import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import crypto from "crypto";
import "reflect-metadata";
import { DataSource, Not, IsNull } from "typeorm";
import { Employee, PtoEntry, MonthlyHours, Acknowledgement } from "./entities/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Database connection
let db: initSqlJs.Database;
let SQL: initSqlJs.SqlJsStatic;
let dataSource: DataSource;

async function initDatabase() {
    try {
        SQL = await initSqlJs();

        db = new SQL.Database();

        // Read and execute schema
        const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
        const schema = fs.readFileSync(schemaPath, "utf8");
        db.exec(schema);

        // Initialize TypeORM DataSource
        dataSource = new DataSource({
            type: "sqljs",
            location: DB_PATH,
            autoSave: true,
            entities: [Employee, PtoEntry, MonthlyHours, Acknowledgement],
            synchronize: false, // Schema is managed manually
            logging: false,
        });

        await dataSource.initialize();
        log("Connected to SQLite database with TypeORM.");
    } catch (error) {
        log(`Database connection error: ${error}`);
        process.exit(1);
    }
}

// Initialize database on startup
initDatabase().then(() => {
    log("Database initialized.");

    // Auth routes
    app.post('/api/auth/request-link', async (req, res) => {
        try {
            const { identifier } = req.body;
            if (!identifier) {
                return res.status(400).json({ error: 'Identifier required' });
            }

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

    // Start server
    app.listen(PORT, () => {
        log(`Server running on port ${PORT}`);
    });
});
