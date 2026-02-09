# Prior Year Review Component

A web component for displaying historical PTO data in a 12-month calendar grid layout.

## Purpose and Goals

The Prior Year Review feature provides historical PTO data visualization through a dedicated web component that renders all 12 months of a selected year in a responsive grid layout. This component enables users to review their PTO usage patterns from previous years for planning and analysis purposes.

## Component Architecture

- **Self-contained Web Component**: Uses Shadow DOM for style encapsulation and clean integration
- **External Year Selection**: Year selection is handled at the dashboard level, not within the component
- **Responsive Grid Layout**: Displays months in a flexible grid (maximum 3 months per row on larger screens)
- **Calendar Visualization**: Each month renders as a full calendar with PTO entries color-coded by type
- **Data Structure**: Accepts structured PTO data with monthly summaries and detailed entry lists

## Key Features

- **Color-Coded PTO Types**:
  - PTO (yellow)
  - Sick (red)
  - Bereavement (purple)
  - Jury Duty (green)
- **Hours Display**: PTO hours shown in bottom-right corner of calendar days
- **Monthly Summaries**: Each month includes summary bars showing total hours by PTO type
- **Consistent Height**: All calendars display exactly 6 weeks (42 days) for perfect alignment
- **Read-Only View**: Historical data is displayed read-only for review purposes

## Integration Points

- **API Endpoint**: `/api/pto/year/:year` provides historical PTO data for any valid year
- **Dashboard Controls**: Year toggle buttons switch between current year and prior year views
- **Error Handling**: Graceful handling of missing data with user-friendly "No data available" messages
- **Theming**: Uses CSS custom properties for consistent styling with the rest of the application

## Overview

The `PriorYearReview` component renders a comprehensive view of PTO usage for an entire year, displaying all 12 months in a responsive grid. Each month shows a calendar with PTO entries color-coded by type, providing a visual overview of historical PTO patterns.

## Features

- **12-Month Grid Layout**: Displays all months from January to December in a responsive grid (maximum 3 months per row on larger screens)
- **Calendar Visualization**: Each month renders as a full calendar with days of the week headers
- **Color-Coded PTO Types**:
  - **PTO/Vacation**: Blue background
  - **Sick Leave**: Red background
  - **Bereavement**: Purple background
  - **Jury Duty**: Green background
- **Hours Display**: PTO hours are shown in the bottom-right corner of calendar days
- **Monthly Summaries**: Each month includes a summary bar showing total hours for each PTO type
- **Responsive Design**: Adapts to different screen sizes, stacking months vertically on mobile devices

## User Experience (UX)

The 12-month grid layout enables users to gain immediate insights into PTO usage patterns across an entire year. By presenting all months simultaneously in a compact grid, the component supports comparative analysis, trend identification, and comprehensive overview of PTO activity.

**Fixed**: The component now ensures all calendars display exactly 6 weeks (42 days) by padding shorter months with empty cells, guaranteeing consistent height and perfect alignment of summary bars across all months.

## Usage

```typescript
import { PriorYearReview } from "./index.js";

// Create component
const review = new PriorYearReview();

// Set data for a specific year
review.data = {
  year: 2025,
  months: [
    {
      month: 1,
      ptoEntries: [
        { date: "2025-01-15", type: "PTO", hours: 8 },
        { date: "2025-01-17", type: "PTO", hours: 8 },
      ],
      summary: {
        totalDays: 31,
        ptoHours: 16,
        sickHours: 0,
        bereavementHours: 0,
        juryDutyHours: 0,
      },
    },
    // ... other months
  ],
};
```

## Data Structure

The component expects data in the following format:

```typescript
interface PTOYearReviewResponse {
  year: number;
  months: Array<{
    month: number; // 1-12
    ptoEntries: Array<{
      date: string; // YYYY-MM-DD format
      type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
      hours: number;
    }>;
    summary: {
      totalDays: number;
      ptoHours: number;
      sickHours: number;
      bereavementHours: number;
      juryDutyHours: number;
    };
  }>;
}
```

## Component Properties

- `data`: PTOYearReviewResponse | null - The PTO data to display

## Styling

The component uses CSS custom properties (CSS variables) for theming:

- `--color-pto-vacation`
- `--color-pto-sick`
- `--color-pto-bereavement`
- `--color-pto-jury-duty`
- `--color-surface`
- `--color-surface-hover`
- `--color-border`
- `--color-text`
- `--color-text-secondary`

## Year Selection

Year selection is handled externally. The component does not include its own year picker - it simply renders the data provided to it. Year selection logic should be implemented at the parent component or page level.

## No Data Handling

When no data is provided or when the data contains no PTO entries, the component displays "No data available".

## Testing

The component includes a test playground that demonstrates:

- External year selection management
- Data feeding based on selected year
- Handling of years with no available data

Run the test page to see the component in action with mock data.

## Dependencies

- `shared/dateUtils.ts` for date calculations
- `shared/businessRules.ts` for PTO type definitions
- `client/tokens.css` for theming variables
- `client/components/test-utils.ts` for DOM utilities
