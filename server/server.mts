import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import { body, validationResult } from "express-validator";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import "reflect-metadata";
import { DataSource, Not, IsNull, Between, Like } from "typeorm";
import { Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement } from "./entities/index.js";
import { calculatePTOStatus } from "./ptoCalculations.js";
import { calculateEndDate } from "./workDays.js";
import { dateToString } from "../shared/dateUtils.js";
import net from "net";
import { sendMagicLinkEmail } from "./utils/mailer.js";
import { PtoEntryDAL } from "./dal/PtoEntryDAL.js";
import { VALIDATION_MESSAGES, MessageKey } from "../shared/businessRules.js";

dotenv.config();

// Configuration validation
const requiredEnvVars = ['HASH_SALT'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    console.error('Please set the following in your .env file:');
    missingEnvVars.forEach(envVar => console.error(`- ${envVar}`));
    process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from client directory in development mode
if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '..', 'client')));
}

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '..', 'public')));

// Database setup
const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");
const LOG_PATH = path.join(__dirname, "..", "logs", "app.log");

// Ensure logs directory exists
const logsDir = path.dirname(LOG_PATH);
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Simple file-based logging
function log(message: string) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(LOG_PATH, logMessage);
    console.log(message);
}

// Check if port is in use
function checkPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.listen(port, '127.0.0.1', () => {
            server.close();
            resolve(false);
        });
        server.on('error', () => {
            resolve(true);
        });
    });
}

// Database connection
let db: initSqlJs.Database;
let SQL: initSqlJs.SqlJsStatic;
let dataSource: DataSource;
let ptoEntryDAL: PtoEntryDAL;

async function initDatabase() {
    try {
        log("Initializing SQL.js...");
        SQL = await initSqlJs();
        log("SQL.js initialized successfully.");

        log("Creating database instance...");
        let filebuffer: Uint8Array | undefined;
        if (fs.existsSync(DB_PATH)) {
            filebuffer = fs.readFileSync(DB_PATH);
            log("Loaded existing database file.");
        } else {
            log("No existing database file found, creating new database.");
        }
        db = new SQL.Database(filebuffer);
        log("Database instance created.");

        // Read and execute schema
        log("Reading database schema...");
        const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
        log(`Schema path: ${schemaPath}`);
        const schema = fs.readFileSync(schemaPath, "utf8");
        log("Schema file read successfully.");

        log("Executing schema...");
        db.exec(schema);
        log("Schema executed successfully.");

        // Initialize TypeORM DataSource
        log("Initializing TypeORM DataSource...");
        dataSource = new DataSource({
            type: "sqljs",
            location: DB_PATH,
            autoSave: true,
            entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement, AdminAcknowledgement],
            synchronize: false, // Schema is managed manually
            logging: false,
        });

        log("Connecting to database with TypeORM...");
        await dataSource.initialize();
        log("Connected to SQLite database with TypeORM.");

        // Initialize DAL
        ptoEntryDAL = new PtoEntryDAL(dataSource);
        log("PTO Entry DAL initialized.");
    } catch (error) {
        const err = error as Error;
        log(`Database connection error: ${err}`);
        log(`Error stack: ${err.stack}`);
        throw err;
    }
}

// Initialize database on startup
log(`Starting server initialization on port ${PORT}...`);
initDatabase().then(async () => {

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0'
        });
    });

    // Test-only database reload endpoint
    app.post('/api/test/reload-database', async (req: Request, res: Response) => {
        try {
            // Only allow in test environment or with special header
            if (process.env.NODE_ENV === 'test' || req.headers['x-test-reload'] === 'true') {
                log('Reloading database for testing...');

                // Destroy current DataSource
                if (dataSource && dataSource.isInitialized) {
                    await dataSource.destroy();
                    log('DataSource destroyed.');
                }

                // Re-initialize database from disk
                await initDatabase();
                log('Database reloaded from disk.');

                res.json({ message: 'Database reloaded successfully' });
            } else {
                res.status(403).json({ error: 'Forbidden: Database reload only allowed in test environment' });
            }
        } catch (error) {
            log(`Database reload error: ${error}`);
            res.status(500).json({ error: 'Database reload failed' });
        }
    });

    // Auth routes
    app.post('/api/auth/request-link', [
        body('identifier').isEmail().normalizeEmail().withMessage('Valid email address required')
    ], async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Invalid input', details: errors.array() });
            }

            const { identifier } = req.body;
            const isTestMode = req.headers['x-test-mode'] === 'true' || process.env.NODE_ENV === 'test';
            const isDirectMagicLink = process.env.MAGIC_LINK_DIRECT === 'true';
            const shouldReturnMagicLink = isTestMode || isDirectMagicLink || process.env.NODE_ENV !== 'production';

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { identifier } });

            if (!employee) {
                if (shouldReturnMagicLink) {
                    const timestamp = Date.now();
                    const magicLink = `http://localhost:3000/?token=missing-user&ts=${timestamp}`;
                    log(`Magic link for ${identifier}: ${magicLink}`);
                    return res.json({
                        message: 'Magic link generated',
                        magicLink
                    });
                }
                // For security, don't reveal if user exists
                return res.json({ message: 'If the email exists, a magic link has been sent.' });
            }

            // Generate secret hash if not exists
            let secretHash = employee.hash;
            if (!secretHash) {
                secretHash = crypto.createHash('sha256').update(identifier + process.env.HASH_SALT || 'default_salt').digest('hex');
                employee.hash = secretHash;
                await employeeRepo.save(employee);
            }

            // Generate temporal hash: hash(secret + timestamp)
            const timestamp = Date.now();
            const temporalHash = crypto.createHash('sha256').update(secretHash + timestamp).digest('hex');

            const magicLink = `http://localhost:3000/?token=${temporalHash}&ts=${timestamp}`;

            if (shouldReturnMagicLink) {
                log(`Magic link for ${identifier}: ${magicLink}`);
            }

            if (shouldReturnMagicLink) {
                // For testing or POC, return the magic link directly
                return res.json({
                    message: 'Magic link generated',
                    magicLink: magicLink
                });
            }

            try {
                await sendMagicLinkEmail(identifier, magicLink);
            } catch (emailError) {
                log(`Error sending magic link email: ${emailError}`);
                return res.status(500).json({ error: 'Failed to send magic link email' });
            }

            res.json({ message: 'If the email exists, a magic link has been sent.' });
        } catch (error) {
            log(`Error requesting magic link: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/auth/validate', async (req, res) => {
        try {
            const { token, ts } = req.query;
            if (!token || !ts) {
                log('Auth validation failed: Token and timestamp required');
                return res.status(400).json({ error: 'Token and timestamp required' });
            }

            const timestamp = parseInt(ts as string);
            const now = Date.now();
            // Expire after 1 hour
            if (now - timestamp > 60 * 60 * 1000) {
                log('Auth validation failed: Token expired');
                return res.status(401).json({ error: 'Token expired' });
            }

            // Find employee with matching secret hash
            const employeeRepo = dataSource.getRepository(Employee);
            const employees = await employeeRepo.find({ where: { hash: Not(IsNull()) } });
            let validEmployee = null;
            for (const emp of employees) {
                const expectedTemporal = crypto.createHash('sha256').update(emp.hash + timestamp).digest('hex');
                if (expectedTemporal === token) {
                    validEmployee = emp;
                    break;
                }
            }
            if (!validEmployee) {
                log('Auth validation failed: Invalid token');
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Return public hash (same as secret for simplicity)
            res.json({ publicHash: validEmployee.hash, employee: { id: validEmployee.id, name: validEmployee.name, role: validEmployee.role } });
        } catch (error) {
            log(`Error validating token: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PTO routes
    app.get('/api/pto/status/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                log(`PTO status request failed: Invalid employee ID: ${employeeId}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`PTO status request failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            const ptoEntries = await ptoEntryRepo.find({ where: { employee_id: employeeIdNum } });

            // Convert to PTO calculation format
            const hireDate = employee.hire_date instanceof Date
                ? employee.hire_date
                : new Date(employee.hire_date as any);

            const employeeData = {
                id: employee.id,
                name: employee.name,
                identifier: employee.identifier,
                pto_rate: employee.pto_rate,
                carryover_hours: employee.carryover_hours,
                hire_date: dateToString(hireDate),
                role: employee.role
            };

            const ptoEntriesData = ptoEntries.map(entry => ({
                id: entry.id,
                employee_id: entry.employee_id,
                date: entry.date,
                type: entry.type,
                hours: entry.hours,
                created_at: dateToString(entry.created_at instanceof Date ? entry.created_at : new Date(entry.created_at as any))
            }));

            const status = calculatePTOStatus(employeeData, ptoEntriesData);

            res.json(status);
        } catch (error) {
            log(`Error getting PTO status: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Monthly Hours routes
    app.post('/api/hours', async (req, res) => {
        try {
            const { employeeId, month, hours } = req.body;

            if (!employeeId || !month || hours === undefined) {
                log('Hours submission failed: Employee ID, month, and hours are required');
                return res.status(400).json({ error: 'Employee ID, month, and hours are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const hoursNum = parseFloat(hours);

            if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
                log(`Hours submission failed: Invalid employee ID (${employeeId}) or hours (${hours})`);
                return res.status(400).json({ error: 'Invalid employee ID or hours' });
            }

            // Validate hours (reasonable range: 0-400 hours per month)
            if (hoursNum < 0 || hoursNum > 400) {
                log(`Hours submission failed: Hours must be between 0 and 400, got: ${hoursNum}`);
                return res.status(400).json({ error: 'Hours must be between 0 and 400' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Hours submission failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
                log(`Hours submission failed: Invalid month format: ${month}`);
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if hours already exist for this month
            const existingHours = await monthlyHoursRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthDate }
            });

            if (existingHours) {
                // Update existing hours
                existingHours.hours_worked = hoursNum;
                existingHours.submitted_at = new Date();
                await monthlyHoursRepo.save(existingHours);
                res.json({ message: 'Hours updated successfully', hours: existingHours });
            } else {
                // Create new hours entry
                const newHours = monthlyHoursRepo.create({
                    employee_id: employeeIdNum,
                    month: monthDate,
                    hours_worked: hoursNum
                });
                await monthlyHoursRepo.save(newHours);
                res.status(201).json({ message: 'Hours submitted successfully', hours: newHours });
            }
        } catch (error) {
            log(`Error submitting hours: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/hours/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { year } = req.query;
            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                log(`Hours retrieval failed: Invalid employee ID: ${employeeId}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Hours retrieval failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            let whereCondition: any = { employee_id: employeeIdNum };
            if (year) {
                const yearNum = parseInt(year as string);
                if (!isNaN(yearNum)) {
                    whereCondition.month = Between(new Date(yearNum, 0, 1), new Date(yearNum, 11, 31));
                }
            }

            const hours = await monthlyHoursRepo.find({
                where: whereCondition,
                order: { month: 'DESC' }
            });

            res.json({ employeeId: employeeIdNum, hours });
        } catch (error) {
            log(`Error getting hours: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Acknowledgement routes
    app.post('/api/acknowledgements', async (req, res) => {
        try {
            const { employeeId, month } = req.body;

            if (!employeeId || !month) {
                log('Acknowledgement submission failed: Employee ID and month are required');
                return res.status(400).json({ error: 'Employee ID and month are required' });
            }

            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                log(`Acknowledgement submission failed: Invalid employee ID: ${employeeId}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Acknowledgement submission failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
                log(`Acknowledgement submission failed: Invalid month format: ${month}`);
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if acknowledgement already exists for this month
            const existingAck = await acknowledgementRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthDate }
            });

            if (existingAck) {
                log(`Acknowledgement submission failed: Acknowledgement already exists for employee ${employeeIdNum}, month ${month}`);
                return res.status(409).json({ error: 'Acknowledgement already exists for this month' });
            }

            // Create new acknowledgement
            const newAck = acknowledgementRepo.create({
                employee_id: employeeIdNum,
                month: monthDate
            });
            await acknowledgementRepo.save(newAck);

            res.status(201).json({ message: 'Acknowledgement submitted successfully', acknowledgement: newAck });
        } catch (error) {
            log(`Error submitting acknowledgement: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/acknowledgements/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                log(`Acknowledgement retrieval failed: Invalid employee ID: ${employeeId}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Acknowledgement retrieval failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            const acknowledgements = await acknowledgementRepo.find({
                where: { employee_id: employeeIdNum },
                order: { month: 'DESC' }
            });

            res.json({ employeeId: employeeIdNum, acknowledgements });
        } catch (error) {
            log(`Error getting acknowledgements: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Monthly summary for acknowledgements
    app.get('/api/monthly-summary/:employeeId/:month', async (req, res) => {
        try {
            const { employeeId, month } = req.params;
            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                log(`Monthly summary request failed: Invalid employee ID: ${employeeId}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);
            const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Monthly summary request failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
                log(`Monthly summary request failed: Invalid month format: ${month}`);
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Get monthly hours for the month
            const monthlyHours = await monthlyHoursRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthDate }
            });

            // Get PTO entries for the month
            const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
            const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

            const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
            const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

            const ptoEntries = await ptoEntryRepo
                .createQueryBuilder('entry')
                .where('entry.employee_id = :employeeId', { employeeId: employeeIdNum })
                .andWhere('entry.date >= :startDate', { startDate: startOfMonthStr })
                .andWhere('entry.date <= :endDate', { endDate: endOfMonthStr })
                .getMany();

            // Calculate PTO usage by category
            const ptoByCategory = {
                PTO: 0,
                Sick: 0,
                Bereavement: 0,
                'Jury Duty': 0
            };

            ptoEntries.forEach(entry => {
                if (ptoByCategory.hasOwnProperty(entry.type)) {
                    ptoByCategory[entry.type as keyof typeof ptoByCategory] += entry.hours;
                }
            });

            res.json({
                employeeId: employeeIdNum,
                month,
                hoursWorked: monthlyHours ? monthlyHours.hours_worked : 0,
                ptoUsage: ptoByCategory
            });
        } catch (error) {
            log(`Error getting monthly summary: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Admin Acknowledgement routes
    app.post('/api/admin-acknowledgements', async (req, res) => {
        try {
            const { employeeId, month, adminId } = req.body;

            if (!employeeId || !month || !adminId) {
                log('Admin acknowledgement submission failed: Employee ID, month, and admin ID are required');
                return res.status(400).json({ error: 'Employee ID, month, and admin ID are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const adminIdNum = parseInt(adminId);

            if (isNaN(employeeIdNum) || isNaN(adminIdNum)) {
                log(`Admin acknowledgement submission failed: Invalid employee ID (${employeeId}) or admin ID (${adminId})`);
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Admin acknowledgement submission failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            const admin = await employeeRepo.findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                log(`Admin acknowledgement submission failed: Admin privileges required for user: ${adminIdNum}`);
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthStr = month;
            if (!/^\d{4}-\d{2}$/.test(monthStr)) {
                log(`Admin acknowledgement submission failed: Invalid month format: ${monthStr}`);
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if admin acknowledgement already exists for this month
            const existingAck = await adminAckRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthStr }
            });

            if (existingAck) {
                log(`Admin acknowledgement submission failed: Admin acknowledgement already exists for employee ${employeeIdNum}, month ${monthStr}`);
                return res.status(409).json({ error: 'Admin acknowledgement already exists for this month' });
            }

            // Create new admin acknowledgement
            const newAck = adminAckRepo.create({
                employee_id: employeeIdNum,
                month: monthStr,
                admin_id: adminIdNum
            });
            await adminAckRepo.save(newAck);

            res.status(201).json({ message: 'Admin acknowledgement submitted successfully', acknowledgement: newAck });
        } catch (error) {
            log(`Error submitting admin acknowledgement: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/admin-acknowledgements/:employeeId', async (req, res) => {
        try {
            const { employeeId } = req.params;
            const { adminId } = req.query;
            const employeeIdNum = parseInt(employeeId);
            const adminIdNum = parseInt(adminId as string);

            if (isNaN(employeeIdNum) || isNaN(adminIdNum)) {
                log(`Admin acknowledgement retrieval failed: Invalid employee ID (${employeeId}) or admin ID (${adminId})`);
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

            const admin = await employeeRepo.findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                log(`Admin acknowledgement retrieval failed: Admin privileges required for user: ${adminIdNum}`);
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                log(`Admin acknowledgement retrieval failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            const acknowledgements = await adminAckRepo.find({
                where: { employee_id: employeeIdNum },
                order: { month: 'DESC' },
                relations: ['admin']
            });

            res.json({ employeeId: employeeIdNum, acknowledgements });
        } catch (error) {
            log(`Error getting admin acknowledgements: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Enhanced Employee routes
    app.get('/api/employees', async (req, res) => {
        try {
            const { search, role } = req.query;
            const employeeRepo = dataSource.getRepository(Employee);

            let whereCondition: any = {};

            if (search) {
                whereCondition.name = Like(`%${search}%`);
            }

            if (role) {
                whereCondition.role = role;
            }

            const employees = await employeeRepo.find({
                where: whereCondition,
                order: { name: 'ASC' },
                select: ['id', 'name', 'identifier', 'role', 'hire_date']
            });

            res.json(employees);
        } catch (error) {
            log(`Error getting employees: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.get('/api/employees/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const employeeIdNum = parseInt(id);

            if (isNaN(employeeIdNum)) {
                log(`Employee retrieval failed: Invalid employee ID: ${id}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                log(`Employee retrieval failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            res.json(employee);
        } catch (error) {
            log(`Error getting employee: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/employees', async (req, res) => {
        try {
            const { name, identifier, pto_rate, carryover_hours, hire_date, role } = req.body;

            // Validation
            if (!name || typeof name !== 'string' || name.trim().length === 0) {
                return res.status(400).json({ error: 'Name is required and must be a non-empty string' });
            }
            if (!identifier || typeof identifier !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
                return res.status(400).json({ error: 'Identifier must be a valid email address' });
            }

            const employeeRepo = dataSource.getRepository(Employee);

            // Check if identifier already exists
            const existingEmployee = await employeeRepo.findOne({ where: { identifier } });
            if (existingEmployee) {
                return res.status(409).json({ error: 'Employee with this email already exists' });
            }

            const employee = new Employee();
            employee.name = name.trim();
            employee.identifier = identifier;
            employee.pto_rate = pto_rate !== undefined ? parseFloat(pto_rate) : 0.71;
            employee.carryover_hours = carryover_hours !== undefined ? parseFloat(carryover_hours) : 0;
            employee.hire_date = hire_date ? new Date(hire_date) : new Date();
            employee.role = role || 'Employee';

            await employeeRepo.save(employee);

            res.status(201).json({ message: 'Employee created successfully' });
        } catch (error) {
            log(`Error creating employee: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/employees/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const employeeIdNum = parseInt(id);

            if (isNaN(employeeIdNum)) {
                log(`Employee update failed: Invalid employee ID: ${id}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const { name, identifier, pto_rate, carryover_hours, hire_date, role } = req.body;

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                log(`Employee update failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Validation
            if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
                return res.status(400).json({ error: 'Name must be a non-empty string' });
            }
            if (identifier !== undefined && (typeof identifier !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))) {
                return res.status(400).json({ error: 'Identifier must be a valid email address' });
            }

            // Check if identifier already exists (excluding current employee)
            if (identifier !== undefined) {
                const existingEmployee = await employeeRepo.findOne({ where: { identifier } });
                if (existingEmployee && existingEmployee.id !== employeeIdNum) {
                    return res.status(409).json({ error: 'Employee with this email already exists' });
                }
            }

            // Update fields if provided
            if (name !== undefined) employee.name = name;
            if (identifier !== undefined) employee.identifier = identifier;
            if (pto_rate !== undefined) employee.pto_rate = parseFloat(pto_rate);
            if (carryover_hours !== undefined) employee.carryover_hours = parseFloat(carryover_hours);
            if (hire_date !== undefined) employee.hire_date = new Date(hire_date);
            if (role !== undefined) employee.role = role;

            await employeeRepo.save(employee);

            res.json({ message: 'Employee updated successfully' });
        } catch (error) {
            log(`Error updating employee: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/employees/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const employeeIdNum = parseInt(id);

            if (isNaN(employeeIdNum)) {
                log(`Employee deletion failed: Invalid employee ID: ${id}`);
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                log(`Employee deletion failed: Employee not found: ${employeeIdNum}`);
                return res.status(404).json({ error: 'Employee not found' });
            }

            await employeeRepo.remove(employee);

            res.json({ message: 'Employee deleted successfully' });
        } catch (error) {
            log(`Error deleting employee: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // PTO Management routes
    app.get('/api/pto', async (req, res) => {
        try {
            const { employeeId, type, startDate, endDate } = req.query;
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);

            let whereCondition: any = {};

            if (employeeId) {
                const empIdNum = parseInt(employeeId as string);
                if (!isNaN(empIdNum)) {
                    whereCondition.employee_id = empIdNum;
                }
            }

            if (type) {
                whereCondition.type = type;
            }

            if (startDate || endDate) {
                whereCondition.date = {};
                if (startDate) whereCondition.date.$gte = new Date(startDate as string);
                if (endDate) whereCondition.date.$lte = new Date(endDate as string);
            }

            const ptoEntries = await ptoEntryRepo.find({
                where: whereCondition,
                order: { date: 'DESC' }
            });

            console.log(`PTO entries for employee ${employeeId}:`, ptoEntries.map(e => ({ date: e.date, type: e.type })));

            const simplifiedEntries = ptoEntries.map(entry => ({
                date: entry.date,
                type: entry.type,
                hours: entry.hours
            }));

            res.json(simplifiedEntries);
        } catch (error) {
            log(`Error getting PTO entries: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/pto', async (req, res) => {
        try {
            const { employeeId, date, hours, type, requests } = req.body;

            // Handle both single request and multiple requests
            const ptoRequests = requests || [{ employeeId, date, hours, type }];

            const results = [];
            for (const request of ptoRequests) {
                const { employeeId: empId, date: reqDate, hours: reqHours, type: reqType } = request;

                if (!empId || !reqDate || reqHours === undefined || !reqType) {
                    return res.status(400).json({ error: 'All fields are required for each request: employeeId, date, hours, type' });
                }

                const empIdNum = parseInt(empId);
                const reqHoursNum = parseFloat(reqHours);

                if (isNaN(empIdNum) || isNaN(reqHoursNum)) {
                    return res.status(400).json({ error: 'Invalid employee ID or hours' });
                }

                const result = await ptoEntryDAL.createPtoEntry({
                    employeeId: empIdNum,
                    date: reqDate,
                    hours: reqHoursNum,
                    type: reqType
                });

                if (!result.success) {
                    console.log('PTO validation failed for request:', {
                        employeeId: empIdNum,
                        date: reqDate,
                        hours: reqHoursNum,
                        type: reqType,
                        errors: result.errors
                    });
                    const fieldErrors = result.errors.map(err => ({
                        field: err.field,
                        message: VALIDATION_MESSAGES[err.messageKey as MessageKey]
                    }));
                    console.log('Returning 400 with field errors:', fieldErrors);
                    return res.status(400).json({ error: 'validation_failed', fieldErrors });
                }

                results.push(result.ptoEntry);
            }

            log(`PTO entries created successfully: ${results.length} entries`);
            results.forEach((entry, index) => {
                log(`Entry ${index + 1}: Employee ${entry.employee_id}, Date ${entry.date}, Type ${entry.type}, Hours ${entry.hours}`);
            });

            const lastResult = results[results.length - 1];
            const responseEntry = {
                id: lastResult.id,
                employee_id: lastResult.employee_id,
                date: lastResult.date,
                type: lastResult.type,
                hours: lastResult.hours,
                created_at: dateToString(lastResult.created_at)
            };

            res.status(201).json({
                message: 'PTO entries created successfully', ptoEntry: responseEntry, ptoEntries: results.map(r => ({
                    id: r.id,
                    employee_id: r.employee_id,
                    date: r.date,
                    type: r.type,
                    hours: r.hours,
                    created_at: dateToString(r.created_at)
                }))
            });
        } catch (error) {
            log(`Error creating PTO entries: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/pto/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const ptoIdNum = parseInt(id);

            if (isNaN(ptoIdNum)) {
                return res.status(400).json({ error: 'Invalid PTO entry ID' });
            }

            const { date, type, hours } = req.body;

            const updateData: any = {};
            if (date !== undefined) updateData.date = date;
            if (type !== undefined) updateData.type = type;
            if (hours !== undefined) updateData.hours = parseFloat(hours);

            const result = await ptoEntryDAL.updatePtoEntry(ptoIdNum, updateData);

            if (!result.success) {
                const fieldErrors = result.errors.map(err => ({
                    field: err.field,
                    message: VALIDATION_MESSAGES[err.messageKey as MessageKey]
                }));
                return res.status(400).json({ error: 'validation_failed', fieldErrors });
            }

            res.json({ message: 'PTO entry updated successfully', ptoEntry: result.ptoEntry });
        } catch (error) {
            log(`Error updating PTO entry: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.delete('/api/pto/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const ptoIdNum = parseInt(id);

            if (isNaN(ptoIdNum)) {
                return res.status(400).json({ error: 'Invalid PTO entry ID' });
            }

            const ptoEntryRepo = dataSource.getRepository(PtoEntry);
            const ptoEntry = await ptoEntryRepo.findOne({ where: { id: ptoIdNum } });

            if (!ptoEntry) {
                return res.status(404).json({ error: 'PTO entry not found' });
            }

            await ptoEntryRepo.remove(ptoEntry);

            res.json({ message: 'PTO entry deleted successfully' });
        } catch (error) {
            log(`Error deleting PTO entry: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // Start server
    log(`Checking if port ${PORT} is available...`);
    const portInUse = await checkPortInUse(PORT);
    if (portInUse) {
        log(`Port ${PORT} is already in use. Please stop the other server or use a different port.`);
        process.exit(1);
    }

    log(`Attempting to start server on port ${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
        log(`Server successfully listening on port ${PORT}`);
        log(`Server available at:`);
        log(`  http://localhost:${PORT}`);
        log(`  http://127.0.0.1:${PORT}`);
        log(`  http://0.0.0.0:${PORT}`);
    });

    server.on('error', (error) => {
        log(`Server failed to start: ${error.message}`);
        process.exit(1);
    });

    // Handle process termination
    process.on('SIGTERM', () => {
        log('SIGTERM received, shutting down gracefully');
        server.close(() => {
            log('Server closed');
            process.exit(0);
        });
    });

    process.on('SIGINT', () => {
        log('SIGINT received, shutting down gracefully');
        server.close(() => {
            log('Server closed');
            process.exit(0);
        });
    });
}).catch((error) => {
    log(`Database initialization failed: ${error.message}`);
    log(`Stack trace: ${error.stack}`);
    process.exit(1);
});
