# PTO Calendar Request Submission Enhancement

## Overview
Repurpose the "Monthly Accrual Breakdown" to also allow employees to submit PTO requests. This involves modifying the Monthly Accrual Breakdown to render all 12 months of the year for date selection, while the pto-calendar component (which renders a single month) gains editing capabilities when not in readonly mode. Employees can select a month from the breakdown, then use the calendar to submit PTO requests by selecting PTO types and "painting" weekday cells. The pto-accrual-card will show projected accrual data for future dates and remain API agnostic. A "Submit" button will be injected into the pto-calendar's slot, with the submission handler implemented at the top-level where the API instance lives.

## Completion Status
**Overall Progress: 0% Complete (planning phase)**

**❌ Not Implemented:**
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
- **12-Month Breakdown**: Modify pto-accrual-card to display all 12 months for selection, even without accrual data, including projected data for future dates
- **API Agnostic**: pto-accrual-card remains API agnostic, with data injection handled externally
- **Single Month Calendar**: pto-calendar still renders one month but gains editing features for PTO requests
- **Interactive Mode**: When in request mode, allow clicking legend to select PTO type, then clicking cells to apply
- **Editable Hours**: Small number in bottom-right of calendar cells defaults to 8, becomes editable input field
- **PTO Types**: Support existing types (PTO, Sick, Bereavement, Jury Duty, Planned PTO)
- **Weekday Only**: Only allow painting Monday-Friday cells
- **Slot-based Submit**: Inject "Submit" button into pto-calendar's slot for request submission
- **Top-level Handler**: Implement submission handler at top-level where API instance lives
- **Visual Feedback**: Highlight selected cells, show selected type

## Checklist

### pto-accrual-card Component Updates
- [ ] Modify to display all 12 months instead of only months with accrual data
- [ ] Show projected accrual data for future dates
- [ ] Maintain API agnostic design
- [ ] Add request submission mode toggle
- [ ] Update month selection to support PTO request workflow
- [ ] Add visual indicators for request mode vs view mode

### pto-calendar Component Updates
- [ ] Add `readonly` attribute to control edit mode
- [ ] Add `selected-type` attribute to track current PTO type selection
- [ ] Add `default-hours` attribute (default 8)
- [ ] Add slot for external submit button injection
- [ ] Add event dispatching for PTO request submission
- [ ] Update observed attributes list

### Interactive Functionality (pto-calendar)
- [ ] Make legend items clickable when not readonly
- [ ] Add click handlers for legend selection
- [ ] Add click handlers for weekday cell painting
- [ ] Implement cell selection state management
- [ ] Add visual indicators for selected cells
- [ ] Prevent selection of weekend cells

### Hours Editing (pto-calendar)
- [ ] Convert hours display to editable input field when not readonly
- [ ] Default value to 8 hours
- [ ] Add input validation (positive numbers, reasonable range)
- [ ] Update all selected cells when hours changed

### API Integration
- [ ] Add method to collect selected dates and hours from pto-calendar
- [ ] Implement slot for external submit button injection in pto-calendar
- [ ] Implement submission handler at top-level where API instance lives
- [ ] Add error handling for submission failures
- [ ] Update components to handle submission response

### Styling Updates
- [ ] Add styles for interactive legend items (hover, selected state)
- [ ] Add styles for selected cells in pto-calendar
- [ ] Add styles for editable hours input
- [ ] Update pto-accrual-card styles for 12-month display
- [ ] Update color schemes for better UX

### Testing
- [ ] Unit tests for new methods and state management in both components
- [ ] E2E tests for interactive functionality
- [ ] Test readonly vs editable mode switching
- [ ] Test hours editing and validation
- [ ] Test slot-based submit button injection
- [ ] Test top-level submission handler integration
- [ ] Test request submission flow
- [ ] Manual testing of full year breakdown view with projected data

### Documentation
- [ ] Update component READMEs with new features
- [ ] Document slot-based submit button injection
- [ ] Document top-level handler integration pattern
- [ ] Add usage examples for request submission
- [ ] Document new attributes and events
- [ ] Update API documentation if needed</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calendar-request-submission.md