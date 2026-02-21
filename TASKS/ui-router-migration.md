# UI Router Migration

## Description

Decouple `UIManager` from concrete page implementations by introducing a type-safe client-side router. Today `UIManager` directly references every web component (`PtoEntryForm`, `PtoSickCard`, `AdminPanel`, …), orchestrates DOM visibility with `classList.add("hidden")`, and manually wires event listeners to each page's internals. This makes the manager ~500 lines of tightly-coupled UI orchestration code.

The goal is to:

1. Define a `Route` / `AppRoutes` type system that describes pages declaratively.
2. Implement a lightweight `Router` class that matches paths, manages history (History API only — no hash routing), enforces auth gates, calls loaders, and renders page components.
3. Extract auth logic from `UIManager` into a dedicated `AuthService` class.
4. Extract each "page" (Login, Submit Time Off, Current Year Summary, Prior Year Summary) into a self-contained page web component implementing the `PageComponent` interface.
5. Migrate admin child components (`employee-list`, `employee-form`, `pto-request-queue`, `admin-monthly-review`) to conform to the web-components-assistant standard **before** wrapping them in pages.
6. Delete `report-generator` (the app doesn't need it).
7. Decompose the monolithic `admin-panel` component into separate routed admin pages (Employees, PTO Requests, Monthly Review, Settings) and **remove** `admin-panel`.
8. Reduce `UIManager` to a thin application shell that bootstraps the router, wires `AuthService`, and delegates everything else to routes and page components.
9. Replace `index.html`'s multi-div page structure with a single `<main id="router-outlet">` immediately (no hybrid migration — the app is offline during this work).

## Priority

🟢 Low Priority (Frontend/UI refactoring — no new user-visible behaviour; existing features must remain intact)

## Decisions (from Q&A)

| #   | Question                         | Decision                                                                                                                                                                               |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Extract auth into `AuthService`? | **Yes** — extract as part of this migration.                                                                                                                                           |
| 2   | Admin page structure?            | **Decompose** `admin-panel` into separate routes (`/admin/employees`, `/admin/pto-requests`, `/admin/monthly-review`, `/admin/settings`). Remove `admin-panel` and `report-generator`. |
| 3   | Hash-based routing?              | **No** — History API only. This is a lightweight app; the focus is developer experience. The server already serves `index.html` for all paths.                                         |
| 4   | `navigate-to-month` cross-page?  | **Query params** — navigate to `/submit-time-off?month=3&year=2026`. The Submit Time Off page reads `URLSearchParams` in `onRouteEnter` and calls `ptoForm.navigateToMonth()`.         |
| 5   | Hybrid migration?                | **No hybrid** — switch to `#router-outlet` immediately. No one will use the app until this feature is complete.                                                                        |

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

### AuthService (sketch)

```typescript
// client/auth/auth-service.ts

export interface AuthUser {
  id: number;
  name: string;
  role: string;
}

export class AuthService {
  private currentUser: AuthUser | null = null;

  /** Check URL for magic-link token, then fall back to cookie-based session. */
  async initialize(): Promise<AuthUser | null> { ... }

  /** Request a magic link for the given email. */
  async requestMagicLink(identifier: string): Promise<{ message: string; magicLink?: string }> { ... }

  /** Validate a magic-link token and establish a session. */
  async validateToken(token: string): Promise<AuthUser> { ... }

  /** Validate an existing cookie-based session. */
  async validateSession(): Promise<AuthUser | null> { ... }

  /** Log the user out: clear cookie, clear state. */
  logout(): void { ... }

  /** Current authenticated user (or null). */
  getUser(): AuthUser | null { return this.currentUser; }

  /** Whether the current user has a given role. */
  hasRole(role: string): boolean { ... }
}
```

### Router Class (sketch)

```typescript
// client/router/router.ts

export class Router {
  private routes: AppRoutes;
  private outlet: HTMLElement;
  private currentComponent: PageComponent | null = null;
  private authService: AuthService;

  constructor(routes: AppRoutes, outlet: HTMLElement, authService: AuthService) { ... }

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
    // Read query params for navigate-to-month: ?month=3&year=2026
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
      /* fetch PTO status + entries */
    },
  },
  {
    path: "/prior-year-summary",
    component: "prior-year-summary-page",
    name: "Prior Year Summary",
    meta: { title: "Prior Year Summary", requiresAuth: true },
    loader: async () => {
      /* fetch prior year review data */
    },
  },
  // Admin routes — each former admin-panel view becomes its own route
  {
    path: "/admin/employees",
    component: "admin-employees-page",
    name: "Employee Management",
    meta: {
      title: "Employee Management",
      requiresAuth: true,
      roles: ["Admin"],
    },
    loader: async () => {
      /* fetch employee list */
    },
  },
  {
    path: "/admin/pto-requests",
    component: "admin-pto-requests-page",
    name: "PTO Requests",
    meta: { title: "PTO Request Queue", requiresAuth: true, roles: ["Admin"] },
    loader: async () => {
      /* fetch PTO requests */
    },
  },
  {
    path: "/admin/monthly-review",
    component: "admin-monthly-review-page",
    name: "Monthly Review",
    meta: {
      title: "Monthly Employee Review",
      requiresAuth: true,
      roles: ["Admin"],
    },
  },
  {
    path: "/admin/settings",
    component: "admin-settings-page",
    name: "Settings",
    meta: { title: "System Settings", requiresAuth: true, roles: ["Admin"] },
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

### Stage 1 — AuthService Extraction

- [x] Create `client/auth/auth-service.ts` with `AuthService` class
  - [x] Move cookie helpers (`setAuthCookie`, `getAuthCookie`) from `UIManager`
  - [x] Move `checkAuth`, `validateToken`, `validateSession` logic from `UIManager`
  - [x] Move `handleLogout` auth-clearing logic from `UIManager`
  - [x] Expose `getUser()`, `hasRole(role)`, `isAuthenticated()` accessors
  - [x] Emit a `auth-state-changed` custom event when user logs in/out
- [x] Create `client/auth/index.ts` barrel export
- [x] Unit tests for `AuthService` (Vitest, happy-dom)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 2 — Router Foundation

- [x] Create `client/router/types.ts` with `Route`, `AppRoutes`, `PageComponent`, `RouteMeta` types
- [x] Create `client/router/router.ts` implementing `Router` class
  - [x] Path matching with `:param` and `*` wildcard support
  - [x] History API integration (`pushState` / `popstate`)
  - [x] Auth gate: check `meta.requiresAuth` and `meta.roles` via `AuthService` before rendering
  - [x] Redirect to `/login` when unauthenticated
  - [x] Loader execution with error/pending component support
  - [x] Outlet management: unmount old component (`onRouteLeave`), mount new component (`onRouteEnter`)
  - [x] Pass `URLSearchParams` from the current URL to `onRouteEnter` for query param consumption
- [x] Create `client/router/routes.ts` with initial route definitions (empty placeholder components)
- [x] Create `client/router/index.ts` barrel export
- [x] Unit tests for `Router` path matching, auth gating, and query param passing (Vitest, happy-dom)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 3 — Login Page Component

- [x] Create `client/pages/login-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Move login form HTML and event handling from `UIManager.handleLogin`
  - [x] Use `AuthService.requestMagicLink()` and `AuthService.validateToken()` internally
  - [x] Fire `login-success` custom event (bubbles, composed) with user data on successful auth
- [x] Create `client/pages/login-page/css.ts`
- [x] Create `client/pages/login-page/test.html` and `test.ts`
- [ ] Unit tests for login page rendering and event dispatch
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 4 — Submit Time Off Page Component

- [x] Create `client/pages/submit-time-off-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Move PTO entry form orchestration from `UIManager` (`handlePtoRequestSubmit`, `handlePtoDataRequest`, `handleFormSelectionChanged`, `clearFormBalanceDeltas`, `updateFormSummaryCard`)
  - [x] Implement `onRouteEnter` to receive loader data (PTO status + entries) and populate sub-components
  - [x] Read query params `?month=N&year=YYYY` in `onRouteEnter` and call `ptoForm.navigateToMonth()` if present
  - [x] Contains `<pto-entry-form>`, `<month-summary>`, submit/cancel buttons in its template
- [x] Create `client/pages/submit-time-off-page/css.ts`
- [x] Create `client/pages/submit-time-off-page/test.html` and `test.ts`
- [ ] Unit tests for page data flow, event handling, and query param navigation
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 5 — Current Year Summary Page Component

- [x] Create `client/pages/current-year-summary-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Move PTO status card orchestration from `UIManager.loadPTOStatus` and `renderPTOStatus`
  - [x] Implement `onRouteEnter` to receive loader data and populate summary/detail cards
  - [x] Contains `<pto-summary-card>`, `<pto-employee-info-card>`, `<pto-pto-card>`, `<pto-sick-card>`, `<pto-bereavement-card>`, `<pto-jury-duty-card>` in its template
  - [x] Handle `navigate-to-month` events by calling `router.navigate("/submit-time-off?month=N&year=YYYY")`
- [x] Create `client/pages/current-year-summary-page/css.ts`
- [x] Create `client/pages/current-year-summary-page/test.html` and `test.ts`
- [ ] Unit tests for data injection and card event handling
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 6 — Prior Year Summary Page Component

- [x] Create `client/pages/prior-year-summary-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Move `UIManager.loadPriorYearReview` logic into `onRouteEnter`
  - [x] Contains `<prior-year-review>` in its template
- [x] Create `client/pages/prior-year-summary-page/css.ts`
- [x] Create `client/pages/prior-year-summary-page/test.html` and `test.ts`
- [ ] Unit tests
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 7 — Remove `report-generator`

- [x] Delete `client/components/report-generator/` directory
- [x] Remove `ReportGenerator` export from `client/components/index.ts`
- [x] Remove all `report-generator` references from other files
- [x] `pnpm run build` passes (no dead imports)
- [x] `pnpm run lint` passes

### Stage 8 — Migrate Admin Child Components to Web-Components-Assistant Standard

Before wrapping these components in page wrappers, migrate them to conform to the [web-components-assistant](../.github/skills/web-components-assistant/SKILL.md) standard. See the conformance audit below for each component's gaps.

#### 8a — `pto-request-queue` (full BaseComponent migration)

- [x] Rewrite to extend `BaseComponent` instead of `HTMLElement`
  - [x] Remove manual `attachShadow()` constructor call
  - [x] Replace imperative `this.shadow.innerHTML = ...` with declarative `protected render(): string`
  - [x] Replace manual `setupEventListeners()` with `handleDelegatedClick()` event delegation
  - [x] Replace direct `this.render()` calls with `this.requestUpdate()`
  - [x] Memory management: remove manual event listener cleanup (BaseComponent handles it)
- [x] Extract styles to `css.ts` file
- [x] Fix attribute handling: `requests` (array) must use private field + `requestUpdate()`, not JSON attribute serialization
- [ ] Unit tests updated
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 8b — `employee-list` (partial migration)

- [x] Extract inline `STYLES` const to separate `css.ts` file
- [x] Fix attribute handling: `employees` (array) must use private field + `requestUpdate()`, not JSON attribute serialization
- [ ] Refactor embedded child components (`<employee-form>`, `<pto-balance-summary>`) to use named `<slot>` elements per "Named Slots Over Component Embedding" rule
- [x] Remove `_customEventsSetup` guard flag — use BaseComponent lifecycle for one-time setup (renamed to `_inputListenerSetup`)
- [ ] Unit tests updated
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 8c — `employee-form` (partial migration)

- [x] Extract `renderStyles()` inline styles to separate `css.ts` file
- [x] Fix attribute handling: `employee` (object) must use private field + `requestUpdate()`, not JSON attribute serialization
- [ ] Replace imperative DOM mutations in `handleDelegatedClick` (direct `submitBtn.disabled`, `submitStatus.textContent` writes) with view-model state + `requestUpdate()` (intentionally deferred — re-render would lose form input values)
- [ ] Replace imperative CSS class mutations in `validateField` with view-model-driven rendering
- [ ] Unit tests updated
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 8d — `admin-monthly-review` (partial migration)

- [x] Extract inline styles to separate `css.ts` file
- [x] Fix attribute handling: `employee-data` and `acknowledgment-data` (arrays) must use private fields + `requestUpdate()`, not JSON attribute serialization
- [x] Add proper getter/setter for `selected-month` (string primitive) with attribute backing
- [x] Replace `this.update()` calls with `this.requestUpdate()` to use proper batching
- [x] Fix Date violation: replace `new Date().toISOString()` with `shared/dateUtils.ts` utilities
- [ ] Replace imperative `updateBalanceSummaries()` post-render DOM manipulation with declarative rendering
- [ ] Refactor embedded `<pto-balance-summary>` to use named `<slot>` element
- [ ] Unit tests updated
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 9 — Admin Page Decomposition (replaces monolithic `admin-panel`)

Each former `admin-panel` sidebar view becomes its own routed page. The `admin-panel` component and its folder are removed after this stage.

#### 9a — Admin Employees Page

- [x] Create `client/pages/admin-employees-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Contains `<employee-list>` in its template
  - [x] Move employee CRUD orchestration, `showEmployeeForm`, `handleEmployeeSubmit` from `admin-panel` (currently stubbed with "coming soon" notifications)
  - [x] Move add/edit/delete event handling from `UIManager.handleAddEmployee`, `handleEditEmployee`, `handleDeleteEmployee`
- [x] Create `client/pages/admin-employees-page/css.ts`
- [x] Create `client/pages/admin-employees-page/test.html` and `test.ts`
- [ ] Unit tests
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 9b — Admin PTO Requests Page

- [x] Create `client/pages/admin-pto-requests-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Contains `<pto-request-queue>` in its template
  - [x] Move PTO request approve/reject event wiring from `admin-panel`
- [x] Create `client/pages/admin-pto-requests-page/css.ts`
- [x] Create `client/pages/admin-pto-requests-page/test.html` and `test.ts`
- [ ] Unit tests
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 9c — Admin Monthly Review Page

- [x] Create `client/pages/admin-monthly-review-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Contains `<admin-monthly-review>` in its template
  - [x] Move admin acknowledgment dialog logic (`handleAdminAcknowledgeReview`, `submitAdminAcknowledgment`) from `UIManager`
- [x] Create `client/pages/admin-monthly-review-page/css.ts`
- [x] Create `client/pages/admin-monthly-review-page/test.html` and `test.ts`
- [ ] Unit tests
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 9d — Admin Settings Page

- [x] Create `client/pages/admin-settings-page/index.ts` extending `BaseComponent` and implementing `PageComponent`
  - [x] Placeholder settings UI (holidays, sick day limits, accrual rate rules)
- [x] Create `client/pages/admin-settings-page/css.ts`
- [x] Create `client/pages/admin-settings-page/test.html` and `test.ts`
- [ ] Unit tests
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

#### 9e — Remove `admin-panel`

- [x] Delete `client/components/admin-panel/` directory
- [x] Remove `AdminPanel` export from `client/components/index.ts`
- [x] Remove all `AdminPanel` references from `UIManager`
- [x] Remove `<admin-panel>` from `index.html`
- [x] `pnpm run build` passes (no dead imports)
- [x] `pnpm run lint` passes

### Stage 10 — UIManager Slimdown & Router Integration

- [x] Refactor `UIManager` to:
  - [x] Instantiate `AuthService` and `Router` with `appRoutes` and the `<main id="router-outlet">` outlet
  - [x] Delegate all auth to `AuthService`
  - [x] Listen for `login-success` event from `login-page` to update `AuthService` state and navigate to `/submit-time-off`
  - [x] Listen for `auth-state-changed` to show/hide `dashboard-navigation-menu`
  - [x] Remove **all** direct component references (`PtoEntryForm`, card components, etc.)
  - [x] Remove `hideAllSections`, `showLogin`, `showDashboard`, `handlePageChange`, and all page-specific load/render methods
  - [x] Remove `buildUsageEntries`, `computeAccrualFields`, `renderPTOStatus` (moved to page components)
  - [x] Delegate page rendering entirely to `Router`
- [x] Update `dashboard-navigation-menu` to emit route paths (`/submit-time-off`, `/current-year-summary`, etc.) instead of page IDs
  - [x] Add `user-role` observed attribute and `userRole` getter/setter to `DashboardNavigationMenu`
  - [x] Conditionally render admin menu items (`admin/employees`, `admin/pto-requests`, `admin/monthly-review`, `admin/settings`) when `userRole === "Admin"`
  - [x] Expand `Page` type union to include admin page IDs
  - [x] `UIManager.showNav()` sets `menu.userRole` from `AuthService.getUser().role` on login, clears on logout
  - [x] `UIManager.navigateFromPage()` route map includes admin paths
  - [x] `UIManager.updateNavMenu()` page map includes admin paths
  - [x] `Router.renderComponent()` injects `authService` into page components that expose the property (e.g. `LoginPage`)
- [x] Update `index.html` to use a single `<main id="router-outlet">` instead of multiple page divs
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 11 — Server SPA Fallback

- [x] Add catch-all route in `server.mts` to serve `index.html` for all non-API, non-static paths
  - [x] Ensures direct URL access to `/submit-time-off`, `/admin/employees`, etc. works
  - [x] Updated `"*"` to `"{*path}"` for Express 5 / `path-to-regexp` v8 compatibility
  - [ ] Only needed in production mode (dev server already serves static files)
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes

### Stage 12 — E2E & Regression Testing

- [x] Verify all existing Playwright E2E tests pass with the routed architecture
- [ ] Add E2E test for route-based navigation (browser back/forward, direct URL access)
- [ ] Add E2E test for auth gate (unauthenticated users redirected to `/login`)
- [ ] Add E2E test for role-based access (non-admin accessing `/admin/*`)
- [ ] Add E2E test for `navigate-to-month` cross-page flow (card click → `/submit-time-off?month=N&year=YYYY`)
- [ ] Manual testing of all navigation flows
- [x] `pnpm run build` passes
- [x] `pnpm run lint` passes
- [ ] Documentation updated (README, copilot-instructions)

## Implementation Notes

- **No new dependencies** — the router is implemented in vanilla TypeScript using the History API. No hash-based routing.
- **Static imports only** — all page component files are statically imported per project conventions (no lazy `import()`). The app is lightweight and all pages load into memory at startup.
- **BaseComponent** — all page components extend `BaseComponent` for consistent lifecycle, memory management, and rendering.
- **No hybrid mode** — `index.html` switches to a single `<main id="router-outlet">` immediately. The app is offline during migration so no backward-compatibility shim is needed.
- **AuthService** — extracted from `UIManager` as a standalone class. The `Router` receives `AuthService` in its constructor and checks `meta.requiresAuth` / `meta.roles` before rendering. Unauthenticated users are redirected to `/login`.
- **Component conformance** — before wrapping admin child components in page components, they are migrated to the web-components-assistant standard. `pto-request-queue` needs a full `BaseComponent` migration. `employee-list`, `employee-form`, and `admin-monthly-review` need partial fixes (css.ts extraction, attribute/field handling, removing imperative DOM mutations).
- **Admin decomposition** — the monolithic `admin-panel` component is replaced by 4 individual page components, each wrapping the relevant child component (`employee-list`, `pto-request-queue`, `admin-monthly-review`). `report-generator` is deleted entirely. The child components are retained; only the container/orchestrator is removed.
- **Data loading** — route `loader` functions replace the scattered `loadPTOStatus`, `loadPriorYearReview`, etc. calls. Loader results are passed to `onRouteEnter`, giving each page its data without the page knowing about `APIClient` directly (loaders use `APIClient`, pages receive data).
- **Cross-page navigation** — `navigate-to-month` events on PTO cards navigate via `router.navigate("/submit-time-off?month=3&year=2026")`. The Submit Time Off page reads `URLSearchParams` in `onRouteEnter` and calls `ptoForm.navigateToMonth()`.
- **Dashboard navigation menu** — the menu component emits route paths (e.g., `/submit-time-off`) via a `navigate` custom event. For admin users, the menu includes admin sub-routes. The `currentPage` attribute is updated by the router after each navigation.
- **Server SPA fallback** — `server.mts` needs a catch-all that returns `index.html` for non-API paths so that direct URL access (e.g., refreshing on `/admin/employees`) works. The dev server (`http-serve`) may already handle this; production (Express) needs the explicit route.
- **Date handling** — follows project convention: all date operations use `shared/dateUtils.ts`, no `new Date()` outside that module.
- **Business rules** — all validation/calculation logic stays in `shared/businessRules.ts`, consumed by loaders or page components.

## Questions and Concerns

1. ~~Should we extract auth logic from `UIManager` into a dedicated `AuthService` class?~~ **Yes** — added as Stage 1.
2. ~~Admin page structure?~~ **Decompose** into 5 separate routes; remove `admin-panel` component.
3. ~~Hash-based routing?~~ **No** — History API only. Focus is DX.
4. ~~`navigate-to-month` mechanism?~~ **Query params** — `/submit-time-off?month=3&year=2026`.
5. ~~Hybrid migration?~~ **No** — switch immediately to `#router-outlet`. App is offline during migration.
6. ~~Child component refactoring?~~ **Yes** — migrate to web-components-assistant standard before wrapping in pages. `report-generator` is deleted (app doesn't need it). `pto-request-queue` needs a full `BaseComponent` migration. `employee-list`, `employee-form`, and `admin-monthly-review` need partial fixes (css.ts extraction, attribute/field handling, removing imperative DOM mutations). Added as Stage 8.
