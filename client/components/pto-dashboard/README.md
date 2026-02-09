# PTO Dashboard Component

## Overview

The PTO Dashboard component serves as a central hub for PTO-related components, providing re-exports and integration patterns for building comprehensive PTO management interfaces. It aggregates all PTO card components into a cohesive dashboard experience.

## Features

- **Component Aggregation**: Re-exports all PTO card components
- **Unified Imports**: Single import point for PTO dashboard functionality
- **Integration Patterns**: Demonstrates component composition
- **Theme Consistency**: All components share theming system
- **Responsive Layout**: Components designed for dashboard layouts

## Usage

```javascript
// Import all PTO components from dashboard
import {
  PtoSummaryCard,
  PtoAccrualCard,
  PtoSickCard,
  PtoBereavementCard,
  PtoJuryDutyCard,
  PtoEmployeeInfoCard,
} from "./pto-dashboard/index.js";
```

```html
<!-- PTO Dashboard Layout -->
<div class="pto-dashboard">
  <pto-employee-info-card
    data='{"name": "John Doe", "hireDate": "2020-01-01"}'
  ></pto-employee-info-card>
  <pto-summary-card
    data='{"available": 96, "used": 40, "remaining": 56}'
  ></pto-summary-card>
  <pto-accrual-card
    accruals="[...]"
    usage="[...]"
    pto-entries="[...]"
  ></pto-accrual-card>
  <pto-sick-card
    data='{"available": 48, "used": 8}'
    entries="[...]"
  ></pto-sick-card>
  <pto-bereavement-card
    data='{"available": 24, "used": 0}'
    entries="[...]"
  ></pto-bereavement-card>
  <pto-jury-duty-card
    data='{"available": 16, "used": 0}'
    entries="[...]"
  ></pto-jury-duty-card>
</div>
```

## Exported Components

- `PtoSummaryCard`: Overall PTO balance and summary
- `PtoAccrualCard`: Monthly accrual tracking and calendar integration
- `PtoSickCard`: Sick leave bucket management
- `PtoBereavementCard`: Bereavement leave tracking
- `PtoJuryDutyCard`: Jury duty leave management
- `PtoEmployeeInfoCard`: Employee information display

## Dashboard Patterns

### Layout Structure

```css
.pto-dashboard {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
```

### Data Flow

- Components receive data via attributes
- Events bubble up for dashboard-level actions
- Shared theming through CSS custom properties

## Theming Implementation

### CSS Custom Properties Used

All components use the shared PTO theming system:

- `--color-background`: Card backgrounds
- `--color-text`: Primary text
- `--color-text-secondary`: Secondary text
- `--color-border`: Card borders
- `--color-shadow`: Card shadows
- `--color-error`: Negative balances
- `--color-success`: Positive indicators

### Theme Integration

- Consistent styling across all PTO components
- Automatic light/dark theme adaptation
- Semantic color usage for PTO types and states

## Implementation Details

- **Re-export Pattern**: Centralizes component imports
- **Test Integration**: Includes comprehensive test scenarios
- **Type Safety**: Full TypeScript support for all components
- **Modular Design**: Each card component is independently usable</content>
  <parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/pto-dashboard/README.md
