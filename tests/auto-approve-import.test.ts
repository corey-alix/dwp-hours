import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  shouldAutoApproveImportEntry,
  ENABLE_IMPORT_AUTO_APPROVE,
  SYS_ADMIN_EMPLOYEE_ID,
  BUSINESS_RULES_CONSTANTS,
  type ImportEntryForAutoApprove,
  type AutoApproveEmployeeLimits,
  type AutoApprovePolicyContext,
  type AutoApproveResult,
  type PTOType,
} from "../shared/businessRules.js";
import {
  upsertPtoEntries,
  upsertAcknowledgements,
} from "../server/reportGenerators/excelImport.js";
import { type ImportedAcknowledgement } from "../shared/excelParsing.js";
import { DataSource } from "typeorm";
import initSqlJs from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Employee,
  PtoEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "../server/entities/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Test DataSource Setup ──

let testDataSource: DataSource;

beforeAll(async () => {
  const SQL = await initSqlJs();
  const testDb = new SQL.Database();

  // Load schema
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");
  testDb.exec(schema);

  // Create test employee
  testDb.exec(`
    INSERT INTO employees (id, name, identifier, hire_date, carryover_hours)
    VALUES (1, 'Test Employee', 'TE001', '2020-01-01', 40);
  `);

  // Create TypeORM data source
  testDataSource = new DataSource({
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

  await testDataSource.initialize();
});

afterAll(async () => {
  if (testDataSource) {
    await testDataSource.destroy();
  }
});

beforeEach(async () => {
  // Clear PTO entries, acknowledgements, and admin acknowledgements before each test
  await testDataSource.getRepository(PtoEntry).clear();
  await testDataSource.getRepository(Acknowledgement).clear();
  await testDataSource.getRepository(AdminAcknowledgement).clear();
});

// ── Helpers ──

function makeEntry(
  overrides: Partial<ImportEntryForAutoApprove> = {},
): ImportEntryForAutoApprove {
  return {
    date: "2025-06-15",
    type: "PTO",
    hours: 8,
    ...overrides,
  };
}

function makeLimits(
  overrides: Partial<AutoApproveEmployeeLimits> = {},
): AutoApproveEmployeeLimits {
  return {
    annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 0 },
    availablePtoBalance: 160,
    ...overrides,
  };
}

function makePolicy(
  overrides: Partial<AutoApprovePolicyContext> = {},
): AutoApprovePolicyContext {
  return {
    yearsOfService: 3,
    ...overrides,
  };
}

// ── Tests ──

describe("Import Auto-Approve", () => {
  describe("Constants", () => {
    it("SYS_ADMIN_EMPLOYEE_ID is 0", () => {
      expect(SYS_ADMIN_EMPLOYEE_ID).toBe(0);
    });

    it("ENABLE_IMPORT_AUTO_APPROVE is true by default", () => {
      expect(ENABLE_IMPORT_AUTO_APPROVE).toBe(true);
    });
  });

  describe("shouldAutoApproveImportEntry", () => {
    it("approves entry within all limits", () => {
      const entry = makeEntry({ type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy({ yearsOfService: 2 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("approves Sick entry within annual limit", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 16, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("rejects Sick entry exceeding 24-hour annual limit", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 20, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Sick");
      expect(result.violations[0]).toContain("28h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.SICK}h`,
      );
    });

    it("rejects Bereavement entry exceeding 16-hour annual limit", () => {
      const entry = makeEntry({ type: "Bereavement", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 12, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Bereavement");
      expect(result.violations[0]).toContain("20h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.BEREAVEMENT}h`,
      );
    });

    it("rejects Jury Duty entry exceeding 24-hour annual limit", () => {
      const entry = makeEntry({ type: "Jury Duty", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 20 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Jury Duty");
      expect(result.violations[0]).toContain("28h");
      expect(result.violations[0]).toContain(
        `${BUSINESS_RULES_CONSTANTS.ANNUAL_LIMITS.JURY_DUTY}h`,
      );
    });

    it("rejects PTO entry exceeding available balance", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 0 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("exceeds available balance");
    });

    it("rejects PTO borrowing after first year of service", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 1 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("borrowing not permitted");
      expect(result.violations[0]).toContain("first year of service");
    });

    it("approves entry in a month with warning acknowledgement status", () => {
      // Warning months no longer block per-day auto-approval;
      // month-level reconciliation warnings are handled at the acknowledgement layer.
      const entry = makeEntry({ date: "2025-03-15", type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy({ yearsOfService: 3 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it("rejects entry in a warning month when it exceeds annual limit on its own merits", () => {
      const entry = makeEntry({ date: "2025-03-15", type: "Sick", hours: 32 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy({ yearsOfService: 3 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations).toHaveLength(1);
      expect(result.violations[0]).toContain("Sick hours");
    });

    it("accumulates multiple violations", () => {
      // Entry exceeds PTO balance
      const entry = makeEntry({ date: "2025-03-15", type: "PTO", hours: 200 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 5 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
      expect(result.violations.length).toBeGreaterThanOrEqual(1);
    });

    it("approves entry at exact limit boundary", () => {
      // Sick: exactly at 24h after adding 8h (16 + 8 = 24)
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 16, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("rejects entry one hour over limit boundary", () => {
      // Sick: 20 + 8 = 28 > 24
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 20, Bereavement: 0, "Jury Duty": 0 },
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(false);
    });

    it("approves PTO at exact balance boundary", () => {
      const entry = makeEntry({ type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 8 });
      const policy = makePolicy({ yearsOfService: 5 });

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("does not check PTO balance for non-PTO types", () => {
      const entry = makeEntry({ type: "Sick", hours: 8 });
      const limits = makeLimits({
        annualUsage: { PTO: 0, Sick: 0, Bereavement: 0, "Jury Duty": 0 },
        availablePtoBalance: 0, // No PTO balance, but this is a Sick entry
      });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("approves entries regardless of warning months", () => {
      // Warning months no longer affect per-day approval
      const entry = makeEntry({ date: "2025-04-15", type: "PTO", hours: 8 });
      const limits = makeLimits({ availablePtoBalance: 160 });
      const policy = makePolicy();

      const result = shouldAutoApproveImportEntry(entry, limits, policy);

      expect(result.approved).toBe(true);
    });

    it("first-year employee: PTO borrowing message differs from post-first-year", () => {
      const entry = makeEntry({ type: "PTO", hours: 16 });
      const limits = makeLimits({ availablePtoBalance: 8 });

      const firstYear = shouldAutoApproveImportEntry(
        entry,
        limits,
        makePolicy({ yearsOfService: 0 }),
      );
      const secondYear = shouldAutoApproveImportEntry(
        entry,
        limits,
        makePolicy({ yearsOfService: 1 }),
      );

      // Both are rejected
      expect(firstYear.approved).toBe(false);
      expect(secondYear.approved).toBe(false);

      // Different violation messages
      expect(firstYear.violations[0]).toContain("exceeds available balance");
      expect(secondYear.violations[0]).toContain("borrowing not permitted");
    });
  });

  describe("upsertPtoEntries Integration", () => {
    it("auto-approves entries within limits", async () => {
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "PTO", hours: 8 },
        { date: "2025-06-02", type: "Sick", hours: 8 },
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const result = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      expect(result.upserted).toBe(2);
      expect(result.autoApproved).toBe(2);
      expect(result.warnings).toHaveLength(0);

      // Check database
      const ptoEntries = await testDataSource
        .getRepository(PtoEntry)
        .find({ where: { employee_id: 1 } });
      expect(ptoEntries).toHaveLength(2);
      expect(ptoEntries[0].approved_by).toBe(SYS_ADMIN_EMPLOYEE_ID);
      expect(ptoEntries[1].approved_by).toBe(SYS_ADMIN_EMPLOYEE_ID);
    });

    it("does not auto-approve entries exceeding limits", async () => {
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "Sick", hours: 32 }, // Exceeds 24h limit
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const result = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      expect(result.upserted).toBe(1);
      expect(result.autoApproved).toBe(0);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("not auto-approved");

      // Check database
      const ptoEntries = await testDataSource
        .getRepository(PtoEntry)
        .find({ where: { employee_id: 1, date: "2025-06-01" } });
      expect(ptoEntries).toHaveLength(1);
      expect(ptoEntries[0].approved_by).toBeNull();
      expect(ptoEntries[0].notes).toContain("Auto-approve denied");
    });

    it("respects running totals across entries", async () => {
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "Sick", hours: 16 }, // Within limit
        { date: "2025-06-02", type: "Sick", hours: 16 }, // Pushes over 24h limit
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const result = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      expect(result.upserted).toBe(2);
      expect(result.autoApproved).toBe(1); // Only first entry approved
      expect(result.warnings).toHaveLength(1);

      // Check database
      const ptoEntries = await testDataSource
        .getRepository(PtoEntry)
        .find({ where: { employee_id: 1 }, order: { date: "ASC" } });
      expect(ptoEntries).toHaveLength(2);
      expect(ptoEntries[0].approved_by).toBe(SYS_ADMIN_EMPLOYEE_ID);
      expect(ptoEntries[1].approved_by).toBeNull();
    });

    it("returns violation notes for acknowledgements", async () => {
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "Sick", hours: 32 }, // Exceeds limit
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const result = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      expect(result.violationNotes.has("2025-06")).toBe(true);
      expect(result.violationNotes.get("2025-06")).toContain(
        "Sick hours would reach",
      );
    });
  });

  describe("Acknowledgement filtering for unapproved entries", () => {
    it("should NOT auto-acknowledge months that contain unapproved entries", async () => {
      // Insert a PTO entry that will fail auto-approve (exceeds sick limit)
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "Sick", hours: 32 }, // Exceeds 24h limit
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const { violationNotes } = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      // Simulate the acknowledgements that would come from parsing
      const acks: ImportedAcknowledgement[] = [
        { month: "2025-06", type: "employee" },
        { month: "2025-06", type: "admin" },
      ];

      // Apply the same filtering logic as importExcelWorkbook
      const filteredAcks = acks
        .filter(
          (ack) => !(ack.type === "admin" && violationNotes.has(ack.month)),
        )
        .map((ack) => {
          if (
            ack.type === "employee" &&
            violationNotes.has(ack.month) &&
            ack.status !== "warning"
          ) {
            return { ...ack, status: "warning" as const };
          }
          return ack;
        });

      await upsertAcknowledgements(
        testDataSource,
        1,
        filteredAcks,
        undefined,
        violationNotes,
      );

      // Admin acknowledgement should NOT exist for month with violations
      const admAcks = await testDataSource
        .getRepository(AdminAcknowledgement)
        .find({ where: { employee_id: 1, month: "2025-06" } });
      expect(admAcks).toHaveLength(0);

      // Employee acknowledgement should exist but with "warning" status
      const empAcks = await testDataSource
        .getRepository(Acknowledgement)
        .find({ where: { employee_id: 1, month: "2025-06" } });
      expect(empAcks).toHaveLength(1);
      expect(empAcks[0].status).toBe("warning");
    });

    it("should auto-acknowledge months where all entries are approved", async () => {
      // Insert a PTO entry that will pass auto-approve
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-07-01", type: "PTO", hours: 8 },
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const { violationNotes } = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      // No violations — month should be acknowledged normally
      expect(violationNotes.size).toBe(0);

      const acks: ImportedAcknowledgement[] = [
        { month: "2025-07", type: "employee" },
        { month: "2025-07", type: "admin" },
      ];

      await upsertAcknowledgements(testDataSource, 1, acks);

      // Both acknowledgements should exist
      const admAcks = await testDataSource
        .getRepository(AdminAcknowledgement)
        .find({ where: { employee_id: 1, month: "2025-07" } });
      expect(admAcks).toHaveLength(1);

      const empAcks = await testDataSource
        .getRepository(Acknowledgement)
        .find({ where: { employee_id: 1, month: "2025-07" } });
      expect(empAcks).toHaveLength(1);
      expect(empAcks[0].status).toBeNull();
    });

    it("should only filter months with violations, not clean months", async () => {
      // Mix of clean and violation entries across months
      const entries: ImportEntryForAutoApprove[] = [
        { date: "2025-06-01", type: "PTO", hours: 8 }, // Clean
        { date: "2025-07-01", type: "Sick", hours: 32 }, // Exceeds limit
      ];

      const autoApproveCtx = {
        hireDate: "2020-01-01",
        carryoverHours: 40,
      };

      const { violationNotes } = await upsertPtoEntries(
        testDataSource,
        1,
        entries,
        autoApproveCtx,
      );

      // Only July should have violations
      expect(violationNotes.has("2025-06")).toBe(false);
      expect(violationNotes.has("2025-07")).toBe(true);

      const acks: ImportedAcknowledgement[] = [
        { month: "2025-06", type: "employee" },
        { month: "2025-06", type: "admin" },
        { month: "2025-07", type: "employee" },
        { month: "2025-07", type: "admin" },
      ];

      // Apply filtering
      const filteredAcks = acks
        .filter(
          (ack) => !(ack.type === "admin" && violationNotes.has(ack.month)),
        )
        .map((ack) => {
          if (
            ack.type === "employee" &&
            violationNotes.has(ack.month) &&
            ack.status !== "warning"
          ) {
            return { ...ack, status: "warning" as const };
          }
          return ack;
        });

      await upsertAcknowledgements(
        testDataSource,
        1,
        filteredAcks,
        undefined,
        violationNotes,
      );

      // June: both acks should exist (clean month)
      const juneAdm = await testDataSource
        .getRepository(AdminAcknowledgement)
        .find({ where: { employee_id: 1, month: "2025-06" } });
      expect(juneAdm).toHaveLength(1);
      const juneEmp = await testDataSource
        .getRepository(Acknowledgement)
        .find({ where: { employee_id: 1, month: "2025-06" } });
      expect(juneEmp).toHaveLength(1);
      expect(juneEmp[0].status).toBeNull();

      // July: only employee ack with warning, no admin ack
      const julyAdm = await testDataSource
        .getRepository(AdminAcknowledgement)
        .find({ where: { employee_id: 1, month: "2025-07" } });
      expect(julyAdm).toHaveLength(0);
      const julyEmp = await testDataSource
        .getRepository(Acknowledgement)
        .find({ where: { employee_id: 1, month: "2025-07" } });
      expect(julyEmp).toHaveLength(1);
      expect(julyEmp[0].status).toBe("warning");
    });
  });
});
