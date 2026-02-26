/**
 * Validate Excel Import Script
 *
 * Validates the database PTO data against the source Excel spreadsheet by:
 * 1. Extracting declared PTO hours (column S, rows 42-53) from every employee sheet
 * 2. Seeding the database via the API
 * 3. Importing the Excel file via the API
 * 4. Querying PTO entries and aggregating by employee + month
 * 5. Comparing and reporting discrepancies
 *
 * Usage:
 *   pnpm validate:xlsx [--file path/to/file.xlsx]
 *
 * Environment:
 *   PORT  Server port (default: 3003)
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import {
  parsePtoCalcUsedHours,
  findPtoCalcStartRow,
} from "../server/reportGenerators/excelImport.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");

const PORT = process.env.PORT || "3003";
const BASE = `http://localhost:${PORT}`;
const ADMIN_EMAIL = "admin@example.com";
const DEFAULT_XLSX = resolve(__dirname, "..", "reports", "2018.xlsx");

// ── Argument parsing ──

function parseArgs(): { file: string } {
  const argv = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--") && i + 1 < argv.length) {
      map.set(argv[i].slice(2), argv[i + 1]);
      i++;
    }
  }

  return { file: map.get("file") || DEFAULT_XLSX };
}

// ── Authentication (same pattern as query-pto.mts) ──

async function authenticate(): Promise<string> {
  const linkRes = await fetch(`${BASE}/api/auth/request-link`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-mode": "true",
    },
    body: JSON.stringify({ identifier: ADMIN_EMAIL }),
  });
  const linkData = (await linkRes.json()) as {
    magicLink?: string;
    message?: string;
  };
  const magicLink = linkData.magicLink;
  if (!magicLink) {
    console.error("Failed to get magic link:", linkData);
    process.exit(1);
  }

  const token = new URL(magicLink).searchParams.get("token");
  if (!token) {
    console.error("No token in magic link:", magicLink);
    process.exit(1);
  }

  const validateRes = await fetch(`${BASE}/api/auth/validate?token=${token}`);
  const validateData = (await validateRes.json()) as {
    authToken?: string;
  };
  if (!validateData.authToken) {
    console.error("Failed to validate token:", validateData);
    process.exit(1);
  }

  return validateData.authToken;
}

// ── API helpers ──

async function fetchJson<T>(url: string, session: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Cookie: `auth_hash=${session}` },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} from ${url}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

// ── Types ──

interface ExcelDeclaredData {
  employeeName: string;
  months: { month: number; declaredHours: number }[];
  totalDeclaredHours: number;
}

interface PtoEntry {
  id: number;
  employeeId: number;
  date: string;
  type: string;
  hours: number;
  createdAt: string;
  approved_by: string | null;
  notes: string | null;
}

interface EmployeeInfo {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: string;
}

interface ImportResponse {
  message: string;
  employeesProcessed: number;
  employeesCreated: number;
  ptoEntriesUpserted: number;
  acknowledgementsSynced: number;
  warnings: string[];
  perEmployee: {
    name: string;
    employeeId: number;
    ptoEntries: number;
    acknowledgements: number;
    created: boolean;
  }[];
}

interface Discrepancy {
  employeeName: string;
  month: number;
  declaredHours: number;
  actualHours: number;
  delta: number;
}

// ── Phase 1: Extract Excel data ──

async function extractExcelData(
  filePath: string,
): Promise<ExcelDeclaredData[]> {
  console.log(`\n📊 Phase 1: Extracting PTO data from ${filePath}...`);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const results: ExcelDeclaredData[] = [];

  for (const ws of workbook.worksheets) {
    // Skip non-employee sheets (e.g., summary sheets)
    try {
      findPtoCalcStartRow(ws);
    } catch {
      console.log(`  Skipping sheet "${ws.name}" (no PTO calc section)`);
      continue;
    }

    const ptoCalcRows = parsePtoCalcUsedHours(ws);
    const totalDeclaredHours = ptoCalcRows.reduce(
      (sum, r) => sum + r.usedHours,
      0,
    );

    results.push({
      employeeName: ws.name,
      months: ptoCalcRows.map((r) => ({
        month: r.month,
        declaredHours: r.usedHours,
      })),
      totalDeclaredHours,
    });
  }

  console.log(`  Extracted data for ${results.length} employees`);
  return results;
}

// ── Phase 2: Seed & Import ──

async function seedDatabase(): Promise<void> {
  console.log(`\n🌱 Phase 2a: Seeding database...`);
  await postJson(`${BASE}/api/test/seed`, {}, { "x-test-seed": "true" });
  console.log("  Database seeded successfully");
}

async function importExcel(
  session: string,
  filePath: string,
): Promise<ImportResponse> {
  console.log(`📥 Phase 2b: Importing Excel file...`);

  const formData = new FormData();
  const { readFileSync } = await import("fs");
  const fileBuffer = readFileSync(filePath);
  const blob = new Blob([fileBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  formData.append("file", blob, "2018.xlsx");

  const res = await fetch(`${BASE}/api/admin/import-excel`, {
    method: "POST",
    headers: { Cookie: `auth_hash=${session}` },
    body: formData,
  });

  if (!res.ok) {
    throw new Error(
      `Import failed: HTTP ${res.status} - ${await res.text()}`,
    );
  }

  const result = (await res.json()) as ImportResponse;
  console.log(
    `  Imported: ${result.employeesProcessed} employees, ${result.ptoEntriesUpserted} PTO entries`,
  );
  if (result.warnings.length > 0) {
    console.log(`  Warnings: ${result.warnings.length}`);
  }
  return result;
}

// ── Phase 3: Query & Aggregate ──

async function queryAndAggregate(
  session: string,
): Promise<Map<string, Map<number, number>>> {
  console.log(`\n🔍 Phase 3: Querying PTO entries from database...`);

  // Get all employees for ID→name mapping
  const employees = await fetchJson<EmployeeInfo[]>(
    `${BASE}/api/employees`,
    session,
  );
  const employeeMap = new Map<number, string>();
  for (const emp of employees) {
    employeeMap.set(emp.id, emp.name);
  }

  // Query all PTO entries for 2018
  const ptoEntries = await fetchJson<PtoEntry[]>(
    `${BASE}/api/admin/pto?startDate=2018-01-01&endDate=2018-12-31`,
    session,
  );

  console.log(
    `  Found ${ptoEntries.length} PTO entries across ${employees.length} employees`,
  );

  // Aggregate by employee name + month
  // Column S only tracks PTO + Sick hours (excludes Bereavement, Jury Duty)
  const COLUMN_S_TYPES = new Set(["PTO"]);
  const aggregated = new Map<string, Map<number, number>>();

  for (const entry of ptoEntries) {
    if (!COLUMN_S_TYPES.has(entry.type)) continue;

    const empName = employeeMap.get(entry.employeeId);
    if (!empName) continue;

    const month = parseInt(entry.date.substring(5, 7));

    if (!aggregated.has(empName)) {
      aggregated.set(empName, new Map<number, number>());
    }
    const empMonths = aggregated.get(empName)!;
    empMonths.set(month, (empMonths.get(month) || 0) + entry.hours);
  }

  return aggregated;
}

// ── Phase 4: Compare & Report ──

function compareAndReport(
  excelData: ExcelDeclaredData[],
  dbData: Map<string, Map<number, number>>,
): Discrepancy[] {
  console.log(`\n📋 Phase 4: Comparing Excel vs Database...\n`);

  const discrepancies: Discrepancy[] = [];
  const monthNames = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  let totalMatches = 0;
  let totalMismatches = 0;
  let totalDeclared = 0;
  let totalActual = 0;

  for (const emp of excelData) {
    const dbMonths = dbData.get(emp.employeeName);
    const empDiscrepancies: Discrepancy[] = [];

    for (const { month, declaredHours } of emp.months) {
      const actualHours = dbMonths?.get(month) || 0;
      totalDeclared += declaredHours;
      totalActual += actualHours;

      // Use a small tolerance for floating point comparison
      const delta = actualHours - declaredHours;
      if (Math.abs(delta) > 0.01) {
        totalMismatches++;
        empDiscrepancies.push({
          employeeName: emp.employeeName,
          month,
          declaredHours,
          actualHours,
          delta,
        });
      } else {
        totalMatches++;
      }
    }

    if (empDiscrepancies.length > 0) {
      console.log(`❌ ${emp.employeeName}:`);
      for (const d of empDiscrepancies) {
        const sign = d.delta > 0 ? "+" : "";
        console.log(
          `     ${monthNames[d.month].padEnd(3)}  Excel: ${String(d.declaredHours).padStart(6)}h  DB: ${String(d.actualHours).padStart(6)}h  Δ: ${sign}${d.delta.toFixed(2)}h`,
        );
      }
      discrepancies.push(...empDiscrepancies);
    } else if (emp.totalDeclaredHours > 0) {
      console.log(`✅ ${emp.employeeName}: all months match`);
    }
  }

  // Check for employees in DB but not in Excel
  for (const [dbName] of dbData) {
    if (!excelData.find((e) => e.employeeName === dbName)) {
      console.log(`⚠️  ${dbName}: in database but not found in Excel sheets`);
    }
  }

  // Summary
  console.log(`\n${"─".repeat(60)}`);
  console.log(`SUMMARY`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  Employees checked:  ${excelData.length}`);
  console.log(`  Month-slots matched: ${totalMatches}`);
  console.log(`  Month-slots mismatched: ${totalMismatches}`);
  console.log(
    `  Total declared hours: ${totalDeclared.toFixed(2)}h`,
  );
  console.log(
    `  Total actual hours:   ${totalActual.toFixed(2)}h`,
  );
  console.log(
    `  Total delta:          ${(totalActual - totalDeclared).toFixed(2)}h`,
  );
  console.log(`${"─".repeat(60)}`);

  return discrepancies;
}

// ── Main ──

async function main() {
  const args = parseArgs();
  console.log(`🔧 Validate Excel Import`);
  console.log(`   File: ${args.file}`);
  console.log(`   Server: ${BASE}`);

  // Phase 1: Extract Excel data
  const excelData = await extractExcelData(args.file);

  // Save extracted data to JSON
  const jsonPath = "/tmp/excel-pto-declared.json";
  writeFileSync(jsonPath, JSON.stringify(excelData, null, 2), "utf-8");
  console.log(`  Saved extracted data to ${jsonPath}`);

  // Phase 2: Seed & Import
  await seedDatabase();
  console.log(`  Authenticating as ${ADMIN_EMAIL}...`);
  const session = await authenticate();
  const importResult = await importExcel(session, args.file);

  // Re-authenticate after seed (seed clears all employees including admin)
  console.log(`  Re-authenticating after import...`);
  const postImportSession = await authenticate();

  // Phase 3: Query & Aggregate
  const dbData = await queryAndAggregate(postImportSession);

  // Phase 4: Compare & Report
  const discrepancies = compareAndReport(excelData, dbData);

  // Save discrepancy report
  const reportPath = "/tmp/excel-import-discrepancies.json";
  writeFileSync(reportPath, JSON.stringify(discrepancies, null, 2), "utf-8");
  console.log(`\n  Discrepancy report saved to ${reportPath}`);

  // Save import result for reference
  const importPath = "/tmp/excel-import-result.json";
  writeFileSync(
    importPath,
    JSON.stringify(importResult, null, 2),
    "utf-8",
  );
  console.log(`  Import result saved to ${importPath}`);

  if (discrepancies.length > 0) {
    console.log(
      `\n⚠️  Found ${discrepancies.length} discrepancies. Exit code: 1`,
    );
    process.exit(1);
  } else {
    console.log(`\n✅ All PTO hours match! Exit code: 0`);
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(2);
});
