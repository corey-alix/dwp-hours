// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { DayNoteDialog } from "../../client/components/day-note-dialog/index.js";

describe("DayNoteDialog Component", () => {
  let dialog: DayNoteDialog;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);

    dialog = new DayNoteDialog();
    dialog.date = "2026-02-10"; // Tuesday (working day)
    dialog.currentNote = "";
    dialog.currentHours = 8;
    container.appendChild(dialog);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("Rendering", () => {
    it("should render overlay, dialog, textarea, and hours input", () => {
      const overlay = dialog.shadowRoot?.querySelector(".overlay");
      const dialogEl = dialog.shadowRoot?.querySelector(".dialog");
      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement | null;
      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement | null;

      expect(overlay).toBeTruthy();
      expect(dialogEl).toBeTruthy();
      expect(textarea).toBeTruthy();
      expect(hoursInput).toBeTruthy();
    });

    it("should display date in header", () => {
      const header = dialog.shadowRoot?.querySelector(".dialog-header");
      expect(header?.textContent).toContain("2026-02-10");
    });

    it("should populate textarea with currentNote", () => {
      dialog.currentNote = "Test note";
      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement | null;
      expect(textarea?.value).toBe("Test note");
    });

    it("should populate hours input with currentHours", () => {
      dialog.currentHours = 4;
      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement | null;
      expect(hoursInput?.value).toBe("4");
    });

    it("should have textarea with 60 cols and 5 rows", () => {
      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement | null;
      expect(textarea?.getAttribute("cols")).toBe("60");
      expect(textarea?.getAttribute("rows")).toBe("5");
    });
  });

  describe("Save Action", () => {
    it("should dispatch day-note-save with note and hours", () => {
      let savedDetail: { date: string; note: string; hours: number } | null =
        null;
      dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
        savedDetail = e.detail;
      }) as EventListener);

      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement;
      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement;
      textarea.value = "Doctor appointment";
      hoursInput.value = "4";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(savedDetail).toEqual({
        date: "2026-02-10",
        note: "Doctor appointment",
        hours: 4,
      });
    });

    it("should trim whitespace from note text", () => {
      let savedDetail: { date: string; note: string; hours: number } | null =
        null;
      dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
        savedDetail = e.detail;
      }) as EventListener);

      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement;
      textarea.value = "  spaces around  ";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(savedDetail!.note).toBe("spaces around");
    });

    it("should allow saving empty note (clears note)", () => {
      dialog.currentNote = "Old note";
      let savedDetail: { date: string; note: string; hours: number } | null =
        null;
      dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
        savedDetail = e.detail;
      }) as EventListener);

      const textarea = dialog.shadowRoot?.querySelector(
        "#note-text",
      ) as HTMLTextAreaElement;
      textarea.value = "";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(savedDetail!.note).toBe("");
    });
  });

  describe("Cancel Action", () => {
    it("should dispatch day-note-cancel on cancel button click", () => {
      let cancelled = false;
      dialog.addEventListener("day-note-cancel", () => {
        cancelled = true;
      });

      const cancelBtn = dialog.shadowRoot?.querySelector(
        ".btn-cancel",
      ) as HTMLButtonElement;
      cancelBtn.click();

      expect(cancelled).toBe(true);
    });

    it("should dispatch day-note-cancel on overlay click", () => {
      let cancelled = false;
      dialog.addEventListener("day-note-cancel", () => {
        cancelled = true;
      });

      const overlay = dialog.shadowRoot?.querySelector(
        ".overlay",
      ) as HTMLElement;
      overlay.click();

      expect(cancelled).toBe(true);
    });

    it("should dispatch day-note-cancel on Escape key", () => {
      let cancelled = false;
      dialog.addEventListener("day-note-cancel", () => {
        cancelled = true;
      });

      // Simulate Escape keydown inside the shadow root
      const dialogEl = dialog.shadowRoot?.querySelector(
        ".dialog",
      ) as HTMLElement;
      dialogEl.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
      );

      expect(cancelled).toBe(true);
    });
  });

  describe("Validation — Negative Hours", () => {
    it("should reject negative hours on a working day (Tuesday)", () => {
      dialog.date = "2026-02-10"; // Tuesday
      let saved = false;
      dialog.addEventListener("day-note-save", () => {
        saved = true;
      });

      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement;
      hoursInput.value = "-4";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(saved).toBe(false);
      const errorMsg = dialog.shadowRoot?.querySelector("#validation-msg");
      expect(errorMsg?.textContent).toContain("Negative hours only allowed");
    });

    it("should allow negative hours on a weekend (Saturday)", () => {
      dialog.date = "2026-02-14"; // Saturday
      let savedDetail: { date: string; note: string; hours: number } | null =
        null;
      dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
        savedDetail = e.detail;
      }) as EventListener);

      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement;
      hoursInput.value = "-3.3";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(savedDetail!.hours).toBe(-3.3);
    });

    it("should reject NaN hours", () => {
      let saved = false;
      dialog.addEventListener("day-note-save", () => {
        saved = true;
      });

      const hoursInput = dialog.shadowRoot?.querySelector(
        "#note-hours",
      ) as HTMLInputElement;
      hoursInput.value = "abc";

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(saved).toBe(false);
      const errorMsg = dialog.shadowRoot?.querySelector("#validation-msg");
      expect(errorMsg?.textContent).toContain("must be a number");
    });
  });

  describe("Event Properties", () => {
    it("day-note-save should bubble and be composed", () => {
      let bubbles = false;
      let composed = false;
      dialog.addEventListener("day-note-save", ((e: CustomEvent) => {
        bubbles = e.bubbles;
        composed = e.composed;
      }) as EventListener);

      const saveBtn = dialog.shadowRoot?.querySelector(
        ".btn-save",
      ) as HTMLButtonElement;
      saveBtn.click();

      expect(bubbles).toBe(true);
      expect(composed).toBe(true);
    });

    it("day-note-cancel should bubble and be composed", () => {
      let bubbles = false;
      let composed = false;
      dialog.addEventListener("day-note-cancel", ((e: CustomEvent) => {
        bubbles = e.bubbles;
        composed = e.composed;
      }) as EventListener);

      const cancelBtn = dialog.shadowRoot?.querySelector(
        ".btn-cancel",
      ) as HTMLButtonElement;
      cancelBtn.click();

      expect(bubbles).toBe(true);
      expect(composed).toBe(true);
    });
  });

  describe("Viewport Centering", () => {
    it("should apply margin-top on .dialog to center in viewport", async () => {
      // Wait for the requestAnimationFrame in connectedCallback
      await new Promise((resolve) => requestAnimationFrame(resolve));

      const dialogEl = dialog.shadowRoot?.querySelector(
        ".dialog",
      ) as HTMLElement | null;
      expect(dialogEl).toBeTruthy();

      // In happy-dom, window.scrollY=0, window.innerHeight defaults to 768,
      // and offsetHeight may be 0 since layout is not real. The code
      // calculates: max(0, scrollY + (viewportHeight - dialogHeight) / 2).
      // With scrollY=0 and offsetHeight=0 → marginTop = 384px.
      const marginTop = parseFloat(dialogEl!.style.marginTop);
      expect(marginTop).toBeGreaterThanOrEqual(0);
    });

    it("should not use flex centering on overlay", () => {
      const overlay = dialog.shadowRoot?.querySelector(
        ".overlay",
      ) as HTMLElement | null;
      expect(overlay).toBeTruthy();

      // Overlay should NOT have display:flex centering — the dialog is
      // positioned via margin-top calculated from viewport coordinates.
      const computedDisplay = overlay!.style.display;
      // The overlay should not have inline flex centering; the CSS class
      // no longer sets display:flex/align-items/justify-content.
      expect(computedDisplay).not.toBe("flex");
    });
  });

  describe("Overuse Banner", () => {
    it("should not render overuse banner when overuseMessage is empty", () => {
      const banner = dialog.shadowRoot?.querySelector(".overuse-banner");
      expect(banner).toBeNull();
    });

    it("should render overuse banner when overuseMessage is set", () => {
      dialog.overuseMessage = "PTO balance exceeded by 8h";
      const banner = dialog.shadowRoot?.querySelector(".overuse-banner");
      expect(banner).toBeTruthy();
      expect(banner?.textContent).toContain("PTO balance exceeded by 8h");
    });

    it("should display the overuse icon in the banner", () => {
      dialog.overuseMessage = "Sick balance exceeded by 4h";
      const icon = dialog.shadowRoot?.querySelector(".overuse-icon");
      expect(icon).toBeTruthy();
      expect(icon?.textContent).toBe("!");
    });

    it("should have role=alert on the overuse banner for accessibility", () => {
      dialog.overuseMessage = "Balance exceeded";
      const banner = dialog.shadowRoot?.querySelector(".overuse-banner");
      expect(banner?.getAttribute("role")).toBe("alert");
    });
  });
});
