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

## Questions and Concerns

1.
2.
3.
