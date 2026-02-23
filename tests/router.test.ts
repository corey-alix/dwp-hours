// @vitest-environment happy-dom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Router } from "../client/router/router.js";
import type { AppRoutes } from "../client/router/types.js";

/** Minimal AuthService stub for router tests. */
function createMockAuthService(
  options: {
    authenticated?: boolean;
    role?: string;
  } = {},
) {
  return {
    isAuthenticated: vi.fn(() => options.authenticated ?? false),
    hasRole: vi.fn((r: string) => r === (options.role ?? "")),
    getUser: vi.fn(() =>
      options.authenticated
        ? { id: 1, name: "Test", role: options.role ?? "Employee" }
        : null,
    ),
  } as any;
}

function createTestRoutes(): AppRoutes {
  return [
    {
      path: "/login",
      component: "test-login",
      name: "Login",
      meta: { title: "Login", requiresAuth: false },
    },
    {
      path: "/dashboard",
      component: "test-dashboard",
      name: "Dashboard",
      meta: { title: "Dashboard", requiresAuth: true },
    },
    {
      path: "/admin/settings",
      component: "test-admin-settings",
      name: "Admin Settings",
      meta: { title: "Admin Settings", requiresAuth: true, roles: ["Admin"] },
    },
    {
      path: "/user/:id",
      component: "test-user-detail",
      name: "User Detail",
      meta: { title: "User Detail", requiresAuth: true },
    },
    {
      path: "/data",
      component: "test-data-page",
      name: "Data",
      meta: { title: "Data", requiresAuth: true },
      loader: async () => ({ items: [1, 2, 3] }),
    },
    {
      path: "*",
      component: "test-not-found",
      name: "Not Found",
      meta: { title: "404" },
    },
  ];
}

// Register minimal custom elements for tests
const registeredElements = new Set<string>();
function ensureElement(tag: string) {
  if (registeredElements.has(tag)) return;
  registeredElements.add(tag);
  customElements.define(
    tag,
    class extends HTMLElement {
      onRouteEnter = vi.fn();
      onRouteLeave = vi.fn().mockReturnValue(true);
    },
  );
}

describe("Router", () => {
  let outlet: HTMLElement;
  let routes: AppRoutes;

  beforeEach(() => {
    outlet = document.createElement("main");
    outlet.id = "router-outlet";
    document.body.appendChild(outlet);
    routes = createTestRoutes();

    // Register test elements
    [
      "test-login",
      "test-dashboard",
      "test-admin-settings",
      "test-user-detail",
      "test-data-page",
      "test-not-found",
    ].forEach(ensureElement);
  });

  afterEach(() => {
    document.body.removeChild(outlet);
    vi.restoreAllMocks();
    // Reset URL
    window.history.replaceState({}, "", "/");
  });

  describe("Path matching", () => {
    it("should match exact paths", () => {
      const auth = createMockAuthService();
      const router = new Router(routes, outlet, auth);
      const match = router.matchRoute("/login");

      expect(match).not.toBeNull();
      expect(match!.route.component).toBe("test-login");
      expect(match!.params).toEqual({});
    });

    it("should match nested paths", () => {
      const auth = createMockAuthService();
      const router = new Router(routes, outlet, auth);
      const match = router.matchRoute("/admin/settings");

      expect(match).not.toBeNull();
      expect(match!.route.component).toBe("test-admin-settings");
    });

    it("should extract path params", () => {
      const auth = createMockAuthService();
      const router = new Router(routes, outlet, auth);
      const match = router.matchRoute("/user/42");

      expect(match).not.toBeNull();
      expect(match!.route.component).toBe("test-user-detail");
      expect(match!.params).toEqual({ id: "42" });
    });

    it("should decode URI-encoded path params", () => {
      const auth = createMockAuthService();
      const router = new Router(routes, outlet, auth);
      const match = router.matchRoute("/user/hello%20world");

      expect(match).not.toBeNull();
      expect(match!.params).toEqual({ id: "hello world" });
    });
  });

  describe("Auth gating", () => {
    it("should redirect to /login when unauthenticated and route requires auth", async () => {
      const auth = createMockAuthService({ authenticated: false });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/dashboard");
      router.start();

      // Should have redirected to /login
      await vi.waitFor(() => {
        expect(window.location.pathname).toBe("/login");
      });
    });

    it("should allow access to non-auth routes when unauthenticated", async () => {
      const auth = createMockAuthService({ authenticated: false });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/login");
      router.start();

      await vi.waitFor(() => {
        const el = outlet.querySelector("test-login");
        expect(el).not.toBeNull();
      });
    });

    it("should redirect non-admin to /login for admin-only routes", async () => {
      const auth = createMockAuthService({
        authenticated: true,
        role: "Employee",
      });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/admin/settings");
      router.start();

      await vi.waitFor(() => {
        expect(window.location.pathname).toBe("/login");
      });
    });

    it("should allow admin access to admin routes", async () => {
      const auth = createMockAuthService({
        authenticated: true,
        role: "Admin",
      });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/admin/settings");
      router.start();

      await vi.waitFor(() => {
        const el = outlet.querySelector("test-admin-settings");
        expect(el).not.toBeNull();
      });
    });
  });

  describe("Navigation", () => {
    it("should render component into outlet", async () => {
      const auth = createMockAuthService({ authenticated: true });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/dashboard");
      router.start();

      await vi.waitFor(() => {
        const el = outlet.querySelector("test-dashboard");
        expect(el).not.toBeNull();
      });
    });

    it("should call onRouteEnter on navigation", async () => {
      const auth = createMockAuthService({ authenticated: true });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/dashboard");
      router.start();

      await vi.waitFor(() => {
        const el = outlet.querySelector("test-dashboard") as any;
        expect(el).not.toBeNull();
        expect(el.onRouteEnter).toHaveBeenCalled();
      });
    });

    it("should update document title from route meta", async () => {
      const auth = createMockAuthService({ authenticated: true });
      const router = new Router(routes, outlet, auth);

      window.history.replaceState({}, "", "/dashboard");
      router.start();

      await vi.waitFor(() => {
        expect(document.title).toContain("Dashboard");
      });
    });

    it("should dispatch route-changed event", async () => {
      const auth = createMockAuthService({ authenticated: true });
      const router = new Router(routes, outlet, auth);
      const handler = vi.fn();
      window.addEventListener("route-changed", handler);

      window.history.replaceState({}, "", "/dashboard");
      router.start();

      await vi.waitFor(() => {
        expect(handler).toHaveBeenCalled();
      });

      window.removeEventListener("route-changed", handler);
    });
  });

  describe("getCurrentPath", () => {
    it("should return current window path", () => {
      const auth = createMockAuthService();
      const router = new Router(routes, outlet, auth);
      window.history.replaceState({}, "", "/test-path");

      expect(router.getCurrentPath()).toBe("/test-path");
    });
  });
});
