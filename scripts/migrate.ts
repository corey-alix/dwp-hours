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
  debugCells: string[] | null;
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
  rollbackLatest: false,
  debugCells: null,
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
  } else if (arg === "--debug") {
    const cellsArg = args[i + 1];
    if (cellsArg) {
      options.debugCells = cellsArg
        .split(/[,\s]+/)
        .filter((cell) => cell.trim());
      i++;
    } else {
      options.debugCells = [];
    }
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

async function debugCells(cells: string[]): Promise<void> {
  if (!fs.existsSync(LEGACY_XLSX_PATH)) {
    log(`Excel file not found at ${LEGACY_XLSX_PATH}`);
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(LEGACY_XLSX_PATH);
  const worksheet = workbook.worksheets[0]; // Assume first worksheet

  const result: { [key: string]: any } = {};

  for (const cellRef of cells) {
    try {
      const cell = worksheet.getCell(cellRef);
      result[cellRef] = {
        value: cell.value,
        text: cell.text,
        type: cell.type,
        fill: cell.fill,
        font: cell.font,
      };
    } catch (error) {
      result[cellRef] = { error: `Failed to read cell: ${error}` };
    }
  }

  console.log(JSON.stringify(result, null, 2));
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

if (options.debugCells) {
  debugCells(options.debugCells)
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      log(`Debug failed: ${error}`);
      process.exit(1);
    });
  process.exit(0); // Exit early for debug mode
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
  const ptoSectionIndex = lines.findIndex((line) =>
    line.includes("PTO CALCULATION SECTION"),
  );
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
    "December",
  ];

  for (let i = ptoSectionIndex + 3; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.includes("PTO CALCULATION SECTION")) continue;

    const parts = line.split("\t"); // Don't filter empty parts
    if (parts.length < 23) continue; // Expect at least 23 parts

    const month = parts[0];
    if (!months.includes(month)) continue;

    // Parse the line - tab separated with consistent positions
    const workDays = parseFloat(parts[2]) || 0;
    const dailyRate = parseFloat(parts[4]) || 0;
    const availablePTO = parseFloat(parts[8]) || 0;
    const carryover = parseFloat(parts[10]) || 0;
    const subtotal = parseFloat(parts[13]) || 0;
    const usedHours = parseFloat(parts[17]) || 0;
    const totalAvailable = parseFloat(parts[19]) || 0;

    ptoData.push({
      month,
      workDays,
      dailyRate,
      availablePTO,
      carryover,
      subtotal,
      usedHours,
      totalAvailable,
    });

    if (ptoData.length >= 12) break;
  }

  return {
    employeeName,
    hireDate,
    ptoData,
  };
}

async function parseExcelSpreadsheet(): Promise<ParsedSpreadsheet> {
  if (!fs.existsSync(LEGACY_XLSX_PATH)) {
    throw new Error(`Excel file not found at ${LEGACY_XLSX_PATH}`);
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(LEGACY_XLSX_PATH);
  const worksheet = workbook.worksheets[0];

  // Extract employee info from R2 (hire date)
  const hireDateCell = worksheet.getCell("R2");
  let hireDate = "2023-02-13"; // default
  if (hireDateCell.value && typeof hireDateCell.value === "string") {
    const match = hireDateCell.value.match(/Hire Date:\s*(.+)/);
    if (match) {
      hireDate = match[1].trim();
    }
  }

  // Parse PTO data from C42-C53 (months) and related columns
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
    "December",
  ];

  for (let i = 0; i < 12; i++) {
    const row = 42 + i; // C42 to C53
    const monthCell = worksheet.getCell(row, 3); // Column C
    const month = monthCell.value?.toString() || months[i];

    // Get PTO calculation data from columns D-W
    const workDays =
      parseFloat(worksheet.getCell(row, 4).value?.toString() || "0") || 0; // D
    const dailyRate =
      parseFloat(worksheet.getCell(row, 6).value?.toString() || "0") || 0; // F
    const availablePTO =
      parseFloat(worksheet.getCell(row, 10).value?.toString() || "0") || 0; // J
    const carryover =
      parseFloat(worksheet.getCell(row, 12).value?.toString() || "0") || 0; // L
    const subtotal =
      parseFloat(worksheet.getCell(row, 15).value?.toString() || "0") || 0; // O
    const usedHours =
      parseFloat(worksheet.getCell(row, 19).value?.toString() || "0") || 0; // S
    const totalAvailable =
      parseFloat(worksheet.getCell(row, 23).value?.toString() || "0") || 0; // W

    ptoData.push({
      month,
      workDays,
      dailyRate,
      availablePTO,
      carryover,
      subtotal,
      usedHours,
      totalAvailable,
    });
  }

  return {
    employeeName: "Corey Alix",
    hireDate,
    ptoData,
  };
}

async function migrateSpreadsheet(): Promise<void> {
  // Parse spreadsheet data - try Excel first, fall back to text
  let data: ParsedSpreadsheet;
  try {
    data = await parseExcelSpreadsheet();
    log("Successfully parsed Excel spreadsheet");
  } catch (error) {
    log(`Excel parsing failed: ${error}. Falling back to text spreadsheet.`);
    data = parseTextSpreadsheet();
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

  // Insert employee with specific email
  const employeeStmt = db.prepare(`
        INSERT OR REPLACE INTO employees (name, identifier, pto_rate, carryover_hours, hire_date, role, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

  const identifier = "test-coreyalix@gmail.com"; // Use specific email as requested
  employeeStmt.run([
    employeeName,
    identifier,
    0.71,
    0,
    new Date(hireDate).toISOString().split("T")[0],
    "Employee",
    null,
  ]);

  const employeeId = db.exec("SELECT last_insert_rowid()")?.[0]
    ?.values?.[0]?.[0] as number;
  employeeStmt.free();

  log(`Created employee with ID: ${employeeId} and email: ${identifier}`);

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
    "December",
  ];

  let monthlyHoursInserted = 0;
  let ptoEntriesInserted = 0;

  for (const entry of ptoData) {
    log(
      `Processing ${entry.month}: Work days: ${entry.workDays}, Used: ${entry.usedHours}, Available: ${entry.totalAvailable}`,
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
        new Date().toISOString(),
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
                INSERT INTO pto_entries (employee_id, date, type, hours, created_at)
                VALUES (?, ?, ?, ?, ?)
            `);

      ptoStmt.run([
        employeeId,
        monthDate.toISOString().split("T")[0],
        "PTO",
        entry.usedHours,
        new Date().toISOString(),
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

  log(
    `Summary: monthly hours inserted=${monthlyHoursInserted}, PTO entries inserted=${ptoEntriesInserted}`,
  );
  if (backupPath) {
    log(`Backup file: ${backupPath}`);
  }
}

async function main(): Promise<void> {
  await migrateSpreadsheet();
}

// Run migration
main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  log(`Migration failed: ${message}`);
  process.exit(1);
});
