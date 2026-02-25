## Spreadsheet tweaks...

### Current Layout (after initial migration)

| VALUE                      | LOCATION  | ROWS  | NOTES                                                                                            |
| -------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------ |
| Current Year               | B2–C2     | 2     | Bold, 14pt, merged 2 cols                                                                        |
| "PTO Form"                 | D2        | 2     | Bold, 14pt                                                                                       |
| Employee Name              | J-P       | 2     | Bold, 14pt, center-justified                                                                     |
| Hire Date                  | R-X       | 2     | "Hire Date: YYYY-MM-DD", right-justified                                                         |
| Month (label)              | B–C       | 43–54 | Merged 2 cols                                                                                    |
| Work Days in Month         | D–E       | 43–54 | Merged 2 cols                                                                                    |
| Daily Rate                 | F–G       | 43–54 | Merged 2 cols                                                                                    |
| Accrued PTO                | J–K       | 43–54 | Merged 2 cols                                                                                    |
| Previous Month's Carryover | L–M       | 43–54 | Merged 2 cols                                                                                    |
| Subtotal PTO hours         | O–P       | 43–54 | Merged 2 cols                                                                                    |
| PTO hours per Month        | S–T       | 43–54 | Merged 2 cols                                                                                    |
| Total Available PTO        | V–W       | 43–54 | Merged 2 cols                                                                                    |
| Employee Ack               | X         | 43–54 | Single col, clip the header text so the column width is maintained, just place employee initials |
| Admin Ack                  | Y         | 43–54 | Single col                                                                                       |
| Legend header              | Z–AA      | 8     | Merged 2 cols                                                                                    |
| Legend entries             | Z–AA      | 9–14  | Merged 2 cols per entry                                                                          |
| "Sick Hours Allowed"       | Y–AA      | 32    | Merged 3 cols (label)                                                                            |
| Sick Hours Allowed         | AB        | 32    | Single col (value)                                                                               |
| "Sick Hours Used"          | Y–AA      | 33    | Merged 3 cols (label)                                                                            |
| Sick Hours Used            | AB        | 33    | Single col (value)                                                                               |
| "Sick Hours Remaining"     | Y–AA      | 34    | Merged 3 cols (label)                                                                            |
| Sick Hours Remaining       | AB        | 34    | Single col (value)                                                                               |
| PTO Calc Section Header    | B–W       | 40    | Merged, bold, centered                                                                           |
| PTO Calc Column Headers    | B–W + X–Y | 41–42 | Two-row merged header                                                                            |
| PTO Calc Data & Totals     | B–W       | 43–55 | All numeric values right-justified, font size 9                                                  |
| PTO Calc Totals            | B–W       | 55    | Sums row                                                                                         |

## Cover Sheet Tab

| VALUE                       | LOCATION | ROWS | NOTES                 |
| --------------------------- | -------- | ---- | --------------------- |
| "Summary of PTO Hours"      | B2-N3    | 2    | Bold, 14pt            |
| "January 2025"              | C5       | 1    | -                     |
| "December 2025"             | N5       | 1    | -                     |
| "Negative PTO Hours"        | O3-O4    | 2    | mild red background   |
| "Amount of PTO Hours of 80" | P3-P4    | 2    | mild green background |
| Employee Name               | B5-B54   | 50   | Bold, 14pt            |
| PTO Hours (Jan 2025)        | C5-C54   | 50   | -                     |
| PTO Hours (Dec 2025)        | N5-N54   | 50   | -                     |

If the employee has negative PTO hours, the "Negative PTO Hours" cell should be highlighted with a mild red background.
For for the first employee, this would be written into cell O5, and for the second employee, it would be written into cell O6, and so on.

If the employee has 80 or more PTO hours, the "Amount of PTO Hours of 80" cell should be highlighted with a mild green background.
For the first employee, this would be written into cell P5, and for the second employee, it would be written into cell P6, and so on.
