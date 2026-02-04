import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import initSqlJs from "sql.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

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

async function initDatabase() {
    try {
        SQL = await initSqlJs();

        let filebuffer: Uint8Array | undefined;
        if (fs.existsSync(DB_PATH)) {
            filebuffer = fs.readFileSync(DB_PATH);
        }

        db = new SQL.Database(filebuffer);
        log("Connected to SQLite database.");
    } catch (error) {
        log(`Database connection error: ${error}`);
        process.exit(1);
    }
}

// Save database to file
function saveDatabase() {
    if (db) {
        const data = db.export();
        const buffer = Buffer.from(data);
        fs.writeFileSync(DB_PATH, buffer);
    }
}

// Initialize database on startup
initDatabase().then(() => {
    // Ensure tables exist
    try {
        db.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        identifier TEXT UNIQUE NOT NULL,
        pto_rate REAL DEFAULT 0.71,
        carryover_hours REAL DEFAULT 0,
        role TEXT DEFAULT 'Employee',
        hash TEXT
      )
    `);

        db.run(`
      CREATE TABLE IF NOT EXISTS pto_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_id INTEGER NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('Sick', 'Full PTO', 'Partial PTO', 'Bereavement', 'Jury Duty')),
        hours REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

        saveDatabase();
        log("Database tables ensured.");
    } catch (error) {
        log(`Error ensuring tables: ${error}`);
    }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    log("Health check requested");
    res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Placeholder for PTO routes
app.get("/api/pto/:employeeId", (req, res) => {
    const { employeeId } = req.params;
    log(`PTO entries requested for employee ${employeeId}`);
    try {
        const stmt = db.prepare("SELECT * FROM pto_entries WHERE employee_id = ?");
        const entries = stmt.getAsObject({ ":employee_id": employeeId });
        res.json({ employeeId, entries: [entries] });
    } catch (error) {
        log(`Error fetching PTO entries: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/pto", (req, res) => {
    const { employeeId, startDate, endDate, type, hours } = req.body;
    log(`New PTO entry: ${JSON.stringify(req.body)}`);
    try {
        const stmt = db.prepare(`
            INSERT INTO pto_entries (employee_id, start_date, end_date, type, hours)
            VALUES (?, ?, ?, ?, ?)
        `);
        stmt.bind([employeeId, startDate, endDate, type, hours]);
        stmt.run();
        stmt.free();

        // Get the last inserted ID
        const idResult = db.exec("SELECT last_insert_rowid() as id");
        const id = idResult[0].values[0][0];

        saveDatabase();
        res.json({ success: true, id });
    } catch (error) {
        log(`Error creating PTO entry: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

// Placeholder for employee routes
app.get("/api/employees", (req, res) => {
    log("Employees list requested");
    try {
        const result = db.exec(
            "SELECT id, name, identifier, pto_rate, carryover_hours, role FROM employees",
        );
        const employees =
            result.length > 0
                ? result[0].values.map((row: any[]) => ({
                    id: row[0],
                    name: row[1],
                    identifier: row[2],
                    ptoRate: row[3],
                    carryoverHours: row[4],
                    role: row[5],
                }))
                : [];
        res.json({ employees });
    } catch (error) {
        log(`Error fetching employees: ${error}`);
        res.status(500).json({ error: "Database error" });
    }
});

app.post("/api/employees", (req, res) => {
    const { name, identifier, ptoRate, carryoverHours, role, hash } = req.body;
    log(`New employee: ${JSON.stringify(req.body)}`);
    try {
        const stmt = db.prepare(`
            INSERT INTO employees (name, identifier, pto_rate, carryover_hours, role, hash)
            VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.bind([
            name,
            identifier,
            ptoRate || 0.71,
            carryoverHours || 0,
            role || "Employee",
            hash,
        ]);
        stmt.run();
        stmt.free();

        // Get the last inserted ID
        const idResult = db.exec("SELECT last_insert_rowid() as id");
        const id = idResult[0].values[0][0];

        saveDatabase();
        res.json({ success: true, id });
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
