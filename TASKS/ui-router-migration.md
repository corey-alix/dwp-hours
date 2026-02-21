# UI Router Migration

## Description

Decouple `UIManager` from concrete page implementations by introducing a type-safe client-side router. Today `UIManager` directly references every web component (`PtoEntryForm`, `PtoSickCard`, `AdminPanel`, …), orchestrates DOM visibility with `classList.add("hidden")`, and manually wires event listeners to each page's internals. This makes the manager ~500 lines of tightly-coupled UI orchestration code.

The goal is to:

1. Define a `Route` / `AppRoutes` type system (inspired by the route type declarations provided by the user) that describes pages declaratively.
2. Implement a lightweight `Router` class that matches paths, manages history, enforces auth gates, calls loaders, and renders page components.
3. Extract each "page" (Login, Submit Time Off, Current Year Summary, Prior Year Summary, Admin) into a self-contained page web component that implements a `PageComponent` interface.
4. Reduce `UIManager` to a thin application shell that bootstraps the router, handles auth state, and delegates everything else to routes and page components.

## Priority

🟢 Low Priority (Frontend/UI refactoring — no new user-visible behaviour; existing features must remain intact)

## Route System Design

### Core Types

```typescript
// client/router/types.ts

/** Utility: extract ':param' segments from a path string. */
type PathParam<T extends string> = T extends `${infer _}:${infer P}/${infer R}`
  ? P | PathParam<R>
  : T extends `${infer _}:${infer P}`
    ? P
    : never;

type ParamsFromPath<TPath extends string> = Record<PathParam<TPath>, string>;

/** Lifecycle hooks a page component can implement. */
export interface PageComponent extends HTMLElement {
  /** Called by the router after the element is placed in the DOM.
   *  Receives route params and the result of the route's loader (if any). */
  onRouteEnter?(
    params: Record<string, string>,
    loaderData?: unknown,
  ): void | Promise<void>;

  /** Called by the router when navigating away. Return `false` to block navigation (unsaved changes). */
  onRouteLeave?(): boolean | Promise<boolean>;
}

export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: string[];
  icon?: string;
  [key: string]: unknown;
}

export interface Route<TPath extends string = string> {
  path: TPath;

  /** Tag name of the page web component to render (e.g. "login-page"). */
  component: string;

  /** Human-readable label for navigation menus. */
  name?: string;

  meta?: RouteMeta;

  /** Async data loader invoked before the component is rendered. */
  loader?: (
    params: ParamsFromPath<TPath>,
    search: URLSearchParams,
  ) => Promise<unknown> | unknown;

  /** Component tag to render on loader/render error. */
  errorComponent?: string;

  /** Component tag to show while loader is pending. */
  pendingComponent?: string;

  children?: Route<string>[];
}

export type AppRoutes = Route<string>[];
```

### Router Class (sketch)

```typescript
// client/router/router.ts

export class Router {
  private routes: AppRoutes;
  private outlet: HTMLElement; // <main> or similar container
  private currentComponent: PageComponent | null = null;

  constructor(routes: AppRoutes, outlet: HTMLElement) { ... }

  /** Navigate to a path. Updates History API and renders. */
  async navigate(path: string): Promise<void> { ... }

  /** Match a path against the route tree, returning matched Route + extracted params. */
  private matchRoute(path: string): { route: Route; params: Record<string, string> } | null { ... }

  /** Render the matched route's component into the outlet. */
  private async renderRoute(route: Route, params: Record<string, string>): Promise<void> { ... }
}
```

### Page Interface Contract

Each page component extends `BaseComponent` and optionally implements `PageComponent`:

```typescript
// Example: client/pages/submit-time-off-page/index.ts
export class SubmitTimeOffPage extends BaseComponent implements PageComponent {
  async onRouteEnter(
    params: Record<string, string>,
    loaderData?: unknown,
  ): Promise<void> {
    // Receive PTO status & entries from loader, populate sub-components
  }

  onRouteLeave(): boolean {
    // Return false to block navigation if form has unsaved changes
    return true;
  }

  protected render(): string {
    /* ... */
  }
}
customElements.define("submit-time-off-page", SubmitTimeOffPage);
```

### Route Definitions

```typescript
// client/router/routes.ts
export const appRoutes: AppRoutes = [
  {
    path: "/login",
    component: "login-page",
    name: "Login",
    meta: { title: "Login", requiresAuth: false },
  },
  {
    path: "/submit-time-off",
    component: "submit-time-off-page",
    name: "Submit Time Off",
    meta: { title: "Submit Time Off", requiresAuth: true },
    loader: async () => {
      const api = new APIClient();
      const [status, entries] = await Promise.all([
        api.getPTOStatus(),
        api.getPTOEntries(),
      ]);
      return { status, entries };
    },
  },
  {
    path: "/current-year-summary",
    component: "current-year-summary-page",
    name: "Current Year Summary",
    meta: { title: "Current Year Summary", requiresAuth: true },
    loader: async () => {
      /* ... */
    },
  },
  {
    path: "/prior-year-summary",
    component: "prior-year-summary-page",
    name: "Prior Year Summary",
    meta: { title: "Prior Year Summary", requiresAuth: true },
    loader: async () => {
      /* ... */
    },
  },
  {
    path: "/admin",
    component: "admin-page",
    name: "Admin",
    meta: { title: "Admin Panel", requiresAuth: true, roles: ["Admin"] },
  },
  {
    path: "*",
    component: "not-found-page",
    name: "Not Found",
    meta: { title: "404" },
  },
];
```

## Checklist

### Stage 1 — Router Foundation (no behaviour change)

- [ ] Create `client/router/types.ts` with `Route`, `AppRoutes`, `PageComponent`, `RouteMeta` types
- [ ] Create `client/router/router.ts` implementing `Router` class
  - [ ] Path matching with `:param` and `*` wildcard support
  - [ ] History API integration (`pushState` / `popstate`)
  - [ ] Auth gate: check `meta.requiresAuth` and `meta.roles` before rendering
  - [ ] Loader execution with error/pending component support
  - [ ] Outlet management: unmount old component (`onRouteLeave`), mount new component (`onRouteEnter`)
- [ ] Create `client/router/routes.ts` with initial route definitions (empty placeholder components)
- [ ] Create `client/router/index.ts` barrel export
- [ ] Unit tests for `Router` path matching and auth gating (Vitest, happy-dom)
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 2 — Login Page Component

- [ ] Create `client/pages/login-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [ ] Move login form HTML, event handling, and magic-link logic from `UIManager.handleLogin` / `checkAuth`
  - [ ] Fire `login-success` custom event with user data on successful auth
- [ ] Create `client/pages/login-page/css.ts`
- [ ] Create `client/pages/login-page/test.html` and `test.ts`
- [ ] Unit tests for login page rendering and event dispatch
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 3 — Submit Time Off Page Component

- [ ] Create `client/pages/submit-time-off-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [ ] Move PTO entry form orchestration from `UIManager` (`handlePtoRequestSubmit`, `handlePtoDataRequest`, `handleFormSelectionChanged`, `clearFormBalanceDeltas`, `updateFormSummaryCard`)
  - [ ] Implement `onRouteEnter` to receive loader data (PTO status + entries) and populate sub-components
  - [ ] Contains `<pto-entry-form>`, `<month-summary>`, submit/cancel buttons in its template
- [ ] Create `client/pages/submit-time-off-page/css.ts`
- [ ] Create `client/pages/submit-time-off-page/test.html` and `test.ts`
- [ ] Unit tests for page data flow and event handling
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 4 — Current Year Summary Page Component

- [ ] Create `client/pages/current-year-summary-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [ ] Move PTO status card orchestration from `UIManager.loadPTOStatus` and `renderPTOStatus`
  - [ ] Implement `onRouteEnter` to receive loader data and populate summary/detail cards
  - [ ] Contains `<pto-summary-card>`, `<pto-employee-info-card>`, `<pto-pto-card>`, `<pto-sick-card>`, `<pto-bereavement-card>`, `<pto-jury-duty-card>` in its template
  - [ ] Handle `navigate-to-month` events internally (dispatch route navigation)
- [ ] Create `client/pages/current-year-summary-page/css.ts`
- [ ] Create `client/pages/current-year-summary-page/test.html` and `test.ts`
- [ ] Unit tests for data injection and card event handling
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 5 — Prior Year Summary Page Component

- [ ] Create `client/pages/prior-year-summary-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [ ] Move `UIManager.loadPriorYearReview` logic into `onRouteEnter`
  - [ ] Contains `<prior-year-review>` in its template
- [ ] Create `client/pages/prior-year-summary-page/css.ts`
- [ ] Create `client/pages/prior-year-summary-page/test.html` and `test.ts`
- [ ] Unit tests
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 6 — Admin Page Component

- [ ] Create `client/pages/admin-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [ ] Move admin button wiring, employee management stubs, and acknowledgment dialog logic from `UIManager`
  - [ ] Contains `<admin-panel>`, management buttons in its template
- [ ] Create `client/pages/admin-page/css.ts`
- [ ] Create `client/pages/admin-page/test.html` and `test.ts`
- [ ] Unit tests
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 7 — UIManager Slimdown & Router Integration

- [ ] Refactor `UIManager` to:
  - [ ] Instantiate `Router` with `appRoutes` and the `<main>` outlet
  - [ ] Handle only auth state (cookie, session validation, login/logout)
  - [ ] Listen for `login-success` event from router/login page to set user context
  - [ ] Remove all direct component references (`PtoEntryForm`, card components, etc.)
  - [ ] Remove `hideAllSections`, `showLogin`, `showDashboard`, `handlePageChange`, and page-specific load methods
  - [ ] Delegate page rendering entirely to `Router`
- [ ] Update `dashboard-navigation-menu` to emit route paths instead of page IDs
- [ ] Update `index.html` to use a single `<main id="router-outlet">` instead of multiple page divs
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes

### Stage 8 — E2E & Regression Testing

- [ ] Verify all existing Playwright E2E tests pass with the routed architecture
- [ ] Add E2E test for route-based navigation (browser back/forward, direct URL access)
- [ ] Add E2E test for auth gate (unauthenticated users redirected to `/login`)
- [ ] Add E2E test for role-based access (non-admin accessing `/admin`)
- [ ] Manual testing of all navigation flows
- [ ] `pnpm run build` passes
- [ ] `pnpm run lint` passes
- [ ] Documentation updated (README, copilot-instructions)

## Implementation Notes

- **No new dependencies** — the router is implemented in vanilla TypeScript using the History API.
- **Static imports only** — all page component files are statically imported per project conventions (no lazy `import()`).
- **BaseComponent** — all page components extend `BaseComponent` for consistent lifecycle, memory management, and rendering.
- **Named slots over embedding** — page components use `<slot>` for composable sub-components where appropriate, but can directly embed domain-specific child components (cards, forms) since they are page-scoped, not generic.
- **Backward compatibility** — during migration, `UIManager` can run in a hybrid mode where some pages use the router and others use the legacy path, allowing incremental adoption. Each stage should leave the app fully functional.
- **Auth state** — the `Router` consults `UIManager` (or a shared auth service) for current user/role when evaluating `meta.requiresAuth` and `meta.roles`. The auth cookie and session validation logic stays in `UIManager` (or is extracted to an `AuthService`).
- **Data loading** — route `loader` functions replace the scattered `loadPTOStatus`, `loadPriorYearReview`, etc. calls. Loader results are passed to `onRouteEnter`, giving each page its data without the page knowing about `APIClient`.
- **Event-driven cross-page actions** — e.g., `navigate-to-month` on a PTO card navigates via `router.navigate("/submit-time-off?month=3&year=2026")` instead of reaching into the form component.
- **Dashboard navigation menu** — the menu component will emit route paths (e.g., `/submit-time-off`) via a `navigate` custom event. The router listens and navigates accordingly. The `currentPage` attribute is updated by the router after each navigation.
- **Date handling** — follows project convention: all date operations use `shared/dateUtils.ts`, no `new Date()` outside that module.
- **Business rules** — all validation/calculation logic stays in `shared/businessRules.ts`, consumed by loaders or page components.

## Questions and Concerns

1. Should we extract auth logic from `UIManager` into a dedicated `AuthService` class as part of this migration, or leave it in `UIManager` and extract later?
2. The current `index.html` has admin controls outside the dashboard div. Should the admin page be a full route (`/admin`) or remain a conditional panel appended to other pages?
3. Should the router support hash-based routing (`#/path`) as a fallback for environments where the server doesn't support SPA rewrites, or is History API sufficient given the dev server setup?
4. How should the `navigate-to-month` cross-page event work? Should the target page read query params (`?month=3&year=2026`), or should the router pass them as route params?
5. During the hybrid migration period (Stages 2–6), should new page components be rendered inside the existing `#dashboard` container, or immediately switch to a dedicated `#router-outlet`?
