# Prior Year Review Component

A web component for displaying historical PTO data in a 12-month calendar grid layout.

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

The 12-month grid layout is a critical design choice that enables users to gain immediate insights into PTO usage patterns across an entire year. By presenting all months simultaneously in a compact grid, the component supports several key user workflows:

- **Comparative Analysis**: Users can quickly compare PTO usage across different months to identify seasonal patterns, peak vacation periods, or unusual leave-taking behavior.
- **Trend Identification**: Visual scanning across the grid allows users to spot trends, such as increased sick leave during certain months or consistent vacation scheduling.
- **Comprehensive Overview**: Unlike paginated or single-month views, the grid provides a holistic view of the entire year's PTO activity at a glance.
- **Color Consistency**: Calendar day colors for each PTO type should match the corresponding summary area colors, creating visual continuity that helps users quickly associate calendar entries with summary statistics.
- **Visual Hierarchy**: Non-zero PTO hour counts in monthly summaries should be displayed with larger, emboldened fonts and color-coding to create visual emphasis and draw attention to significant leave usage, acting as a call-to-action for reviewing patterns or addressing high-usage periods. Only the numeric values should be styled this way; the labels (e.g., "PTO:", "Sick:") should remain in default styling.

However, the current implementation has a known UX limitation: when months contain different numbers of calendar weeks (typically 4 or 5), the month summary bars become misaligned across rows. For example, a month starting on a Monday with 31 days (5 weeks) will have its summary positioned lower than an adjacent month with only 4 weeks.

This misalignment disrupts the visual flow and makes it harder to scan summary information horizontally across the grid. **Fixed**: The component now ensures all calendars display exactly 6 weeks (42 days) by padding shorter months with empty cells, guaranteeing consistent height and perfect alignment of summary bars across all months.

The grid layout prioritizes information density and comparative analysis capabilities over perfect visual alignment, but resolving the alignment issue would significantly enhance the component's usability for data-driven PTO management decisions.

## Usage

```typescript
import { PriorYearReview } from './index.js';

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
        { date: "2025-01-17", type: "PTO", hours: 8 }
      ],
      summary: { totalDays: 31, ptoHours: 16, sickHours: 0, bereavementHours: 0, juryDutyHours: 0 }
    },
    // ... other months
  ]
};
```

## Data Structure

The component expects data in the following format:

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