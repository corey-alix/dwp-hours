// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MonthSummary } from "../../client/components/month-summary/index.js";
import { PTO_TYPES } from "../../client/shared/pto-types.js";

describe("MonthSummary Component", () => {
  let component: MonthSummary;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    component = new MonthSummary();
    container.appendChild(component);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      document.body.removeChild(container);
    }
  });

  it("should render all four summary items with correct labels", () => {
    const labels = Array.from(
      component.shadowRoot?.querySelectorAll(".summary-label") || [],
    ).map((el) => el.textContent);

    expect(labels).toEqual(PTO_TYPES.map((type) => type.label));
  });

  it("should render 0 values by default without color classes", () => {
    const values = component.shadowRoot?.querySelectorAll(".summary-value");
    expect(values?.length).toBe(4);

    values?.forEach((val) => {
      expect(val.textContent?.trim()).toBe("0");
      expect(val.classList.contains("summary-pto")).toBe(false);
      expect(val.classList.contains("summary-sick")).toBe(false);
      expect(val.classList.contains("summary-bereavement")).toBe(false);
      expect(val.classList.contains("summary-jury-duty")).toBe(false);
    });
  });

  it("should apply color class when hours > 0", () => {
    component.ptoHours = 8;
    component.sickHours = 4;

    const ptoValue = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"]',
    );
    const sickValue = component.shadowRoot?.querySelector(
      '[data-summary-type="sick"]',
    );
    const bereavementValue = component.shadowRoot?.querySelector(
      '[data-summary-type="bereavement"]',
    );

    expect(ptoValue?.classList.contains("summary-pto")).toBe(true);
    expect(ptoValue?.textContent?.trim()).toBe("8");
    expect(sickValue?.classList.contains("summary-sick")).toBe(true);
    expect(sickValue?.textContent?.trim()).toBe("4");
    expect(bereavementValue?.classList.contains("summary-bereavement")).toBe(
      false,
    );
  });

  it("should display delta indicators when deltas property is set", () => {
    component.ptoHours = 16;
    component.deltas = { PTO: 8, Sick: -4 };

    const ptoValue = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"]',
    );
    const sickValue = component.shadowRoot?.querySelector(
      '[data-summary-type="sick"]',
    );

    // PTO should show 16 with +8 delta
    const ptoPending = ptoValue?.querySelector(".summary-pending");
    expect(ptoPending).toBeTruthy();
    expect(ptoPending?.textContent).toBe("+8");

    // Sick should show 0 with -4 delta (delta triggers color class)
    const sickPending = sickValue?.querySelector(".summary-pending");
    expect(sickPending).toBeTruthy();
    expect(sickPending?.textContent).toBe("-4");
    expect(sickValue?.classList.contains("summary-sick")).toBe(true);
  });

  it("should not display delta indicator when delta is 0", () => {
    component.ptoHours = 8;
    component.deltas = { PTO: 0 };

    const ptoValue = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"]',
    );
    const ptoPending = ptoValue?.querySelector(".summary-pending");
    expect(ptoPending).toBeFalsy();
  });

  it("should respond to attribute changes and re-render", () => {
    component.setAttribute("pto-hours", "24");

    const ptoValue = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"]',
    );
    expect(ptoValue?.textContent?.trim()).toBe("24");
    expect(ptoValue?.classList.contains("summary-pto")).toBe(true);
  });

  it("should have correct data-summary-type attributes", () => {
    const types = Array.from(
      component.shadowRoot?.querySelectorAll("[data-summary-type]") || [],
    ).map((el) => el.getAttribute("data-summary-type"));

    expect(types).toEqual(["pto", "sick", "bereavement", "jury-duty"]);
  });

  it("should clear deltas when set to empty object", () => {
    component.ptoHours = 8;
    component.deltas = { PTO: 4 };

    // Confirm delta is shown
    let ptoPending = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"] .summary-pending',
    );
    expect(ptoPending).toBeTruthy();

    // Clear deltas
    component.deltas = {};

    ptoPending = component.shadowRoot?.querySelector(
      '[data-summary-type="pto"] .summary-pending',
    );
    expect(ptoPending).toBeFalsy();
  });
});
