# Report Generator Component

## Overview

The Report Generator component provides comprehensive PTO reporting capabilities with configurable date ranges, report types, and export functionality. It displays PTO data in both summary and detailed formats with filtering and sorting options.

## Features

- **Report Types**: Summary and detailed PTO reports
- **Date Range Filtering**: Configurable start and end dates
- **Export Functionality**: Generate and download reports
- **Employee Filtering**: Filter reports by employee
- **Data Visualization**: Tabular display of PTO information
- **Theme Integration**: Full support for light and dark themes
- **Responsive Design**: Adapts to different screen sizes

## Usage

```html
<report-generator
  report-data='[{"employeeId": 1, "employeeName": "John Doe", "totalPTOHours": 96, "usedPTOHours": 40, "remainingPTOHours": 56, "carryoverHours": 0}]'
  report-type="summary"
  date-range='{"start": "2024-01-01", "end": "2024-12-31"}'>
</report-generator>
```

## Attributes

- `report-data`: JSON array of employee PTO report data
- `report-type`: "summary" or "detailed" report format
- `date-range`: JSON object with start and end date strings

## Properties

- `reportData`: Array of ReportData objects
- `reportType`: Report type ("summary" | "detailed")
- `dateRange`: Date range object with start/end dates

## Data Structure

```typescript
type ReportData = {
  employeeId: number;
  employeeName: string;
  totalPTOHours: number;     // Total allocated PTO hours
  usedPTOHours: number;      // Hours used in period
  remainingPTOHours: number; // Hours remaining
  carryoverHours: number;    // Carried over from previous year
};
```

## Features

- **Report Controls**: Date range picker and report type selector
- **Export Options**: Generate downloadable reports
- **Employee Table**: Sortable table of PTO data
- **Summary Statistics**: Aggregate PTO information
- **Filtering**: Filter by date range and employee

## Events

- `report-export`: Fired when export button is clicked
- `date-range-change`: Fired when date range is modified
- `report-type-change`: Fired when report type is changed

## Theming Implementation

### CSS Custom Properties Used

- `--color-background`: Component background
- `--color-surface`: Header and control backgrounds
- `--color-text`: Primary text color
- `--color-text-muted`: Secondary text color
- `--color-border`: Borders and dividers
- `--color-primary`: Action buttons and focus states
- `--shadow-md`: Component shadow
- `--border-radius-lg`: Component border radius

### Theme Integration

- Consistent with admin panel styling
- Automatic light/dark theme adaptation
- Proper contrast ratios for readability

## Implementation Details

- **Shadow DOM**: Encapsulated styling and markup
- **Reactive Updates**: Updates when data or configuration changes
- **Date Integration**: Uses shared date utilities for formatting
- **Export Logic**: Handles report generation and download
- **Type Safety**: Full TypeScript interfaces for report data</content>
<parameter name="filePath">/home/ca0v/code/ca0v/earth/client/components/report-generator/README.md