# App.run() Entry Point Refactor

## Description

Refactor `index.html` (and all other HTML pages that load `app.js`) to use an explicit `App.run()` entry point instead of relying on top-level side effects at module load time. This gives the application a single, discoverable, post-DOM entry point and eliminates the current pattern where `UIManager` is instantiated as a top-level side effect guarded by an `getElementById` null check.

Current pattern in `index.html`:

```html
<script type="module" src="app.js"></script>
```

Target pattern:

```html
<script type="module">
  import { App } from "/app.js";
  App.run();
</script>
```

`App.run()` is called after the browser has parsed the DOM, so all elements are present before any controller or manager scans for them.

## Priority

🟢 Low Priority

## Checklist

- [ ] **Stage 1: Define `App` class in `app.ts`**
  - Create an `App` class (or namespace) with a static `run()` method
  - Move the current `UIManager` instantiation logic (currently guarded by `document.getElementById('login-form')`) into `App.run()`
  - Export `App` from `app.ts`
  - Validation: `pnpm run build` passes, `pnpm run lint` passes

- [ ] **Stage 2: Update `index.html`**
  - Replace `<script type="module" src="app.js"></script>` with the inline `import { App } from '/app.js'; App.run();` pattern
  - Validation: Application loads and functions correctly in the browser

- [ ] **Stage 3: Update all other HTML pages**
  - Audit all HTML files under `client/` and `public/` that load `app.js`
  - Apply the same inline import pattern to each (or leave test pages using their own entry points if appropriate)
  - Validation: All test pages load correctly

- [ ] **Stage 4: Remove legacy guard**
  - Remove the `const loginForm = document.getElementById('login-form'); if (loginForm) { ... }` guard at the bottom of `app.ts` — it is no longer needed
  - Validation: `pnpm run build` passes, `pnpm run lint` passes, no duplicate instantiation

- [ ] **Stage 5: Regression testing**
  - Run `pnpm run test:unit` — all unit tests pass
  - Manual smoke test: login, dashboard, PTO submission
  - Validation: No regressions introduced

## Implementation Notes

- `App.run()` should be the **only** place `UIManager` (or its successor) is instantiated
- Controllers registered during `App.run()` have access to the fully-parsed DOM, eliminating the need for `DOMContentLoaded` guards inside constructors
- This pattern is a prerequisite for the `TraceListener` / controller architecture described in [debug-console-component.md](debug-console-component.md), where `DebugConsoleController` and `PtoNotificationController` are registered inside `App.run()`
- `test.html` pages in component subdirectories use their own inline scripts and are not affected by this change

## Recommendation: Use `seedData.ts` for Mock API Responses

The mock API in `test.ts` (`createMockApi()`) currently returns hard-coded canned responses. These should be replaced with data sourced from `shared/seedData.ts` so that:

- Mock responses stay consistent with the seed data used by the server and unit tests
- Changes to seed data (new employees, updated PTO entries) are automatically reflected in the test page
- The test workflow exercises realistic data shapes rather than arbitrary literals

**Example migration:**

```typescript
import { seedEmployees, seedPTOEntries } from "../shared/seedData.js";

function createMockApi(): TestApi {
  return {
    get: async (endpoint: string) => {
      if (endpoint.startsWith("/api/pto/status/")) {
        const employee = seedEmployees[0]; // John Doe
        const entries = seedPTOEntries.filter((e) => e.employee_id === 1);
        const usedPTO = entries
          .filter((e) => e.type === "PTO" && e.approved_by !== null)
          .reduce((sum, e) => sum + e.hours, 0);
        return {
          annualAllocation: 120,
          availablePTO: 120 - usedPTO + employee.carryover_hours,
          usedPTO,
          carryoverFromPreviousYear: employee.carryover_hours,
          monthlyAccruals: [
            { month: 1, hours: 8.0 },
            { month: 2, hours: 8.0 },
          ],
          hireDate: employee.hire_date,
          nextRolloverDate: "2027-01-01",
        };
      }
      // ... other endpoints
    },
    // ...
  };
}
```

This keeps the single source of truth in `seedData.ts` and eliminates duplicated magic values scattered across test files.

## ⚠️ Globals Are Prohibited

**`window.app`, `window.api`, and any other `(window as any).*` assignments are prohibited.** All access to shared instances must go through ES module imports, never through global variables.

Code that currently relies on `window.app` or `window.api` must be redesigned to import what it needs from `app.ts`:

```typescript
// ❌ WRONG — global side-effect
(window as any).app = new UIManager();

// ❌ WRONG — accessing a global
const app = (window as any).app;
await app.loadPTOStatus();

// ✅ CORRECT — import the entry point function
import { App } from "/app.js";
const app = App.run(); // returns the UIManager instance
```

`App.run()` returns the `UIManager` instance so callers that need the app object can capture it:

```html
<script type="module">
  import { App } from "/app.js";
  App.run();
</script>
```

```html
<!-- test page that needs the instance -->
<script type="module">
  import { App } from "/app.js";
  const app = App.run();
  // use app directly — no globals
</script>
```

### Current Global Usage (to be removed)

The following globals are currently set in `app.ts` and **must be eliminated**:

**window.api** (APIClient instance):

- Set in `app.ts`: `(window as any).api = api;`
- Used in `test.ts` for mocking and API calls in event handlers
- Used in compiled `public/app.js`

**window.app** (UIManager instance):

- Set in `app.ts`: `(window as any).app = new UIManager();`
- Used in `test.ts` for calling `handleTokenValidation()` and `loadPTOStatus()` methods
- Used in compiled `public/app.js`

### Replacement Strategy

**For production app (`App.run()`):**

- `App.run()` instantiates `APIClient` and `UIManager` locally and returns the `UIManager`
- No globals — components access instances through ES module imports or the return value of `App.run()`

**For test.ts (automated testing):**

- `TestWorkflow` must not read from `window.app` or `window.api`
- Modify `TestWorkflow` constructor to accept `api` and `app` parameters via dependency injection
- Test pages call `App.run()` and pass the returned instance to `TestWorkflow`

**Migration approach:**

1. Change `App.run()` to return `new UIManager()` and remove all `(window as any).*` assignments
2. Modify `TestWorkflow` to accept dependency-injected `api` and `app` parameters
3. Update `test.html` to capture `App.run()` return value and pass it to `TestWorkflow`
4. Remove every `(window as any)` reference from `app.ts` and `test.ts`
5. Verify no remaining global usage with a codebase search for `window as any`

### Files Requiring Updates

- `client/app.ts`: Remove all `(window as any).api` and `(window as any).app` assignments; `App.run()` returns `UIManager`
- `client/test.ts`: Update `TestWorkflow` constructor to accept `api`/`app` params; remove all `(window as any)` reads
- `client/test.html`: Capture `App.run()` return value and pass to `TestWorkflow`
- All HTML files: Update from `<script type="module" src="app.js"></script>` to inline import pattern
