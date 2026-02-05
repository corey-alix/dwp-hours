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
const accrualCard = document.createElement('pto-accrual-card') as any;
accrualCard.monthlyAccruals = status.monthlyAccruals;
accrualCard.calendar = calendarData;
accrualCard.calendarYear = new Date().getFullYear();
accrualCard.monthlyUsage = this.buildMonthlyUsage(entries, new Date().getFullYear());
accrualCard.setAttribute('request-mode', 'true'); // Enable calendar editing
accrualCard.setAttribute('annual-allocation', status.annualAllocation.toString());
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
test('should submit PTO requests via calendar and verify server persistence', async ({ page }) => {
    // ... login and navigation setup ...

    // Enable request mode
    await page.click('#toggle-pto-request-mode');

    // Select a month from accrual card
    await page.click('.month-item[data-month="1"]'); // February

    // Select PTO type from calendar legend
    await page.click('.legend-item[data-type="PTO"]');

    // Click on some weekday cells in calendar
    await page.click('.calendar-cell[data-date="2024-02-05"]'); // Monday
    await page.click('.calendar-cell[data-date="2024-02-06"]'); // Tuesday

    // Edit hours if needed
    await page.fill('.selected-cell input[type="number"]', '4');

    // Submit the request
    await page.click('#pto-submit-btn');

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible();

    // Critical: Verify data was actually persisted by checking if it appears in PTO status
    // This requires the page to refresh data and re-render components
    await expect(page.locator('#pto-status')).toContainText('24.36'); // Updated used PTO

    // Switch back to view mode and verify the submitted dates appear in calendar
    await page.click('#toggle-pto-request-mode');
    await page.click('.month-item[data-month="1"]'); // Re-select February
    await expect(page.locator('.calendar-cell[data-date="2024-02-05"].pto')).toBeVisible();
    await expect(page.locator('.calendar-cell[data-date="2024-02-06"].pto')).toBeVisible();
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
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calendar-request-submission.md