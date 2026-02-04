# PTO Status Calculations

## Overview
Implement proper PTO balance calculations based on daily accrual rates and work days per month. Each employee has a unique daily PTO rate, and PTO accrues based on actual work days in each month. Additionally, track annual sick time allocation (24 hours per year).

## PTO Calculation Formula
```
Monthly PTO Accrual = Work Days in Month × Employee Daily Rate
Total Available PTO = Σ(Monthly Accruals) + Carryover Hours - Used Hours
Total Available Sick Time = 24 Hours - Used Sick Hours (resets annually)
```

### Key Components
- **Work Days**: Number of working days in a month (varies 20-23 days, changes yearly)
- **Daily Rate**: Employee-specific PTO accrual rate (typically 0.68-0.71 hours per day)
- **Carryover**: Unused PTO from previous year (up to certain limit)
- **Usage**: PTO hours already taken
- **Sick Time**: Annual allocation of 24 hours (resets each year)

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
- [ ] Handle year-end carryover logic
  - Calculate unused PTO at year end
  - Apply carryover limits (if any)
  - Reset annual accrual for new year
  - Reset sick time to 24 hours for new year

### API Endpoints
- [ ] Create `/api/pto/status/:employeeId` endpoint
- [ ] Return structured PTO data:
  - Current available balance
  - Used hours (by type and date range)
  - Accrued this year
  - Carryover from previous year
  - Next accrual date and amount
  - Sick time: allowed, used, remaining
- [ ] Add date range filtering for PTO calculations
- [ ] Implement PTO projection (future monthly accruals)

### Frontend Integration
- [ ] Update `app.ts` to call real PTO status API
- [ ] Display PTO breakdown by type (Sick, PTO, etc.)
  - Regular PTO: available, used, remaining
  - Sick Time: allowed (24), used, remaining
- [ ] Show daily rate and monthly accrual information
- [ ] Display work days calculation and next accrual date
- [ ] Handle loading states and error cases

### Data Validation
- [ ] Ensure PTO calculations handle edge cases:
  - New hires (partial month accrual)
  - Rate changes mid-year
  - Carryover limits and policies
  - Leap years and calendar variations
- [ ] Validate PTO submission doesn't exceed available balance
- [ ] Validate sick time usage doesn't exceed 24 hours annually
- [ ] Add business logic for PTO approval workflows
- [ ] Handle partial day calculations correctly
- [ ] Ensure sick time resets properly at year end</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calculations.md