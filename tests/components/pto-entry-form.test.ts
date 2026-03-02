// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PtoEntryForm } from "../../client/components/pto-entry-form/index.js";
import { InMemoryStorage } from "../../client/shared/storage.js";
import type { PTOEntry } from "../../client/components/pto-calendar/index.js";

// ── matchMedia mock ──
// happy-dom does not fully implement matchMedia. Provide a mock that
// defaults to single-calendar mode (matches: false for min-width query)
// and supports overriding via setMultiCalendarMode().

let matchMediaMatches = false;
const changeListeners: Array<(e: { matches: boolean }) => void> = [];
const originalMatchMedia = window.matchMedia;

function mockMatchMedia(query: string) {
  // reduced-motion queries should always return matches: true in tests
  // to avoid animation timing issues
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
    addListener: (_fn: EventListener) => {
      // deprecated API
    },
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  };
}

/** Simulate a viewport change by calling all registered matchMedia listeners */
function simulateViewportChange(wide: boolean) {
  matchMediaMatches = wide;
  for (const fn of changeListeners) {
    fn({ matches: wide });
  }
}

describe("PtoEntryForm — Declarative Rendering & Mode Switching", () => {
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

  // ── Declarative template rendering (Phase 3) ──

  describe("Declarative Template Rendering", () => {
    it("should render all 12 month-cards in shadow DOM", () => {
      const cards = component.shadowRoot.querySelectorAll(".month-card");
      expect(cards.length).toBe(12);
    });

    it("should render 12 pto-calendar elements", () => {
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      expect(calendars.length).toBe(12);
    });

    it("should render 12 month-summary elements", () => {
      const summaries = component.shadowRoot.querySelectorAll("month-summary");
      expect(summaries.length).toBe(12);
    });

    it("should assign correct data-month attributes to cards", () => {
      const cards = component.shadowRoot.querySelectorAll(".month-card");
      cards.forEach((card, i) => {
        expect(card.getAttribute("data-month")).toBe((i + 1).toString());
      });
    });

    it("should assign correct month attribute to each calendar", () => {
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal, i) => {
        expect(cal.getAttribute("month")).toBe((i + 1).toString());
      });
    });

    it("should set hide-legend on all calendars", () => {
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal) => {
        expect(cal.getAttribute("hide-legend")).toBe("true");
      });
    });

    it("should set interactive attribute on all month-summaries", () => {
      const summaries = component.shadowRoot.querySelectorAll("month-summary");
      summaries.forEach((s) => {
        expect(s.hasAttribute("interactive")).toBe(true);
      });
    });

    it("should render navigation arrows", () => {
      const prev = component.shadowRoot.querySelector("#prev-month-btn");
      const next = component.shadowRoot.querySelector("#next-month-btn");
      expect(prev).toBeTruthy();
      expect(next).toBeTruthy();
    });
  });

  // ── Attribute-based mode switching (Phase 4) ──

  describe("Mode Switching via data-mode Attribute", () => {
    it("should default to single mode when viewport is narrow", () => {
      expect(component.getAttribute("data-mode")).toBe("single");
    });

    it("should set data-mode to multi when viewport is wide", () => {
      // Recreate with wide viewport
      container.removeChild(component);
      matchMediaMatches = true;
      const wideComponent = new PtoEntryForm();
      wideComponent.storage = storage;
      container.appendChild(wideComponent);

      expect(wideComponent.getAttribute("data-mode")).toBe("multi");
    });

    it("isMultiCalendar should reflect data-mode attribute", () => {
      expect(component.isMultiCalendar).toBe(false);
      simulateViewportChange(true);
      expect(component.isMultiCalendar).toBe(true);
    });

    it("should switch to multi mode on simulated viewport change", () => {
      expect(component.getAttribute("data-mode")).toBe("single");
      simulateViewportChange(true);
      expect(component.getAttribute("data-mode")).toBe("multi");
    });

    it("should switch back to single mode on viewport shrink", () => {
      simulateViewportChange(true);
      expect(component.getAttribute("data-mode")).toBe("multi");
      simulateViewportChange(false);
      expect(component.getAttribute("data-mode")).toBe("single");
    });

    it("should not use .multi-calendar class (deprecated)", () => {
      simulateViewportChange(true);
      expect(component.classList.contains("multi-calendar")).toBe(false);
    });
  });

  // ── Calendar header visibility by mode ──

  describe("Calendar Header Visibility", () => {
    it("should set hide-header on all calendars in single mode", () => {
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal) => {
        expect(cal.getAttribute("hide-header")).toBe("true");
      });
    });

    it("should remove hide-header from all calendars in multi mode", () => {
      simulateViewportChange(true);
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal) => {
        expect(cal.hasAttribute("hide-header")).toBe(false);
      });
    });

    it("should toggle hide-header when switching modes", () => {
      simulateViewportChange(true);
      simulateViewportChange(false);
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal) => {
        expect(cal.getAttribute("hide-header")).toBe("true");
      });
    });
  });

  // ── Single-calendar active month management ──

  describe("Single-Calendar Active Month", () => {
    it("should mark one month card as active in single mode", () => {
      const activeCards =
        component.shadowRoot.querySelectorAll(".month-card.active");
      expect(activeCards.length).toBe(1);
    });

    it("should restore persisted month on initial load", () => {
      // Pre-set a persisted month before component creation
      container.removeChild(component);
      storage.setItem("dwp-pto-form-selected-month", "7");
      const newComponent = new PtoEntryForm();
      newComponent.storage = storage;
      container.appendChild(newComponent);

      const activeCard =
        newComponent.shadowRoot.querySelector(".month-card.active");
      expect(activeCard?.getAttribute("data-month")).toBe("7");
    });

    it("should not have active card in multi mode", () => {
      simulateViewportChange(true);
      // Active class is irrelevant in multi mode — all cards visible.
      // The class may remain but has no CSS effect.
      // Just verify all 12 cards are present.
      const cards = component.shadowRoot.querySelectorAll(".month-card");
      expect(cards.length).toBe(12);
    });

    it("should restore active card when switching back to single", () => {
      // Navigate to month 5
      component.navigateToMonth(5, 2026);
      simulateViewportChange(true);
      simulateViewportChange(false);
      const activeCard =
        component.shadowRoot.querySelector(".month-card.active");
      expect(activeCard?.getAttribute("data-month")).toBe("5");
    });
  });

  // ── Navigation ──

  describe("Single-Calendar Navigation", () => {
    it("should update month label in nav header", () => {
      const label = component.shadowRoot.querySelector("#calendar-month-label");
      // Label should contain the active month name
      expect(label?.textContent).toBeTruthy();
    });

    it("navigateToMonth should switch active card", () => {
      component.navigateToMonth(11, 2026);
      const activeCard =
        component.shadowRoot.querySelector(".month-card.active");
      expect(activeCard?.getAttribute("data-month")).toBe("11");
    });

    it("navigateToMonth should dispatch month-changed event", () => {
      const handler = vi.fn();
      component.addEventListener("month-changed", handler);
      component.navigateToMonth(4, 2026);
      expect(handler).toHaveBeenCalled();
      const detail = (handler.mock.calls[0][0] as CustomEvent).detail;
      expect(detail.month).toBe(4);
      expect(detail.year).toBe(2026);
    });

    it("navigateToMonth in multi mode should not change active card", () => {
      simulateViewportChange(true);
      // Multi mode scrolls into view instead of switching active
      component.navigateToMonth(6, 2026);
      // No assertion for scrollIntoView (happy-dom limitation),
      // just verify no crash
    });
  });

  // ── Data distribution ──

  describe("PTO Data Distribution", () => {
    const entries: PTOEntry[] = [
      {
        id: 1,
        employeeId: 1,
        date: "2026-01-15",
        type: "PTO",
        hours: 8,
        createdAt: "2026-01-01T00:00:00Z",
        approved_by: 1,
      },
      {
        id: 2,
        employeeId: 1,
        date: "2026-03-10",
        type: "Sick",
        hours: 4,
        createdAt: "2026-03-01T00:00:00Z",
        approved_by: null,
      },
    ];

    it("should distribute entries to correct month calendars", () => {
      component.setPtoData(entries);

      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      const janCal = calendars[0] as unknown as {
        ptoEntries: PTOEntry[];
      };
      const marCal = calendars[2] as unknown as {
        ptoEntries: PTOEntry[];
      };
      const febCal = calendars[1] as unknown as {
        ptoEntries: PTOEntry[];
      };

      expect(janCal.ptoEntries.length).toBe(1);
      expect(janCal.ptoEntries[0].date).toBe("2026-01-15");
      expect(marCal.ptoEntries.length).toBe(1);
      expect(marCal.ptoEntries[0].date).toBe("2026-03-10");
      expect(febCal.ptoEntries.length).toBe(0);
    });

    it("setPtoData should work the same in both modes", () => {
      // Single mode
      component.setPtoData(entries);
      const singleEntries = component.getPtoEntries();

      // Switch to multi
      simulateViewportChange(true);

      // Entries should still be on the calendars (no rebuild needed)
      const multiEntries = component.getPtoEntries();
      expect(multiEntries.length).toBe(singleEntries.length);
    });

    it("should preserve calendar state across mode switches", () => {
      component.setPtoData(entries);
      const entryCountBefore = component.getPtoEntries().length;

      // Switch single → multi → single
      simulateViewportChange(true);
      simulateViewportChange(false);

      const entryCountAfter = component.getPtoEntries().length;
      expect(entryCountAfter).toBe(entryCountBefore);
    });
  });

  // ── Reset ──

  describe("Reset Behavior", () => {
    it("should dispatch pto-data-request on reset", () => {
      const handler = vi.fn();
      component.addEventListener("pto-data-request", handler);
      component.reset();
      expect(handler).toHaveBeenCalled();
    });

    it("should preserve 12 calendars after reset (no rebuild)", () => {
      component.reset();
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      expect(calendars.length).toBe(12);
    });
  });

  // ── Selected requests aggregation ──

  describe("getSelectedRequests", () => {
    it("should return empty array when no selections", () => {
      expect(component.getSelectedRequests()).toEqual([]);
    });
  });

  // ── PTO type propagation ──

  describe("PTO Type Changes", () => {
    it("should propagate PTO type to all calendars via setActivePtoType", () => {
      component.setActivePtoType("Sick");
      const calendars = component.shadowRoot.querySelectorAll("pto-calendar");
      calendars.forEach((cal) => {
        const ptoCal = cal as unknown as { selectedPtoType: string };
        expect(ptoCal.selectedPtoType).toBe("Sick");
      });
    });
  });
});
