// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { AuthService } from "../client/auth/auth-service.js";

describe("AuthService", () => {
  let authService: AuthService;
  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      requestAuthLink: vi.fn(),
      validateAuth: vi.fn(),
      validateSession: vi.fn(),
    };
    authService = new AuthService(mockApi);
    // Clear cookies
    document.cookie =
      "auth_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Initial state", () => {
    it("should start with no user", () => {
      expect(authService.getUser()).toBeNull();
    });

    it("should not be authenticated initially", () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should not have any role initially", () => {
      expect(authService.hasRole("Admin")).toBe(false);
      expect(authService.hasRole("Employee")).toBe(false);
    });
  });

  describe("Cookie helpers", () => {
    it("should set auth cookie", () => {
      authService.setAuthCookie("test-hash-123");
      expect(document.cookie).toContain("auth_hash=test-hash-123");
    });

    it("should get auth cookie", () => {
      authService.setAuthCookie("test-hash-456");
      expect(authService.getAuthCookie()).toBe("test-hash-456");
    });

    it("should return null when no auth cookie exists", () => {
      expect(authService.getAuthCookie()).toBeNull();
    });
  });

  describe("requestMagicLink", () => {
    it("should call api.requestAuthLink with identifier", async () => {
      mockApi.requestAuthLink.mockResolvedValue({
        message: "Link sent",
        magicLink: "http://localhost/auth?token=abc",
      });

      const result = await authService.requestMagicLink("user@example.com");

      expect(mockApi.requestAuthLink).toHaveBeenCalledWith("user@example.com");
      expect(result.message).toBe("Link sent");
    });
  });

  describe("validateToken", () => {
    it("should validate token and set user", async () => {
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash-abc",
        employee: { id: 1, name: "Test User", role: "Employee" },
      });

      const user = await authService.validateToken("test-token");

      expect(user).toEqual({
        id: 1,
        name: "Test User",
        role: "Employee",
      });
      expect(authService.getUser()).toEqual(user);
      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should set auth cookie on successful validation", async () => {
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash-xyz",
        employee: { id: 2, name: "Admin", role: "Admin" },
      });

      await authService.validateToken("token-123");

      expect(authService.getAuthCookie()).toBe("hash-xyz");
    });

    it("should dispatch auth-state-changed event", async () => {
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash-abc",
        employee: { id: 1, name: "Test", role: "Employee" },
      });

      const handler = vi.fn();
      window.addEventListener("auth-state-changed", handler);

      await authService.validateToken("token");

      expect(handler).toHaveBeenCalledTimes(1);
      window.removeEventListener("auth-state-changed", handler);
    });
  });

  describe("validateSession", () => {
    it("should return user when session is valid", async () => {
      mockApi.validateSession.mockResolvedValue({
        valid: true,
        employee: { id: 1, name: "Existing User", role: "Admin" },
      });

      const user = await authService.validateSession();

      expect(user).toEqual({
        id: 1,
        name: "Existing User",
        role: "Admin",
      });
      expect(authService.isAuthenticated()).toBe(true);
    });

    it("should return null and logout when session is invalid", async () => {
      mockApi.validateSession.mockResolvedValue({ valid: false });

      const user = await authService.validateSession();

      expect(user).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should return null and logout when api throws", async () => {
      mockApi.validateSession.mockRejectedValue(new Error("Network error"));

      const user = await authService.validateSession();

      expect(user).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe("logout", () => {
    it("should clear user state", async () => {
      // First set up a user
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash",
        employee: { id: 1, name: "User", role: "Employee" },
      });
      await authService.validateToken("token");
      expect(authService.isAuthenticated()).toBe(true);

      authService.logout();

      expect(authService.getUser()).toBeNull();
      expect(authService.isAuthenticated()).toBe(false);
    });

    it("should clear auth cookie", async () => {
      authService.setAuthCookie("test-hash");
      expect(authService.getAuthCookie()).toBe("test-hash");

      authService.logout();

      expect(authService.getAuthCookie()).toBeNull();
    });

    it("should clear localStorage", async () => {
      localStorage.setItem("currentUser", '{"id":1}');

      authService.logout();

      expect(localStorage.getItem("currentUser")).toBeNull();
    });

    it("should dispatch auth-state-changed event with null user", () => {
      const handler = vi.fn();
      window.addEventListener("auth-state-changed", handler);

      authService.logout();

      expect(handler).toHaveBeenCalledTimes(1);
      const event = handler.mock.calls[0][0] as CustomEvent;
      expect(event.detail.user).toBeNull();

      window.removeEventListener("auth-state-changed", handler);
    });
  });

  describe("hasRole", () => {
    it("should return true when user has matching role", async () => {
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash",
        employee: { id: 1, name: "Admin User", role: "Admin" },
      });
      await authService.validateToken("token");

      expect(authService.hasRole("Admin")).toBe(true);
    });

    it("should return false when user has different role", async () => {
      mockApi.validateAuth.mockResolvedValue({
        authToken: "hash",
        employee: { id: 1, name: "User", role: "Employee" },
      });
      await authService.validateToken("token");

      expect(authService.hasRole("Admin")).toBe(false);
    });
  });
});
