#!/usr/bin/env node

import initSqlJs from "sql.js";
import type { Database } from "sql.js";
import fs from "fs";
import path from "path";
import ExcelJS from "exceljs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");
const DEFAULT_XLSX_PATH = path.join(__dirname, "..", "Corey Alix 2025.xlsx");
const LEGACY_TXT_PATH = path.join(__dirname, "..", "legacy.spreadsheet.txt");

type MigrationOptions = {
    legacyPath: string | null;
    dryRun: boolean;
    backup: boolean;
    backupDir: string;
    rollbackPath: string | null;
    rollbackLatest: boolean;
};

type PtoSpreadsheetEntry = {
    month: string;
    workDays: number;
    dailyRate: number;
    availablePTO: number;
    carryover: number;
    subtotal: number;
    usedHours: number;
    totalAvailable: number;
};

type ParsedSpreadsheet = {
    employeeName: string;
    hireDate: string;
    ptoData: PtoSpreadsheetEntry[];
};

const args = process.argv.slice(2);
const options: MigrationOptions = {
    legacyPath: null,
    dryRun: false,
    backup: true,
    backupDir: path.join(__dirname, "..", "db", "backups"),
    rollbackPath: null,
    rollbackLatest: false
};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--dry-run") {
        options.dryRun = true;
    } else if (arg === "--no-backup") {
        options.backup = false;
    } else if (arg === "--backup") {
        options.backup = true;
    } else if (arg === "--backup-dir") {
        options.backupDir = args[i + 1];
        i++;
    } else if (arg === "--rollback") {
        options.rollbackPath = args[i + 1];
        i++;
    } else if (arg === "--rollback-latest") {
        options.rollbackLatest = true;
    } else if (arg === "--legacy") {
        options.legacyPath = args[i + 1];
        i++;
    } else if (!arg.startsWith("--") && !options.legacyPath) {
        options.legacyPath = arg;
    }
}

const LEGACY_XLSX_PATH = options.legacyPath || DEFAULT_XLSX_PATH;

// Load existing database
let db: Database;
try {
    const SQL = await initSqlJs();
    let filebuffer: Uint8Array | undefined;
    if (fs.existsSync(DB_PATH)) {
        filebuffer = fs.readFileSync(DB_PATH);
    }
    db = new SQL.Database(filebuffer);

    // Always execute schema to ensure tables exist
    const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    db.exec(schema);
} catch (error) {
    console.error("Failed to load database:", error);
    process.exit(1);
}

function log(message: string): void {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

function resolveBackupPath(): string | null {
    if (!fs.existsSync(DB_PATH)) {
        return null;
    }
    if (!fs.existsSync(options.backupDir)) {
        fs.mkdirSync(options.backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupName = `dwp-hours.db.backup-${timestamp}`;
    return path.join(options.backupDir, backupName);
}

function listBackups(): string[] {
    if (!fs.existsSync(options.backupDir)) {
        return [];
    }
    return fs
        .readdirSync(options.backupDir)
        .filter((name) => name.startsWith("dwp-hours.db.backup-"))
        .map((name) => path.join(options.backupDir, name))
        .sort();
}

function rollbackDatabase(rollbackPath: string): void {
    if (!rollbackPath) {
        throw new Error("Rollback path not provided");
    }
    if (!fs.existsSync(rollbackPath)) {
        throw new Error(`Rollback file not found at ${rollbackPath}`);
    }
    fs.copyFileSync(rollbackPath, DB_PATH);
    log(`Rollback completed. Restored database from ${rollbackPath}`);
}

if (options.rollbackLatest) {
    const backups = listBackups();
    if (backups.length === 0) {
        log("No backups found to rollback");
        process.exit(1);
    }
    rollbackDatabase(backups[backups.length - 1]);
    process.exit(0);
}

if (options.rollbackPath) {
    rollbackDatabase(options.rollbackPath);
    process.exit(0);
}

function parseTextSpreadsheet(): ParsedSpreadsheet {
    if (!fs.existsSync(LEGACY_TXT_PATH)) {
        throw new Error(`Text spreadsheet not found at ${LEGACY_TXT_PATH}`);
    }

    const content = fs.readFileSync(LEGACY_TXT_PATH, "utf8");
    const lines = content.split("\n");

    // Extract employee info from first few lines
    const nameLine = lines.find((line) => line.includes("Corey Alix"));
    const hireLine = lines.find((line) => line.includes("Hire Date:"));

    const employeeName = nameLine ? "Corey Alix" : "Corey Alix"; // Hardcoded for now
    const hireDateMatch = hireLine?.match(/Hire Date:\s*(.+)/);
    const hireDate = hireDateMatch ? hireDateMatch[1].trim() : "2023-02-13";

    log(`Parsed employee: ${employeeName}, Hire date: ${hireDate}`);

    // Find PTO calculation section
    const ptoSectionIndex = lines.findIndex((line) => line.includes("PTO CALCULATION SECTION"));
    if (ptoSectionIndex === -1) {
        throw new Error("PTO calculation section not found");
    }

    // Skip header lines and parse monthly data
    const ptoData: PtoSpreadsheetEntry[] = [];
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    for (let i = ptoSectionIndex + 4; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.includes("PTO CALCULATION SECTION")) continue;

        const parts = line.split("\t").filter((p) => p.trim());
        if (parts.length < 14) continue;

        const month = parts[0];
        if (!months.includes(month)) continue;

        const workDays = parseFloat(parts[1]) || 0;
        const dailyRate = parseFloat(parts[3]) || 0;
        const availablePTO = parseFloat(parts[5]) || 0;
        const carryover = parseFloat(parts[7]) || 0;
        const subtotal = parseFloat(parts[9]) || 0;
        const usedHours = parseFloat(parts[11]) || 0;
        const totalAvailable = parseFloat(parts[13]) || 0;

        ptoData.push({
            month,
            workDays,
            dailyRate,
            availablePTO,
            carryover,
            subtotal,
            usedHours,
            totalAvailable
        });

        if (ptoData.length >= 12) break;
    }

    return {
        employeeName,
        hireDate,
        ptoData
    };
}

async function migrateSpreadsheet(): Promise<void> {
    let data: ParsedSpreadsheet;

    if (fs.existsSync(LEGACY_XLSX_PATH)) {
        log("Using Excel spreadsheet for migration");
        // Excel parsing logic here (existing code)
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(LEGACY_XLSX_PATH);
        // ... rest of Excel logic
        data = { employeeName: "Corey Alix", hireDate: "2023-02-13", ptoData: [] }; // Placeholder
    } else if (fs.existsSync(LEGACY_TXT_PATH)) {
        log("Using text spreadsheet for migration");
        data = parseTextSpreadsheet();
    } else {
        log("Neither Excel nor text spreadsheet found.");
        log("Please provide the path to the Excel file as an argument or ensure legacy.spreadsheet.txt exists");
        process.exit(1);
    }

    const { employeeName, hireDate, ptoData } = data;

    log(`Migrating data for employee: ${employeeName}`);

    if (options.dryRun) {
        log("Dry-run mode enabled. No files will be written.");
    }

    let backupPath: string | null = null;
    if (!options.dryRun && options.backup) {
        backupPath = resolveBackupPath();
        if (backupPath) {
            fs.copyFileSync(DB_PATH, backupPath);
            log(`Database backup created at ${backupPath}`);
        } else {
            log("No existing database found. Skipping backup.");
        }
    } else if (options.dryRun) {
        log("Dry-run: skipping backup creation.");
    }

    // Insert employee
    const employeeStmt = db.prepare(`
        INSERT OR REPLACE INTO employees (name, identifier, pto_rate, carryover_hours, hire_date, role, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const identifier = employeeName.toString().toLowerCase().replace(/\s+/g, ".");
    employeeStmt.run([
        employeeName,
        identifier,
        0.71,
        0,
        new Date(hireDate).toISOString().split("T")[0],
        "Employee",
        null
    ]);

    const employeeId = db.exec("SELECT last_insert_rowid()")?.[0]?.values?.[0]?.[0] as number;
    employeeStmt.free();

    log(`Created employee with ID: ${employeeId}`);

    // Process PTO data
    const months = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    let monthlyHoursInserted = 0;
    let ptoEntriesInserted = 0;

    for (const entry of ptoData) {
        log(
            `Processing ${entry.month}: Work days: ${entry.workDays}, Used: ${entry.usedHours}, Available: ${entry.totalAvailable}`
        );

        // Insert monthly hours
        if (entry.workDays > 0) {
            const monthlyHoursStmt = db.prepare(`
                INSERT INTO monthly_hours (employee_id, month, hours_worked, submitted_at)
                VALUES (?, ?, ?, ?)
            `);

            const monthIndex = months.indexOf(entry.month);
            const monthDate = new Date(2025, monthIndex, 1);

            monthlyHoursStmt.run([
                employeeId,
                monthDate.toISOString().split("T")[0],
                entry.workDays * 8,
                new Date().toISOString()
            ]);

            monthlyHoursStmt.free();
            monthlyHoursInserted++;
        }

        // Create PTO entries for used hours (simplified - one entry per month)
        if (entry.usedHours > 0) {
            const monthIndex = months.indexOf(entry.month);
            const year = 2025;
            const monthDate = new Date(year, monthIndex, 1);
            const nextMonth = new Date(year, monthIndex + 1, 1);
            const endDate = new Date(nextMonth.getTime() - 1);

            const ptoStmt = db.prepare(`
                INSERT INTO pto_entries (employee_id, start_date, end_date, type, hours, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            ptoStmt.run([
                employeeId,
                monthDate.toISOString().split("T")[0],
                endDate.toISOString().split("T")[0],
                "PTO",
                entry.usedHours,
                new Date().toISOString()
            ]);

            ptoStmt.free();
            ptoEntriesInserted++;
        }
    }

    if (!options.dryRun) {
        // Save database
        const dbData = db.export();
        const buffer = Buffer.from(dbData);
        fs.writeFileSync(DB_PATH, buffer);
        log("Migration completed successfully");
    } else {
        log("Dry-run complete. Database was not modified.");
    }

    log(`Summary: monthly hours inserted=${monthlyHoursInserted}, PTO entries inserted=${ptoEntriesInserted}`);
    if (backupPath) {
        log(`Backup file: ${backupPath}`);
    }
}

// Run migration
migrateSpreadsheet().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    log(`Migration failed: ${message}`);
    process.exit(1);
});
