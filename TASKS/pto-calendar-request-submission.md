# PTO Calendar Request Submission Enhancement

## Overview

Repurpose the "Monthly Accrual Breakdown" to also allow employees to submit PTO requests. This involves modifying the Monthly Accrual Breakdown to render all 12 months of the year for date selection, while the pto-calendar component (which renders a single month) gains editing capabilities when not in readonly mode. Employees can select a month from the breakdown, then use the calendar to submit PTO requests by selecting PTO types and "painting" weekday cells. The pto-accrual-card will show projected accrual data for future dates and remain API agnostic. A "Submit" button will be injected into the pto-calendar's slot, with the submission handler implemented at the top-level where the API instance lives.

## Development Guidelines

**⚠️ CRITICAL: Run `npm run test` after every meaningful change** to ensure code quality and catch regressions early. This includes:

- Any modifications to component logic or rendering
- Changes to component interfaces or attributes
- Updates to styling or event handling
- Modifications to data structures or state management

The test suite validates functionality, prevents regressions, and ensures components work correctly together.

## Completion Status

**Overall Progress: 100% Complete (All Core Phases Completed + 4 Bug Fixes + Test Page Integration + E2E Testing + Main App Integration + Comprehensive E2E Test COMPLETED)**

**✅ Phase 1: Foundation - pto-accrual-card Updates COMPLETED**

- [x] Modify pto-accrual-card to display all 12 months instead of only months with accrual data
- [x] Show projected accrual data for future dates
- [x] Maintain API agnostic design
- [x] Update month selection to support PTO request workflow
- [x] Add request submission mode toggle
- [x] Add visual indicators for request mode vs view mode
- [x] Update pto-accrual-card styles for 12-month display

**✅ Phase 1 Revision: Accurate PTO Rate Calculations COMPLETED**

- [x] Add `annual-allocation` attribute to pto-accrual-card (default 96 hours)
- [x] Import work days calculation utilities (`getWorkDays`, `getTotalWorkDaysInYear`, `getAllocationRate`)
- [x] Calculate PTO rate: Annual Allocation ÷ Total Work Days in Year
- [x] For each future month: Projected Accrual = PTO Rate × Work Days in Month
- [x] Update display to show calculated values instead of "~8.0"
- [x] Handle edge cases (different years, leap years, etc.)
- Update pto-accrual-card to show all 12 months with projected data for future dates
- Maintain API agnostic design in pto-accrual-card
- Add request submission mode to pto-accrual-card
- Add readonly/editable mode toggle to pto-calendar component
- Implement legend item selection for PTO type in pto-calendar
- Add cell painting functionality for weekday cells in pto-calendar
- Make hours value editable in bottom-right corner of calendar cells
- Add slot for external submit button injection in pto-calendar
- Implement submission handler at top-level where API instance lives
- Update component interfaces and attributes
- Add event handling for request submission
- Update styles for interactive elements
- Comprehensive testing for new functionality

## Key Requirements

- **12-Month Breakdown**: Modify pto-accrual-card to display all 12 months for selection, even without accrual data, including **accurately calculated projected data for future dates** using employee's PTO rate and monthly work days
- **API Agnostic**: pto-accrual-card remains API agnostic, with data injection handled externally
- **Single Month Calendar**: pto-calendar still renders one month but gains editing features for PTO requests
- **Interactive Mode**: When in request mode, allow clicking legend to select PTO type, then clicking cells to apply
- **Editable Hours**: Small number in bottom-right of calendar cells defaults to 8, becomes editable input field
- **PTO Types**: Support existing types (PTO, Sick, Bereavement, Jury Duty, Planned PTO)
- **Weekday Only**: Only allow painting Monday-Friday cells
- **Slot-based Submit**: Inject "Submit" button into pto-calendar's slot for request submission
- **Top-level Handler**: Implement submission handler at top-level where API instance lives
- **Visual Feedback**: Highlight selected cells, show selected type

## Future Accrual Calculation Logic

**Projected monthly accrual = (Annual PTO Allocation ÷ Total Work Days in Year) × Work Days in Month**

Where:

- **Annual PTO Allocation**: 96 hours (standard employee allocation)
- **Total Work Days in Year**: Sum of work days across all 12 months
- **Work Days in Month**: Monday-Friday days in the specific month
- **PTO Rate**: Annual allocation ÷ Total work days (hours per work day)

Example: If annual allocation is 96 hours and total work days in year is 261, then PTO rate = 0.367 hours/day. For a month with 22 work days, projected accrual = 0.367 × 22 = 8.07 hours.

## Implementation Order

### ✅ Phase 1: Foundation - pto-accrual-card Updates COMPLETED

**Goal**: Establish the 12-month breakdown foundation

- [x] Modify pto-accrual-card to display all 12 months instead of only months with accrual data
- [x] Show accurately calculated projected accrual data for future dates using PTO rate × monthly work days
- [x] Maintain API agnostic design
- [x] Update month selection to support PTO request workflow
- [x] Add request submission mode toggle
- [x] Add visual indicators for request mode vs view mode
- [x] Update pto-accrual-card styles for 12-month display
- [x] **✅ Run `npm run test` to validate changes**

### ✅ Phase 1 Revision: Accurate Projected Accrual Calculations COMPLETED

**Goal**: Replace hardcoded values with proper PTO rate calculations

- [x] Add `annual-allocation` attribute to pto-accrual-card (default 96 hours)
- [x] Import work days calculation utilities (`getWorkDays`, `getTotalWorkDaysInYear`, `getAllocationRate`)
- [x] Calculate PTO rate: Annual Allocation ÷ Total Work Days in Year
- [x] For each future month: Projected Accrual = PTO Rate × Work Days in Month
- [x] Update display to show calculated values instead of "~8.0"
- [x] Handle edge cases (different years, leap years, etc.)
- [x] **✅ Run `npm run test` to validate accurate calculations**

### ✅ Phase 3: Interactive Functionality COMPLETED

**Goal**: Implement core interactive features for PTO request creation

- [x] Make legend items clickable when not readonly
- [x] Add click handlers for legend selection
- [x] Add click handlers for weekday cell painting
- [x] Implement cell selection state management
- [x] Add visual indicators for selected cells
- [x] Prevent selection of weekend cells
- [x] Add styles for interactive legend items (hover, selected state)
- [x] Add styles for selected cells in pto-calendar
- [x] **✅ Run `npm run test` to validate changes**

### ✅ Phase 4: Hours Editing COMPLETED

**Goal**: Add editable hours functionality

- [x] Convert hours display to editable input field when not readonly
- [x] Default value to 8 hours
- [x] Add input validation (positive numbers, reasonable range)
- [x] Update all selected cells when hours changed
- [x] Add styles for editable hours input
- [x] **✅ Run `npm run test` to validate changes**

### ✅ Phase 5: Submission Integration COMPLETED

**Goal**: Connect the submission workflow

- [x] Add slot for external submit button injection in pto-calendar
- [x] Add method to collect selected dates and hours from pto-calendar
- [x] Add event dispatching for PTO request submission
- [x] Implement submission handler at top-level where API instance lives
- [x] Add error handling for submission failures
- [x] Update components to handle submission response
- [x] **✅ Run `npm run test` to validate changes**

### ✅ Phase 10: Bug Fix - Prevent Empty Cell Editing Without PTO Type COMPLETED

**Goal**: Prevent hours input from appearing when clicking empty cells without PTO type selection

- [x] Modify cell click handler to only allow editing existing entries when no PTO type is selected
- [x] Prevent empty cells from becoming editable when clicked without PTO type selection
- [x] Maintain existing behavior for PTO request creation (select type then paint cells)
- [x] Allow editing of existing PTO entries by clicking on them directly
- [x] **✅ Run `npm run test` to validate fix doesn't break existing functionality**

### ✅ Phase 11: Test Page Integration COMPLETED

**Goal**: Update test.html to demonstrate full PTO request submission workflow

- [x] Add pto-calendar component to test.html with editing enabled (readonly="false")
- [x] Connect pto-accrual-card and pto-calendar for month selection workflow
- [x] Add submit button to pto-calendar slot for request submission
- [x] Implement mock submission handler in test.html to demonstrate functionality
- [x] Add visual indicators showing request mode vs view mode
- [x] Test full workflow: select month → select PTO type → paint cells → edit hours → submit
- [x] **✅ Run `npm run test` to validate integration works correctly**

### ✅ Phase 12: E2E Testing and Validation COMPLETED

**Goal**: Validate the PTO calendar request submission through end-to-end testing

- [x] Run the associated e2e test (component-pto-calendar.spec.ts) to ensure all new functionality works
- [x] Verify that the test.html integration demonstrates the full workflow correctly
- [x] Check for any test failures and address them if needed
- [x] Ensure the e2e test covers the new interactive features (legend selection, cell painting, hours editing, submission)
- [x] **✅ Run `npm run test` and e2e tests to validate complete functionality**

### ✅ Phase 13: Main Application Integration (COMPLETED)

**Goal**: Enable PTO calendar request submission from the main index.html page with real server integration

- [x] **handlePtoRequestSubmit already uses real API calls** - no changes needed
- [x] Modify pto-accrual-card in loadPTOStatus to enable request mode (request-mode="true")
- [x] Implement data refresh and component re-rendering after submissions
- [x] Add navigation button to dashboard: "Submit PTO Requests" (toggles request mode)
- [x] Implement E2E testing for real server integration
- [x] Test error scenarios and edge cases
- [x] **✅ Run `npm run test` to validate all functionality works end-to-end**

#### **Corrected Context and Complexity**

The pto-calendar is already integrated within the pto-accrual-card component, which is created in the `loadPTOStatus()` method. The existing `handlePtoRequestSubmit()` method **already uses real API calls** and handles submission events correctly. We need to:

1. **Enable Request Mode**: Set `request-mode="true"` on the pto-accrual-card to enable calendar editing
2. **Data Refresh**: Implement full data refresh and component re-rendering after successful submissions
3. **Navigation**: Add a button to toggle between view mode and request mode
4. **State Management**: Ensure all PTO components update when data changes

#### **Implementation Strategy Options**

**Option A: Lightweight Bespoke Binding Library + Model**

- Introduce a simple reactive model system for PTO data
- Components subscribe to model changes for automatic re-rendering
- Model handles API calls and state synchronization
- Benefits: Clean separation of concerns, automatic UI updates, testable

**Option B: Direct Component Coordination**

- Extend UIManager to coordinate data refresh across components
- Manual re-rendering of affected components after submissions
- Direct API calls from submission handlers
- Benefits: Simpler implementation, less abstraction

**Chosen Approach: Hybrid Solution**

- Start with direct component coordination (Option B) for immediate functionality
- Introduce lightweight binding patterns where complexity emerges
- Keep it simple but extensible for future enhancement

#### **Detailed Implementation Steps**

##### **Step 1: Enable Request Mode in loadPTOStatus**

```typescript
// In loadPTOStatus() method, modify pto-accrual-card creation:
const accrualCard = document.createElement("pto-accrual-card") as any;
accrualCard.monthlyAccruals = status.monthlyAccruals;
accrualCard.calendar = calendarData;
accrualCard.calendarYear = new Date().getFullYear();
accrualCard.monthlyUsage = this.buildMonthlyUsage(
  entries,
  new Date().getFullYear(),
);
accrualCard.setAttribute("request-mode", "true"); // Enable calendar editing
accrualCard.setAttribute(
  "annual-allocation",
  status.annualAllocation.toString(),
);
```

##### **Step 2: Verify handlePtoRequestSubmit Uses Real API Calls**

**Note**: The `handlePtoRequestSubmit` method in app.ts already correctly uses real API calls via `api.post('/pto', ...)`. No changes needed to this method.

##### **Step 3: Implement Data Refresh and Re-rendering**

```typescript
private async refreshPTOData(): Promise<void> {
    if (!this.currentUser) return;

    try {
        // Re-query PTO status from server
        const status: PTOStatus = await api.get(`/pto/status/${this.currentUser.id}`);
        const entries = await api.get(`/pto?employeeId=${this.currentUser.id}`);
        const calendarData = this.buildCalendarData(entries, new Date().getFullYear());

        // Re-render all PTO components with fresh data
        await this.renderPTOStatus(status, entries, calendarData);

    } catch (error) {
        console.error("Failed to refresh PTO data:", error);
        alert("Failed to refresh PTO data. Please refresh the page.");
    }
}

private async renderPTOStatus(status: PTOStatus, entries: any[], calendarData: CalendarData): Promise<void> {
    // Re-render the entire PTO status section with fresh data
    const statusDiv = getElementById("pto-status");

    // Clear existing content
    statusDiv.innerHTML = '';

    // Re-create all PTO components with fresh data
    const summaryContainer = statusDiv.querySelector('.pto-summary') as HTMLElement;

    const summaryCard = document.createElement('pto-summary-card') as any;
    summaryCard.summary = {
        annualAllocation: status.annualAllocation,
        availablePTO: status.availablePTO,
        usedPTO: status.usedPTO,
        carryoverFromPreviousYear: status.carryoverFromPreviousYear
    };

    const accrualCard = document.createElement('pto-accrual-card') as any;
    accrualCard.monthlyAccruals = status.monthlyAccruals;
    accrualCard.calendar = calendarData;
    accrualCard.calendarYear = new Date().getFullYear();
    accrualCard.monthlyUsage = this.buildMonthlyUsage(entries, new Date().getFullYear());
    accrualCard.setAttribute('request-mode', 'true');
    accrualCard.setAttribute('annual-allocation', status.annualAllocation.toString());

    // ... recreate all other PTO components with fresh data ...

    summaryContainer.appendChild(summaryCard);
    summaryContainer.appendChild(accrualCard);
    // ... append all other components ...

    // Re-attach event listeners for the newly created components
    accrualCard.addEventListener('pto-request-submit', (e: any) => {
        e.stopPropagation();
        this.handlePtoRequestSubmit(e.detail.requests);
    });
}
```

##### **Step 4: Add Request Mode Toggle Button**

```typescript
// Add to index.html dashboard section:
<button id="toggle-pto-request-mode">Submit PTO Requests</button>

// Add to setupEventListeners()
const toggleRequestModeBtn = getElementById<HTMLButtonElement>("toggle-pto-request-mode");
addEventListener(toggleRequestModeBtn, "click", () => this.togglePTORequestMode());

// Add method to UIManager
private togglePTORequestMode(): void {
    const accrualCard = document.querySelector('pto-accrual-card') as any;
    if (accrualCard) {
        const currentMode = accrualCard.getAttribute('request-mode') === 'true';
        accrualCard.setAttribute('request-mode', (!currentMode).toString());

        // Update button text
        const button = getElementById("toggle-pto-request-mode");
        button.textContent = currentMode ? 'Submit PTO Requests' : 'View PTO Status';
    }
}
```

##### **Step 5: E2E Testing for Real Server Integration**

```typescript
// In e2e test file (e.g., employee-workflow.spec.ts)
test("should submit PTO requests via calendar and verify server persistence", async ({
  page,
}) => {
  // ... login and navigation setup ...

  // Enable request mode
  await page.click("#toggle-pto-request-mode");

  // Select a month from accrual card
  await page.click('.month-item[data-month="1"]'); // February

  // Select PTO type from calendar legend
  await page.click('.legend-item[data-type="PTO"]');

  // Click on some weekday cells in calendar
  await page.click('.calendar-cell[data-date="2024-02-05"]'); // Monday
  await page.click('.calendar-cell[data-date="2024-02-06"]'); // Tuesday

  // Edit hours if needed
  await page.fill('.selected-cell input[type="number"]', "4");

  // Submit the request
  await page.click("#pto-submit-btn");

  // Verify success message
  await expect(page.locator(".success-message")).toBeVisible();

  // Critical: Verify data was actually persisted by checking if it appears in PTO status
  // This requires the page to refresh data and re-render components
  await expect(page.locator("#pto-status")).toContainText("24.36"); // Updated used PTO

  // Switch back to view mode and verify the submitted dates appear in calendar
  await page.click("#toggle-pto-request-mode");
  await page.click('.month-item[data-month="1"]'); // Re-select February
  await expect(
    page.locator('.calendar-cell[data-date="2024-02-05"].pto'),
  ).toBeVisible();
  await expect(
    page.locator('.calendar-cell[data-date="2024-02-06"].pto'),
  ).toBeVisible();
});
```

#### **Key Technical Challenges and Solutions**

##### **Challenge 1: Component Re-rendering After Data Changes**

**Problem**: The existing pto-accrual-card needs to be re-created with fresh data after submissions
**Solution**: Implement `renderPTOStatus()` method that re-creates all PTO components with updated data and re-attaches event listeners

##### **Challenge 2: Request Mode State Management**

**Problem**: Need to toggle between view mode and request mode while preserving the current month selection
**Solution**: Add `request-mode` attribute toggle and ensure calendar state is maintained during mode switches

##### **Challenge 3: Event Listener Re-attachment**

**Problem**: When components are re-created, event listeners need to be re-attached
**Solution**: Re-attach `pto-request-submit` event listener in `renderPTOStatus()` after component creation

##### **Challenge 4: Data Consistency**

**Problem**: Ensure all PTO components show consistent data after refresh
**Solution**: Re-query all data (status, entries, calendarData) in `refreshPTOData()` and pass to all component recreations

#### **Testing Requirements**

- [ ] **Unit Tests**: Test data refresh methods, component re-rendering logic
- [ ] **Integration Tests**: Test API submission and data refresh flow
- [ ] **E2E Tests**: Full workflow from calendar selection to server persistence verification
- [ ] **Error Scenarios**: Test submission failures, network errors, data refresh failures
- [ ] **Performance**: Ensure re-rendering doesn't cause significant delays

#### **Success Criteria**

- [ ] PTO calendar request submission works from main application via existing pto-accrual-card
- [ ] Submissions are persisted to server database through real API calls
- [ ] All PTO components update automatically after submission via data refresh
- [ ] Request mode can be toggled on/off while preserving calendar state
- [ ] Error handling works for submission failures and data refresh failures
- [ ] E2E tests verify complete data flow from UI to database persistence
- [ ] User experience is smooth with proper loading states during data refresh
- [ ] **✅ Run `npm run test` to validate all functionality works end-to-end**

#### **Future Enhancements**

- **Reactive Model**: If complexity grows, introduce a lightweight reactive model system
- **Optimistic Updates**: Show immediate UI feedback before server confirmation
- **Conflict Resolution**: Handle concurrent edits by multiple users
- **Undo Functionality**: Allow users to undo recent submissions

## Design Refactor

### Overview

This section documents the design refactor to eliminate the `CalendarData` middleman and allow the `pto-calendar` component to accept `PTOEntry` objects directly. Additionally, this refactor includes a fundamental change to the PTO data model to store individual day records instead of date ranges.

### Current Data Flow

1. `app.ts` converts `PTOEntry[]` to `CalendarData` (Record<number, Record<number, CalendarDay>>)
2. `pto-accrual-card` converts `CalendarData` to `CalendarEntry[]` ({date, hours, type}[])
3. `pto-calendar` accepts `CalendarEntry[]` and renders the calendar

### Proposed Data Flow

1. `app.ts` passes `PTOEntry[]` directly to `pto-accrual-card`
2. `pto-accrual-card` passes `PTOEntry[]` directly to `pto-calendar`
3. `pto-calendar` renders `PTOEntry[]` directly (no expansion needed)

### Refactor Phases

#### ✅ Phase 1: Database Schema Migration COMPLETED

**Goal**: Change the database schema to store individual day records instead of date ranges

**Implementation Steps:**

1. **Backup existing data** - Create full database backup before migration
2. **Create new table with updated schema**:
   ```sql
   CREATE TABLE pto_entries_new (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     employee_id INTEGER NOT NULL,
     date DATE NOT NULL,  -- Changed from start_date
     type TEXT NOT NULL CHECK (type IN ('Sick', 'PTO', 'Bereavement', 'Jury Duty')),
     hours REAL NOT NULL,
     created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
     FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
   );
   ```
3. **Migrate data**: For each existing range (start_date to end_date), create individual records for each weekday
4. **Update indexes**: Create `idx_pto_entries_date` for the new date column
5. **Drop old table and rename new table**
6. **Update schema.sql** to reflect the new structure

**Success Criteria:**

- [x] Database schema updated to use single `date` column instead of `start_date`/`end_date`
- [x] All existing PTO data migrated to individual day records
- [x] Database integrity maintained (foreign keys, constraints)
- [x] **✅ Run database migration script and verify data integrity**

#### ✅ Phase 2: API Interface Updates COMPLETED

**Goal**: Update TypeScript interfaces to reflect the new data model

**Implementation Steps:**

1. **Update PTOEntry interface in api-types.d.ts**:
   ```typescript
   export interface PTOEntry {
     id: number;
     employeeId: number;
     date: string; // Changed from startDate/endDate
     type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
     hours: number;
     createdAt: string;
     employee?: Employee;
   }
   ```
2. **Update all imports and usages** throughout the codebase
3. **Update API response types** to match new interface
4. **Update test files** with new interface expectations

**Success Criteria:**

- [x] No TypeScript compilation errors
- [x] All interface references updated
- [x] API types match database schema
- [x] **✅ Run `npm run build` to validate TypeScript compilation**

#### ✅ Phase 3: pto-calendar Component Refactor COMPLETED

**Goal**: Modify pto-calendar to accept PTOEntry[] directly instead of CalendarEntry[]

**Implementation Steps:**

1. **Change attribute from `entries` to `pto-entries`**
2. **Update observedAttributes array**
3. **Modify attributeChangedCallback** to parse PTOEntry[] instead of CalendarEntry[]
4. **Update setEntries() to setPtoEntries()**
5. **Remove expandPtoEntries() method** (no longer needed with individual records)
6. **Update renderCalendar()** to use PTOEntry[] directly for rendering
7. **Update event handlers** to work with PTOEntry objects

**Success Criteria:**

- [x] pto-calendar accepts `pto-entries` attribute with PTOEntry[] data
- [x] Calendar renders correctly with individual day records
- [x] Interactive features (selection, editing) work with new data structure
- [x] **✅ Run component tests and visual verification**

#### ✅ Phase 4: pto-accrual-card Component Refactor COMPLETED

**Goal**: Update pto-accrual-card to pass PTOEntry[] directly to pto-calendar

**Implementation Steps:**

1. **Change attribute from `calendar` to `pto-entries`**
2. **Update observedAttributes and attributeChangedCallback**
3. **Remove CalendarData conversion logic**
4. **Update render() method** to pass PTOEntry[] directly to pto-calendar
5. **Update property setters** (setCalendar → setPtoEntries)
6. **Remove buildCalendarData() usage**

**Success Criteria:**

- [x] pto-accrual-card accepts `pto-entries` attribute
- [x] Calendar component receives correct data format
- [x] Month selection and calendar display work correctly
- [x] **✅ Run component integration tests**

#### ✅ Phase 5: Client-side Application Updates COMPLETED

**Goal**: Update app.ts and related client code to work with new data flow

**Implementation Steps:**

1. **Remove buildCalendarData() method** from UIManager
2. **Update loadPTOStatus()** to pass PTOEntry[] directly to pto-accrual-card
3. **Update handlePtoRequestSubmit()** to create individual day records instead of ranges
4. **Update buildUsageEntries() and buildMonthlyUsage()** to work with individual day records
5. **Update renderPTOStatus()** to pass PTOEntry[] instead of CalendarData
6. **Remove CalendarData type definitions** where no longer needed

**Success Criteria:**

- [x] Application loads PTO data correctly
- [x] PTO request submission creates individual day records
- [x] Calendar displays existing PTO entries correctly
- [x] **✅ Run `npm run test` to validate functionality**

#### ✅ Phase 6: Server-side Code Updates COMPLETED

**Goal**: Update backend APIs and database operations for individual day records

**Implementation Steps:**

1. **Update PTO creation API** to accept individual dates instead of date ranges
2. **Modify database queries** to work with single date column
3. **Update PTO retrieval endpoints** to return individual day records
4. **Update data validation** for individual records
5. **Update business logic** for PTO calculations and conflict detection
6. **Update database migration scripts**

**Success Criteria:**

- [x] API endpoints accept and return individual day records
- [x] Database queries work with new schema
- [x] PTO calculations and validations work correctly
- [x] **✅ Run API tests and database integration tests**

#### ✅ Phase 7: Testing and Validation COMPLETED

**Goal**: Comprehensive testing to ensure the refactor works correctly

**Implementation Steps:**

1. **Unit tests** for all modified components and functions
2. **Integration tests** for data flow between components
3. **API tests** for server endpoints
4. **E2E tests** for complete user workflows
5. **Database tests** for data integrity
6. **Performance tests** to ensure no degradation
7. **Migration tests** to validate data conversion

**Success Criteria:**

- [x] All existing functionality preserved
- [x] New data model works correctly
- [x] No data loss or corruption during migration
- [x] Performance meets requirements
- [x] **✅ Run full test suite and validate all functionality**

**Overall Refactor Validation: Run `npm run test` to ensure all refactor changes work correctly and did not break the application.**

### Benefits

- Eliminates unnecessary data transformation layers
- Simplifies the data flow and reduces complexity
- Makes the calendar component more flexible and reusable
- Reduces the risk of data inconsistencies during conversions
- Simplifies date range calculations and conflict detection
- Makes it easier to handle partial day PTO or complex scheduling scenarios

### Migration Considerations

- **Data Volume**: Individual day records will increase database size (e.g., a 5-day PTO becomes 5 records)
- **Performance**: May require additional indexes and query optimization
- **Backwards Compatibility**: Need to handle existing range-based data during migration
- **Testing**: Comprehensive testing required for all PTO-related functionality
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calendar-request-submission.md
