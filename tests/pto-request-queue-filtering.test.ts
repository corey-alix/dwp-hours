// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  seedPTOEntries,
  seedEmployees,
  type SeedPtoEntry,
} from "../shared/seedData.js";
import { PtoRequestQueue } from "../client/components/pto-request-queue/index.js";
import { validateHours } from "../shared/businessRules.js";

/**
 * Filter logic that mirrors the route loader and refreshQueue in
 * admin-pto-requests-page.  The canonical rule is:
 *   an entry is pending when `approved_by` is null or undefined.
 */
function filterPendingEntries(entries: SeedPtoEntry[]) {
  return entries.filter(
    (e) => e.approved_by === null || e.approved_by === undefined,
  );
}

/**
 * Build PTORequest objects from seed data, the same way the route loader
 * and refreshQueue do.
 */
function buildRequestsFromSeed(pendingEntries: SeedPtoEntry[]) {
  const employeeMap = new Map(
    seedEmployees.map((emp, idx) => [idx + 1, emp.name]),
  );

  return pendingEntries.map((e, idx) => ({
    id: idx + 1,
    employeeId: e.employee_id,
    employeeName: employeeMap.get(e.employee_id) ?? "Unknown",
    startDate: e.date,
    endDate: e.date,
    type: e.type,
    hours: e.hours,
    status: "pending" as const,
    createdAt: e.date,
  }));
}

describe("PTO Request Queue — seed data filtering", () => {
  describe("Seed data validity (all entries pass business rules)", () => {
    it("all seed entry hours should be valid", () => {
      for (const entry of seedPTOEntries) {
        const error = validateHours(entry.hours);
        expect(
          error,
          `Seed entry ${entry.date} has invalid hours: ${entry.hours}`,
        ).toBeNull();
      }
    });
  });

  describe("Pending entry identification from seedData", () => {
    it("should identify exactly 5 pending entries from seed data", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      expect(pending).toHaveLength(5);
    });

    it("pending entries should all have approved_by null", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      for (const entry of pending) {
        expect(entry.approved_by).toBeNull();
      }
    });

    it("should identify the correct pending entry dates", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      const dates = pending.map((e) => e.date).sort();
      expect(dates).toEqual([
        "2026-03-10",
        "2026-03-16",
        "2026-04-01",
        "2026-07-01",
        "2026-08-03",
      ]);
    });

    it("approved entries should NOT appear in pending list", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      const approvedDates = seedPTOEntries
        .filter((e) => e.approved_by !== null && e.approved_by !== undefined)
        .map((e) => e.date);

      for (const entry of pending) {
        expect(approvedDates).not.toContain(entry.date);
      }
    });

    it("total seed entries minus approved should equal pending count", () => {
      const approved = seedPTOEntries.filter(
        (e) => e.approved_by !== null && e.approved_by !== undefined,
      );
      const pending = filterPendingEntries(seedPTOEntries);
      expect(approved.length + pending.length).toBe(seedPTOEntries.length);
    });
  });

  describe("Filtering uses approved_by (snake_case), not approvedBy", () => {
    it("should filter correctly using approved_by field", () => {
      // Simulate API response shape (approved_by in snake_case)
      const apiEntries = [
        {
          id: 1,
          employeeId: 1,
          date: "2026-01-01",
          type: "PTO",
          hours: 8,
          approved_by: 3,
          createdAt: "2026-01-01",
        },
        {
          id: 2,
          employeeId: 1,
          date: "2026-02-01",
          type: "PTO",
          hours: 8,
          approved_by: null,
          createdAt: "2026-02-01",
        },
        {
          id: 3,
          employeeId: 2,
          date: "2026-03-01",
          type: "Sick",
          hours: 8,
          approved_by: null,
          createdAt: "2026-03-01",
        },
      ];

      const pending = apiEntries.filter(
        (e) => e.approved_by === null || e.approved_by === undefined,
      );
      expect(pending).toHaveLength(2);
      expect(pending.map((e) => e.id)).toEqual([2, 3]);
    });

    it("should NOT use approvedBy (camelCase) — that field does not exist on API response", () => {
      // This test documents the bug that was fixed:
      // Using `!e.approvedBy` would treat ALL entries as pending because
      // the API returns `approved_by` (snake_case), so `e.approvedBy`
      // is always undefined, and `!undefined === true`.
      const apiEntries = [
        {
          id: 1,
          employeeId: 1,
          date: "2026-01-01",
          type: "PTO",
          hours: 8,
          approved_by: 3,
          createdAt: "2026-01-01",
        },
        {
          id: 2,
          employeeId: 1,
          date: "2026-02-01",
          type: "PTO",
          hours: 8,
          approved_by: null,
          createdAt: "2026-02-01",
        },
      ];

      // WRONG (old bug): using camelCase field that doesn't exist
      const wrongFilter = apiEntries.filter(
        (e: any) => !e.approvedBy, // approvedBy is always undefined
      );
      // Bug: ALL entries pass through because approvedBy is undefined for all
      expect(wrongFilter).toHaveLength(2); // Both pass — BUG

      // CORRECT: using snake_case field
      const correctFilter = apiEntries.filter(
        (e) => e.approved_by === null || e.approved_by === undefined,
      );
      expect(correctFilter).toHaveLength(1); // Only the pending one
      expect(correctFilter[0].id).toBe(2);
    });
  });

  describe("After approve/reject, refresh should show correct count", () => {
    it("approving one entry should reduce pending count by 1", () => {
      // Start with seed pending entries
      const pending = filterPendingEntries(seedPTOEntries);
      expect(pending).toHaveLength(5);

      // Simulate approving the first pending entry:
      // After approval, the entry has approved_by set to admin ID
      const afterApproval = seedPTOEntries.map((e) =>
        e.date === pending[0].date && e.employee_id === pending[0].employee_id
          ? { ...e, approved_by: 3 }
          : e,
      );

      const stillPending = filterPendingEntries(afterApproval);
      expect(stillPending).toHaveLength(4);
    });

    it("rejecting (deleting) one entry should reduce pending count by 1", () => {
      // Start with seed pending entries
      const pending = filterPendingEntries(seedPTOEntries);
      expect(pending).toHaveLength(5);

      // Simulate rejecting (deleting) the first pending entry
      const afterReject = seedPTOEntries.filter(
        (e) =>
          !(
            e.date === pending[0].date &&
            e.employee_id === pending[0].employee_id
          ),
      );

      const stillPending = filterPendingEntries(afterReject);
      expect(stillPending).toHaveLength(4);
    });

    it("approving all pending entries should leave zero pending", () => {
      const allApproved = seedPTOEntries.map((e) =>
        e.approved_by === null || e.approved_by === undefined
          ? { ...e, approved_by: 3 }
          : e,
      );

      const stillPending = filterPendingEntries(allApproved);
      expect(stillPending).toHaveLength(0);
    });
  });

  describe("PtoRequestQueue component renders correct pending count", () => {
    let component: PtoRequestQueue;
    let container: HTMLElement;

    beforeEach(() => {
      container = document.createElement("div");
      document.body.appendChild(container);
      component = new PtoRequestQueue();
      container.appendChild(component);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it("should show 5 pending request cards with seed data", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      component.requests = buildRequestsFromSeed(pending);

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(5);

      const statValue = component.shadowRoot?.querySelector(".stat-value");
      expect(statValue?.textContent).toBe("5");
    });

    it("should show 4 pending after approving one", () => {
      const pending = filterPendingEntries(seedPTOEntries);
      // Remove first entry (simulating approval)
      const afterApproval = pending.slice(1);
      component.requests = buildRequestsFromSeed(afterApproval);

      const cards = component.shadowRoot?.querySelectorAll(".request-card");
      expect(cards?.length).toBe(4);

      const statValue = component.shadowRoot?.querySelector(".stat-value");
      expect(statValue?.textContent).toBe("4");
    });

    it("should show empty state when all approved", () => {
      component.requests = [];

      const emptyState = component.shadowRoot?.querySelector(".empty-state");
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain("No pending requests");
    });
  });
});
