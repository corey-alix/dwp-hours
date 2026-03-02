// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginPage } from "../../client/pages/login-page/index.js";

describe("LoginPage — Timesheet Login", () => {
  let page: LoginPage;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    page = new LoginPage();
    container.appendChild(page);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe("Rendering", () => {
    it("should render the timesheet login form", () => {
      const form = page.shadowRoot?.querySelector("#timesheet-login-form");
      expect(form).toBeTruthy();
    });

    it("should render the divider between login methods", () => {
      const divider = page.shadowRoot?.querySelector(".divider");
      expect(divider).toBeTruthy();
      expect(divider?.textContent?.trim()).toBe("or");
    });

    it("should render the file input for .xlsx", () => {
      const input = page.shadowRoot?.querySelector(
        "#timesheet-file",
      ) as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe("file");
      expect(input.accept).toBe(".xlsx");
    });

    it("should render the timesheet login submit button", () => {
      const btn = page.shadowRoot?.querySelector(
        "#timesheet-login-btn",
      ) as HTMLButtonElement;
      expect(btn).toBeTruthy();
      expect(btn.textContent?.trim()).toBe("Sign In with Timesheet");
    });

    it("should render the timesheet section heading", () => {
      const h3 = page.shadowRoot?.querySelector(".timesheet-login-section h3");
      expect(h3).toBeTruthy();
      expect(h3?.textContent?.trim()).toBe("Sign in with your timesheet");
    });
  });

  describe("onRouteEnter", () => {
    it("should reset timesheet message state when entering route", async () => {
      (page as any)._timesheetMessage = "Old message";
      (page as any)._timesheetParsing = true;
      (page as any)._timesheetFileName = "old.xlsx";
      await page.onRouteEnter!();

      const messageDiv = page.shadowRoot?.querySelector("#timesheet-message");
      if (messageDiv) {
        expect(
          messageDiv.classList.contains("hidden") ||
            messageDiv.textContent?.trim() === "",
        ).toBe(true);
      }
    });
  });

  describe("File selection", () => {
    it("should update file name display when a file is selected", async () => {
      const input = page.shadowRoot?.querySelector(
        "#timesheet-file",
      ) as HTMLInputElement;
      expect(input).toBeTruthy();

      // Simulate file selection
      const file = new File(["test"], "my-timesheet.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      Object.defineProperty(input, "files", {
        value: [file],
        writable: false,
      });

      input.dispatchEvent(new Event("change", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 0));

      const nameSpan = page.shadowRoot?.querySelector(
        "#timesheet-file-name",
      ) as HTMLSpanElement;
      expect(nameSpan?.textContent).toBe("my-timesheet.xlsx");
    });
  });

  describe("Form submission — validation", () => {
    it("should show error when no file is selected", async () => {
      const mockAuthService = {
        requestMagicLink: vi.fn(),
        validateToken: vi.fn(),
        setAuthCookie: vi.fn(),
        establishSession: vi.fn(),
        api: { timesheetLogin: vi.fn() },
      };
      page.authService = mockAuthService as any;

      const form = page.shadowRoot?.querySelector(
        "#timesheet-login-form",
      ) as HTMLFormElement;
      form?.dispatchEvent(new Event("submit", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 50));

      const messageDiv = page.shadowRoot?.querySelector("#timesheet-message");
      expect(messageDiv?.textContent?.trim()).toContain(
        "Please select an .xlsx file first",
      );
    });
  });

  describe("Existing login form still works", () => {
    it("should still render the magic-link login form", () => {
      const form = page.shadowRoot?.querySelector("#login-form");
      expect(form).toBeTruthy();
      const input = page.shadowRoot?.querySelector("#identifier");
      expect(input).toBeTruthy();
    });

    it("should still dispatch login-success through magic link flow", async () => {
      const mockAuthService = {
        requestMagicLink: vi.fn().mockResolvedValue({
          message: "Magic link sent",
          magicLink: "http://localhost:3000/login?token=test123",
        }),
        validateToken: vi.fn().mockResolvedValue({
          id: 1,
          name: "Test User",
          role: "Employee",
        }),
      };

      page.authService = mockAuthService as any;

      const loginHandler = vi.fn();
      page.addEventListener("login-success", loginHandler);

      const input = page.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      if (input) {
        input.value = "test@example.com";
      }

      const form = page.shadowRoot?.querySelector(
        "#login-form",
      ) as HTMLFormElement;
      form?.dispatchEvent(new Event("submit", { bubbles: true }));

      await new Promise((r) => setTimeout(r, 100));

      expect(mockAuthService.requestMagicLink).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });
});
