import express, { Request, Response } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
import net from "net";

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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

app.use(limiter);
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

async function initDatabase() {
    try {
        log("Initializing SQL.js...");
        SQL = await initSqlJs();
        log("SQL.js initialized successfully.");

        log("Creating database instance...");
        db = new SQL.Database();
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
    log("Database initialized successfully.");

    // Health check endpoint
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: '1.0.0'
        });
    });

    // Auth routes (with stricter rate limiting)
    app.use('/api/auth', authLimiter);
    app.post('/api/auth/request-link', [
        body('identifier').isEmail().normalizeEmail().withMessage('Valid email address required')
    ], async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ error: 'Invalid input', details: errors.array() });
            }

            const { identifier } = req.body;

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { identifier } });

            if (!employee) {
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

            // In a real app, send email with link: http://localhost:3000/?token=${temporalHash}&ts=${timestamp}
            log(`Magic link for ${identifier}: http://localhost:3000/?token=${temporalHash}&ts=${timestamp}`);

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
                return res.status(400).json({ error: 'Token and timestamp required' });
            }

            const timestamp = parseInt(ts as string);
            const now = Date.now();
            // Expire after 1 hour
            if (now - timestamp > 60 * 60 * 1000) {
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
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const ptoEntries = await ptoEntryRepo.find({ where: { employee_id: employeeIdNum } });

            // Convert to PTO calculation format
            const employeeData = {
                id: employee.id,
                name: employee.name,
                identifier: employee.identifier,
                pto_rate: employee.pto_rate,
                carryover_hours: employee.carryover_hours,
                hire_date: employee.hire_date,
                role: employee.role
            };

            const ptoEntriesData = ptoEntries.map(entry => ({
                id: entry.id,
                employee_id: entry.employee_id,
                start_date: entry.start_date,
                end_date: entry.end_date,
                type: entry.type,
                hours: entry.hours,
                created_at: entry.created_at
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
                return res.status(400).json({ error: 'Employee ID, month, and hours are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const hoursNum = parseFloat(hours);

            if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
                return res.status(400).json({ error: 'Invalid employee ID or hours' });
            }

            // Validate hours (reasonable range: 0-400 hours per month)
            if (hoursNum < 0 || hoursNum > 400) {
                return res.status(400).json({ error: 'Hours must be between 0 and 400' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
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
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const monthlyHoursRepo = dataSource.getRepository(MonthlyHours);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
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
                return res.status(400).json({ error: 'Employee ID and month are required' });
            }

            const employeeIdNum = parseInt(employeeId);

            if (isNaN(employeeIdNum)) {
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthDate = new Date(month + '-01');
            if (isNaN(monthDate.getTime())) {
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if acknowledgement already exists for this month
            const existingAck = await acknowledgementRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthDate }
            });

            if (existingAck) {
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
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const acknowledgementRepo = dataSource.getRepository(Acknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
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

    // Admin Acknowledgement routes
    app.post('/api/admin-acknowledgements', async (req, res) => {
        try {
            const { employeeId, month, adminId } = req.body;

            if (!employeeId || !month || !adminId) {
                return res.status(400).json({ error: 'Employee ID, month, and admin ID are required' });
            }

            const employeeIdNum = parseInt(employeeId);
            const adminIdNum = parseInt(adminId);

            if (isNaN(employeeIdNum) || isNaN(adminIdNum)) {
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const admin = await employeeRepo.findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            // Parse month (expected format: YYYY-MM)
            const monthStr = month;
            if (!/^\d{4}-\d{2}$/.test(monthStr)) {
                return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
            }

            // Check if admin acknowledgement already exists for this month
            const existingAck = await adminAckRepo.findOne({
                where: { employee_id: employeeIdNum, month: monthStr }
            });

            if (existingAck) {
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
                return res.status(400).json({ error: 'Invalid employee or admin ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);

            const admin = await employeeRepo.findOne({ where: { id: adminIdNum } });
            if (!admin || admin.role !== 'Admin') {
                return res.status(403).json({ error: 'Admin privileges required' });
            }

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
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
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            res.json(employee);
        } catch (error) {
            log(`Error getting employee: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.put('/api/employees/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const employeeIdNum = parseInt(id);

            if (isNaN(employeeIdNum)) {
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const { name, identifier, pto_rate, carryover_hours, hire_date, role } = req.body;

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            // Update fields if provided
            if (name !== undefined) employee.name = name;
            if (identifier !== undefined) employee.identifier = identifier;
            if (pto_rate !== undefined) employee.pto_rate = parseFloat(pto_rate);
            if (carryover_hours !== undefined) employee.carryover_hours = parseFloat(carryover_hours);
            if (hire_date !== undefined) employee.hire_date = new Date(hire_date);
            if (role !== undefined) employee.role = role;

            await employeeRepo.save(employee);

            res.json({ message: 'Employee updated successfully', employee });
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
                return res.status(400).json({ error: 'Invalid employee ID' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });

            if (!employee) {
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
                whereCondition.start_date = {};
                if (startDate) whereCondition.start_date.$gte = new Date(startDate as string);
                if (endDate) whereCondition.start_date.$lte = new Date(endDate as string);
            }

            const ptoEntries = await ptoEntryRepo.find({
                where: whereCondition,
                order: { start_date: 'DESC' },
                relations: ['employee']
            });

            res.json(ptoEntries);
        } catch (error) {
            log(`Error getting PTO entries: ${error}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    app.post('/api/pto', async (req, res) => {
        try {
            const { employeeId, startDate, endDate, type, hours } = req.body;

            if (!employeeId || !startDate || !endDate || !type || hours === undefined) {
                return res.status(400).json({ error: 'All fields are required: employeeId, startDate, endDate, type, hours' });
            }

            const employeeIdNum = parseInt(employeeId);
            const hoursNum = parseFloat(hours);

            if (isNaN(employeeIdNum) || isNaN(hoursNum)) {
                return res.status(400).json({ error: 'Invalid employee ID or hours' });
            }

            // Validate PTO type
            const validTypes = ['PTO', 'Sick', 'Bereavement', 'Jury Duty'];
            if (!validTypes.includes(type)) {
                return res.status(400).json({ error: 'Invalid PTO type' });
            }

            // Validate hours based on type
            if (type === 'Sick' && hoursNum > 24) {
                return res.status(400).json({ error: 'Sick time cannot exceed 24 hours annually' });
            }
            if ((type === 'Bereavement' || type === 'Jury Duty') && hoursNum > 40) {
                return res.status(400).json({ error: 'Bereavement/Jury Duty cannot exceed 40 hours annually' });
            }

            const employeeRepo = dataSource.getRepository(Employee);
            const ptoEntryRepo = dataSource.getRepository(PtoEntry);

            const employee = await employeeRepo.findOne({ where: { id: employeeIdNum } });
            if (!employee) {
                return res.status(404).json({ error: 'Employee not found' });
            }

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                return res.status(400).json({ error: 'Invalid date format' });
            }

            if (start > end) {
                return res.status(400).json({ error: 'Start date cannot be after end date' });
            }

            // Create PTO entry
            const newPtoEntry = ptoEntryRepo.create({
                employee_id: employeeIdNum,
                start_date: start,
                end_date: end,
                type,
                hours: hoursNum
            });

            await ptoEntryRepo.save(newPtoEntry);

            res.status(201).json({ message: 'PTO entry created successfully', ptoEntry: newPtoEntry });
        } catch (error) {
            log(`Error creating PTO entry: ${error}`);
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

            const { startDate, endDate, type, hours } = req.body;

            const ptoEntryRepo = dataSource.getRepository(PtoEntry);
            const ptoEntry = await ptoEntryRepo.findOne({ where: { id: ptoIdNum } });

            if (!ptoEntry) {
                return res.status(404).json({ error: 'PTO entry not found' });
            }

            // Update fields if provided
            if (startDate) ptoEntry.start_date = new Date(startDate);
            if (endDate) ptoEntry.end_date = new Date(endDate);
            if (type) ptoEntry.type = type;
            if (hours !== undefined) ptoEntry.hours = parseFloat(hours);

            await ptoEntryRepo.save(ptoEntry);

            res.json({ message: 'PTO entry updated successfully', ptoEntry });
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
