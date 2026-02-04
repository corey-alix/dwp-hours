import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
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
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    log("Health check requested");
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Placeholder for PTO routes
app.get("/api/pto/:employeeId", async (req, res) => {
    const { employeeId } = req.params;
    log(`PTO entries requested for employee ${employeeId}`);
    try {
        const ptoRepository = dataSource.getRepository(PtoEntry);
        const entries = await ptoRepository.find({
            where: { employee_id: parseInt(employeeId) },
            order: { created_at: "DESC" }
        });
        res.json({ employeeId, entries });
    } catch (error) {
        log(`Error fetching PTO entries: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/pto", async (req, res) => {
    const { employeeId, startDate, endDate, type, hours } = req.body;
    log(`New PTO entry: ${JSON.stringify(req.body)}`);
    try {
        const ptoRepository = dataSource.getRepository(PtoEntry);
        const ptoEntry = ptoRepository.create({
            employee_id: employeeId,
            start_date: new Date(startDate),
            end_date: new Date(endDate),
            type,
            hours
        });
        const saved = await ptoRepository.save(ptoEntry);
        res.json({ success: true, id: saved.id });
    } catch (error) {
        log(`Error creating PTO entry: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

// Placeholder for employee routes
app.get("/api/employees", async (req, res) => {
    log("Employees list requested");
    try {
        const employeeRepository = dataSource.getRepository(Employee);
        const employees = await employeeRepository.find({
            select: ["id", "name", "identifier", "pto_rate", "carryover_hours", "role"]
        });
        const formatted = employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            identifier: emp.identifier,
            ptoRate: emp.pto_rate,
            carryoverHours: emp.carryover_hours,
            role: emp.role
        }));
        res.json({ employees: formatted });
    } catch (error) {
        log(`Error fetching employees: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/employees", async (req, res) => {
    const { name, identifier, ptoRate, carryoverHours, role, hash } = req.body;
    log(`New employee: ${JSON.stringify(req.body)}`);
    try {
        const employeeRepository = dataSource.getRepository(Employee);
        const employee = employeeRepository.create({
            name,
            identifier,
            pto_rate: ptoRate || 0.71,
            carryover_hours: carryoverHours || 0,
            role: role || "Employee",
            hash
        });
        const saved = await employeeRepository.save(employee);
        res.json({ success: true, id: saved.id });
    } catch (error) {
        log(`Error creating employee: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

// Start server
app.listen(PORT, () => {
    log(`Server running on port ${PORT}`);
});

export default app;
