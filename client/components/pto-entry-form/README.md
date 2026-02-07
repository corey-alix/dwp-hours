# PTO Entry Form Component

## Overview
The PTO Entry Form component collects time-off requests with PTO-type specific behavior, weekday-aware date handling, spillover-aware end date calculation, and inline validation feedback. It includes a toggle to open the PTO calendar for date/type selection.

## Features
- **Dynamic fields**: "Full PTO" uses days with a readonly hours field; other types use editable hours with readonly end date
- **Spillover handling**: Calculates end date across weekdays when hours exceed a workday
- **Progressive disclosure**: Shows a calculation breakdown with spillover indication
- **Validation**: Uses shared business rules for hours, type, and weekday warnings
- **Calendar toggle**: Opens `pto-calendar` for selecting dates and hours

## Usage

### Basic Implementation
```html
<pto-entry-form></pto-entry-form>
```

### Event Handling
```javascript
const form = document.querySelector('pto-entry-form');

form.addEventListener('pto-submit', (e) => {
    const request = e.detail.ptoRequest;
    // request = { startDate, endDate, ptoType, hours }
});

form.addEventListener('form-cancel', () => {
    // handle cancel
});
```

## Behavior Details

### Full PTO
- Label switches to "Days"
- `hours` is readonly and derived from weekdays between dates
- Submitted hours are stored as `days * 8`

### Other PTO Types
- Label stays "Hours"
- `hours` is editable in 4-hour increments
- `endDate` is readonly and calculated from hours with spillover across weekdays

### Spillover Indicator
When hours span multiple workdays, the calculation text is highlighted to indicate spillover.

### Calendar Toggle
Selecting dates/hours in the calendar applies them to the form and switches back to the form view.

## Testing
Run the component E2E test:
```bash
npm run test:e2e component-pto-entry-form
```

Or visit the test page directly:
```
/components/pto-entry-form/test.html
```

## Dependencies
- Shared business rules in `shared/businessRules.ts`
- Shared date utilities in `shared/dateUtils.ts`
- `pto-calendar` component for calendar selection
