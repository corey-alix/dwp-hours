import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DataSource } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "../server/entities/index.js";
import { Notification } from "../server/entities/Notification.js";
import { assembleReportData } from "../server/reportService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testDb: initSqlJs.Database;
let dataSource: DataSource;

beforeAll(async () => {
  const SQL = await initSqlJs();
  testDb = new SQL.Database();

  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  testDb.exec(schema);

  dataSource = new DataSource({
    type: "sqljs",
    database: new Uint8Array(testDb.export()),
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
    autoSave: false,
  });

  await dataSource.initialize();
});

afterAll(async () => {
  await dataSource.destroy();
});

beforeEach(async () => {
  await dataSource.getRepository(AdminAcknowledgement).clear();
  await dataSource.getRepository(Acknowledgement).clear();
  await dataSource.getRepository(PtoEntry).clear();
  await dataSource.getRepository(MonthlyHours).clear();
  await dataSource.getRepository(Employee).clear();
});

async function seedEmployee(
  overrides: Partial<Employee> & { id: number; name: string },
) {
  const repo = dataSource.getRepository(Employee);
  await repo.save({
    identifier: `${overrides.name.toLowerCase().replace(/\s/g, ".")}@example.com`,
    pto_rate: 0.71,
    carryover_hours: 0,
    hire_date: new Date("2023-01-01"),
    role: "Employee",
    ...overrides,
  });
}

describe("Report Service — assembleReportData", () => {
  it("should return report data with correct shape", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const report = await assembleReportData(dataSource, 2025);

    expect(report.year).toBe(2025);
    expect(report.generatedAt).toBeDefined();
    expect(report.employees).toHaveLength(1);
  });

  it("should return employees sorted by name", async () => {
    await seedEmployee({ id: 1, name: "Charlie" });
    await seedEmployee({ id: 2, name: "Alice" });
    await seedEmployee({ id: 3, name: "Bob" });

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees.map((e) => e.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });

  it("should include PTO entries for the target year", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const ptoRepo = dataSource.getRepository(PtoEntry);
    await ptoRepo.save([
      {
        employee_id: 1,
        date: "2025-03-10",
        type: "PTO",
        hours: 8,
      },
      {
        employee_id: 1,
        date: "2024-12-20",
        type: "PTO",
        hours: 8,
      }, // different year
    ]);

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees[0].ptoEntries).toHaveLength(1);
    expect(report.employees[0].ptoEntries[0].date).toBe("2025-03-10");
  });

  it("should include monthly hours for the target year only", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const mhRepo = dataSource.getRepository(MonthlyHours);
    await mhRepo.save([
      { employee_id: 1, month: "2025-01", hours_worked: 160 },
      { employee_id: 1, month: "2024-12", hours_worked: 152 },
    ]);

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees[0].monthlyHours).toHaveLength(1);
    expect(report.employees[0].monthlyHours[0].month).toBe("2025-01");
  });

  it("should include employee acknowledgements for the target year", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const ackRepo = dataSource.getRepository(Acknowledgement);
    await ackRepo.save({
      employee_id: 1,
      month: "2025-01",
    });

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees[0].acknowledgements).toHaveLength(1);
    expect(report.employees[0].acknowledgements[0].month).toBe("2025-01");
  });

  it("should include admin acknowledgements with admin name", async () => {
    await seedEmployee({ id: 1, name: "Alice" });
    await seedEmployee({ id: 2, name: "Mandi", role: "Admin" } as any);

    const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
    await adminAckRepo.save({
      employee_id: 1,
      month: "2025-01",
      admin_id: 2,
    });

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees[0].adminAcknowledgements).toHaveLength(1);
    expect(report.employees[0].adminAcknowledgements[0].adminName).toBe(
      "Mandi",
    );
  });

  it("should compute 12 PTO calculation rows per employee", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees[0].ptoCalculation).toHaveLength(12);
    expect(report.employees[0].ptoCalculation[0].monthName).toBe("January");
    expect(report.employees[0].ptoCalculation[11].monthName).toBe("December");
  });

  it("should compute work days and accrued hours in calculation rows", async () => {
    await seedEmployee({ id: 1, name: "Alice" });

    const report = await assembleReportData(dataSource, 2025);
    const jan = report.employees[0].ptoCalculation[0];

    expect(jan.workDays).toBeGreaterThan(0);
    expect(jan.dailyRate).toBeGreaterThan(0);
    expect(jan.accruedHours).toBeGreaterThan(0);
  });

  it("should reflect PTO usage in calculation rows", async () => {
    await seedEmployee({ id: 1, name: "Alice", carryover_hours: 20 } as any);

    const ptoRepo = dataSource.getRepository(PtoEntry);
    await ptoRepo.save({
      employee_id: 1,
      date: "2025-01-15",
      type: "PTO",
      hours: 8,
    });

    const report = await assembleReportData(dataSource, 2025);
    const jan = report.employees[0].ptoCalculation[0];

    expect(jan.usedHours).toBe(8);
    expect(jan.carryover).toBe(20); // carryover from previous year
    expect(jan.remainingBalance).toBe(jan.subtotal - 8);
  });

  it("should handle an empty database (no employees)", async () => {
    const report = await assembleReportData(dataSource, 2025);

    expect(report.employees).toHaveLength(0);
    expect(report.year).toBe(2025);
  });
});
