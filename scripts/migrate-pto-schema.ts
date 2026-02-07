#!/usr/bin/env node

import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");

function log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

async function migratePtoSchema(): Promise<void> {
    try {
        const SQL = await initSqlJs();

        // Load existing database
        if (!fs.existsSync(DB_PATH)) {
            log("Database not found, nothing to migrate");
            return;
        }

        const filebuffer = fs.readFileSync(DB_PATH);
        const db = new SQL.Database(filebuffer);

        log("Starting PTO schema migration...");

        // Check if migration already done
        const tableInfo = db.exec("PRAGMA table_info(pto_entries)");
        const columns = tableInfo[0]?.values.map((row) => String(row[1])) ?? [];

        if (columns.includes("date")) {
            log("Migration already completed - 'date' column exists");
            return;
        }

        if (!columns.includes("start_date") || !columns.includes("end_date")) {
            log("Unexpected schema - missing start_date or end_date columns");
            return;
        }

        // Create backup
        const backupPath = `${DB_PATH}.backup`;
        fs.writeFileSync(backupPath, filebuffer);
        log(`Database backup created at ${backupPath}`);

        // Create new table with updated schema
        db.exec(`
            CREATE TABLE pto_entries_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                employee_id INTEGER NOT NULL,
                date TEXT NOT NULL,
                type TEXT NOT NULL CHECK (type IN ('Sick', 'PTO', 'Bereavement', 'Jury Duty')),
                hours REAL NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
            );
        `);

        // Get all existing PTO entries
        const existingEntries = db.exec("SELECT * FROM pto_entries ORDER BY id");
        const existingRows = existingEntries[0]?.values ?? [];

        if (existingRows.length > 0) {
            log(`Migrating ${existingRows.length} PTO entries...`);

            // Prepare insert statement
            const insertStmt = db.prepare(`
                INSERT INTO pto_entries_new (employee_id, date, type, hours, created_at)
                VALUES (?, ?, ?, ?, ?)
            `);

            // For each existing entry, expand the date range into individual days
            for (const row of existingRows) {
                const [id, employeeId, startDate, endDate, type, hours, createdAt] = row as [
                    number,
                    number,
                    string,
                    string,
                    string,
                    number,
                    string
                ];

                const start = new Date(startDate);
                const end = new Date(endDate);

                // Calculate work days in the range
                const workDays: Date[] = [];
                const current = new Date(start);
                while (current <= end) {
                    // Only include weekdays (Monday-Friday)
                    if (current.getDay() >= 1 && current.getDay() <= 5) {
                        workDays.push(new Date(current));
                    }
                    current.setDate(current.getDate() + 1);
                }

                if (workDays.length === 0) {
                    log(`Warning: No work days found for PTO entry ${id} (${startDate} to ${endDate})`);
                    continue;
                }

                // Distribute hours evenly across work days
                const hoursPerDay = hours / workDays.length;

                for (const workDay of workDays) {
                    insertStmt.run([
                        employeeId,
                        workDay.toISOString().split("T")[0],
                        type,
                        hoursPerDay,
                        createdAt
                    ]);
                }

                log(`Migrated PTO entry ${id}: ${workDays.length} work days, ${hoursPerDay.toFixed(2)} hours each`);
            }

            insertStmt.free();
        } else {
            log("No existing PTO entries to migrate");
        }

        // Create new indexes (drop old ones first if they exist)
        try {
            db.exec("DROP INDEX IF EXISTS idx_pto_entries_employee_id;");
            db.exec("DROP INDEX IF EXISTS idx_pto_entries_start_date;");
            db.exec("DROP INDEX IF EXISTS idx_pto_entries_end_date;");
        } catch {
            // Ignore errors if indexes don't exist
        }

        db.exec(`
            CREATE INDEX idx_pto_entries_employee_id ON pto_entries_new(employee_id);
            CREATE INDEX idx_pto_entries_date ON pto_entries_new(date);
        `);

        // Drop old table and rename new one
        db.exec(`
            DROP TABLE pto_entries;
            ALTER TABLE pto_entries_new RENAME TO pto_entries;
        `);

        // Save the migrated database
        const migratedData = db.export();
        const buffer = Buffer.from(migratedData);
        fs.writeFileSync(DB_PATH, buffer);

        log("PTO schema migration completed successfully");

        // Verify migration
        const verifyResult = db.exec("SELECT COUNT(*) as count FROM pto_entries");
        const newCount = verifyResult[0]?.values[0]?.[0] ?? 0;
        log(`Verification: ${newCount} PTO entries in database`);

        db.close();
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        log(`Migration failed: ${message}`);
        console.error(error);
        process.exit(1);
    }
}

migratePtoSchema();
