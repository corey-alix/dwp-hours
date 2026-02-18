# GitHub Copilot Custom Instructions - DWP Hours Tracker

> **⚠️ CRITICAL: Do NOT attempt to start the development server within this environment.** The `pnpm run dev` script is now blocked and will exit with an error if run in VS Code. Use `pnpm run dev:external` in a separate terminal outside of this environment to avoid conflicts with test execution. See "Server Management" section below for details.

## Project Context

You are assisting with the DWP Hours Tracker, a Node.js/TypeScript application for managing employee PTO and hours tracking. The project uses:

- **Backend**: Node.js, Express.js, SQLite (sql.js for WSL compatibility)
- **Frontend**: Vanilla TypeScript, HTML, CSS (no frameworks)
- **Build**: TypeScript compilation, pnpm scripts
- **Testing**: Vitest (unit), Playwright (E2E)
- **Development**: http-serve for dev server
- **Browser Support**: Chrome only (primary target browser)

## Development Workflow

### Terminal and Console Output

**⚠️ CRITICAL: Tmux Interference with Console Output**

If using tmux (terminal multiplexer), be aware that it can prevent the AI assistant from seeing console output. This creates a "blind debugging" scenario where:

- Commands execute successfully (you can see them in tmux)
- AI assistant cannot see output or errors
- Debugging and troubleshooting become impossible
- Workflow operations proceed without proper feedback

**Solutions**:

- Exit tmux when working with AI-assisted workflows: `tmux detach` or `Ctrl-B D`
- Use direct terminal access for workflow operations
- If tmux is required, configure it to allow output passthrough
- Always verify console output visibility before complex operations

**Symptoms of tmux interference**:

- Commands appear to run but no output is visible to the AI
- "Alternate buffer" behavior in terminal
- Debugging requires manual output sharing

### Server Management

**Important**: Avoid starting the development server within this environment. The current workflow of starting a blocking dev server and then running tests creates conflicts where tests may kill or interfere with the server process.

**Recommended Approach**:

- Run `pnpm run dev:external` (or `pnpm run start`) in a separate terminal outside of this environment
- When server issues occur, restart the external server manually
- For E2E testing, ensure the server is running on port 3000 before executing tests
- Use `pnpm run dev:kill` if you need to kill a server process, but prefer manual server management

This approach prevents the disruptive pattern where server startup and test execution interfere with each other.

## Task Management System

The project uses a structured task system in the `TASKS/` folder. Always reference and follow these guidelines:

### Task Priority Order

1. 🔥 **High Priority**: database-schema.md, authentication.md, pto-calculations.md, api-endpoints.md
2. 🟡 **Medium Priority**: admin-panel.md, testing-suite.md
3. 🟢 **Low Priority**: data-migration.md, security-production.md

### Implementation Guidelines

- **Completion Criteria**: All checklist items ✓, builds without errors, linting passes, manual testing, documentation updated
- **Code Quality**: TypeScript strict mode, proper error handling, input validation, security best practices
- **Testing**: Manual testing, API testing, frontend integration, error cases

## Agent Skills

This project uses specialized agent skills located in `.github/skills/` directories. Each skill provides focused assistance for specific development activities:

- **task-implementation-assistant**: Guides task implementation from the TASKS folder
- **code-review-qa**: Reviews code against project quality standards
- **architecture-guidance**: Provides design and architecture recommendations
- **testing-strategy**: Advises on testing approaches and coverage
- **dependency-management**: Manages task priorities and dependencies

## Development Best Practices and Learnings

For comprehensive development guidance, patterns, and lessons learned from recent implementations, refer to the [README.md Development Best Practices and Learnings section](../README.md#development-best-practices-and-learnings). This includes code quality practices, testing strategies, architecture insights, performance considerations, and documentation guidelines derived from actual project implementations.

## Code Patterns and Conventions

### Backend Patterns

```typescript
// API endpoint structure
app.get("/api/resource/:id", (req, res) => {
  try {
    // Input validation
    const { id } = req.params;

    // Database operation
    const result = db.exec("SELECT * FROM table WHERE id = ?", [id]);

    // Response
    res.json({ data: result });
  } catch (error) {
    log(`Error in endpoint: ${error}`);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

### Frontend Patterns

```typescript
// API client usage
const api = new APIClient();

async function loadData(): Promise<void> {
  try {
    const data = await api.get("/api/endpoint");
    // Handle success
  } catch (error) {
    // Handle error
  }
}

// DOM element queries - use strongly typed elements
const ptoForm = querySingle<PtoEntryForm>("pto-entry-form"); // Specific type, no casting
const input = querySingle<HTMLInputElement>("#input-id", ptoForm.shadowRoot); // Scoped queries
```

### DOM Element Handling

- Always use strongly typed DOM elements - avoid `as any` or type casting
- Use `querySingle` from `test-utils.ts` instead of `getElementById` for error-throwing behavior
- Web components have specific class types (e.g., `PtoEntryForm` for `<pto-entry-form>`) - leverage them for type safety

### Error Handling

- Always use try/catch blocks
- Log errors with the `log()` function
- Return appropriate HTTP status codes
- Provide meaningful error messages

### Database Operations

- Use prepared statements with `stmt.bind()` and `stmt.run()`
- Get last insert ID with `db.exec('SELECT last_insert_rowid()')`
- Always call `saveDatabase()` after writes
- Handle SQL constraints gracefully

### Script Generation

- Generate scripts in TypeScript with ESM modules (.mts extension), not plain JavaScript or CommonJS modules.
- Use import/export syntax for ESM.

### Business Rules

- **Never implement business logic directly in client files** - all validation rules, calculations, and business constraints must be imported from `shared/businessRules.ts`
- Client-side validation should leverage the shared business rules module for consistency with server-side validation
- Extend `shared/businessRules.ts` as needed rather than duplicating logic in components

### Date Handling

- **Date operations must use string-based YYYY-MM-DD format exclusively** - avoid Date objects and timezone issues
- **Never use `new Date()`, `Date.UTC`, or any Date methods outside `shared/dateUtils.ts`** - all date operations must go through the dateUtils library
- All date manipulation must go through `shared/dateUtils.ts` - do not use Date.UTC, new Date(), or Date methods outside this library
- Extend `shared/dateUtils.ts` with new utility functions as needed rather than using native Date APIs
- Use string comparisons and manipulations for date logic to ensure consistency and avoid timezone problems

### CSS Formatting Rules

- **Empty lines**: Include an empty line before each CSS rule for better readability
- **Color functions**: Use modern `rgb()` notation with alpha percentages instead of `rgba()` (e.g., `rgb(0 0 0 / 10%)` instead of `rgba(0, 0, 0, 0.1)`)
- **Alpha values**: Express alpha values as percentages (e.g., `10%` instead of `0.1`)
- **Atomic CSS**: Follow atomic design principles with single-purpose utility classes
- **Custom properties**: Use CSS custom properties from `tokens.css` for colors, spacing, and other design tokens
- **Linting**: Run `pnpm lint:css` to check for stylelint violations and use `--fix` to auto-correct fixable issues

## CSS Animation Policy

This policy outlines mandatory and recommended practices for implementing CSS animations in the DWP Hours Tracker project, adapted from general best practices to align with our web components architecture, design token system, and testing framework.

### Purpose

Ensure animations are performant, accessible, maintainable, and enhance user experience without technical debt.

### Scope

Applies to all CSS animations in web components, including transitions, keyframes, and GPU-accelerated effects.

### Core Principles

- **Performance First**: Maintain 60 FPS on mid-range devices
- **Accessibility**: Respect `prefers-reduced-motion`, WCAG guidelines
- **Maintainability**: Modular code using `css.ts` files and design tokens
- **Efficiency**: Hardware acceleration, no reflows

### Best Practices

#### 1. Property Selection

- **Must**: Animate only `transform`, `opacity`, `filter` properties
- **Should**: Use `transform: translate3d(0,0,0)` for GPU compositing
- **Integration**: Define in component's `css.ts` file using design tokens from `tokens.css`

#### 2. Duration and Timing

- **Must**: 100-400ms durations for UI interactions
- **Should**: Use easing functions; define easings in `tokens.css` as custom properties
- **Must Not**: Exceed 1s without user control

#### 3. Keyframes and Complexity

- **Must**: Define `@keyframes` in `css.ts` files as template strings
- **Should**: Limit to essential steps; use semantic naming
- **Example**:
  ```typescript
  export const styles = `
    @keyframes slideIn {
      from { transform: translateX(-100%); }
      to { transform: translateX(0); }
    }
    .calendar { animation: slideIn 0.3s ease-out; }
  `;
  ```

#### 4. Performance Optimization

- **Must**: Use `will-change` strategically, remove after animation
- **Should**: Test with Chrome DevTools Performance panel
- **Must**: Use `requestAnimationFrame` for JS animations
- **Avoid**: Overlapping animations on same element

#### 5. Accessibility

- **Must**: Honor `@media (prefers-reduced-motion: reduce)` with static fallbacks
- **Should**: Avoid vestibular issues (no rapid/large movements)
- **Must**: ARIA for dynamic content changes

#### 6. Maintainability and Code Structure

- **Must**: Use CSS custom properties from `tokens.css` for durations/easings (extend `tokens.css` as needed)
- **Should**: Utility classes in `css.ts` for reuse
- **Must**: Document purpose, performance impact, accessibility in comments
- **Avoid**: Inline styles or hardcoded values

#### 7. Testing and Monitoring

- **Must**: Unit tests with Vitest (happy-dom) for animation triggers and states
- **Should**: Playwright E2E for visual regression of animations
- **Must Not**: Deploy without cross-browser testing (Chrome primary)
- **Monitoring**: Lighthouse for production performance

#### 8. Fallbacks and Graceful Degradation

- **Must**: Non-animated fallbacks for no-CSS/legacy browsers
- **Should**: Progressive enhancement

### Enforcement

- Reference this policy in PRs with animations
- Code reviews flag violations
- Annual audits

### References

- MDN CSS Animations
- WCAG 2.1 Animation guidelines
- Google Web Fundamentals High-Performance Animations

Last Updated: February 18, 2026

Before marking any implementation complete:

- ✅ `pnpm run build` passes
- ✅ `pnpm run lint` passes
- ✅ Manual testing of functionality
- ✅ Error cases handled
- ✅ Input validation implemented
- ✅ Documentation updated
- ✅ Related task checklists updated

## Common Pitfalls to Avoid

1. **Don't** implement features before completing foundation tasks
2. **Don't** skip input validation or error handling
3. **Don't** use frameworks not approved in the tech stack
4. **Don't** forget to update task checklists when completing items
5. **Don't** implement authentication before database schema is complete

## Documentation Conventions

- Number items under any "Questions and Concerns" section in TASKS documents.</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/copilot-instructions.md
