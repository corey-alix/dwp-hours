# Debug Console Component

## Description

Create a comprehensive logging and notification system for the DWP Hours Tracker. This system will include:

1. A `<debug-console>` web component — pure display component, docked bottom-right in a `<details>` container
2. A `<pto-notification>` web component for user-facing toast notifications
3. A `TraceListener` class that replaces `NotificationManager` and fans out messages to registered controllers
4. A `PtoNotificationController` and a `DebugConsoleController` that bridge the TraceListener to the components
5. Debug-mode hooks (console interception, unhandled exception reporting) gated on `?debug=1` query string

## Priority

🟢 Low Priority

## Checklist

- [x] **Stage 1: Component Structure** - Create the basic web component class and HTML structure
  - Define the custom element class extending HTMLElement
  - Create shadow DOM with `<details>` container and initial styling
  - Add basic CSS for bottom-right fixed positioning
  - Validation: Component renders without errors, positioned correctly
- [x] **Stage 2: Console Event Listening** - Implement console event interception
  - Override `console.log` to capture messages and store in component state
  - Ensure original console functionality is preserved (pass-through)
  - Handle multiple console methods (log, warn, error)
  - Validation: Console messages appear in component, still output to console
- [x] **Stage 3: DOM Rendering** - Add messages to the `<details>` element
  - Update DOM when new messages arrive, with newest messages at the top
  - Format messages with timestamps and levels
  - Implement scrolling container and overflow handling
  - Add "Clear" button in the header area to reset the log
  - Validation: Messages display correctly with newest on top, scrolling works, clear button functions
- [x] **Stage 4: Styling and Positioning** - Finalize CSS for docking and theming
  - Ensure responsive design and proper z-index
  - Integrate with project's theming system
  - Add expand/collapse functionality
  - Validation: Component looks good in light/dark themes
- [x] **Stage 5: Integration and Testing** - Add to forms and comprehensive testing
  - Integrate into test.html pages, starting with `components/pto-calendar/test.html` ✅ **DONE**
  - Write unit tests for component functionality ✅ **DONE** — 18 tests in `tests/components/debug-console.test.ts`
  - ~~Add E2E tests for console output display~~ **E2E tests will not be necessary**
  - Manual testing across browsers
  - Validation: `pnpm run build` passes ✅, `pnpm run lint` passes ✅, manual testing successful

### Unit Test Plan

Tests live in `tests/components/debug-console.test.ts` (Vitest + happy-dom).

#### 1. Unhandled exceptions are reported

**File under test:** `DebugConsoleController` + `<debug-console>`

- Set `window.location.search = "?debug=1"` before constructing the controller
- Dispatch a `new ErrorEvent("error", { message: "boom", filename: "test.ts", lineno: 42 })` on `window`
- Assert `<debug-console>` shadow DOM contains text matching `Unhandled error: boom`
- Dispatch a `new PromiseRejectionEvent("unhandledrejection", { reason: new Error("rejected"), promise: ... })` on `window`
- Assert shadow DOM contains `Unhandled rejection: rejected`
- Call `controller.destroy()` in `afterEach` to restore console

#### 2. console.log / warn / error are intercepted

**File under test:** `DebugConsoleController`

- Set `?debug=1`, construct controller
- Save reference to the pre-interception `console.log`
- Call `console.log("hello")`, `console.warn("caution")`, `console.error("fail")`
- Assert each message appears in `<debug-console>` shadow DOM with correct level prefix (`LOG:`, `WARN:`, `ERROR:`)
- Assert the **original** console methods were still called (spy on the stored originals)
- Call `controller.destroy()` and verify `console.log` is restored to the original

#### 3. `<debug-console>` contains expected content

**File under test:** `DebugConsole` component directly

- Create `<debug-console>`, append to document, trigger `connectedCallback`
- Call `component.log("info", "Test message")`
- Assert shadow DOM `.log-entry` count is `1` and text includes `INFO: Test message`
- Call `component.log("error", "Bad thing")` — assert 2 entries, newest first
- Call `component.clear()` — assert 0 entries
- Verify max-message cap: log 101 messages, assert only 100 `.log-entry` elements

#### 4. `<pto-notification>` reports success / error / info / warning

**File under test:** `PtoNotification` component directly

- Create `<pto-notification>`, append to document
- Call `component.show("ok", "success")` — assert shadow DOM has `.toast.success` with text `ok`
- Call `component.show("fail", "error")` — assert `.toast.error` with text `fail`
- Call `component.show("note", "info")` — assert `.toast.info` with text `note`
- Call `component.show("heads up", "warning")` — assert `.toast.warning` with text `heads up`
- Verify dismiss removes the toast: call `component.dismiss(id)`, advance timers, assert toast is gone

#### 5. No cycles when logging throws

**File under test:** `TraceListener` + `DebugConsoleController`

- Register a handler whose `onTrace` throws an `Error`
- Register a second handler (spy) to verify it still receives the message
- Call `traceListener.error("test")` — assert first handler threw, second handler was called, no infinite loop
- Construct `DebugConsoleController` with `?debug=1` and a `<debug-console>` whose `log()` method is stubbed to throw
- Call `console.log("trigger")` — assert no unhandled exception escapes (the controller swallows the error), and the original `console.log` still fires
- Call `controller.destroy()` to restore console

## Additional Requirements

- ~~**Message-Oriented API**~~ **Scratched** — the TraceListener's existing `success()`, `error()`, `info()`, `warning()` API is sufficient. No separate message-oriented API is needed.
- [x] **TraceListener and Controller Architecture** - Replace NotificationManager with a TraceListener and register output-channel controllers
  - Remove `NotificationManager` class entirely from `app.ts`
  - Introduce `TraceListener` class with `success()`, `error()`, `info()`, `warning()` API (backward-compatible with existing `notifications.*` call sites)
  - Extract UI rendering logic from `NotificationManager` into a standalone `<pto-notification>` web component (following SKILL.md / `BaseComponent` conventions)
  - Implement a `PtoNotificationController` that detects `<pto-notification>` in the DOM and registers as a TraceListener listener
  - Implement a `DebugConsoleController` that detects (or injects) `<debug-console>` in the DOM and registers as a TraceListener listener
  - The overall pattern: `traceListener.addListener(new PtoNotificationController()); traceListener.addListener(new DebugConsoleController());`
- [x] **Debug Mode Activation (`debug=1`)** - Gate debug-specific behaviors behind query string
  - `DebugConsoleController` checks for `debug=1` on startup
  - If `debug=1` and `<debug-console>` is absent from the DOM, dynamically inject it into `document.body`
  - If `debug=1`, hook `console.log` / `console.warn` / `console.error` interception (moved out of the component into the controller)
  - If `debug=1`, register `window.onerror` and `window.onunhandledrejection` handlers that forward to TraceListener
  - If `debug != 1`, none of the above hooks are installed, even if `<debug-console>` is already present in the DOM
- [x] **`<debug-console>` Refactor to Pure Component** - Remove all side effects from the component
  - Strip console interception out of the constructor; `<debug-console>` only exposes a `log(level, message)` method (or equivalent) for the controller to call
  - Component remains dormant / invisible until it receives its first message or is explicitly activated
- [x] **`<pto-notification>` Web Component** - Full shadow DOM component per SKILL.md guidelines
  - Extend `BaseComponent`; place in `client/components/pto-notification/index.ts`
  - Declarative `render()` method; no imperative `createElement` / `appendChild` in template
  - Expose the same visual behavior currently in `NotificationManager.show()`

## Implementation Notes

- Use the web components API with shadow DOM for encapsulation; both `<debug-console>` and `<pto-notification>` extend `BaseComponent`
- Follow project's component naming conventions (e.g., `<debug-console>`, `<pto-notification>`)
- Debug-mode gating (`debug=1`) is the responsibility of `DebugConsoleController`, not the component
- Use TypeScript for type safety
- Follow existing error handling and logging patterns
- Reference `shared/businessRules.ts` if needed, though unlikely for this component
- Replace `NotificationManager` with `TraceListener`; register output-channel controllers as listeners
- `<debug-console>` and `<pto-notification>` are both pure shadow DOM web components extending `BaseComponent` — no side effects, no console overrides inside the components themselves
- Console interception, exception hooking, and `<debug-console>` injection all live in `DebugConsoleController`, not in the component
- Both controllers are only registered by the host (e.g., `app.ts`); the components themselves remain independently testable and side-effect-free
- Follow SKILL.md (web-components-assistant) for all component implementation: `BaseComponent`, declarative `render()`, attribute-backed primitives, private fields for complex values

**Potential Pitfalls:**

- **Console Override Conflicts**: Overriding `console.log` globally may interfere with browser dev tools, other debugging libraries, or production logging systems. **This will only occur when `debug=1` query string is present.**
- **Memory Leaks**: Accumulating large numbers of log messages without proper cleanup could cause memory issues; implement message limits or automatic cleanup
- **Performance Impact**: Frequent DOM updates for console messages could impact page performance; consider debouncing or batching updates
- **Security Concerns**: Console output might contain sensitive data that shouldn't be displayed in the DOM; ensure proper sanitization
- **Browser Compatibility**: Console method overrides may behave differently across browsers; test thoroughly
- **Layout Interference**: Fixed positioning in bottom-right corner could overlap with other page elements; ensure proper z-index and responsive behavior
- **Component Registration**: Ensure the custom element is registered only once to avoid redefinition errors
- **Orchestrator Complexity**: The centralized TraceListener must handle multiple output channels without creating circular dependencies
- **Exception Handler Conflicts**: Global exception handlers may conflict with browser extensions or other error reporting systems. **This will only occur when `debug=1` query string is present.**
- **Notification Overload**: User notifications should be rate-limited to avoid overwhelming the user interface

## Questions and Concerns

1. Should this component be conditionally enabled only in development mode? **No** - The component will be included in all builds for debugging purposes, but will only be injected and activated when `debug=1` query string parameter is present.
2. How to handle large volumes of console output (performance/memory)? **Newest items to the top of this component, add a "clear" button in the header area** - Implement a scrolling container with newest messages at the top, and provide a clear button to reset the log.
3. Integration points - which forms should include this component? **Only test.html pages, but for starters, just the components/pto-calendar/test.html so we can test it** - Start with integration in the PTO calendar test page for initial development and testing.
4. How should the orchestrator handle different environments (development vs production)? **The orchestrator should be configurable to enable/disable debug console output in production while maintaining notification functionality. A `debug=1` query string parameter will inject the `<debug-console>` component and enable console interception and exception handling. Since this is an SPA, setting the query string once is sufficient.**
5. Should exception handling be enabled by default? **Exception handling should be configurable and disabled by default in production to avoid interfering with external error reporting systems. It should only be enabled when `debug=1` query string is present.**
6. Should Stage 2 be re-opened since `<debug-console>` currently does the console interception itself? **No — Stage 2 will be superseded by the controller refactor. Console interception logic will be extracted into a dedicated controller, leaving `<debug-console>` as a pure display component with no side effects on `console.log`.**
7. What is the final class name — `NotificationManager` or `TraceListener`? **`NotificationManager` is gone entirely. `app.ts` will instantiate `TraceListener` directly. A controller will register a listener that forwards messages to `<pto-notification>` if it exists in the DOM, and another listener will forward to `<debug-console>` if it exists. `notifications` as a variable name in `app.ts` may remain but it will hold a `TraceListener` instance.**
8. How does `debug=1` activate `<debug-console>`? **`<debug-console>` may already be present in the DOM (e.g., test pages include it declaratively) and will remain dormant until activated. If `debug=1` and `<debug-console>` is not found in the DOM, the controller injects it dynamically. If `debug != 1`, no console.log interception and no unhandled exception hooking occurs, regardless of whether the element is present.**
9. Should `<pto-notification>` be a full shadow DOM web component? **Yes — follow the web-components-assistant SKILL.md guidelines. Both `<pto-notification>` and `<debug-console>` must be proper shadow DOM web components extending `BaseComponent`, placed in their own `client/components/` subdirectories. No imperative DOM construction in templates; use declarative `render()` methods and attribute-backed properties for primitives.**
10. ~~Is a separate Message-Oriented API needed beyond what TraceListener provides?~~ **Scratched — this was a bad requirement. The TraceListener's existing `success()`, `error()`, `info()`, `warning()` surface is sufficient.**

---

### Final Pre-Implementation Notes

11. **[STALE CHECKLIST]** Stage 2 is marked ✅ but its behavior (console interception in the constructor) will be removed by the `<debug-console>` Refactor task. Treat Stage 2 as **superseded** — do not preserve its current implementation as a baseline.
12. **[MISSING FILE LOCATIONS]** Canonical locations for new non-component files:
    - `TraceListener`: `client/controller/TraceListener.ts`
    - `PtoNotificationController`: `client/controller/PtoNotificationController.ts`
    - `DebugConsoleController`: `client/controller/DebugConsoleController.ts`
    - `<pto-notification>` component: `client/components/pto-notification/index.ts`
13. **[TIMING — controller DOM scan]** `index.html` now uses `import { App } from '/app.js'; App.run();`, providing a defined, post-DOM entry point. **Status: DONE (Stages 1–4 complete).** See [app-run-entry-point.md](app-run-entry-point.md). Controllers should be instantiated inside `App.run()` (or `UIManager.init()`), not at module load time. The TraceListener/controller stages of this task are **no longer blocked**.
14. **[TIMING — custom element upgrade]** `debug-console` is registered as a custom element via its static import in `app.ts`, which is bundled into `app.js`. Since the bundle loads before the controllers are constructed, the element will always be upgraded before `DebugConsoleController` tries to use it. No additional guards needed.
15. **[DORMANT meaning]** "Dormant" for `<debug-console>` when `debug != 1`: the element has `display:none` so it has no visual presence, and the controller makes no `log()` calls to it. No message accumulation, no layout impact.
