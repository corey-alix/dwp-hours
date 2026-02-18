# Current Year PTO Scheduler Component

A web component for scheduling PTO across the entire current fiscal year in a 12-month calendar grid layout.

## Purpose and Goals

The Current Year PTO Scheduler feature provides a comprehensive interface for employees to review existing PTO and schedule new PTO requests across all 12 months of the current year. This component enables users to plan their PTO usage for the entire year in a single view, with a unified submission process.

## Component Architecture

- **Self-contained Web Component**: Uses Shadow DOM for style encapsulation and clean integration
- **Editable Calendar Grid**: Displays all 12 months with clickable days for PTO scheduling
- **Responsive Grid Layout**: Displays months in a flexible grid (maximum 3 months per row on larger screens)
- **Unified Submission**: Single "Submit PTO Request" button at the bottom for all scheduled PTO
- **Data Structure**: Loads existing PTO data and manages new scheduling selections

## Key Features

- **12-Month Grid Layout**: Displays all months from January to December in a responsive grid
- **Editable Calendars**: Clickable days for selecting/deselecting PTO dates
- **Color-Coded PTO Types**: Visual feedback for different PTO types (existing and scheduled)
- **Validation**: Real-time validation using business rules for PTO requests
- **Unified Submission**: Single button to submit all scheduled PTO at once
- **Confirmation Dialog**: User confirmation before submitting PTO requests

## Integration Points

- **API Endpoints**: `/api/pto/year/:year` for loading existing data, `/api/pto/submit` for submission
- **Business Rules**: `shared/businessRules.ts` for validation logic
- **Date Utilities**: `shared/dateUtils.ts` for all date operations
- **Error Handling**: Graceful handling of validation errors and submission failures
- **Theming**: Uses CSS custom properties for consistent styling

## Overview

The `CurrentYearPtoScheduler` component renders an editable view of PTO for the entire current year, displaying all 12 months in a responsive grid. Each month shows a calendar where users can click days to schedule PTO, with visual feedback and validation.

## Features

- **12-Month Grid Layout**: Displays all months from January to December in a responsive grid (maximum 3 months per row on larger screens)
- **Editable Calendar Visualization**: Each month renders as a full calendar with clickable days
- **PTO Selection**: Click days to toggle PTO scheduling on/off
- **Color-Coded PTO Types**:
  - **PTO/Vacation**: Blue background
  - **Sick Leave**: Red background
  - **Bereavement**: Purple background
  - **Jury Duty**: Green background
- **Hours Display**: Existing PTO hours shown in calendar days
- **Monthly Summaries**: Each month includes summary bars showing total hours for each PTO type
- **Validation Feedback**: Real-time validation with error messages for invalid selections
- **Submit Button**: Single button at the bottom to submit all scheduled PTO
- **Confirmation Dialog**: Prevents accidental submissions

## Data Flow

1. Component loads existing PTO data for the current year
2. User clicks calendar days to select/deselect PTO dates
3. Real-time validation checks business rules (e.g., sufficient balance, no conflicts)
4. User clicks "Submit PTO Request" button
5. Confirmation dialog appears
6. Upon confirmation, submits all selected PTO dates to API
7. Success/failure feedback displayed to user

## Validation Rules

- PTO balance checks
- Date conflict detection
- Business day restrictions
- Maximum PTO per period limits
- All rules enforced via `shared/businessRules.ts`

## Error Handling

- Network errors during data loading
- Validation errors during selection
- Submission failures with retry options
- User-friendly error messages throughout
