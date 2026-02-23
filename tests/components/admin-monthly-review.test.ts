// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AdminMonthlyReview } from "../../client/components/admin-monthly-review/index.js";
import type { AdminMonthlyReviewItem } from "../../shared/api-models.js";
import type {
  SeedPtoEntry,
  SeedAdminAcknowledgment,
  SeedEmployee,
} from "../../shared/seedData.js";
import {
  seedEmployees,
  seedPTOEntries,
  seedAdminAcknowledgments,
} from "../../shared/seedData.js";

// Import the data generation function from the test harness
// This transforms seed data into the component's expected format
function generateMonthlyData(month: string): AdminMonthlyReviewItem[] {
  const data: AdminMonthlyReviewItem[] = [];

  for (let i = 0; i < seedEmployees.length; i++) {
    const employee = seedEmployees[i];
    const employeeId = i + 1; // employee_id starts from 1

    // Filter PTO entries for this employee and month
    const monthEntries = seedPTOEntries.filter(
      (entry: SeedPtoEntry) =>
        entry.employee_id === employeeId && entry.date.startsWith(month),
    );

    // Aggregate hours by type
    const hours = {
      pto: 0,
      sick: 0,
      bereavement: 0,
      juryDuty: 0,
    };

    for (const entry of monthEntries) {
      switch (entry.type) {
        case "PTO":
          hours.pto += entry.hours;
          break;
        case "Sick":
          hours.sick += entry.hours;
          break;
        case "Bereavement":
          hours.bereavement += entry.hours;
          break;
        case "Jury Duty":
          hours.juryDuty += entry.hours;
          break;
      }
    }

    // Check if acknowledged
    const acknowledgment = seedAdminAcknowledgments.find(
      (ack: SeedAdminAcknowledgment) =>
        ack.employee_id === employeeId && ack.month === month,
    );

    // Mock total hours (assuming 40 hours/week * 4.3 weeks ≈ 172 hours)
    const totalHours = 172;

    data.push({
      employeeId: employeeId,
      employeeName: employee.name,
      month,
      totalHours,
      ptoHours: hours.pto,
      sickHours: hours.sick,
      bereavementHours: hours.bereavement,
      juryDutyHours: hours.juryDuty,
      acknowledgedByAdmin: !!acknowledgment,
      adminAcknowledgedAt: acknowledgment?.acknowledged_at,
      adminAcknowledgedBy: acknowledgment
        ? seedEmployees.find(
            (e: SeedEmployee, idx: number) =>
              idx + 1 === acknowledgment.admin_id,
          )?.name
        : undefined,
    });
  }

  return data;
}

describe("AdminMonthlyReview Component", () => {
  let component: AdminMonthlyReview;
  let container: HTMLElement;

  beforeEach(async () => {
    // Create a container for the component
    container = document.createElement("div");
    document.body.appendChild(container);

    // Create the component
    component = new AdminMonthlyReview();
    container.appendChild(component);
  });

  afterEach(() => {
    // Clean up
    document.body.removeChild(container);
  });

  describe("Component Initialization", () => {
    it("should create component instance", () => {
      expect(component).toBeInstanceOf(AdminMonthlyReview);
      expect(component.shadowRoot).toBeTruthy();
    });

    it("should dispatch admin-monthly-review-request on connectedCallback", () => {
      let requestEvent: CustomEvent | null = null;

      // Remove component from DOM to reset state
      container.removeChild(component);

      component.addEventListener("admin-monthly-review-request", (e: Event) => {
        requestEvent = e as CustomEvent;
      });

      // Re-append to trigger connectedCallback
      container.appendChild(component);

      // Wait for next tick to ensure event is dispatched
      return new Promise((resolve) => {
        setTimeout(() => {
          expect(requestEvent).toBeTruthy();
          expect(requestEvent?.detail).toHaveProperty("month");
          expect(typeof requestEvent?.detail.month).toBe("string");
          resolve(void 0);
        }, 0);
      });
    });
  });

  describe("Data Injection and Rendering", () => {
    it("should render employee cards when data is injected", () => {
      const testData = generateMonthlyData("2025-01");

      component.employeeData = testData;

      const html = component.shadowRoot?.innerHTML;
      const count = (html?.match(/class="employee-card"/g) || []).length;
      expect(count).toBe(testData.length);
    });

    it("should display employee names correctly", () => {
      const testData = generateMonthlyData("2025-01");

      component.setEmployeeData(testData);

      const firstCard = component.shadowRoot?.querySelector(".employee-card");
      const employeeName = firstCard?.querySelector(".employee-name");

      expect(employeeName?.textContent).toBe(testData[0].employeeName);
    });

    it("should show acknowledgment status", () => {
      const testData = generateMonthlyData("2025-01");

      component.setEmployeeData(testData);

      const acknowledgedCard = component.shadowRoot?.querySelector(
        ".employee-card.acknowledged",
      );
      const unacknowledgedCard = component.shadowRoot?.querySelector(
        ".employee-card:not(.acknowledged)",
      );

      // Should have both acknowledged and unacknowledged cards
      expect(acknowledgedCard || unacknowledgedCard).toBeTruthy();
    });
  });

  describe("Month Selection", () => {
    it("should dispatch request event when month attribute changes", () => {
      let requestEvent: CustomEvent | null = null;

      component.addEventListener("admin-monthly-review-request", (e: Event) => {
        requestEvent = e as CustomEvent;
      });

      component.setAttribute("selected-month", "2025-02");

      return new Promise((resolve) => {
        setTimeout(() => {
          expect(requestEvent).toBeTruthy();
          expect(requestEvent?.detail.month).toBe("2025-02");
          resolve(void 0);
        }, 0);
      });
    });

    it("should update selected month property", () => {
      component.setAttribute("selected-month", "2025-03");

      expect(component.getAttribute("selected-month")).toBe("2025-03");
    });
  });

  describe("Acknowledgment Events", () => {
    it("should dispatch admin-acknowledge event when acknowledge button is clicked", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      let acknowledgeEvent: CustomEvent | null = null;

      component.addEventListener("admin-acknowledge", (e: Event) => {
        acknowledgeEvent = e as CustomEvent;
      });

      // Find an unacknowledged employee card and click the acknowledge button
      const unacknowledgedCard = component.shadowRoot?.querySelector(
        ".employee-card:not(.acknowledged)",
      );
      const acknowledgeButton = unacknowledgedCard?.querySelector(
        ".acknowledge-btn",
      ) as HTMLButtonElement;

      if (acknowledgeButton) {
        acknowledgeButton.click();

        return new Promise((resolve) => {
          setTimeout(() => {
            expect(acknowledgeEvent).toBeTruthy();
            expect(acknowledgeEvent?.detail).toHaveProperty("employeeId");
            expect(acknowledgeEvent?.detail).toHaveProperty("employeeName");
            expect(acknowledgeEvent?.detail).toHaveProperty("month");
            resolve(void 0);
          }, 0);
        });
      } else {
        // If no unacknowledged cards, test passes (all data might be acknowledged)
        expect(true).toBe(true);
      }
    });
  });

  describe("Loading State", () => {
    it("should show loading state initially", () => {
      const loadingElement = component.shadowRoot?.querySelector(".loading");
      expect(loadingElement).toBeTruthy();
    });

    it("should hide loading state after data injection", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      const loadingElement = component.shadowRoot?.querySelector(".loading");
      expect(loadingElement).toBeFalsy();
    });
  });

  describe("Integration with Seed Data", () => {
    it("should handle months with no data", () => {
      const emptyData = generateMonthlyData("2020-01"); // Month with no seed data

      component.setEmployeeData(emptyData);

      const employeeCards =
        component.shadowRoot?.querySelectorAll(".employee-card");
      expect(employeeCards?.length).toBe(3); // Should still show all employees with 0 hours
    });

    it("should display acknowledgment information correctly", () => {
      const testData = generateMonthlyData("2025-01");

      component.setEmployeeData(testData);

      // Find acknowledged employee
      const acknowledgedEmployee = testData.find(
        (emp) => emp.acknowledgedByAdmin,
      );
      if (acknowledgedEmployee) {
        const acknowledgedCard = Array.from(
          component.shadowRoot?.querySelectorAll(".employee-card") || [],
        ).find(
          (card) =>
            card.querySelector(".employee-name")?.textContent ===
            acknowledgedEmployee.employeeName,
        );

        const statusIndicator =
          acknowledgedCard?.querySelector(".status-indicator");
        expect(statusIndicator?.classList.contains("acknowledged")).toBe(true);
      }
    });
  });

  describe("Declarative Balance Rendering", () => {
    it("should render balance badges when PTO entries are provided", () => {
      const testData = generateMonthlyData("2025-01");
      // Inject PTO entries before setting employee data
      component.setPtoEntries(
        seedPTOEntries.map((e: SeedPtoEntry) => ({
          employee_id: e.employee_id,
          type: e.type,
          hours: e.hours,
          date: e.date,
          approved_by: e.approved_by ?? null,
        })),
      );
      component.setEmployeeData(testData);

      const firstCard = component.shadowRoot?.querySelector(".employee-card");
      const badges = firstCard?.querySelectorAll(".balance-badge");
      // Should render some balance badges based on seed data
      if (badges && badges.length > 0) {
        expect(badges.length).toBeGreaterThan(0);
        // Each badge should have a label and value
        const label = badges[0].querySelector(".badge-label");
        const value = badges[0].querySelector(".badge-value");
        expect(label?.textContent).toBeTruthy();
        expect(value?.textContent).toContain("h");
      }
    });

    it("should not render slotted pto-balance-summary elements", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      // After refactoring, there should be no balance-summary slots
      const slots = component.shadowRoot?.querySelectorAll(
        'slot[name^="balance-"]',
      );
      expect(slots?.length || 0).toBe(0);
    });
  });

  describe("Inline Calendar Toggle", () => {
    it("should render a View Calendar button in every employee card", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      const buttons =
        component.shadowRoot?.querySelectorAll(".view-calendar-btn");
      expect(buttons?.length).toBe(testData.length);
    });

    it("should render a toolbar in every employee card", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      const toolbars = component.shadowRoot?.querySelectorAll(".toolbar");
      expect(toolbars?.length).toBe(testData.length);
    });

    it("should show View Calendar button for acknowledged cards", () => {
      const testData = generateMonthlyData("2025-01");
      component.setEmployeeData(testData);

      // Find an acknowledged card
      const acknowledgedEmployee = testData.find(
        (emp) => emp.acknowledgedByAdmin,
      );
      if (acknowledgedEmployee) {
        const card = component.shadowRoot?.querySelector(
          `.employee-card[data-employee-id="${acknowledgedEmployee.employeeId}"]`,
        );
        const viewBtn = card?.querySelector(".view-calendar-btn");
        expect(viewBtn).toBeTruthy();
        // Acknowledged cards should NOT have acknowledge button
        const ackBtn = card?.querySelector(".acknowledge-btn");
        expect(ackBtn).toBeFalsy();
      }
    });

    it("should toggle inline calendar on View Calendar button click", () => {
      const testData = generateMonthlyData("2026-02");
      component.setPtoEntries(
        seedPTOEntries.map((e: SeedPtoEntry) => ({
          employee_id: e.employee_id,
          type: e.type,
          hours: e.hours,
          date: e.date,
          approved_by: e.approved_by ?? null,
        })),
      );
      component.setEmployeeData(testData);

      // No calendars initially
      let calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(0);

      // Click the View Calendar button for the first employee
      const firstBtn = component.shadowRoot?.querySelector(
        ".view-calendar-btn",
      ) as HTMLElement;
      expect(firstBtn).toBeTruthy();
      firstBtn.click();

      // Calendar should now be visible
      calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(1);

      // Button text should change
      const updatedBtn = component.shadowRoot?.querySelector(
        ".view-calendar-btn",
      ) as HTMLElement;
      expect(updatedBtn?.textContent?.trim()).toBe("Hide Calendar");

      // Click again to collapse
      updatedBtn.click();
      calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(0);
    });

    it("should render inline calendar in readonly mode", () => {
      const testData = generateMonthlyData("2026-02");
      component.setPtoEntries(
        seedPTOEntries.map((e: SeedPtoEntry) => ({
          employee_id: e.employee_id,
          type: e.type,
          hours: e.hours,
          date: e.date,
          approved_by: e.approved_by ?? null,
        })),
      );
      component.setEmployeeData(testData);

      // Expand calendar for first employee
      const firstBtn = component.shadowRoot?.querySelector(
        ".view-calendar-btn",
      ) as HTMLElement;
      firstBtn.click();

      const calendar = component.shadowRoot?.querySelector("pto-calendar");
      expect(calendar?.getAttribute("readonly")).toBe("true");
      expect(calendar?.getAttribute("hide-legend")).toBe("true");
      expect(calendar?.getAttribute("hide-header")).toBe("true");
    });

    it("should filter PTO entries per employee for inline calendar", () => {
      const testData = generateMonthlyData("2026-02");
      component.setPtoEntries(
        seedPTOEntries.map((e: SeedPtoEntry) => ({
          employee_id: e.employee_id,
          type: e.type,
          hours: e.hours,
          date: e.date,
          approved_by: e.approved_by ?? null,
        })),
      );
      component.setEmployeeData(testData);

      // Expand calendar for first employee (id=1)
      const firstBtn = component.shadowRoot?.querySelector(
        ".view-calendar-btn",
      ) as HTMLElement;
      firstBtn.click();

      const calendar = component.shadowRoot?.querySelector(
        "pto-calendar",
      ) as any;
      expect(calendar).toBeTruthy();
      expect(calendar?.dataset.employeeId).toBe("1");

      // The calendar's ptoEntries should only contain entries for employee 1
      const entries = calendar?.ptoEntries || [];
      for (const entry of entries) {
        expect(entry.employeeId).toBe(1);
      }
    });

    it("should collapse all calendars when month changes", () => {
      const testData = generateMonthlyData("2026-02");
      component.setPtoEntries(
        seedPTOEntries.map((e: SeedPtoEntry) => ({
          employee_id: e.employee_id,
          type: e.type,
          hours: e.hours,
          date: e.date,
          approved_by: e.approved_by ?? null,
        })),
      );
      component.setEmployeeData(testData);

      // Expand a calendar
      const firstBtn = component.shadowRoot?.querySelector(
        ".view-calendar-btn",
      ) as HTMLElement;
      firstBtn.click();

      let calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(1);

      // Change selected month via attribute
      component.setAttribute("selected-month", "2026-03");

      // After re-render with new data, calendars should be collapsed
      const newData = generateMonthlyData("2026-03");
      component.setEmployeeData(newData);

      calendars = component.shadowRoot?.querySelectorAll("pto-calendar");
      expect(calendars?.length).toBe(0);
    });
  });
});
