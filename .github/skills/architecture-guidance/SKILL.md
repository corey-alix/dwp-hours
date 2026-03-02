---
name: architecture-guidance
description: Provides guidance on design decisions, architecture choices, and implementation approaches that align with the project's approved tech stack and patterns.
---

# Architecture and Design Guidance

## Description

Provides guidance on design decisions, architecture choices, and implementation approaches that align with the project's approved tech stack and patterns.

## Trigger

Activated when users ask about design decisions, architecture choices, or implementation approaches.

## Response Pattern

1. Reference existing codebase patterns and conventions
2. Suggest solutions that align with the approved tech stack (vanilla TS, Express, sql.js)
3. Consider WSL compatibility requirements for database choices
4. Follow established API patterns and frontend structure
5. Explain trade-offs and rationale for recommendations

## Examples

- "How should I structure this new API endpoint?"
- "What's the best way to handle this frontend state?"
- "Should I use a different database approach?"

## Additional Context

This skill ensures architectural decisions maintain consistency with the project's vanilla TypeScript approach and WSL compatibility requirements.

## High-Level Architecture Overview

### Technology Stack

- **Frontend**: Vanilla HTML, CSS, and TypeScript (no frameworks)
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite with sql.js driver for WSL compatibility
- **ORM**: TypeORM with DataMapper pattern
- **Development Server**: http-serve for local development
- **Build System**: TypeScript compilation with npm scripts
- **Testing**: Vitest (unit), Playwright (E2E)

### Database Schema

The application uses TypeORM entities for data persistence:

- `Employee`: Employee information and authentication
- `PtoEntry`: PTO time-off entries with date ranges and hours
- `Acknowledgement`: Monthly review acknowledgements
- Additional entities for admin panel functionality

#### Core Tables

**employees**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing employee ID
- `name` (TEXT): Employee full name
- `identifier` (TEXT UNIQUE): Unique employee identifier
- `pto_rate` (REAL): PTO accrual rate per hour (default 0.71)
- `carryover_hours` (REAL): Carried over PTO hours from previous year
- `hire_date` (DATE): Employee hire date
- `role` (TEXT): Employee role (default 'Employee')
- `hash` (TEXT): Password hash for authentication

**pto_entries**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing entry ID
- `employee_id` (INTEGER): Foreign key to employees table
- `date` (TEXT): Date of PTO entry (YYYY-MM-DD format)
- `type` (TEXT): PTO type ('Sick', 'PTO', 'Bereavement', 'Jury Duty')
- `hours` (REAL): Hours used
- `created_at` (DATETIME): Entry creation timestamp

**monthly_hours**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing record ID
- `employee_id` (INTEGER): Foreign key to employees table
- `month` (TEXT): Month in YYYY-MM format
- `hours_worked` (REAL): Total hours worked in the month
- `submitted_at` (DATETIME): Submission timestamp

**acknowledgements**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing acknowledgement ID
- `employee_id` (INTEGER): Foreign key to employees table
- `month` (TEXT): Month in YYYY-MM format
- `acknowledged_at` (DATETIME): Acknowledgement timestamp

**admin_acknowledgements**

- `id` (INTEGER PRIMARY KEY): Auto-incrementing admin acknowledgement ID
- `employee_id` (INTEGER): Foreign key to employees table
- `month` (TEXT): Month in YYYY-MM format
- `admin_id` (INTEGER): Foreign key to employees table (admin who acknowledged)
- `acknowledged_at` (DATETIME): Admin acknowledgement timestamp

**sessions**

- `token` (TEXT PRIMARY KEY): Session token
- `employee_id` (INTEGER): Foreign key to employees table
- `expires_at` (DATETIME): Session expiration timestamp

#### Database Constraints and Indexes

- Foreign key constraints enforce referential integrity
- Unique constraints on employee identifiers and session tokens
- Performance indexes on foreign keys and commonly queried fields
- CHECK constraints on PTO entry types

### ORM Patterns

#### TypeORM Configuration

- **Driver**: sql.js for WSL compatibility
- **Synchronization**: Disabled (`synchronize: false`) - schema managed manually via SQL files
- **Auto-save**: Enabled for automatic database persistence
- **Logging**: Disabled in production

#### Entity Design Patterns

- **Active Record Pattern**: Not used - Data Mapper pattern preferred
- **Repository Pattern**: Used through TypeORM repositories for data access
- **Entity Relationships**:
  - `@OneToMany` for parent-child relationships (Employee → PTO entries)
  - `@ManyToOne` with `@JoinColumn` for foreign key relationships
  - Lazy loading by default, explicit joins for complex queries

#### Data Access Layer (DAL)

- **Repository Injection**: DAL classes receive DataSource and create repositories
- **Business Logic Separation**: Validation and calculations in dedicated modules
- **Transaction Management**: Explicit transactions for multi-table operations
- **Query Building**: TypeORM query builder for complex queries with joins and conditions

#### Common ORM Usage Patterns

```typescript
// Repository usage
const employeeRepo = dataSource.getRepository(Employee);
const ptoEntryRepo = dataSource.getRepository(PtoEntry);

// Simple queries
const employee = await employeeRepo.findOne({ where: { id: employeeId } });

// Relations loading
const employeeWithEntries = await employeeRepo.findOne({
  where: { id: employeeId },
  relations: ["ptoEntries"],
});

// Complex queries with joins
const entries = await ptoEntryRepo.find({
  where: { employee: { id: employeeId } },
  relations: ["employee"],
});
```

### Service Layer Architecture

To maintain separation of concerns and improve testability, components must not directly instantiate or use APIClient. Instead, implement a service layer with dependency injection:

#### Service Layer Pattern

```typescript
// Service interface
interface IEmployeeService {
  getEmployees(): Promise<Employee[]>;
  updateEmployee(id: number, data: Partial<Employee>): Promise<Employee>;
}

// Service implementation
class EmployeeService implements IEmployeeService {
  constructor(private apiClient: APIClient) {}

  async getEmployees(): Promise<Employee[]> {
    return this.apiClient.get("/api/employees");
  }
}

// Component with injected service
class AdminEmployeesPage extends BaseComponent {
  constructor(private employeeService: IEmployeeService) {
    super();
  }

  async loadData() {
    const employees = await this.employeeService.getEmployees();
    // render employees
  }
}
```

#### Dependency Injection

- **Container**: Use a simple DI container for service registration and resolution
- **Injection**: Services injected into components via constructors
- **Mocking**: Services easily mockable for unit testing
- **Benefits**: Loose coupling, improved testability, clear dependencies

#### Prohibited Patterns

- ❌ Direct APIClient instantiation in components
- ❌ HTTP logic mixed with UI logic
- ❌ Components making API calls directly
- ❌ Imperative DOM manipulation for responsive layouts
- ❌ JavaScript-based media query handling
- ❌ Global singletons and side effects
- ❌ Implicit state sharing through localStorage/globals
- ❌ Overuse of event delegation creating "event soup"
- ❌ UI messages mixed with business logic
- ❌ Hardcoded feature flags in code

#### Recommended Patterns

- ✅ Service interfaces for abstraction
- ✅ Dependency injection for loose coupling
- ✅ CSS-driven responsive layouts with grid/flexbox
- ✅ Declarative templates with attribute-based mode switching
- ✅ Context providers for scoped state management
- ✅ Component-level state with explicit dependencies
- ✅ Targeted event listeners with proper cleanup
- ✅ Custom events for component communication
- ✅ Pure business rules returning structured data
- ✅ Localization layer for UI messages
- ✅ Runtime configuration for feature flags
- ✅ Build-time flag elimination
- ✅ Event-driven data flow with service injection
- ✅ Pure business logic in services

### Automated Systems

- **Monthly Reminder Scheduler**: Sends reminders for monthly PTO reviews
- **Daily Follow-up System**: Handles follow-up notifications and automated processes

### Key Architectural Principles

- **Vanilla Approach**: No heavy frameworks, keeping the codebase lightweight and maintainable
- **WSL Compatibility**: Database and development setup work seamlessly in Windows Subsystem for Linux
- **Separation of Concerns**: Clear boundaries between frontend components, API endpoints, and business logic
- **Service Layer**: Components must use injected services instead of direct APIClient usage
- **Event-Driven Architecture**: Components dispatch custom events for data requests, parent components handle API calls and data injection
- **Component Isolation**: Web components should be data-agnostic and testable without direct API dependencies
- **Type Safety**: Full TypeScript coverage for reliability and developer experience
- **Testability**: Architecture designed to support comprehensive unit and E2E testing with mockable services

### Context Protocol

The application uses a lightweight context protocol for dependency injection into web components. Context providers wrap subtrees and intercept bubbling `context-request` events.

#### Providing Context

In `App.run()`, context providers wrap `#app-wrapper`:

```typescript
import { createContextProvider, CONTEXT_KEYS } from "./shared/context.js";

const provider = createContextProvider(
  CONTEXT_KEYS.NOTIFICATIONS,
  notifications,
);
provider.style.display = "contents";
parentElement.insertBefore(provider, appWrapper);
provider.appendChild(appWrapper);
```

#### Consuming Context

Components consume context in `connectedCallback()`:

```typescript
import { consumeContext, CONTEXT_KEYS } from "../../shared/context.js";
import type { TraceListener } from "../../controller/TraceListener.js";

class MyPage extends BaseComponent {
  private _notifications: TraceListener | null = null;

  connectedCallback() {
    super.connectedCallback();
    consumeContext<TraceListener>(this, CONTEXT_KEYS.NOTIFICATIONS, (svc) => {
      this._notifications = svc;
    });
  }

  private handleError(msg: string): void {
    this._notifications?.error(msg); // nullable — safe in unit tests without provider
  }
}
```

#### Well-Known Context Keys

| Key             | Value Type               | Purpose              |
| --------------- | ------------------------ | -------------------- |
| `NOTIFICATIONS` | `TraceListener`          | Toast notifications  |
| `DEBUG`         | `DebugConsoleController` | Debug console bridge |

#### Context vs Constructor Injection

- **Context protocol**: For web components (DOM elements) that need shared services.
- **Constructor injection**: For plain classes like `UIManager` that are not custom elements.

### Event Delegation and `data-action` Convention

#### Standard Target Resolution

Use `BaseComponent.resolveAction(e)` to resolve the `data-action` attribute from a delegated event:

```typescript
protected handleDelegatedClick(e: Event): void {
  const hit = this.resolveAction(e);
  if (!hit) return;

  switch (hit.action) {
    case "approve":
      this.handleApprove(hit.target);
      break;
    case "reject":
      this.handleReject(hit.target);
      break;
  }
}
```

#### HTML Markup

Actionable elements carry `data-action` and optional `data-*` attributes:

```html
<button data-action="approve" data-request-id="42">Approve</button>
<button data-action="reject" data-request-id="42">Reject</button>
```

#### When to Use Delegation vs Direct Listeners

| Scenario                  | Pattern                          |
| ------------------------- | -------------------------------- |
| Dynamic/repeated content  | Delegation via `data-action`     |
| Static buttons/controls   | Direct `addListener()`           |
| Cross-component data flow | Custom events                    |
| External events (window)  | `addListener()` + `addCleanup()` |

### Custom Event Catalog

All custom events are cataloged in `client/shared/events.ts` with typed detail interfaces.

#### Naming Conventions

| Pattern             | Usage                     | Example             |
| ------------------- | ------------------------- | ------------------- |
| `noun-verb`         | Action completed          | `employee-submit`   |
| `noun-data-request` | Component needs data      | `pto-data-request`  |
| `noun-changed`      | State change notification | `selection-changed` |

#### Typed Dispatch

```typescript
import { dispatchTypedEvent } from "../../shared/events.js";

dispatchTypedEvent(this, "employee-submit", { employee: { name: "Jane" } });
```

### Two-Click Confirmation Pattern

For destructive or important actions, use `ConfirmationController` from `client/shared/confirmation-mixin.ts`:

```typescript
import { ConfirmationController } from "../../shared/confirmation-mixin.js";

class MyComponent extends BaseComponent {
  private _confirm = new ConfirmationController();

  disconnectedCallback() {
    this._confirm.clearAll();
    super.disconnectedCallback();
  }

  protected handleDelegatedClick(e: Event): void {
    const hit = this.resolveAction(e);
    if (!hit) return;

    if (hit.action === "delete") {
      this._confirm.handleClick(hit.target as HTMLButtonElement, () => {
        this.executeDelete(hit.target);
      });
    }
  }
}
```

For conditional confirmation (only confirm under certain conditions):

```typescript
this._confirm.handleConditionalClick(
  btn,
  hasNegativeBalance, // only require confirmation when true
  () => this.executeApprove(requestId),
);
```

### StorageService Abstraction

Components that persist UI preferences (expanded state, selected month, etc.) use the `StorageService` interface from `client/shared/storage.ts`:

```typescript
import type { StorageService } from "../../shared/storage.js";
import { LocalStorageAdapter } from "../../shared/storage.js";

class MyComponent extends BaseComponent {
  private _storage: StorageService = new LocalStorageAdapter();

  // Setter for test injection
  set storage(svc: StorageService) {
    this._storage = svc;
  }
}
```

Tests inject `InMemoryStorage` instead of mocking `localStorage` globals.
