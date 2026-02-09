# PTO Calculation Rules Assistant

## Description

Specialized assistant for understanding and implementing PTO (Paid Time Off) calculation rules, business logic, and accrual formulas in the DWP Hours Tracker. Provides guidance on PTO balance calculations, work day determination, carryover rules, and type-specific tracking.

## PTO Calculation Rules

The DWP Hours Tracker implements specific business rules for PTO management:

### Annual Allocation and Reset
- At the start of each year, the system automatically debits PTO entries with **96 hours of "PTO"** and **24 hours of "Sick"** dated January 1st
- PTO carryover from the prior year is added as an additional PTO entry on January 1st
- "Sick" time is **reset to 24 hours at the start of each year** (no carryover for sick time)

### Monthly Accrual
- Employees **accrue pto_rate hours per work day** to their PTO balance throughout the year
- **Work days** are the total non-weekend (Monday-Friday) days in each month
- **Monthly accrual** = pto_rate × work_days_in_month

### Balance Calculation
- **Available PTO** = Sum of allocation entries + Accrued - Used PTO Hours
- **Time Off Types**: "Sick", "PTO", "Bereavement", "Jury Duty" are all tracked as separate PTO types
- Each type has its own balance and usage tracking
- At year-end, usage reports must break down hours by type

## Trigger

Activate this skill when users ask about:

- PTO calculation logic and formulas
- Business rules for PTO accrual and usage
- Work day determination and monthly calculations
- Carryover policies and annual resets
- PTO balance calculations and type-specific tracking
- PTO rate application and employee-specific rules

## Response Pattern

When activated, follow this structured approach:

1. **Identify the Calculation Type**: Determine if the query involves annual allocation, monthly accrual, balance calculation, or reporting
2. **Reference Core Rules**: Explain the relevant PTO calculation rules with examples
3. **Provide Implementation Guidance**: Show how rules translate to code in `shared/businessRules.ts` or calculation functions
4. **Consider Edge Cases**: Address boundary conditions like year transitions, partial months, or rate changes
5. **Validate Against Requirements**: Ensure calculations align with year-end reporting needs

## Examples

- "How is PTO balance calculated for an employee?"
- "What are the rules for PTO carryover between years?"
- "How do we determine work days for monthly accrual?"
- "How are different PTO types tracked separately?"
- "What happens to sick time at year-end?"

## Additional Context

This skill integrates with the completed TASKS/database-schema.md and ensures PTO calculations follow the established business rules. Calculations are implemented in `shared/businessRules.ts` and `shared/ptoCalculations.ts` for consistency across client and server. Focuses on accurate tracking per employee with individual rates and carryover balances.