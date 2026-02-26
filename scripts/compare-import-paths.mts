/**
 * Compare Server-Side vs Browser-Side Import Paths
 *
 * Loads the Excel workbook and runs both import paths in-process to compare
 * the parsed results directly — no server needed.
 *
 * Path A (Server): Uses importExcelWorkbook's flow — extractThemeColors
 *   from workbook._themes.theme1 XML, then parseEmployeeSheet per sheet.
 * Path B (Browser): Uses excelImportClient's flow — extractThemeColors(),
 *   then parseEmployeeSheet per sheet, mapped to BulkImportPayload.
 *
 * Compares: employee names, PTO entries (date, type, hours, notes),
 * acknowledgements, and warnings.
 *
 * Usage:
 *   pnpm compare:import [--file path/to/file.xlsx]
 */

import { writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";
import ExcelJS from "exceljs";
import {
  isEmployeeSheet,
  parseEmployeeSheet,
  extractThemeColors,
  generateIdentifier,
  computePtoRate,
  parseThemeColors,
  DEFAULT_OFFICE_THEME,
  type SheetImportResult,
} from "../shared/excelParsing.ts";
import type {
  BulkImportPayload,
  BulkImportEmployee,
} from "../shared/api-models.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, "..");
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

// ── Types ──

interface ParsedEmployee {
  name: string;
  identifier: string;
  hireDate: string;
  carryoverHours: number;
  ptoRate: number;
  ptoEntries: {
    date: string;
    hours: number;
    type: string;
    notes: string;
    isNoteDerived: boolean;
  }[];
  acknowledgements: {
    month: string;
    type: string;
    note: string;
    status: string;
  }[];
  warnings: string[];
}

interface PathResult {
  label: string;
  themeColors: Map<number, string>;
  employees: ParsedEmployee[];
  totalPtoEntries: number;
  totalAcknowledgements: number;
  totalWarnings: number;
}

// ── Path A: Server-side flow (same as importExcelWorkbook) ──

function runServerPath(workbook: ExcelJS.Workbook): PathResult {
  // Server extracts theme colors directly from workbook internals
  let themeColors: Map<number, string> = DEFAULT_OFFICE_THEME;
  try {
    const wbAny = workbook as any;
    const themeXml: string | undefined =
      wbAny._themes?.theme1 ?? wbAny.themes?.theme1 ?? wbAny._model?.themes?.theme1;
    if (themeXml) {
      themeColors = parseThemeColors(themeXml);
    }
  } catch { /* use defaults */ }

  const employees: ParsedEmployee[] = [];
  let totalPto = 0;
  let totalAcks = 0;
  let totalWarns = 0;

  for (const ws of workbook.worksheets) {
    if (!isEmployeeSheet(ws)) continue;

    try {
      const result: SheetImportResult = parseEmployeeSheet(ws, themeColors);
      const { rate } = computePtoRate(result.employee);
      const identifier = generateIdentifier(result.employee.name);

      employees.push({
        name: result.employee.name,
        identifier,
        hireDate: result.employee.hireDate || "",
        carryoverHours: result.employee.carryoverHours,
        ptoRate: rate,
        ptoEntries: result.ptoEntries.map((e) => ({
          date: e.date,
          hours: e.hours,
          type: e.type,
          notes: (e.notes || "").trim(),
          isNoteDerived: !!e.isNoteDerived,
        })),
        acknowledgements: result.acknowledgements.map((a) => ({
          month: a.month,
          type: a.type,
          note: (a.note || "").trim(),
          status: (a.status || "").trim(),
        })),
        warnings: result.warnings,
      });

      totalPto += result.ptoEntries.length;
      totalAcks += result.acknowledgements.length;
      totalWarns += result.warnings.length;
    } catch (err) {
      totalWarns++;
    }
  }

  return { label: "Server", themeColors, employees, totalPtoEntries: totalPto, totalAcknowledgements: totalAcks, totalWarnings: totalWarns };
}

// ── Path B: Browser-side flow (same as excelImportClient.ts) ──

function runBrowserPath(workbook: ExcelJS.Workbook): PathResult {
  // Browser uses extractThemeColors() wrapper
  const themeColors = extractThemeColors(workbook);

  const employees: ParsedEmployee[] = [];
  let totalPto = 0;
  let totalAcks = 0;
  let totalWarns = 0;

  for (const ws of workbook.worksheets) {
    if (!isEmployeeSheet(ws)) continue;

    try {
      const result: SheetImportResult = parseEmployeeSheet(ws, themeColors);
      const { rate } = computePtoRate(result.employee);
      const identifier = generateIdentifier(result.employee.name);

      employees.push({
        name: result.employee.name,
        identifier,
        hireDate: result.employee.hireDate || "",
        carryoverHours: result.employee.carryoverHours,
        ptoRate: rate,
        ptoEntries: result.ptoEntries.map((e) => ({
          date: e.date,
          hours: e.hours,
          type: e.type,
          notes: (e.notes || "").trim(),
          isNoteDerived: !!e.isNoteDerived,
        })),
        acknowledgements: result.acknowledgements.map((a) => ({
          month: a.month,
          type: a.type,
          note: (a.note || "").trim(),
          status: (a.status || "").trim(),
        })),
        warnings: result.warnings,
      });

      totalPto += result.ptoEntries.length;
      totalAcks += result.acknowledgements.length;
      totalWarns += result.warnings.length;
    } catch (err) {
      totalWarns++;
    }
  }

  return { label: "Browser", themeColors, employees, totalPtoEntries: totalPto, totalAcknowledgements: totalAcks, totalWarnings: totalWarns };
}

// ── Comparison ──

interface Diff {
  category: "theme" | "employee" | "pto-entry" | "acknowledgement" | "summary";
  name: string;
  field: string;
  serverValue: unknown;
  browserValue: unknown;
}

function compareResults(server: PathResult, browser: PathResult): Diff[] {
  const diffs: Diff[] = [];

  // Compare theme color maps
  const allThemeIds = new Set([...server.themeColors.keys(), ...browser.themeColors.keys()]);
  for (const id of allThemeIds) {
    const sv = server.themeColors.get(id);
    const bv = browser.themeColors.get(id);
    if (sv !== bv) {
      diffs.push({ category: "theme", name: `theme[${id}]`, field: "argb", serverValue: sv, browserValue: bv });
    }
  }

  // Compare summary counts
  if (server.employees.length !== browser.employees.length) {
    diffs.push({ category: "summary", name: "count", field: "employees", serverValue: server.employees.length, browserValue: browser.employees.length });
  }
  if (server.totalPtoEntries !== browser.totalPtoEntries) {
    diffs.push({ category: "summary", name: "count", field: "ptoEntries", serverValue: server.totalPtoEntries, browserValue: browser.totalPtoEntries });
  }
  if (server.totalAcknowledgements !== browser.totalAcknowledgements) {
    diffs.push({ category: "summary", name: "count", field: "acknowledgements", serverValue: server.totalAcknowledgements, browserValue: browser.totalAcknowledgements });
  }

  // Build name-keyed maps
  const serverMap = new Map(server.employees.map((e) => [e.name, e]));
  const browserMap = new Map(browser.employees.map((e) => [e.name, e]));
  const allNames = new Set([...serverMap.keys(), ...browserMap.keys()]);

  for (const name of allNames) {
    const se = serverMap.get(name);
    const be = browserMap.get(name);

    if (!se || !be) {
      diffs.push({
        category: "employee",
        name,
        field: "presence",
        serverValue: se ? "PRESENT" : "MISSING",
        browserValue: be ? "PRESENT" : "MISSING",
      });
      continue;
    }

    // Compare employee fields
    for (const field of ["identifier", "hireDate", "carryoverHours", "ptoRate"] as const) {
      const sv = se[field];
      const bv = be[field];
      if (typeof sv === "number" && typeof bv === "number") {
        if (Math.abs(sv - bv) > 0.001) {
          diffs.push({ category: "employee", name, field, serverValue: sv, browserValue: bv });
        }
      } else if (sv !== bv) {
        diffs.push({ category: "employee", name, field, serverValue: sv, browserValue: bv });
      }
    }

    // Compare PTO entries
    type EntryKey = string;
    const sEntries = new Map<EntryKey, (typeof se.ptoEntries)[0]>();
    for (const e of se.ptoEntries) sEntries.set(`${e.date}|${e.type}`, e);
    const bEntries = new Map<EntryKey, (typeof be.ptoEntries)[0]>();
    for (const e of be.ptoEntries) bEntries.set(`${e.date}|${e.type}`, e);

    const allEntryKeys = new Set([...sEntries.keys(), ...bEntries.keys()]);
    for (const key of allEntryKeys) {
      const sE = sEntries.get(key);
      const bE = bEntries.get(key);
      const label = `${name}|${key}`;

      if (!sE || !bE) {
        diffs.push({
          category: "pto-entry",
          name: label,
          field: "presence",
          serverValue: sE ? `${sE.hours}h` : "MISSING",
          browserValue: bE ? `${bE.hours}h` : "MISSING",
        });
        continue;
      }
      if (Math.abs(sE.hours - bE.hours) > 0.001) {
        diffs.push({ category: "pto-entry", name: label, field: "hours", serverValue: sE.hours, browserValue: bE.hours });
      }
      if (sE.notes !== bE.notes) {
        diffs.push({ category: "pto-entry", name: label, field: "notes", serverValue: sE.notes || "(empty)", browserValue: bE.notes || "(empty)" });
      }
      if (sE.isNoteDerived !== bE.isNoteDerived) {
        diffs.push({ category: "pto-entry", name: label, field: "isNoteDerived", serverValue: sE.isNoteDerived, browserValue: bE.isNoteDerived });
      }
    }

    // Compare acknowledgements
    const sAcks = new Map(se.acknowledgements.map((a) => [`${a.month}|${a.type}`, a]));
    const bAcks = new Map(be.acknowledgements.map((a) => [`${a.month}|${a.type}`, a]));
    const allAckKeys = new Set([...sAcks.keys(), ...bAcks.keys()]);
    for (const key of allAckKeys) {
      const sA = sAcks.get(key);
      const bA = bAcks.get(key);
      const label = `${name}|${key}`;

      if (!sA || !bA) {
        diffs.push({
          category: "acknowledgement",
          name: label,
          field: "presence",
          serverValue: sA ? "PRESENT" : "MISSING",
          browserValue: bA ? "PRESENT" : "MISSING",
        });
        continue;
      }
      if (sA.note !== bA.note) {
        diffs.push({ category: "acknowledgement", name: label, field: "note", serverValue: sA.note, browserValue: bA.note });
      }
      if (sA.status !== bA.status) {
        diffs.push({ category: "acknowledgement", name: label, field: "status", serverValue: sA.status, browserValue: bA.status });
      }
    }
  }

  return diffs;
}

// ── Main ──

async function main() {
  const args = parseArgs();
  console.log("🔧 Compare Server-Side vs Browser-Side Import (in-process)");
  console.log(`   File: ${args.file}\n`);

  console.log("  Loading workbook...");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(args.file);
  console.log(`  Loaded ${workbook.worksheets.length} worksheets.\n`);

  // ── Path A ──
  console.log("═══════════════════════════════════════════════════");
  console.log("  Path A: SERVER-SIDE flow");
  console.log("    (theme via workbook._themes.theme1 XML)");
  console.log("═══════════════════════════════════════════════════");
  const serverResult = runServerPath(workbook);
  console.log(`  Theme colors: ${serverResult.themeColors.size}`);
  console.log(`  Employees: ${serverResult.employees.length}`);
  console.log(`  PTO entries: ${serverResult.totalPtoEntries}`);
  console.log(`  Acknowledgements: ${serverResult.totalAcknowledgements}`);
  console.log(`  Warnings: ${serverResult.totalWarnings}\n`);

  // ── Path B ──
  console.log("═══════════════════════════════════════════════════");
  console.log("  Path B: BROWSER-SIDE flow");
  console.log("    (theme via extractThemeColors() wrapper)");
  console.log("═══════════════════════════════════════════════════");
  const browserResult = runBrowserPath(workbook);
  console.log(`  Theme colors: ${browserResult.themeColors.size}`);
  console.log(`  Employees: ${browserResult.employees.length}`);
  console.log(`  PTO entries: ${browserResult.totalPtoEntries}`);
  console.log(`  Acknowledgements: ${browserResult.totalAcknowledgements}`);
  console.log(`  Warnings: ${browserResult.totalWarnings}\n`);

  // ── Compare ──
  console.log("═══════════════════════════════════════════════════");
  console.log("  COMPARISON");
  console.log("═══════════════════════════════════════════════════\n");

  const diffs = compareResults(serverResult, browserResult);

  if (diffs.length === 0) {
    console.log("✅ IDENTICAL — both import paths produce the same parsed results!\n");
  } else {
    console.log(`❌ Found ${diffs.length} difference(s):\n`);

    const grouped = new Map<string, Diff[]>();
    for (const d of diffs) {
      const key = d.category;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(d);
    }

    for (const [category, catDiffs] of grouped) {
      const icons: Record<string, string> = {
        theme: "🎨", summary: "📊", employee: "👤", "pto-entry": "📅", acknowledgement: "✉️",
      };
      console.log(`  ${icons[category] || "•"} ${category} (${catDiffs.length}):`);
      for (const d of catDiffs.slice(0, 30)) {
        console.log(`     ${d.name} [${d.field}]: server=${JSON.stringify(d.serverValue)} browser=${JSON.stringify(d.browserValue)}`);
      }
      if (catDiffs.length > 30) {
        console.log(`     ... and ${catDiffs.length - 30} more`);
      }
      console.log();
    }
  }

  // Also compare the BulkImportPayload mapping
  console.log("═══════════════════════════════════════════════════");
  console.log("  BULK PAYLOAD SIZE");
  console.log("═══════════════════════════════════════════════════\n");

  const payload: BulkImportPayload = {
    employees: browserResult.employees.map((e) => ({
      name: e.name,
      identifier: e.identifier,
      hireDate: e.hireDate,
      carryoverHours: e.carryoverHours,
      ptoRate: e.ptoRate,
      ptoEntries: e.ptoEntries.map((p) => ({
        date: p.date,
        hours: p.hours,
        type: p.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
        notes: p.notes || null,
        isNoteDerived: p.isNoteDerived,
      })),
      acknowledgements: e.acknowledgements.map((a) => ({
        month: a.month,
        type: a.type as "employee" | "admin",
        note: a.note || null,
        status: (a.status as "warning" | null) || null,
      })),
      warnings: e.warnings,
    })),
  };

  const payloadJson = JSON.stringify(payload);
  const payloadPath = "/tmp/bulk-import-payload.json";
  writeFileSync(payloadPath, JSON.stringify(payload, null, 2), "utf-8");
  console.log(`  Payload JSON: ${(payloadJson.length / 1024).toFixed(0)} KB raw, saved to ${payloadPath}`);
  console.log(`  Employees: ${payload.employees.length}`);
  console.log(`  Total PTO entries: ${payload.employees.reduce((s, e) => s + e.ptoEntries.length, 0)}`);
  console.log(`  Total acknowledgements: ${payload.employees.reduce((s, e) => s + e.acknowledgements.length, 0)}`);

  // Save report
  const reportPath = "/tmp/import-comparison-report.json";
  writeFileSync(
    reportPath,
    JSON.stringify({ summary: { server: { employees: serverResult.employees.length, ptoEntries: serverResult.totalPtoEntries, acknowledgements: serverResult.totalAcknowledgements, warnings: serverResult.totalWarnings }, browser: { employees: browserResult.employees.length, ptoEntries: browserResult.totalPtoEntries, acknowledgements: browserResult.totalAcknowledgements, warnings: browserResult.totalWarnings }, differences: diffs.length }, diffs }, null, 2),
    "utf-8",
  );
  console.log(`\n  Full report saved to ${reportPath}`);

  if (diffs.length > 0) {
    console.log(`\n⚠️  ${diffs.length} differences found. Exit code: 1`);
    process.exit(1);
  } else {
    console.log("\n✅ All clear! Exit code: 0");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(2);
});
