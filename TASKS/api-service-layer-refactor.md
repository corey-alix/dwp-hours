# API Service Layer Refactor

## Description

Refactor the application architecture to eliminate tight coupling between UI components and the APIClient. Introduce a service layer with dependency injection to improve separation of concerns, testability, and maintainability. Components will no longer directly instantiate APIClient; instead, they'll receive service dependencies that abstract API interactions.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Architecture Design and Planning

- [x] Analyze current APIClient usage across components (AdminEmployeesPage, etc.)
- [x] Design service layer interfaces (IEmployeeService, IPtoService, etc.)
- [x] Define dependency injection container pattern for the application
- [x] Create service factory/registry for managing service instances
- [x] Document service boundaries and responsibilities
- [ ] Update architecture-guidance skill to include service layer patterns
- [ ] Manual review of design with team

**Discovery Findings:**

- **Direct APIClient instantiations found in:**
  - `client/UIManager.ts` (line 30)
  - `client/pages/submit-time-off-page/index.ts` (line 33)
  - `client/pages/admin-employees-page/index.ts` (line 21)
  - `client/pages/admin-settings-page/index.ts` (line 7)
  - `client/pages/admin-pto-requests-page/index.ts` (line 35)
  - `client/pages/admin-monthly-review-page/index.ts` (line 19)
  - `client/router/routes.ts` (line 4)
  - `client/auth/auth-service.ts` (line 20)
- **Test files also instantiate APIClient:**
  - `tests/api-client.test.ts` (line 16)
- **Total: 9 direct instantiations** excluding tests, spanning pages, auth service, router, and UIManager
- **All 9 production instantiations eliminated** — only `client/services/service-container.ts` creates APIClient

### Phase 2: Core Service Infrastructure

- [x] Create base service interfaces in `client/services/interfaces.ts`
- [x] Create ServiceContainer with lazy singleton in `client/services/service-container.ts`
- [x] Add service registration via existing Context Protocol (`CONTEXT_KEYS.SERVICES`)
- [x] Implement error handling and logging in service layer
- [x] Write unit tests for DI container functionality (`tests/services/service-container.test.ts`)
- [x] Build passes, lint passes

### Phase 3: Domain Service Implementations

- [x] Implement EmployeeService with APIClient integration
- [x] Implement PtoService for PTO-related operations
- [x] Implement AuthApiService for authentication operations
- [x] Implement AdminService for admin-specific functionality
- [x] Implement AcknowledgementService, HoursService, NotificationService, ImportService, HealthService
- [x] Add proper TypeScript interfaces for all service methods
- [x] Implement service method error handling and validation
- [x] Build passes, lint passes

### Phase 4: Component Refactoring

- [x] Refactor AdminEmployeesPage to use injected EmployeeService
- [x] Refactor SubmitTimeOffPage to use PtoService + AcknowledgementService
- [x] Update AuthService to use IAuthApiService interface
- [x] Update NotificationService to use INotificationService interface
- [x] Refactor AdminPtoRequestsPage to use AdminService + EmployeeService
- [x] Refactor AdminMonthlyReviewPage to use AdminService + EmployeeService + NotificationService
- [x] Refactor AdminSettingsPage to use ImportService
- [x] Refactor UploadTimesheetPage to use AuthApiService
- [x] Refactor TimesheetUploadForm to use ImportService (eliminated raw fetch bypass)
- [x] Update router/routes.ts to use ServiceContainer
- [x] Update UIManager to use ServiceContainer
- [x] Modify app.ts to provide ServiceContainer via Context Protocol
- [x] Remove all direct APIClient instantiations from components
- [ ] Manual testing of refactored components

### Phase 5: Testing and Validation

- [x] Update existing unit tests to use service mocks instead of APIClient
- [x] Add unit tests for ServiceContainer (`tests/services/service-container.test.ts`)
- [ ] Update E2E tests to work with new architecture
- [x] Verify no direct APIClient usage in components (only in service-container.ts)
- [ ] Performance testing to ensure no regression
- [ ] Code review and security audit
- [ ] Documentation updates in README and architecture guides
- [x] Build passes, lint passes, all tests pass (1310 tests, 71 files)

## Implementation Notes

- **Service Pattern**: Interface-based services that wrap APIClient functionality, defined in `client/services/interfaces.ts`
- **Dependency Injection**: Dual approach — module-level singleton via `getServices()` for non-component code (routes, module-scope), plus Context Protocol (`CONTEXT_KEYS.SERVICES`) for web components
- **ServiceContainer**: Single class in `client/services/service-container.ts` that holds one shared APIClient and creates all 9 domain services
- **Mocking**: Services are easily mockable — tests inject mock objects via `(page as any).services = { ... }`, or use `setServices()` to replace the singleton
- **Error Handling**: Service methods delegate to APIClient, preserving existing error patterns (responseData on errors, typed responses)
- **Backwards Compatibility**: APIClient class unchanged — existing API contracts fully preserved
- **Migration**: All 10 production `new APIClient()` calls replaced in one pass; 2 test integration files updated to mock services instead of APIClient
- **Type Safety**: Full TypeScript coverage — 9 service interfaces with typed method signatures from `api-models.d.ts`
- **Code Smell Fixed**: `timesheet-upload-form` raw `fetch()` bypass (accessing private `api["baseURL"]`) replaced with proper `IImportService.importEmployeeBulk()` method

## Questions and Concerns (Resolved)

1. **How should the DI container be initialized?** — Lazy singleton via `getServices()`, also provided through Context Protocol in `app.ts` at boot time
2. **Should services be singletons or per-component?** — Singleton (one ServiceContainer backing one shared APIClient instance, since APIClient is stateless)
3. **How to handle auth context?** — AuthService accepts `IAuthApiService` interface; UIManager passes `services.auth` to AuthService constructor
4. **Migration strategy?** — All-at-once within a single branch; no incremental migration needed since APIClient is stateless and all callers are internal
5. **Performance impact?** — Negligible; one extra function call layer; no additional network overhead</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/api-service-layer-refactor.md
