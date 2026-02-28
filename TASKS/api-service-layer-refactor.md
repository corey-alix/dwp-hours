# API Service Layer Refactor

## Description

Refactor the application architecture to eliminate tight coupling between UI components and the APIClient. Introduce a service layer with dependency injection to improve separation of concerns, testability, and maintainability. Components will no longer directly instantiate APIClient; instead, they'll receive service dependencies that abstract API interactions.

## Priority

🟡 Medium Priority

## Checklist

### Phase 1: Architecture Design and Planning

- [x] Analyze current APIClient usage across components (AdminEmployeesPage, etc.)
- [ ] Design service layer interfaces (IEmployeeService, IPtoService, etc.)
- [ ] Define dependency injection container pattern for the application
- [ ] Create service factory/registry for managing service instances
- [ ] Document service boundaries and responsibilities
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

### Phase 2: Core Service Infrastructure

- [ ] Create base service interfaces in `shared/services/`
- [ ] Implement abstract base service class with common functionality
- [ ] Create dependency injection container in `shared/di/`
- [ ] Add service registration and resolution mechanisms
- [ ] Implement error handling and logging in service layer
- [ ] Write unit tests for DI container functionality
- [ ] Build passes, lint passes

### Phase 3: Domain Service Implementations

- [ ] Implement EmployeeService with APIClient integration
- [ ] Implement PtoService for PTO-related operations
- [ ] Implement AuthService for authentication operations
- [ ] Implement AdminService for admin-specific functionality
- [ ] Add proper TypeScript interfaces for all service methods
- [ ] Implement service method error handling and validation
- [ ] Write unit tests for each service with mocked APIClient
- [ ] Build passes, lint passes

### Phase 4: Component Refactoring

- [ ] Refactor AdminEmployeesPage to use injected EmployeeService
- [ ] Refactor PtoEntryForm and related components to use PtoService
- [ ] Update authentication components to use AuthService
- [ ] Modify BaseComponent or app initialization to inject services
- [ ] Remove direct APIClient instantiations from components
- [ ] Update component constructors to accept service dependencies
- [ ] Manual testing of refactored components

### Phase 5: Testing and Validation

- [ ] Update existing unit tests to use service mocks instead of APIClient
- [ ] Add integration tests for service layer functionality
- [ ] Update E2E tests to work with new architecture
- [ ] Verify no direct APIClient usage in components
- [ ] Performance testing to ensure no regression
- [ ] Code review and security audit
- [ ] Documentation updates in README and architecture guides
- [ ] Build passes, lint passes, all tests pass

## Implementation Notes

- **Service Pattern**: Use interface-based services that wrap APIClient functionality
- **Dependency Injection**: Implement a simple DI container for service management
- **Mocking**: Services should be easily mockable for unit testing
- **Error Handling**: Maintain consistent error handling patterns from APIClient
- **Backwards Compatibility**: Ensure existing API contracts remain unchanged
- **Gradual Migration**: Allow components to migrate incrementally to avoid breaking changes
- **Type Safety**: Full TypeScript coverage for all service interfaces and implementations

## Questions and Concerns

1. How should the DI container be initialized in the application lifecycle?
2. Should services be singletons or instantiated per component?
3. How to handle service dependencies that require authentication context?
4. What migration strategy for existing components to minimize disruption?
5. How to ensure service layer doesn't become a bottleneck for performance?</content>
   <parameter name="filePath">/home/ca0v/code/corey-alix/dwp-hours/jupiter/TASKS/api-service-layer-refactor.md
