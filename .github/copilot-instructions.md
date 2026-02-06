# GitHub Copilot Custom Instructions - DWP Hours Tracker

> **⚠️ CRITICAL: Do NOT attempt to start the development server within this environment.** The `npm run dev` script is now blocked and will exit with an error if run in VS Code. Use `npm run dev:external` in a separate terminal outside of this environment to avoid conflicts with test execution. See "Server Management" section below for details.

## Project Context
You are assisting with the DWP Hours Tracker, a Node.js/TypeScript application for managing employee PTO and hours tracking. The project uses:
- **Backend**: Node.js, Express.js, SQLite (sql.js for WSL compatibility)
- **Frontend**: Vanilla TypeScript, HTML, CSS (no frameworks)
- **Build**: TypeScript compilation, npm scripts
- **Testing**: Vitest (unit), Playwright (E2E)
- **Development**: http-serve for dev server

## Development Workflow

### Server Management
**Important**: Avoid starting the development server within this environment. The current workflow of starting a blocking dev server and then running tests creates conflicts where tests may kill or interfere with the server process.

**Recommended Approach**:
- Run `npm run dev:external` (or `npm run start`) in a separate terminal outside of this environment
- When server issues occur, restart the external server manually
- For E2E testing, ensure the server is running on port 3000 before executing tests
- Use `npm run dev:kill` if you need to kill a server process, but prefer manual server management

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

## Code Patterns and Conventions

### Backend Patterns
```typescript
// API endpoint structure
app.get('/api/resource/:id', (req, res) => {
  try {
    // Input validation
    const { id } = req.params;

    // Database operation
    const result = db.exec('SELECT * FROM table WHERE id = ?', [id]);

    // Response
    res.json({ data: result });
  } catch (error) {
    log(`Error in endpoint: ${error}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Frontend Patterns
```typescript
// API client usage
const api = new APIClient();

async function loadData(): Promise<void> {
  try {
    const data = await api.get('/api/endpoint');
    // Handle success
  } catch (error) {
    // Handle error
  }
}

// DOM element queries - use strongly typed elements
const ptoForm = querySingle<PtoEntryForm>('pto-entry-form');  // Specific type, no casting
const input = querySingle<HTMLInputElement>('#input-id', ptoForm.shadowRoot);  // Scoped queries
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

## Quality Gates

Before marking any implementation complete:
- ✅ `npm run build` passes
- ✅ `npm run lint` passes
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
5. **Don't** implement authentication before database schema is complete</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/copilot-instructions.md