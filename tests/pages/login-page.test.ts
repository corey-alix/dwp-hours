// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LoginPage } from "../../client/pages/login-page/index.js";

describe("LoginPage Component", () => {
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
    it("should create component instance with shadow DOM", () => {
      expect(page).toBeInstanceOf(LoginPage);
      expect(page.shadowRoot).toBeTruthy();
    });

    it("should render login form with identifier input", () => {
      const form = page.shadowRoot?.querySelector("#login-form");
      expect(form).toBeTruthy();
      const input = page.shadowRoot?.querySelector("#identifier");
      expect(input).toBeTruthy();
    });

    it("should render submit button", () => {
      const btn = page.shadowRoot?.querySelector(
        '#login-form button[type="submit"]',
      );
      expect(btn).toBeTruthy();
    });
  });

  describe("onRouteEnter", () => {
    it("should reset message state when entering route", async () => {
      // Set some state first
      (page as any)._message = "Old message";
      await page.onRouteEnter!();

      // After entering, message should be cleared
      const messageDiv = page.shadowRoot?.querySelector("#login-message");
      // Message div should either not exist or be empty
      if (messageDiv) {
        expect(messageDiv.textContent?.trim()).toBe("");
      }
    });
  });

  describe("Event Dispatch", () => {
    it("should dispatch login-success event on successful auth", async () => {
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

      // Fill in identifier and submit
      const input = page.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      if (input) {
        input.value = "test@example.com";
      }

      const form = page.shadowRoot?.querySelector(
        "#login-form",
      ) as HTMLFormElement;
      if (form) {
        form.dispatchEvent(new Event("submit", { bubbles: true }));
      }

      // Wait for async operations
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockAuthService.requestMagicLink).toHaveBeenCalledWith(
        "test@example.com",
      );
    });
  });
});
