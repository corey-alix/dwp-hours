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
**Overall Progress: ~10% Complete (Phase 1 fully completed)**

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

### Phase 3: Interactive Functionality
**Goal**: Implement core interactive features for PTO request creation
- [ ] Make legend items clickable when not readonly
- [ ] Add click handlers for legend selection
- [ ] Add click handlers for weekday cell painting
- [ ] Implement cell selection state management
- [ ] Add visual indicators for selected cells
- [ ] Prevent selection of weekend cells
- [ ] Add styles for interactive legend items (hover, selected state)
- [ ] Add styles for selected cells in pto-calendar
- [ ] **Run `npm run test` to validate changes**

### Phase 4: Hours Editing
**Goal**: Add editable hours functionality
- [ ] Convert hours display to editable input field when not readonly
- [ ] Default value to 8 hours
- [ ] Add input validation (positive numbers, reasonable range)
- [ ] Update all selected cells when hours changed
- [ ] Add styles for editable hours input
- [ ] **Run `npm run test` to validate changes**

### Phase 5: Submission Integration
**Goal**: Connect the submission workflow
- [ ] Add slot for external submit button injection in pto-calendar
- [ ] Add method to collect selected dates and hours from pto-calendar
- [ ] Add event dispatching for PTO request submission
- [ ] Implement submission handler at top-level where API instance lives
- [ ] Add error handling for submission failures
- [ ] Update components to handle submission response
- [ ] **Run `npm run test` to validate changes**

### Phase 6: Polish and Testing
**Goal**: Finalize implementation with comprehensive testing
- [ ] Update color schemes for better UX
- [ ] Unit tests for new methods and state management in both components
- [ ] E2E tests for interactive functionality
- [ ] Test readonly vs editable mode switching
- [ ] Test hours editing and validation
- [ ] Test slot-based submit button injection
- [ ] Test top-level submission handler integration
- [ ] Test request submission flow
- [ ] Manual testing of full year breakdown view with projected data
- [ ] Update component READMEs with new features
- [ ] Document slot-based submit button injection
- [ ] Document top-level handler integration pattern
- [ ] Add usage examples for request submission
- [ ] Document new attributes and events
- [ ] Update API documentation if needed
- [ ] **Run `npm run test` to validate final implementation**</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calendar-request-submission.md