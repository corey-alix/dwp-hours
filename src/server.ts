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

    // Start server
    app.listen(PORT, () => {
        log(`Server running on port ${PORT}`);
    });
});
