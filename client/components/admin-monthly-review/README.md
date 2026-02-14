# Admin Monthly Review Component

## Overview

The Admin Monthly Review component provides an interface for administrators to review employee monthly hours and PTO usage data. It displays employee information in card format with detailed hours breakdowns and allows admins to acknowledge their review of the data.

## Architecture

### Event-Driven Data Flow

This component follows the **event-driven architecture pattern** used throughout the DWP Hours Tracker:

- **No Direct API Calls**: The component never makes direct HTTP requests
- **Event Dispatch**: Data requests are signaled via custom events (`admin-monthly-review-request`)
- **Parent Injection**: Data is injected via method calls (`setEmployeeData()`) by parent components
- **Separation of Concerns**: UI logic is isolated from data fetching and business logic

```typescript
// Component dispatches event for data request
this.dispatchEvent(
  new CustomEvent("admin-monthly-review-request", {
    bubbles: true,
    composed: true,
    detail: { month: this._selectedMonth },
  }),
);

// Parent component handles the event and provides data
component.setEmployeeData(fetchedData);
```

### Component Testing Architecture

The component uses a sophisticated **seed data integration testing pattern**:

- **Seed Data Source**: Reads from `shared/seedData.ts` for realistic test scenarios
- **Type Safety**: Uses shared `AdminMonthlyReviewItem` types from `shared/api-models.ts`
- **API Simulation**: Test harness generates data matching the `/api/admin/monthly-review/:month` response structure
- **Event Simulation**: Tests both data consumption and event production

```typescript
// Test harness generates API-equivalent data from seed data
function generateMonthlyData(month: string): AdminMonthlyReviewItem[] {
  // Reads seedEmployees, seedPTOEntries, seedAdminAcknowledgments
  // Transforms into AdminMonthlyReviewItem[] structure
  // Matches server API response format exactly
}
```

### Integration Architecture

The component integrates into a **hierarchical component system**:

```
Admin Panel (admin-panel/index.ts)
├── Navigation & Layout
├── Event Handling & API Coordination
└── Admin Monthly Review (admin-monthly-review/index.ts)
    ├── UI Rendering & User Interaction
    ├── Event Dispatch for Data Requests
    └── Data Consumption via Method Injection
```

### Type Safety Architecture

- **Shared Types**: Uses `AdminMonthlyReviewItem` from `shared/api-models.ts`
- **Client-Server Consistency**: Types match server response structure exactly
- **Compile-Time Safety**: TypeScript ensures data structure compliance
- **API Contract**: Types serve as the contract between frontend and backend

## Features

- **Month Selection**: Choose which month's data to review
- **Employee Cards**: Visual cards displaying each employee's monthly data
- **Hours Breakdown**: Detailed view of total hours, PTO, sick, bereavement, and jury duty hours
- **Acknowledgment Status**: Visual indicators showing acknowledgment status
- **Acknowledgment Actions**: Buttons to acknowledge reviews for individual employees
- **Responsive Design**: Adapts to different screen sizes

## Data Structure

The component expects employee data in the `AdminMonthlyReviewItem` format from `shared/api-models.ts`:

```typescript
import type { AdminMonthlyReviewItem } from "../../../shared/api-models.js";

// AdminMonthlyReviewItem structure:
{
  employeeId: number;
  employeeName: string;
  month: string;
  totalHours: number;
  ptoHours: number;
  sickHours: number;
  bereavementHours: number;
  juryDutyHours: number;
  acknowledgedByAdmin: boolean;
  adminAcknowledgedAt?: string;
  adminAcknowledgedBy?: string;
}
```

## Usage

### Basic Usage

```html
<admin-monthly-review></admin-monthly-review>
```

### With Attributes

```html
<admin-monthly-review
  selected-month="2026-02"
  employee-data='[{"employeeId": 1, "employeeName": "John Doe", ...}]'
>
</admin-monthly-review>
```

## Attributes

- `selected-month`: The month to display data for (format: YYYY-MM)
- `employee-data`: JSON string of employee monthly data array

## Events

### admin-acknowledge

Dispatched when an admin clicks the "Acknowledge Review" button.

```javascript
monthlyReview.addEventListener("admin-acknowledge", (e) => {
  const { employeeId, month } = e.detail;
  // Handle acknowledgment logic
});
```

**Event Detail:**

- `employeeId`: Number - The ID of the employee being acknowledged
- `month`: String - The month being acknowledged (YYYY-MM format)

## Styling

The component uses CSS custom properties for theming:

### Layout Colors

- `--color-background`: Main background
- `--color-surface`: Card backgrounds
- `--color-border`: Borders and dividers

### Text Colors

- `--color-text`: Primary text
- `--color-text-secondary`: Secondary text

### Interactive Colors

- `--color-primary`: Button backgrounds
- `--color-primary-hover`: Button hover states
- `--color-success`: Acknowledged status indicator
- `--color-warning`: Pending status indicator

## Testing

### Test Architecture

The component employs a **dual testing strategy**:

#### Manual Testing (`test.html`)

- Interactive browser-based testing
- Real-time event logging and feedback
- Visual verification of UI components
- Integration testing with parent components

#### Automated Testing (`test.ts`)

- **Seed Data Integration**: Reads `shared/seedData.ts` to generate realistic test scenarios
- **Type Compliance**: Ensures test data matches `AdminMonthlyReviewItem` interface
- **Event Simulation**: Tests both incoming data handling and outgoing event dispatch
- **API Response Simulation**: Generates data structures identical to server responses

### Test Data Flow

```
Seed Data (shared/seedData.ts)
├── seedEmployees[] - Employee information
├── seedPTOEntries[] - PTO usage records
└── seedAdminAcknowledgments[] - Acknowledgment records

Test Harness (test.ts)
├── generateMonthlyData() - Transforms seed data
├── Event listeners - Captures component events
└── Data injection - Provides test data to component

Component (index.ts)
├── Receives test data via setEmployeeData()
├── Renders UI based on data
└── Dispatches events for user interactions
```

### Running Tests

```bash
# Manual testing - open in browser
open client/components/admin-monthly-review/test.html

# Automated testing - run test suite
npm run test:unit

# E2E testing - full workflow
npm run test:e2e
```

The test harness includes:

- Mock employee data generation from seed data
- Event logging and validation
- Interactive testing controls
- API response structure validation

## Integration

### Component Hierarchy

This component integrates into the **admin panel component system** following a clear separation of responsibilities:

#### Parent Component (Admin Panel)

- **Event Handling**: Listens for `admin-monthly-review-request` and `admin-acknowledge` events
- **API Coordination**: Makes HTTP requests to `/api/admin/monthly-review/:month` and `/api/admin-acknowledgements`
- **Data Management**: Fetches data and injects it via `setEmployeeData()` method
- **State Management**: Maintains application state and coordinates between components

#### Child Component (Admin Monthly Review)

- **UI Rendering**: Displays employee data in card-based layout
- **User Interaction**: Handles month selection and acknowledgment button clicks
- **Event Dispatch**: Signals data needs and user actions to parent
- **Data Consumption**: Receives and displays data injected by parent

### Data Flow Architecture

```
User Interaction → Component Event → Parent Handler → API Call → Data Injection → UI Update

1. User selects month → admin-monthly-review-request event
2. Admin panel listens → calls API → gets AdminMonthlyReviewItem[]
3. Admin panel calls → component.setEmployeeData(data)
4. Component renders → employee cards with acknowledgment status
5. User clicks acknowledge → admin-acknowledge event
6. Admin panel handles → calls acknowledgment API → updates data
```

### Shared Type System

The component uses **shared type definitions** ensuring consistency across the application:

- **Client-Server Contract**: `AdminMonthlyReviewItem` matches server response structure
- **Type Safety**: Compile-time validation of data structures
- **API Evolution**: Types serve as the contract for API changes
- **Testing Consistency**: Test data matches production data structure

### Event Architecture

All component communication uses **custom events** for loose coupling:

```typescript
// Data request event
new CustomEvent("admin-monthly-review-request", {
  bubbles: true,
  composed: true,
  detail: { month: "2026-02" },
});

// Acknowledgment event
new CustomEvent("admin-acknowledge", {
  bubbles: true,
  composed: true,
  detail: { employeeId: 1, employeeName: "John Doe", month: "2026-02" },
});
```

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast support
- Focus management

## Architecture Summary

The Admin Monthly Review component exemplifies the **DWP Hours Tracker's architectural principles**:

### 🎯 **Event-Driven Design**

- Components communicate via events, not direct method calls
- Loose coupling enables flexible composition and testing
- Parent components orchestrate data flow and API interactions

### 🔄 **Data Flow Patterns**

- **Downward Data Flow**: Parent injects data via methods
- **Upward Event Flow**: Child signals needs and actions via events
- **Type Safety**: Shared interfaces ensure data structure compliance

### 🧪 **Testing Architecture**

- **Seed Data Integration**: Realistic test scenarios from shared seed data
- **Type Compliance**: Test data matches production API responses
- **Event Simulation**: Full event-driven flow testing without network calls

### 🏗️ **Component Composition**

- **Hierarchical Structure**: Clear parent-child relationships
- **Separation of Concerns**: UI, data, and business logic are distinct
- **Reusable Patterns**: Consistent with other components in the system

### 📋 **Type System**

- **Shared Models**: Client and server use identical type definitions
- **API Contracts**: Types define the interface between frontend and backend
- **Compile-Time Safety**: TypeScript prevents runtime data structure errors

This architecture enables **maintainable, testable, and scalable** component development while ensuring **type safety** and **consistent data flow** throughout the application.
