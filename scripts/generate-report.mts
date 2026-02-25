#!/usr/bin/env npx tsx
/**
 * Generate a PTO HTML report from the current database.
 *
 * Usage:
 *   npx tsx scripts/generate-report.mts [year]
 *
 * The report is written to reports/pto-report-YYYY.html
 */

import "reflect-metadata";
import { DataSource } from "typeorm";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
  Notification,
} from "../server/entities/index.js";
import { assembleReportData } from "../server/reportService.js";
import { generateHtmlReport } from "../server/reportGenerators/htmlReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, "..", "db", "dwp-hours.db");
const REPORTS_DIR = path.join(__dirname, "..", "reports");

const year = parseInt(process.argv[2] || String(new Date().getFullYear()), 10);

if (isNaN(year) || year < 2000 || year > 2100) {
  console.error(
    "Invalid year. Usage: npx tsx scripts/generate-report.mts [year]",
  );
  process.exit(1);
}

if (!fs.existsSync(DB_PATH)) {
  console.error(`Database not found at ${DB_PATH}. Run seed first.`);
  process.exit(1);
}

// Initialize TypeORM DataSource pointing at the existing SQLite file
const dataSource = new DataSource({
  type: "sqljs",
  location: DB_PATH,
  autoSave: false,
  entities: [
    Employee,
    PtoEntry,
    MonthlyHours,
    Acknowledgement,
    AdminAcknowledgement,
    Notification,
  ],
  synchronize: false,
  logging: false,
});

try {
  await dataSource.initialize();
  console.log("Database connected.");

  const reportData = await assembleReportData(dataSource, year);
  console.log(
    `Assembled data for ${reportData.employees.length} employee(s), year ${year}.`,
  );

  const html = generateHtmlReport(reportData);

  // Ensure reports directory exists
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const outFile = path.join(REPORTS_DIR, `pto-report-${year}.html`);
  fs.writeFileSync(outFile, html, "utf-8");
  console.log(`Report written to ${outFile}`);

  await dataSource.destroy();
} catch (err) {
  console.error("Failed to generate report:", err);
  process.exit(1);
}
