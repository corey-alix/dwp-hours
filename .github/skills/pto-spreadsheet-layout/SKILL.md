# PTO Spreadsheet Layout

## Description

Explains the structure and layout of PTO Excel spreadsheets used in the DWP Hours Tracker data migration process, including calendar areas, legend sections, PTO calculation data, and color coding schemes.

## Trigger

Activate when users ask about Excel spreadsheet structure, PTO data layout, calendar organization, legend interpretation, or how to navigate the legacy Excel files for data migration.

## Response Pattern

1. **Identify Key Sections**: Locate and describe the main areas of the spreadsheet (calendar, legend, PTO calculations)
2. **Explain Calendar Layout**: Detail the calendar area coordinates, date formulas, and cell structure
3. **Describe Legend Section**: Explain how PTO types are mapped to colors in the legend
4. **Cover PTO Calculations**: Describe the PTO calculation section and data format
5. **Explain Color Coding**: Detail how colors represent different PTO types and how to extract them
6. **Provide Navigation Tips**: Give guidance on programmatically accessing different sections

## Examples

- "How is the PTO Excel spreadsheet organized?"
- "Where is the calendar in the Excel file?"
- "How do I find the legend colors?"
- "What's the layout of the PTO calculation section?"
- "How are the dates structured in the calendar?"

## Additional Context

This skill integrates with the data-migration task and provides foundational knowledge for the ExcelJS-based migration implementation. It helps developers understand the source data structure before implementing extraction logic.

## Precise Spreadsheet Layout

### Legend Location

- **Coordinates**: Row 8, Column 27 (cell AA8)
- **Structure**: Vertical list starting with "Legend" header, followed by colored cells for each PTO type
- **PTO Types and Colors** (from sample "Corey Alix 2025.xlsx"):
  - Sick: FF00B050 (green)
  - Full PTO: FFFFFF00 (yellow)
  - Partial PTO: FFFFC000 (orange-yellow)
  - Planned PTO: FF00B0F0 (blue)
  - Bereavement: FFBFBFBF (gray)
  - Jury Duty: FFFF0000 (red)

### Calendar Layout

- **Coordinates**: B6:X37 (rows 6-37, columns 2-24)
- **Month Headers**: Located in row 4, with each month spanning multiple consecutive columns
- **Precise Month Locations** (from sample "Corey Alix 2025.xlsx"):
  - January: Row 4, Columns 4-6 (D4-F4)
  - February: Row 13, Columns 4-6 (D13-F13) - continued from row 4
  - March: Row 22, Columns 4-6 (D22-F22) - continued from row 4
  - April: Row 31, Columns 4-6 (D31-F31) - continued from row 4
  - May: Row 4, Columns 12-14 (L4-N4)
  - June: Row 13, Columns 12-14 (L13-N13) - continued from row 4
  - July: Row 22, Columns 12-14 (L22-N22) - continued from row 4
  - August: Row 31, Columns 12-14 (L31-N31) - continued from row 4
  - September: Row 4, Columns 20-22 (T4-V4)
  - October: Row 13, Columns 20-22 (T13-V13) - continued from row 4
  - November: Row 22, Columns 20-22 (T22-V22) - continued from row 4
  - December: Row 31, Columns 20-22 (T31-V31) - continued from row 4
- **Date Structure**: Each month occupies 3 columns horizontally, with dates flowing vertically within each month's column block (7 rows per week)
- **Cell Content**: Numbers 1-31 representing days, calculated using Excel array formulas with PTOYEAR variable

### PTO Calculation Section

- **Location**: Starts at row 39 (after "PTO CALCULATION SECTION" header)
- **Data Structure**: Monthly breakdown with columns for work days, daily rate, accrued hours, carryover, used hours, and remaining balance
- **Month Range**: January through December (12 months of PTO data)
- **Data Extraction**: Skip 2 header rows after section title, then parse monthly data rows

### Detailed PTO Calculation Data Section

- **Location**: D42-W53 (rows 42-53, columns 4-23)
- **Headers**: Located in rows 40-41 (two-row header structure)
- **Column Structure** (from sample "Corey Alix 2025.xlsx"):
  - **D-E (Work Days in Month)**: Number of work days in each month
  - **F-G (Daily Rate)**: Daily PTO accrual rate (e.g., 0.68, 0.71 hours per day)
  - **J (Available PTO)**: Total available PTO hours before usage
  - **L-M (Previous Month's Carryover)**: PTO hours carried over from previous month
  - **O-P (Subtotal PTO hours)**: Subtotal of accrued + carryover hours
  - **S-T (PTO hours per Month)**: PTO hours used/taken during the month
  - **V-W (Total Available PTO)**: Final available PTO balance after usage
- **Data Pattern**: Each row represents one month (January through December)
- **Calculation Logic**: Shows the detailed breakdown of PTO accrual, carryover, and usage calculations
- **Relationship**: This detailed section corresponds to the summary data in the main PTO calculation section above

### Acknowledgement Sections

- **Admin Acknowledgements**: Column Y (25), Rows 42-53
  - **Purpose**: Records admin approval/acknowledgement for each month's PTO data
  - **Sample Data**: "Mandi" (appears in all 12 rows)
  - **Structure**: One acknowledgement per month, corresponding to months in column B
- **Employee Acknowledgements**: Column X (24), Rows 42-53
  - **Purpose**: Records employee acknowledgement/approval for each month's PTO data
  - **Sample Data**: "CA" (Corey Alix, appears in all 12 rows)
  - **Structure**: One acknowledgement per month, corresponding to months in column B
- **Relationship**: Both acknowledgement columns align with the monthly data in the PTO calculation section

### Employee Information Section

- **Hire Date**: Cell R2 (Row 2, Column 18)
  - **Format**: "Hire Date: <date>"
  - **Sample Data**: "Hire Date: 2/13/23"
  - **Purpose**: Records the employee's hire date for HR and payroll purposes

### Color Coding System

- **Direct Cell Fills**: Colors are applied directly to calendar cells (no conditional formatting rules found)
- **Actual Usage in Sample**: Only yellow (FFFF00/FFFFFF00) is used for PTO days (24 cells total)
- **Color Extraction**: Use ExcelJS `cell.fill.fgColor.argb` or `cell.fill.fgColor.rgb` properties
- **Color Matching**: Normalize colors by removing alpha channel (FF prefix) for comparison

### Month Layout Pattern

- **Column Spanning**: Each month header appears in row 4 and spans exactly 3 consecutive columns
- **Row Continuation**: Month headers continue in rows 13, 22, and 31 for subsequent weeks of the same month
- **Date Flow**: Within each month's 3-column block, dates flow vertically (7 rows per week)
- **Year Coverage**: Full calendar year from January to December
- **PTO Distribution in Sample**:
  - January: 1 PTO day
  - May: 4 PTO days
  - September: 4 PTO days
  - Other months: Varies by employee schedule</content>
    <parameter name="filePath">/home/ca0v/code/ca0v/dwp-hours/.github/skills/pto-spreadsheet-layout/SKILL.md
