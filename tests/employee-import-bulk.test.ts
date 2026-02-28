import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DataSource, Between } from "typeorm";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "../server/entities/index.js";
import { BUSINESS_RULES_CONSTANTS } from "../shared/businessRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let testDb: initSqlJs.Database;
let dataSource: DataSource;
let app: express.Application;
let server: any;

/** Employee ID set during beforeEach for the test employee. */
let testEmployeeId: number;

const log = (message: string) => {
  // silent in tests
};

/**
 * Helper: creates a minimal Express app that mounts the employee import-bulk
 * handler with a fake auth middleware injecting `req.employee`.
 */
function createTestApp(
  ds: DataSource,
  authEmployee: { id: number; name: string; role: string },
) {
  const testApp = express();
  testApp.use(express.json({ limit: "10mb" }));

  // Fake auth middleware — injects req.employee
  testApp.use((req: Request, _res: Response, next: NextFunction) => {
    (req as any).employee = authEmployee;
    next();
  });

  // ── Mount the same handler logic as server.mts ──
  testApp.post(
    "/api/employee/import-bulk",
    async (req: Request, res: Response) => {
      try {
        const { employeeName, hireDate, year, ptoEntries, acknowledgements } =
          req.body as {
            employeeName: string;
            hireDate: string;
            year: number;
            ptoEntries: Array<{
              date: string;
              hours: number;
              type: string;
              notes?: string | null;
              isNoteDerived?: boolean;
            }>;
            acknowledgements: Array<{
              month: string;
              type: string;
              note?: string | null;
              status?: string | null;
            }>;
          };

        // Basic payload validation
        if (!employeeName || !hireDate || !year || !Array.isArray(ptoEntries)) {
          return res.status(400).json({
            error:
              "Invalid payload. Required: employeeName, hireDate, year, ptoEntries[].",
          });
        }

        const employee = (req as any).employee!;
        const employeeId = employee.id;

        // Identity verification (server-side)
        const empRepo = ds.getRepository(Employee);
        const dbEmployee = await empRepo.findOne({
          where: { id: employeeId },
        });
        if (!dbEmployee) {
          return res.status(404).json({ error: "Employee not found." });
        }

        const normalize = (s: string) =>
          s.trim().replace(/\s+/g, " ").toLowerCase();
        const dbName = normalize(dbEmployee.name);
        const sheetName = normalize(employeeName);
        if (dbName !== sheetName) {
          return res.status(403).json({
            error: `Spreadsheet name "${employeeName}" does not match your account name "${dbEmployee.name}".`,
          });
        }

        // Hire date comparison
        const dbHireDate = dbEmployee.hire_date
          ? String(dbEmployee.hire_date)
          : "";
        if (dbHireDate && hireDate && dbHireDate !== hireDate) {
          return res.status(403).json({
            error: `Spreadsheet hire date "${hireDate}" does not match your account hire date "${dbHireDate}".`,
          });
        }

        // Per-month admin-lock check & import
        const ptoRepo = ds.getRepository(PtoEntry);
        const adminAckRepo = ds.getRepository(AdminAcknowledgement);
        const ackRepo = ds.getRepository(Acknowledgement);
        const perMonth: Array<{
          month: string;
          status: "imported" | "skipped-locked";
          entriesImported: number;
          entriesDeleted: number;
          warnings: string[];
        }> = [];
        const allWarnings: string[] = [];
        let totalImported = 0;
        let totalDeleted = 0;

        for (let m = 1; m <= 12; m++) {
          const monthStr = `${year}-${m < 10 ? "0" + m : m}`;
          const monthWarnings: string[] = [];

          // Check admin lock
          const adminAck = await adminAckRepo.findOne({
            where: { employee_id: employeeId, month: monthStr },
          });
          if (adminAck) {
            perMonth.push({
              month: monthStr,
              status: "skipped-locked",
              entriesImported: 0,
              entriesDeleted: 0,
              warnings: [],
            });
            continue;
          }

          const monthEntries = ptoEntries.filter(
            (e) => e.date && e.date.startsWith(monthStr),
          );

          // Delete existing entries for this month (full overwrite)
          const existingEntries = await ptoRepo.find({
            where: {
              employee_id: employeeId,
              date: Between(`${monthStr}-01`, `${monthStr}-31`),
            },
          });
          const deletedCount = existingEntries.length;
          if (deletedCount > 0) {
            await ptoRepo.remove(existingEntries);
          }

          // Insert new entries (unapproved)
          let insertedCount = 0;
          for (const entry of monthEntries) {
            const validTypes = [
              "PTO",
              "Sick",
              "Bereavement",
              "Jury Duty",
            ] as const;
            type PtoType = (typeof validTypes)[number];
            const entryType: PtoType = validTypes.includes(
              entry.type as PtoType,
            )
              ? (entry.type as PtoType)
              : "PTO";

            const ptoEntry = ptoRepo.create({
              employee_id: employeeId,
              date: entry.date,
              type: entryType,
              hours: entry.hours,
              notes: entry.notes || null,
              approved_by: null,
            });
            await ptoRepo.save(ptoEntry);
            insertedCount++;
          }

          // Upsert employee acknowledgement
          const empAck = (acknowledgements || []).find(
            (a) => a.month === monthStr && a.type === "employee",
          );
          if (empAck) {
            const existing = await ackRepo.findOne({
              where: { employee_id: employeeId, month: monthStr },
            });
            if (!existing) {
              const newAck = ackRepo.create({
                employee_id: employeeId,
                month: monthStr,
                acknowledged_at: new Date(),
              });
              await ackRepo.save(newAck);
            }
          }

          // Business rule warnings
          const yearStart = `${year}-01-01`;
          const yearEnd = `${year}-12-31`;
          const allYearEntries = await ptoRepo.find({
            where: {
              employee_id: employeeId,
              date: Between(yearStart, yearEnd),
            },
          });
          const annualUsage: Record<string, number> = {
            PTO: 0,
            Sick: 0,
            Bereavement: 0,
            "Jury Duty": 0,
          };
          for (const e of allYearEntries) {
            if (e.type in annualUsage) {
              annualUsage[e.type] += e.hours;
            }
          }

          if (
            annualUsage["Sick"] > BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK
          ) {
            monthWarnings.push(
              `Sick hours (${annualUsage["Sick"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK}h.`,
            );
          }
          if (
            annualUsage["Bereavement"] >
            BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT
          ) {
            monthWarnings.push(
              `Bereavement hours (${annualUsage["Bereavement"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT}h.`,
            );
          }
          if (
            annualUsage["Jury Duty"] >
            BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY
          ) {
            monthWarnings.push(
              `Jury Duty hours (${annualUsage["Jury Duty"]}h) exceed annual limit of ${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY}h.`,
            );
          }

          totalImported += insertedCount;
          totalDeleted += deletedCount;
          allWarnings.push(...monthWarnings);

          perMonth.push({
            month: monthStr,
            status: "imported",
            entriesImported: insertedCount,
            entriesDeleted: deletedCount,
            warnings: monthWarnings,
          });
        }

        // All months locked → 409
        const importedMonths = perMonth.filter((m) => m.status === "imported");
        if (importedMonths.length === 0) {
          return res.status(409).json({
            error:
              "All months in the uploaded year are admin-locked. No data was imported.",
            perMonth,
          });
        }

        const lockedMonths = perMonth.filter(
          (m) => m.status === "skipped-locked",
        );
        const lockedSummary =
          lockedMonths.length > 0
            ? ` (${lockedMonths.length} month(s) skipped — admin-locked)`
            : "";

        res.json({
          message: `Import complete: ${totalImported} entries imported, ${totalDeleted} replaced${lockedSummary}.`,
          perMonth,
          totalEntriesImported: totalImported,
          totalEntriesDeleted: totalDeleted,
          warnings: allWarnings,
        });
      } catch (error) {
        log(`Error in employee import: ${error}`);
        res.status(500).json({ error: "Failed to process timesheet import" });
      }
    },
  );

  return testApp;
}

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
    ],
    synchronize: false,
    logging: false,
    autoSave: false,
  });

  await dataSource.initialize();
});

afterAll(async () => {
  if (server) {
    server.close();
  }
  if (dataSource) {
    await dataSource.destroy();
  }
  if (testDb) {
    testDb.close();
  }
});

beforeEach(async () => {
  // Clear all tables
  await dataSource.getRepository(AdminAcknowledgement).clear();
  await dataSource.getRepository(Acknowledgement).clear();
  await dataSource.getRepository(PtoEntry).clear();
  await dataSource.getRepository(MonthlyHours).clear();
  await dataSource.getRepository(Employee).clear();

  // Create a test employee
  const empRepo = dataSource.getRepository(Employee);
  const emp = empRepo.create({
    name: "Jane Doe",
    identifier: "jane@example.com",
    pto_rate: 6.67,
    carryover_hours: 0,
    hire_date: "2020-03-15",
    role: "Employee",
  });
  await empRepo.save(emp);
  testEmployeeId = emp.id;

  // New app for each test to inject the correct employee id
  app = createTestApp(dataSource, {
    id: testEmployeeId,
    name: "Jane Doe",
    role: "Employee",
  });
  server = app.listen(0);
});

// ─────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────

describe("POST /api/employee/import-bulk", () => {
  // ── Phase 1: Identity Verification ──

  describe("Identity Verification", () => {
    it("should return 400 for missing required fields", async () => {
      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({ employeeName: "Jane Doe" }); // missing hireDate, year, ptoEntries

      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Required");
    });

    it("should return 403 when employee name does not match", async () => {
      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "John Smith",
        hireDate: "2020-03-15",
        year: 2025,
        ptoEntries: [],
        acknowledgements: [],
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("does not match your account name");
    });

    it("should match names case-insensitively and whitespace-normalized", async () => {
      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "  jane   DOE  ",
        hireDate: "2020-03-15",
        year: 2025,
        ptoEntries: [],
        acknowledgements: [],
      });

      expect(res.status).toBe(200);
      expect(res.body.totalEntriesImported).toBe(0);
    });

    it("should return 403 when hire date does not match", async () => {
      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "Jane Doe",
        hireDate: "2019-01-01",
        year: 2025,
        ptoEntries: [],
        acknowledgements: [],
      });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain("does not match your account hire date");
    });

    it("should accept matching identity and return success", async () => {
      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "Jane Doe",
        hireDate: "2020-03-15",
        year: 2025,
        ptoEntries: [],
        acknowledgements: [],
      });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain("Import complete");
    });
  });

  // ── Phase 3: Admin-Lock Detection & Overwrite ──

  describe("Admin-Lock Detection & Overwrite", () => {
    it("should skip admin-locked months", async () => {
      // Lock January
      const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
      const lock = adminAckRepo.create({
        employee_id: testEmployeeId,
        month: "2025-01",
        admin_id: testEmployeeId, // use any valid employee id
        acknowledged_at: new Date(),
      });
      await adminAckRepo.save(lock);

      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [
            { date: "2025-01-10", hours: 8, type: "PTO" },
            { date: "2025-02-10", hours: 8, type: "PTO" },
          ],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);
      const jan = res.body.perMonth.find((m: any) => m.month === "2025-01");
      expect(jan.status).toBe("skipped-locked");
      expect(jan.entriesImported).toBe(0);

      const feb = res.body.perMonth.find((m: any) => m.month === "2025-02");
      expect(feb.status).toBe("imported");
      expect(feb.entriesImported).toBe(1);
    });

    it("should return 409 when all 12 months are admin-locked", async () => {
      const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
      for (let m = 1; m <= 12; m++) {
        const monthStr = `2025-${m < 10 ? "0" + m : m}`;
        const lock = adminAckRepo.create({
          employee_id: testEmployeeId,
          month: monthStr,
          admin_id: testEmployeeId,
          acknowledged_at: new Date(),
        });
        await adminAckRepo.save(lock);
      }

      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [{ date: "2025-03-10", hours: 8, type: "PTO" }],
          acknowledgements: [],
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toContain("admin-locked");
      expect(res.body.perMonth).toHaveLength(12);
      expect(
        res.body.perMonth.every((m: any) => m.status === "skipped-locked"),
      ).toBe(true);
    });

    it("should overwrite existing PTO entries in unlocked months", async () => {
      // Seed an existing entry in January
      const ptoRepo = dataSource.getRepository(PtoEntry);
      const existing = ptoRepo.create({
        employee_id: testEmployeeId,
        date: "2025-01-05",
        type: "Sick",
        hours: 8,
        approved_by: testEmployeeId, // previously approved
      });
      await ptoRepo.save(existing);

      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [
            { date: "2025-01-10", hours: 8, type: "PTO" },
            { date: "2025-01-15", hours: 4, type: "PTO", notes: "half day" },
          ],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);
      const jan = res.body.perMonth.find((m: any) => m.month === "2025-01");
      expect(jan.status).toBe("imported");
      expect(jan.entriesDeleted).toBe(1); // the old Sick entry
      expect(jan.entriesImported).toBe(2); // two new PTO entries

      // Verify the old entry is gone and new ones exist
      const allEntries = await ptoRepo.find({
        where: { employee_id: testEmployeeId },
      });
      const janEntries = allEntries.filter((e) => e.date.startsWith("2025-01"));
      expect(janEntries).toHaveLength(2);
      expect(janEntries.every((e) => e.approved_by === null)).toBe(true);
    });

    it("should return per-month breakdown with 12 months", async () => {
      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "Jane Doe",
        hireDate: "2020-03-15",
        year: 2025,
        ptoEntries: [],
        acknowledgements: [],
      });

      expect(res.status).toBe(200);
      expect(res.body.perMonth).toHaveLength(12);
      expect(res.body.perMonth[0].month).toBe("2025-01");
      expect(res.body.perMonth[11].month).toBe("2025-12");
    });
  });

  // ── Phase 4: Business Rule Warnings & Approval Flow ──

  describe("Business Rule Warnings & Approval Flow", () => {
    it("should create entries with approved_by = null (unapproved)", async () => {
      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [{ date: "2025-06-10", hours: 8, type: "PTO" }],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);

      const ptoRepo = dataSource.getRepository(PtoEntry);
      const entries = await ptoRepo.find({
        where: { employee_id: testEmployeeId },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].approved_by).toBeNull();
    });

    it("should emit warnings when sick hours exceed annual limit but still import", async () => {
      // Generate enough sick entries to exceed the limit
      const sickLimit = BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK;
      const numEntries = Math.ceil(sickLimit / 8) + 1; // one more than the limit
      const ptoEntries = [];
      for (let i = 0; i < numEntries; i++) {
        const day = (i % 28) + 1;
        const month = Math.floor(i / 28) + 1;
        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        ptoEntries.push({
          date: `2025-${monthStr}-${dayStr}`,
          hours: 8,
          type: "Sick",
        });
      }

      const res = await request(app).post("/api/employee/import-bulk").send({
        employeeName: "Jane Doe",
        hireDate: "2020-03-15",
        year: 2025,
        ptoEntries,
        acknowledgements: [],
      });

      // Should still import successfully (warnings are non-blocking)
      expect(res.status).toBe(200);
      expect(res.body.totalEntriesImported).toBe(numEntries);
      expect(res.body.warnings.length).toBeGreaterThan(0);
      expect(
        res.body.warnings.some((w: string) => w.includes("Sick hours")),
      ).toBe(true);
    });

    it("should upsert employee acknowledgements from column X data", async () => {
      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [],
          acknowledgements: [
            { month: "2025-03", type: "employee", note: "JD" },
            { month: "2025-04", type: "employee", note: "JD" },
          ],
        });

      expect(res.status).toBe(200);

      const ackRepo = dataSource.getRepository(Acknowledgement);
      const acks = await ackRepo.find({
        where: { employee_id: testEmployeeId },
      });
      expect(acks.length).toBeGreaterThanOrEqual(2);
      const months = acks.map((a) => a.month);
      expect(months).toContain("2025-03");
      expect(months).toContain("2025-04");
    });
  });

  // ── Mixed scenarios ──

  describe("Mixed Scenarios", () => {
    it("should handle a full year import with mixed locked/unlocked months", async () => {
      // Lock March and July
      const adminAckRepo = dataSource.getRepository(AdminAcknowledgement);
      for (const month of ["2025-03", "2025-07"]) {
        const lock = adminAckRepo.create({
          employee_id: testEmployeeId,
          month,
          admin_id: testEmployeeId,
          acknowledged_at: new Date(),
        });
        await adminAckRepo.save(lock);
      }

      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [
            { date: "2025-03-10", hours: 8, type: "PTO" },
            { date: "2025-07-15", hours: 8, type: "PTO" },
            { date: "2025-09-05", hours: 8, type: "Sick" },
          ],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);

      const locked = res.body.perMonth.filter(
        (m: any) => m.status === "skipped-locked",
      );
      expect(locked).toHaveLength(2);

      const imported = res.body.perMonth.filter(
        (m: any) => m.status === "imported",
      );
      expect(imported).toHaveLength(10);

      // Only September should have an entry (March and July were locked)
      expect(res.body.totalEntriesImported).toBe(1);

      // Verify the locked months' entries were NOT imported
      const ptoRepo = dataSource.getRepository(PtoEntry);
      const marchEntries = await ptoRepo.find({
        where: {
          employee_id: testEmployeeId,
          date: Between("2025-03-01", "2025-03-31"),
        },
      });
      expect(marchEntries).toHaveLength(0);
    });

    it("should handle multiple PTO types correctly", async () => {
      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [
            { date: "2025-05-01", hours: 8, type: "PTO" },
            { date: "2025-05-02", hours: 8, type: "Sick" },
            { date: "2025-05-03", hours: 8, type: "Bereavement" },
            { date: "2025-05-04", hours: 8, type: "Jury Duty" },
          ],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);
      expect(res.body.totalEntriesImported).toBe(4);

      const ptoRepo = dataSource.getRepository(PtoEntry);
      const entries = await ptoRepo.find({
        where: { employee_id: testEmployeeId },
      });
      const types = entries.map((e) => e.type).sort();
      expect(types).toEqual(["Bereavement", "Jury Duty", "PTO", "Sick"]);
    });

    it("should default unknown PTO types to PTO", async () => {
      const res = await request(app)
        .post("/api/employee/import-bulk")
        .send({
          employeeName: "Jane Doe",
          hireDate: "2020-03-15",
          year: 2025,
          ptoEntries: [{ date: "2025-04-01", hours: 8, type: "Unknown Type" }],
          acknowledgements: [],
        });

      expect(res.status).toBe(200);

      const ptoRepo = dataSource.getRepository(PtoEntry);
      const entries = await ptoRepo.find({
        where: { employee_id: testEmployeeId },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe("PTO");
    });
  });
});
