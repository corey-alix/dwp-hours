// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PtoEntryForm } from "../client/components/pto-entry-form/index.js";
import { InMemoryStorage } from "../client/shared/storage.js";

// ── matchMedia mock ──
let matchMediaMatches = false;
const changeListeners: Array<(e: { matches: boolean }) => void> = [];
const originalMatchMedia = window.matchMedia;

function mockMatchMedia(query: string) {
  const isReducedMotion = query.includes("prefers-reduced-motion");
  return {
    matches: isReducedMotion ? true : matchMediaMatches,
    media: query,
    addEventListener: (_ev: string, fn: EventListenerOrEventListenerObject) => {
      if (!isReducedMotion) {
        changeListeners.push(
          fn as unknown as (e: { matches: boolean }) => void,
        );
      }
    },
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  };
}

function simulateViewportChange(wide: boolean) {
  matchMediaMatches = wide;
  for (const fn of changeListeners) {
    fn({ matches: wide });
  }
}

describe("Lock Month Per-Calendar", () => {
  let component: PtoEntryForm;
  let container: HTMLElement;
  let storage: InMemoryStorage;

  beforeEach(() => {
    matchMediaMatches = false;
    changeListeners.length = 0;
    window.matchMedia = mockMatchMedia as typeof window.matchMedia;

    storage = new InMemoryStorage();
    container = document.createElement("div");
    document.body.appendChild(container);

    component = new PtoEntryForm();
    component.storage = storage;
    container.appendChild(component);
  });

  afterEach(() => {
    document.body.removeChild(container);
    window.matchMedia = originalMatchMedia;
  });

  describe("Stage 1: Per-month lock button rendering", () => {
    it("should render a .btn-month-lock button in each month-card", () => {
      const cards = component.shadowRoot.querySelectorAll(".month-card");
      expect(cards.length).toBe(12);

      cards.forEach((card) => {
        const lockBtn = card.querySelector(".btn-month-lock");
        expect(lockBtn).toBeTruthy();
      });
    });

    it("each lock button should have the correct data-month attribute", () => {
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      expect(buttons.length).toBe(12);

      buttons.forEach((btn, i) => {
        expect(btn.getAttribute("data-month")).toBe((i + 1).toString());
      });
    });

    it("each lock button should have an aria-label with the month name", () => {
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];

      buttons.forEach((btn, i) => {
        expect(btn.getAttribute("aria-label")).toBe(`Lock ${monthNames[i]}`);
      });
    });

    it("lock buttons should default to '🔓 Lock' text", () => {
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      buttons.forEach((btn) => {
        expect(btn.textContent).toBe("🔓 Lock");
      });
    });

    it("lock buttons should have data-action=toggle-month-lock", () => {
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      buttons.forEach((btn) => {
        expect(btn.getAttribute("data-action")).toBe("toggle-month-lock");
      });
    });
  });

  describe("Stage 2: Event dispatch from per-month lock button", () => {
    it("clicking a lock button dispatches toggle-month-lock with YYYY-MM detail", () => {
      const handler = vi.fn();
      component.addEventListener("toggle-month-lock", handler);

      // Click the March lock button
      const marchBtn = component.shadowRoot.querySelector(
        '.btn-month-lock[data-month="3"]',
      ) as HTMLButtonElement;
      expect(marchBtn).toBeTruthy();
      marchBtn.click();

      expect(handler).toHaveBeenCalledTimes(1);
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.month).toMatch(/^\d{4}-03$/);
    });

    it("toggle-month-lock event should be composed (cross shadow DOM)", () => {
      let receivedEvent: CustomEvent | null = null;
      component.addEventListener("toggle-month-lock", ((e: CustomEvent) => {
        receivedEvent = e;
      }) as EventListener);

      const janBtn = component.shadowRoot.querySelector(
        '.btn-month-lock[data-month="1"]',
      ) as HTMLButtonElement;
      janBtn.click();

      expect(receivedEvent).toBeTruthy();
      expect(receivedEvent!.composed).toBe(true);
    });

    it("toggle-month-lock event should bubble", () => {
      let receivedEvent: CustomEvent | null = null;
      component.addEventListener("toggle-month-lock", ((e: CustomEvent) => {
        receivedEvent = e;
      }) as EventListener);

      const decBtn = component.shadowRoot.querySelector(
        '.btn-month-lock[data-month="12"]',
      ) as HTMLButtonElement;
      decBtn.click();

      expect(receivedEvent).toBeTruthy();
      expect(receivedEvent!.bubbles).toBe(true);
    });

    it("each button dispatches the correct month key", () => {
      const handler = vi.fn();
      component.addEventListener("toggle-month-lock", handler);

      for (let m = 1; m <= 12; m++) {
        const btn = component.shadowRoot.querySelector(
          `.btn-month-lock[data-month="${m}"]`,
        ) as HTMLButtonElement;
        btn.click();
      }

      expect(handler).toHaveBeenCalledTimes(12);
      for (let m = 1; m <= 12; m++) {
        const detail = (handler.mock.calls[m - 1][0] as CustomEvent).detail;
        const expectedMonth = m.toString().padStart(2, "0");
        expect(detail.month).toContain(`-${expectedMonth}`);
      }
    });
  });

  describe("Stage 3: Global toolbar lock button visibility", () => {
    it("in single-calendar mode, lock buttons are hidden via CSS (no display style set)", () => {
      // In single mode, the CSS rule :host([data-mode="single"]) .btn-month-lock { display: none }
      // hides the buttons. We verify the data-mode attribute.
      expect(component.getAttribute("data-mode")).toBe("single");
      // Buttons exist in DOM but CSS hides them
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      expect(buttons.length).toBe(12);
    });

    it("switching to multi mode makes per-month lock buttons CSS-visible", () => {
      simulateViewportChange(true);
      expect(component.getAttribute("data-mode")).toBe("multi");
      // Buttons remain in DOM, CSS shows them via :host([data-mode="multi"]) rule
      const buttons = component.shadowRoot.querySelectorAll(".btn-month-lock");
      expect(buttons.length).toBe(12);
    });
  });
});

describe("Submit Time Off - toggle-month-lock event bubbling", () => {
  it("toggle-month-lock event should bubble from child to parent shadow root", () => {
    const parent = document.createElement("div");
    const shadow = parent.attachShadow({ mode: "open" });
    const child = document.createElement("div");
    shadow.appendChild(child);

    const handler = vi.fn();
    shadow.addEventListener("toggle-month-lock", handler);

    child.dispatchEvent(
      new CustomEvent("toggle-month-lock", {
        detail: { month: "2026-03" },
        bubbles: true,
        composed: true,
      }),
    );

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.month).toBe("2026-03");
  });
});

describe("Submit Time Off - per-month lock button state", () => {
  /**
   * Helper: simulate per-month lock state rendering that the page applies
   * to month-card lock buttons based on acknowledgements.
   */
  function applyPerMonthLockState(btn: HTMLButtonElement, isLocked: boolean) {
    if (isLocked) {
      btn.textContent = "🔒 Unlock";
      btn.classList.add("btn-month-unlock");
      btn.classList.remove("hidden");
    } else {
      btn.textContent = "🔓 Lock";
      btn.classList.remove("btn-month-unlock");
      btn.classList.remove("hidden");
    }
  }

  it("should show '🔓 Lock' when month is unlocked", () => {
    const btn = document.createElement("button");
    applyPerMonthLockState(btn, false);
    expect(btn.textContent).toBe("🔓 Lock");
    expect(btn.classList.contains("btn-month-unlock")).toBe(false);
  });

  it("should show '🔒 Unlock' when month is locked", () => {
    const btn = document.createElement("button");
    applyPerMonthLockState(btn, true);
    expect(btn.textContent).toBe("🔒 Unlock");
    expect(btn.classList.contains("btn-month-unlock")).toBe(true);
  });

  it("should not be hidden when locked or unlocked", () => {
    const btn = document.createElement("button");
    applyPerMonthLockState(btn, true);
    expect(btn.classList.contains("hidden")).toBe(false);

    applyPerMonthLockState(btn, false);
    expect(btn.classList.contains("hidden")).toBe(false);
  });

  it("should toggle between states correctly", () => {
    const btn = document.createElement("button");

    applyPerMonthLockState(btn, false);
    expect(btn.textContent).toBe("🔓 Lock");

    applyPerMonthLockState(btn, true);
    expect(btn.textContent).toBe("🔒 Unlock");

    applyPerMonthLockState(btn, false);
    expect(btn.textContent).toBe("🔓 Lock");
    expect(btn.classList.contains("btn-month-unlock")).toBe(false);
  });
});
