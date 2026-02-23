// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  BalanceTable,
  type BalanceTableData,
} from "../../client/components/balance-table/index.js";

describe("BalanceTable Component", () => {
  let component: BalanceTable;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new BalanceTable();
    container.appendChild(component);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render an empty grid when no data is set", () => {
    const grid = component.shadowRoot?.querySelector(".balance-grid");
    expect(grid).toBeTruthy();
    // No data cells when data is null
    const cells = grid?.querySelectorAll(".cell");
    expect(cells?.length).toBe(0);
  });

  it("should render 4 columns x 4 rows (16 cells) when data is set", () => {
    component.data = {
      pto: { issued: 225, used: 112 },
      sick: { issued: 24, used: 32 },
      bereavement: { issued: 40, used: 8 },
      juryDuty: { issued: 40, used: 40 },
    };

    const cells = component.shadowRoot?.querySelectorAll(".cell");
    // 4 header cells + 4 Issued cells + 4 Used cells + 4 Avail cells = 16
    expect(cells?.length).toBe(16);
  });

  it("should display correct header labels", () => {
    component.data = {
      pto: { issued: 100, used: 50 },
      sick: { issued: 24, used: 0 },
      bereavement: { issued: 40, used: 0 },
      juryDuty: { issued: 40, used: 0 },
    };

    const headers = component.shadowRoot?.querySelectorAll(".cell.header");
    const headerTexts = Array.from(headers || []).map(
      (h) => h.textContent?.trim() || "",
    );
    expect(headerTexts).toEqual(["", "PTO", "Sick", "Other"]);
  });

  it("should consolidate Bereavement + Jury Duty into Other column", () => {
    component.data = {
      pto: { issued: 100, used: 50 },
      sick: { issued: 24, used: 8 },
      bereavement: { issued: 40, used: 8 },
      juryDuty: { issued: 40, used: 40 },
    };

    // Find all cells with col-other class (excluding header)
    const otherCells = component.shadowRoot?.querySelectorAll(
      ".cell.col-other:not(.header)",
    );
    const otherValues = Array.from(otherCells || []).map(
      (c) => c.textContent?.trim() || "",
    );
    // Issued: 40+40=80, Used: 8+40=48, Avail: 80-48=32
    expect(otherValues).toEqual(["80", "48", "32"]);
  });

  it("should compute available as issued minus used", () => {
    component.data = {
      pto: { issued: 225, used: 112 },
      sick: { issued: 24, used: 32 },
      bereavement: { issued: 40, used: 8 },
      juryDuty: { issued: 40, used: 40 },
    };

    // PTO avail: 225-112=113, Sick avail: 24-32=-8, Other avail: 80-48=32
    const availCells =
      component.shadowRoot?.querySelectorAll(".cell.row-avail");
    const availValues = Array.from(availCells || []).map(
      (c) => c.textContent?.trim() || "",
    );
    expect(availValues).toEqual(["113", "-8", "32"]);
  });

  it("should apply negative class to negative available values", () => {
    component.data = {
      pto: { issued: 100, used: 50 },
      sick: { issued: 24, used: 32 },
      bereavement: { issued: 0, used: 0 },
      juryDuty: { issued: 0, used: 0 },
    };

    // Sick avail: 24-32 = -8 → should have .negative
    const negativeCells =
      component.shadowRoot?.querySelectorAll(".cell.negative");
    expect(negativeCells?.length).toBe(1);

    const negativeText = negativeCells?.[0]?.textContent?.trim();
    expect(negativeText).toBe("-8");
  });

  it("should NOT apply negative class to zero or positive available values", () => {
    component.data = {
      pto: { issued: 100, used: 100 },
      sick: { issued: 24, used: 0 },
      bereavement: { issued: 40, used: 0 },
      juryDuty: { issued: 40, used: 0 },
    };

    // PTO avail: 0, Sick avail: 24, Other avail: 80 — none negative
    const negativeCells =
      component.shadowRoot?.querySelectorAll(".cell.negative");
    expect(negativeCells?.length).toBe(0);
  });

  it("should render row labels: Issued, Used, Avail", () => {
    component.data = {
      pto: { issued: 100, used: 50 },
      sick: { issued: 24, used: 0 },
      bereavement: { issued: 0, used: 0 },
      juryDuty: { issued: 0, used: 0 },
    };

    const rowLabels = component.shadowRoot?.querySelectorAll(".cell.row-label");
    const labelTexts = Array.from(rowLabels || []).map(
      (l) => l.textContent?.trim() || "",
    );
    expect(labelTexts).toEqual(["Issued", "Used", "Avail"]);
  });

  it("should handle all-zero data gracefully", () => {
    component.data = {
      pto: { issued: 0, used: 0 },
      sick: { issued: 0, used: 0 },
      bereavement: { issued: 0, used: 0 },
      juryDuty: { issued: 0, used: 0 },
    };

    const availCells =
      component.shadowRoot?.querySelectorAll(".cell.row-avail");
    const availValues = Array.from(availCells || []).map(
      (c) => c.textContent?.trim() || "",
    );
    expect(availValues).toEqual(["0", "0", "0"]);

    const negativeCells =
      component.shadowRoot?.querySelectorAll(".cell.negative");
    expect(negativeCells?.length).toBe(0);
  });
});
