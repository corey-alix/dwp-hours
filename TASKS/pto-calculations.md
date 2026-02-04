# PTO Status Calculations

## Overview
Implement proper PTO balance calculations to replace the current hardcoded mock data.

## Checklist

### PTO Calculation Logic
- [ ] Create PTO calculation function in backend
  - Formula: `(monthly_rate × months_worked) + carryover_hours - used_hours`
  - Handle different PTO types (Sick vs Regular PTO)
- [ ] Implement month calculation based on hire date
- [ ] Track PTO usage by type and date range
- [ ] Handle year-end carryover logic

### API Endpoints
- [ ] Create `/api/pto/status/:employeeId` endpoint
- [ ] Return structured PTO data (available, used, remaining, by type)
- [ ] Add date range filtering for PTO calculations
- [ ] Implement PTO projection (future accrual)

### Frontend Integration
- [ ] Update `app.ts` to call real PTO status API
- [ ] Display PTO breakdown by type (Sick, PTO, etc.)
- [ ] Show accrual rate and next accrual date
- [ ] Handle loading states and error cases

### Data Validation
- [ ] Ensure PTO calculations handle edge cases (new hires, carryover, etc.)
- [ ] Validate PTO submission doesn't exceed available balance
- [ ] Add business logic for PTO approval workflows
- [ ] Handle partial day calculations correctly</content>
<parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/TASKS/pto-calculations.md