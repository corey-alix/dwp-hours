import type { AuthService } from "../auth/auth-service.js";
import type { AppRoutes, PageComponent, Route } from "./types.js";

interface MatchResult {
  route: Route;
  params: Record<string, string>;
}

/**
 * Lightweight client-side router using the History API.
 *
 * - Matches paths with `:param` segments and a `*` wildcard catch-all.
 * - Enforces auth gates via `meta.requiresAuth` / `meta.roles`.
 * - Calls optional route `loader` before rendering.
 * - Manages a single outlet element, calling `onRouteEnter` / `onRouteLeave`
 *   lifecycle hooks on page components.
 */
export class Router {
  private routes: AppRoutes;
  private outlet: HTMLElement;
  private currentComponent: (HTMLElement & Partial<PageComponent>) | null =
    null;
  private authService: AuthService;
  private started = false;

  constructor(
    routes: AppRoutes,
    outlet: HTMLElement,
    authService: AuthService,
  ) {
    this.routes = routes;
    this.outlet = outlet;
    this.authService = authService;
  }

  /** Start listening for navigation. Renders the current URL. */
  start(): void {
    if (this.started) return;
    this.started = true;

    window.addEventListener("popstate", () => {
      this.renderCurrentUrl();
    });

    // Intercept link clicks for SPA navigation
    document.addEventListener("click", (e) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (
        anchor &&
        anchor.href &&
        anchor.origin === window.location.origin &&
        !anchor.hasAttribute("download") &&
        anchor.target !== "_blank"
      ) {
        e.preventDefault();
        this.navigate(anchor.pathname + anchor.search);
      }
    });

    this.renderCurrentUrl();
  }

  /** Navigate to a path. Updates History API and renders. */
  async navigate(path: string): Promise<void> {
    // Ask current page whether we may leave
    if (this.currentComponent?.onRouteLeave) {
      const allowed = await this.currentComponent.onRouteLeave();
      if (allowed === false) return;
    }

    window.history.pushState({}, "", path);
    await this.renderCurrentUrl();
  }

  /** Get the current path from the URL. */
  getCurrentPath(): string {
    return window.location.pathname;
  }

  // ── Route matching ─────────────────────────────────────────────

  /** Match a path against the route table. */
  matchRoute(urlPath: string): MatchResult | null {
    // Flatten children into a flat list with fully qualified paths
    const flatRoutes = this.flattenRoutes(this.routes);

    for (const route of flatRoutes) {
      if (route.path === "*") continue; // Wildcard is last-resort

      const params = this.matchPath(route.path, urlPath);
      if (params !== null) {
        return { route, params };
      }
    }

    // Try wildcard
    const wildcard = flatRoutes.find((r) => r.path === "*");
    if (wildcard) {
      return { route: wildcard, params: {} };
    }

    return null;
  }

  private flattenRoutes(routes: AppRoutes, prefix = ""): Route[] {
    const result: Route[] = [];
    for (const route of routes) {
      const fullPath =
        prefix + (route.path.startsWith("/") ? route.path : `/${route.path}`);
      result.push({ ...route, path: fullPath });
      if (route.children) {
        result.push(...this.flattenRoutes(route.children, fullPath));
      }
    }
    return result;
  }

  /**
   * Match a route path pattern against a URL path.
   * Returns extracted params or null on mismatch.
   */
  private matchPath(
    pattern: string,
    urlPath: string,
  ): Record<string, string> | null {
    const patternSegments = pattern.split("/").filter(Boolean);
    const urlSegments = urlPath.split("/").filter(Boolean);

    if (patternSegments.length !== urlSegments.length) return null;

    const params: Record<string, string> = {};
    for (let i = 0; i < patternSegments.length; i++) {
      const pat = patternSegments[i];
      const url = urlSegments[i];
      if (pat.startsWith(":")) {
        params[pat.slice(1)] = decodeURIComponent(url);
      } else if (pat !== url) {
        return null;
      }
    }
    return params;
  }

  // ── Rendering ──────────────────────────────────────────────────

  private async renderCurrentUrl(): Promise<void> {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);

    // Root path redirect: authenticated → default page, unauthenticated → login
    if (path === "/") {
      const target = this.authService.isAuthenticated()
        ? "/submit-time-off"
        : "/login";
      window.history.replaceState({}, "", target);
      await this.renderCurrentUrl();
      return;
    }

    const match = this.matchRoute(path);

    if (!match) {
      this.outlet.innerHTML = `<p>Page not found</p>`;
      return;
    }

    const { route, params } = match;

    // Auth gate
    if (route.meta?.requiresAuth && !this.authService.isAuthenticated()) {
      window.history.replaceState({}, "", "/login");
      await this.renderCurrentUrl();
      return;
    }

    // Role gate
    if (route.meta?.roles && route.meta.roles.length > 0) {
      const hasRole = route.meta.roles.some((r) => this.authService.hasRole(r));
      if (!hasRole) {
        window.history.replaceState({}, "", "/login");
        await this.renderCurrentUrl();
        return;
      }
    }

    // Run loader
    let loaderData: unknown = undefined;
    if (route.loader) {
      try {
        loaderData = await route.loader(params as any, search);
      } catch (err) {
        console.error(`Route loader error for ${route.path}:`, err);
        if (route.errorComponent) {
          this.renderComponent(route.errorComponent, params, search);
          return;
        }
      }
    }

    // Update page title
    if (route.meta?.title) {
      document.title = `${route.meta.title} — DWP Hours Tracker`;
    }

    await this.renderComponent(route.component, params, search, loaderData);
  }

  private async renderComponent(
    tagName: string,
    params: Record<string, string>,
    search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void> {
    // Leave current page
    if (this.currentComponent?.onRouteLeave) {
      await this.currentComponent.onRouteLeave();
    }

    // Clear outlet
    this.outlet.innerHTML = "";

    // Create new component
    const el = document.createElement(tagName) as HTMLElement &
      Partial<PageComponent>;

    // Inject authService into page components that support it (e.g. LoginPage)
    if ("authService" in el) {
      (el as any).authService = this.authService;
    }

    this.outlet.appendChild(el);
    this.currentComponent = el;

    // Enter new page
    if (el.onRouteEnter) {
      await el.onRouteEnter(params, search, loaderData);
    }

    // Dispatch route-changed event for nav menu etc.
    window.dispatchEvent(
      new CustomEvent("route-changed", {
        detail: { path: window.location.pathname, route: tagName },
      }),
    );
  }
}
