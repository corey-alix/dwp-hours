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
**Overall Progress: 100% Complete (All Core Phases Completed + 4 Bug Fixes + Test Page Integration)**

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
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calendar-request-submission.md