# Calendar Day Assistant

## Description

Specialized assistant for determining the day of the week for any date in 2026, particularly useful for E2E testing where calendar interactions require knowing if dates are weekdays (clickable) or weekends (not clickable).

## Trigger

Activate when users need to determine the day of the week for dates in 2026, especially for:

- E2E test date selection
- Calendar component testing
- PTO request date validation
- Any scenario requiring weekday/weekend determination

## Response Pattern

1. **Identify the reference date**: Use February 6, 2026 (Friday) as the known reference point
2. **Calculate day offset**: Determine how many days the target date is from the reference date
3. **Apply modular arithmetic**: Use (reference_day + offset) mod 7 to find the target day
4. **Provide clear result**: State the day of the week and whether it's a weekday or weekend
5. **Suggest alternatives**: If the date is a weekend, suggest nearby weekday alternatives

## Examples

- "What day is March 7, 2026?"
- "Is March 10, 2026 a weekday?"
- "Find a Monday in March 2026 for testing"
- "Check if April 15, 2026 is clickable in calendar"

## Additional Context

- **Reference Date**: February 6, 2026 = Friday
- **Day numbering**: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
- **Calendar constraints**: Only weekdays (Mon-Fri) are clickable in PTO calendar components
- **Testing focus**: Primarily used to ensure E2E tests select appropriate dates for calendar interactions

## 2026 Calendar Reference

### Key Reference Points

- **January 1, 2026**: Thursday
- **February 6, 2026**: Friday (reference date)
- **March 1, 2026**: Sunday

### Monthly First Days & Patterns

| Month | Days | First Day | Weekday Pattern             |
| ----- | ---- | --------- | --------------------------- |
| Jan   | 31   | Thu       | Thu-Fri-Sat-Sun-Mon-Tue-Wed |
| Feb   | 28   | Sun       | Sun-Mon-Tue-Wed-Thu-Fri-Sat |
| Mar   | 31   | Sun       | Sun-Mon-Tue-Wed-Thu-Fri-Sat |
| Apr   | 30   | Wed       | Wed-Thu-Fri-Sat-Sun-Mon-Tue |
| May   | 31   | Fri       | Fri-Sat-Sun-Mon-Tue-Wed-Thu |
| Jun   | 30   | Mon       | Mon-Tue-Wed-Thu-Fri-Sat-Sun |
| Jul   | 31   | Wed       | Wed-Thu-Fri-Sat-Sun-Mon-Tue |
| Aug   | 31   | Sat       | Sat-Sun-Mon-Tue-Wed-Thu-Fri |
| Sep   | 30   | Tue       | Tue-Wed-Thu-Fri-Sat-Sun-Mon |
| Oct   | 31   | Thu       | Thu-Fri-Sat-Sun-Mon-Tue-Wed |
| Nov   | 30   | Sun       | Sun-Mon-Tue-Wed-Thu-Fri-Sat |
| Dec   | 31   | Tue       | Tue-Wed-Thu-Fri-Sat-Sun-Mon |

### Programmatic Calculation

For accurate, timezone-safe day-of-week determination in code:

```javascript
// Timezone-safe day of week calculation
function getDayOfWeek(year, month, day) {
  // Note: month is 1-based (1=January, 2=February, etc.)
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
}

// Example: February 6, 2026
const dayOfWeek = getDayOfWeek(2026, 2, 6); // Returns 5 (Friday)
```

**Important**: Avoid `new Date(year, month, day)` or `date.getDay()` as they depend on local timezone and can give incorrect results.

### Quick Day Calculation

To find any date's day: Use February 6 (Friday) as reference, then add/subtract days and use mod 7 arithmetic.

**JavaScript Note**: When using `Date.UTC(year, month, day)`, months are 0-indexed (0=January, 1=February, etc.). For February, use `1` instead of `2`.

**Example**: March 11, 2026

- Feb 6 = Friday
- Feb has 28 days, so Feb 28 = Friday + 22 days = Friday + 22 mod 7 = Friday + 1 = Saturday
- March 1 = Sunday (Saturday + 1)
- March 11 = Sunday + 10 days = Sunday + 10 mod 7 = Sunday + 3 = Wednesday

### Common Testing Dates (Weekdays Only)

- March 11: Wednesday
- April 15: Wednesday
- May 20: Wednesday
- June 10: Wednesday
- July 15: Wednesday
- August 11: Wednesday
- September 16: Wednesday
- October 21: Wednesday
- November 12: Wednesday
- December 16: Wednesday</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/calendar-day-assistant/SKILL.md
