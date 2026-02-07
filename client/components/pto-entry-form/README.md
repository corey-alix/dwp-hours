# PTO Entry Form Component

## Overview
The PTO Entry Form component collects time-off requests with PTO-type specific behavior, weekday-aware date handling, spillover-aware end date calculation, and inline validation feedback. It includes a toggle to open the PTO calendar for date/type selection.

## Features
- **Dynamic fields**: "Full PTO" uses days with a readonly hours field; other types use editable hours with readonly end date
- **Spillover handling**: Calculates end date across weekdays when hours exceed a workday
- **Progressive disclosure**: Shows a calculation breakdown with spillover indication
- **Validation**: Uses shared business rules for hours, type, and weekday warnings
- **Calendar toggle**: Opens `pto-calendar` for selecting dates and hours
- **Unified toolbar**: Common Submit and Cancel buttons for both form and calendar views
- **View switching**: Toggle between form and calendar views with calendar icon
- **Keyboard navigation**: Tab through weekdays and legend items in calendar edit mode

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

## Toolbar and View Integration

### Common Toolbar
Both form and calendar views share a common toolbar with Submit and Cancel buttons. The Submit button validates and submits the PTO request from either view, while the Cancel button resets the form.

### View Switching
- The calendar icon in the toolbar toggles between form view (default) and calendar view
- Form view is optimized for single-day entries
- Calendar view allows selecting multiple dates and PTO types
- View switching preserves form state

### Calendar View Features
- Defaults to "Full PTO" selection
- Keyboard navigation: Tab through weekdays and legend items to toggle PTO types
- Date selection applies to form fields when switching back

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
