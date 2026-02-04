# PTO Status Calculations

## Overview
Implement PTO balance calculations for an annual allocation system with monthly accrual tracking. Each employee receives 12 days (96 hours) of PTO annually, allocated at the start of each year with automatic rollover. Use work days per month to show how PTO accrues monthly for informational purposes. Additionally, track annual sick time allocation (24 hours per year) and other leave types like Bereavement and Jury Duty.

## Completion Status
**Overall Progress: ~85% Complete (core functionality implemented)**

**✅ Fully Implemented:**
- Annual PTO allocation system (96 hours/year)
- Simplified work days lookup table with dynamic calculation
- Monthly accrual calculations for display
- PTO balance calculations
- Year-end rollover logic
- Employee data model with annual allocation
- Sick time and Bereavement/Jury Duty tracking
- API endpoint structure
- Frontend integration framework
- Comprehensive unit tests (all passing)

**⚠️ Partially Implemented:**
- Annual resets (logic exists but no automated processing)

**❌ Not Implemented / Needs Minor Updates:**
- Updated API responses with monthly accrual info
- Updated frontend display
- PTO submission endpoint and validation

## PTO Calculation Formula
```
Annual PTO Allocation = 96 Hours (12 days × 8 hours/day)
Monthly PTO Accrual = Allocation Rate × Work Days in Month
Total Available PTO = Annual Allocation + Carryover Hours - Used Hours
Total Available Sick Time = 24 Hours - Used Sick Hours (resets annually)
Bereavement/Jury Duty = 40 Hours - Used Hours (resets annually)
```

### Key Components
- **Annual Allocation**: Fixed 96 hours (12 days) per employee per year
- **Allocation Rate**: ~0.368 hours per work day (96 hours ÷ ~261 annual work days)
- **Work Days**: Fixed number of M-F days per month (varies 20-23 days)
- **Monthly Accrual**: For informational display only
- **Carryover**: Unused PTO from previous year (automatic rollover)
- **Usage**: PTO hours already taken
- **Sick Time**: Annual allocation of 24 hours (resets each year)
- **Bereavement/Jury Duty**: Annual allocation of 40 hours (resets each year)

## Checklist

### PTO Calculation Logic
- [x] Implement annual PTO allocation system
  - 96 hours (12 days) allocated annually per employee at year start
  - Automatic rollover logic that populates the value each year
  - Track allocation per employee for historical accuracy
- [x] Create simplified work days lookup table
  - Fixed work days per month (M-F only, accounting for holidays/weekends)
  - Example: Jan=23, Feb=20, Mar=21, Apr=22, May=22, Jun=21, Jul=23, Aug=21, Sep=22, Oct=23, Nov=20, Dec=23
  - Support different work day schedules per year if needed
  - No complex holiday calculations - just lookup table
- [x] Implement monthly PTO accrual calculation for display
  - Formula: `allocation_rate × work_days_in_month`
  - Allocation rate = 96 hours ÷ total annual work days (~0.368 hours/day)
  - Used for informational display only (actual balance is annual allocation)
- [x] Create PTO balance calculation function
  - Annual allocation + carryover - used hours
  - Handle year-end rollover automatically
  - Support carryover limits if needed
- [x] Implement sick time tracking
  - Annual allocation of 24 hours per employee
  - Track used sick hours separately from PTO
  - Reset sick time allocation annually *[Logic exists but no automated reset]*
  - Pre-populate all users with 24 sick hours initially *[Not implemented]*
- [x] Add Bereavement and Jury Duty tracking
  - Annual allocation of 40 hours combined for Bereavement/Jury Duty
  - Track usage separately from PTO and sick time
  - Reset allocation annually *[Logic exists but no automated reset]*
  - Allow configurable limits per employee if needed
- [x] Handle year-end rollover logic
  - Automatically add 96 hours to each employee's PTO balance at year start
  - Calculate any remaining PTO from previous year
  - Apply carryover limits if any
  - Reset sick time to 24 hours for new year *[Logic exists but no automated reset]*
  - Reset Bereavement/Jury Duty to 40 hours for new year *[Logic exists but no automated reset]*

### Employee Data Management
- [x] Add hire date field to employee records *[Already implemented]*
- [ ] Implement annual PTO allocation tracking
  - Fixed 96 hours per employee per year
  - Track allocation year for rollover logic
  - Support allocation adjustments if needed
- [ ] Remove daily rate calculation *[No longer needed - using fixed allocation]*
  - Different rates based on tenure/service years *[Not applicable]*
  - Support rate adjustments over time *[Not applicable]*
- [ ] Store historical allocation changes for accurate calculations *[If allocations ever change]*

### API Endpoints
- [x] Create `/api/pto/status/:employeeId` endpoint *[Already implemented]*
- [ ] Update PTO status response for annual allocation with monthly accrual info:
  - Current available balance (allocation + carryover - used)
  - Used hours (by type and date range)
  - Annual allocation (96 hours)
  - Carryover from previous year
  - Monthly accrual information (for display)
  - Next rollover date (January 1st)
  - Sick time: allowed (24), used, remaining
  - Bereavement/Jury Duty: allowed (40), used, remaining
  - Employee hire date
- [ ] Add date range filtering for PTO calculations
- [ ] Implement PTO projection (future rollover dates) *[Simplified - just next rollover]*

### Frontend Integration
- [x] Update `app.ts` to call real PTO status API *[Already implemented]*
- [ ] Update PTO display for annual allocation system:
  - Regular PTO: annual allocation (96), used, remaining
  - Monthly accrual breakdown (for informational display)
  - Sick Time: allowed (24), used, remaining
  - Bereavement/Jury Duty: allowed (40), used, remaining
- [ ] Remove daily rate information *[No longer applicable]*
- [ ] Display next rollover date instead of next accrual date
- [x] Show employee hire date and tenure information *[Already implemented]*
- [x] Handle loading states and error cases *[Already implemented]*

### Data Validation
- [ ] Ensure PTO calculations handle edge cases:
  - New hires (prorated annual allocation) *[Need to implement]*
  - Carryover limits and policies *[Need to implement]*
  - Year transitions and rollover timing *[Need to implement]*
- [ ] Validate PTO submission doesn't exceed available balance *[No PTO submission endpoint exists]*
- [ ] Validate sick time usage doesn't exceed 24 hours annually *[No validation in submission]*
- [ ] Validate Bereavement/Jury Duty usage doesn't exceed 40 hours annually *[No validation in submission]*
- [ ] Add business logic for PTO approval workflows
- [ ] Handle partial day calculations correctly *[May not be needed with fixed allocation]*
- [ ] Ensure all leave types reset properly at year end *[Logic exists but no automated processing]*

### Unit Tests
- [x] Write unit tests for annual PTO allocation system
  - Test 96-hour annual allocation
  - Test automatic rollover logic
  - Test allocation tracking per employee
- [x] Write unit tests for work days lookup table
  - Test work days for each month (Jan=23, Feb=20, etc.)
  - Test lookup for different years
  - Test edge cases (leap years, etc.)
- [x] Write unit tests for monthly PTO accrual calculation
  - Test allocation_rate × work_days formula
  - Test monthly accrual amounts
  - Test annual total equals 96 hours
- [x] Write unit tests for PTO balance calculation function
  - Test allocation + carryover - used hours formula
  - Test year-end rollover
  - Test carryover limits
- [x] Write unit tests for sick time tracking *[Already implemented]*
  - Test 24-hour annual allocation *[Already implemented]*
  - Test usage tracking and remaining calculation *[Already implemented]*
  - Test annual reset functionality *[Logic tested but no automated reset]*
- [x] Write unit tests for Bereavement and Jury Duty tracking *[Already implemented]*
  - Test 40-hour annual allocation *[Already implemented]*
  - Test combined usage tracking *[Already implemented]*
  - Test annual reset functionality *[Logic tested but no automated reset]*
- [x] Write unit tests for year-end rollover logic
  - Test automatic 96-hour addition at year start
  - Test rollover limits
  - Test annual resets for all leave types
- [ ] Write unit tests for hire date and allocation calculations
  - Test prorated allocation for new hires
  - Test allocation adjustments
- [x] Write unit tests for /api/pto/status/:employeeId endpoint *[Already implemented]*
  - Test response structure and data accuracy *[Already implemented]*
  - Test different employee scenarios *[Already implemented]*
  - Test error handling *[Already implemented]*
- [ ] Write unit tests for PTO rollover projections
  - Test next rollover date calculation
- [ ] Write unit tests for frontend PTO display components
  - Test PTO breakdown rendering
  - Test monthly accrual display
  - Test sick time display
  - Test Bereavement/Jury Duty display
  - Test rollover date display
- [ ] Write unit tests for PTO submission validation
  - Test balance limit enforcement
  - Test sick time limit validation
  - Test Bereavement/Jury Duty limit validation
- [ ] Write unit tests for edge cases
  - Test new hire prorated allocation
  - Test year-end processing
  - Test rollover timing
- [x] Ensure all tests pass with `npm run test` *[Already implemented]*</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calculations.md