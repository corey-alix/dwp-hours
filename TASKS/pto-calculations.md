# PTO Status Calculations

## Overview
Implement proper PTO balance calculations based on daily accrual rates and work days per month. Each employee has a unique daily PTO rate, and PTO accrues based on actual work days in each month. Additionally, track annual sick time allocation (24 hours per year) and other leave types like Bereavement and Jury Duty.

## PTO Calculation Formula
```
Monthly PTO Accrual = Work Days in Month × Employee Daily Rate
Total Available PTO = Σ(Monthly Accruals) + Carryover Hours - Used Hours
Total Available Sick Time = 24 Hours - Used Sick Hours (resets annually)
Bereavement/Jury Duty = 40 Hours - Used Hours (resets annually)
```

### Key Components
- **Work Days**: Number of working days in a month (varies 20-23 days, changes yearly)
- **Daily Rate**: Employee-specific PTO accrual rate (typically 0.68-0.71 hours per day, based on hire date)
- **Hire Date**: Employee start date (affects daily rate calculation and accrual start)
- **Carryover**: Unused PTO from previous year (up to certain limit)
- **Usage**: PTO hours already taken
- **Sick Time**: Annual allocation of 24 hours (resets each year)
- **Bereavement/Jury Duty**: Annual allocation of 40 hours (resets each year)

## Checklist

### PTO Calculation Logic
- [ ] Create work days calculation utility
  - Calculate work days for any month/year (accounting for weekends, holidays)
  - Support manual override for special cases (company holidays, etc.)
  - Store work days data in database for historical accuracy
- [ ] Implement daily PTO accrual calculation
  - Formula: `work_days × employee_daily_rate`
  - Handle different PTO types (Sick vs Regular PTO) with separate rates
  - Support rate changes over time
- [ ] Create PTO balance calculation function
  - Sum accruals from hire date to current month
  - Add carryover from previous year
  - Subtract used PTO hours
- [ ] Implement sick time tracking
  - Annual allocation of 24 hours per employee
  - Track used sick hours separately from PTO
  - Reset sick time allocation annually
  - Pre-populate all users with 24 sick hours initially
- [ ] Add Bereavement and Jury Duty tracking
  - Annual allocation of 40 hours combined for Bereavement/Jury Duty
  - Track usage separately from PTO and sick time
  - Reset allocation annually
  - Allow configurable limits per employee if needed
- [ ] Handle year-end carryover logic
  - Calculate unused PTO at year end
  - Apply carryover limits (if any)
  - Reset annual accrual for new year
  - Reset sick time to 24 hours for new year
  - Reset Bereavement/Jury Duty to 40 hours for new year

### Employee Data Management
- [ ] Add hire date field to employee records
- [ ] Implement daily rate calculation based on hire date
  - Different rates based on tenure/service years
  - Support rate adjustments over time
- [ ] Store historical rate changes for accurate calculations

### API Endpoints
- [ ] Create `/api/pto/status/:employeeId` endpoint
- [ ] Return structured PTO data:
  - Current available balance
  - Used hours (by type and date range)
  - Accrued this year
  - Carryover from previous year
  - Next accrual date and amount
  - Sick time: allowed (24), used, remaining
  - Bereavement/Jury Duty: allowed (40), used, remaining
  - Employee hire date and current daily rate
- [ ] Add date range filtering for PTO calculations
- [ ] Implement PTO projection (future monthly accruals)

### Frontend Integration
- [ ] Update `app.ts` to call real PTO status API
- [ ] Display PTO breakdown by type:
  - Regular PTO: available, used, remaining
  - Sick Time: allowed (24), used, remaining
  - Bereavement/Jury Duty: allowed (40), used, remaining
- [ ] Show daily rate and monthly accrual information
- [ ] Display work days calculation and next accrual date
- [ ] Show employee hire date and tenure information
- [ ] Handle loading states and error cases

### Data Validation
- [ ] Ensure PTO calculations handle edge cases:
  - New hires (partial month accrual)
  - Rate changes mid-year
  - Carryover limits and policies
  - Leap years and calendar variations
- [ ] Validate PTO submission doesn't exceed available balance
- [ ] Validate sick time usage doesn't exceed 24 hours annually
- [ ] Validate Bereavement/Jury Duty usage doesn't exceed 40 hours annually
- [ ] Add business logic for PTO approval workflows
- [ ] Handle partial day calculations correctly
- [ ] Ensure all leave types reset properly at year end

### Unit Tests
- [ ] Write unit tests for work days calculation utility
  - Test calculation for different months/years
  - Test holiday and weekend exclusions
  - Test manual override functionality
- [ ] Write unit tests for daily PTO accrual calculation
  - Test work_days × daily_rate formula
  - Test different employee rates
  - Test partial month calculations
- [ ] Write unit tests for PTO balance calculation function
  - Test summation of monthly accruals
  - Test carryover addition
  - Test usage subtraction
- [ ] Write unit tests for sick time tracking
  - Test 24-hour annual allocation
  - Test usage tracking and remaining calculation
  - Test annual reset functionality
- [ ] Write unit tests for Bereavement and Jury Duty tracking
  - Test 40-hour annual allocation
  - Test combined usage tracking
  - Test annual reset functionality
- [ ] Write unit tests for year-end carryover logic
  - Test PTO carryover calculation
  - Test carryover limits
  - Test annual resets for all leave types
- [ ] Write unit tests for hire date and daily rate calculations
  - Test rate determination based on hire date
  - Test tenure-based rate adjustments
  - Test historical rate change handling
- [ ] Write unit tests for /api/pto/status/:employeeId endpoint
  - Test response structure and data accuracy
  - Test different employee scenarios
  - Test error handling
- [ ] Write unit tests for PTO projection calculations
  - Test future monthly accrual projections
  - Test year-end projections
- [ ] Write unit tests for frontend PTO display components
  - Test PTO breakdown rendering
  - Test sick time display
  - Test Bereavement/Jury Duty display
  - Test hire date and rate information display
- [ ] Write unit tests for PTO submission validation
  - Test balance limit enforcement
  - Test sick time limit validation
  - Test Bereavement/Jury Duty limit validation
- [ ] Write unit tests for edge cases
  - Test new hire calculations
  - Test rate change scenarios
  - Test leap year handling
  - Test year-end processing
- [ ] Ensure all tests pass with `npm run test`</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calculations.md