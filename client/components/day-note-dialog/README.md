# `<day-note-dialog>` Component

Modal dialog for adding or editing a note and custom hours on a PTO calendar day cell.

## Usage

```typescript
import { DayNoteDialog } from "./index.js";

const dialog = new DayNoteDialog();
dialog.date = "2026-02-10";
dialog.currentNote = "Doctor appointment";
dialog.currentHours = 4;
document.body.appendChild(dialog);
```

## Properties

| Property       | Type     | Description                            |
| -------------- | -------- | -------------------------------------- |
| `date`         | `string` | YYYY-MM-DD string for the target day   |
| `currentNote`  | `string` | Pre-existing note text (empty for new) |
| `currentHours` | `number` | Pre-existing hours value               |

## Events

| Event             | Detail                  | Description                        |
| ----------------- | ----------------------- | ---------------------------------- |
| `day-note-save`   | `{ date, note, hours }` | Fired on save with validated data  |
| `day-note-cancel` | —                       | Fired on cancel / overlay / Escape |

## Validation Rules

- **Hours must be numeric** — NaN values are rejected with an inline error message.
- **Negative hours only on non-working days** — Attempting to enter negative hours on a weekday shows a validation error. Weekends and holidays allow negative hours (representing worked-day credits).

## Interaction

- **Save**: Click "Save" button
- **Cancel**: Click "Cancel" button, click overlay backdrop, or press Escape
- **Focus trap**: Textarea receives focus on open via `requestAnimationFrame`

## Integration with `<pto-calendar>`

The dialog is lazily imported by `PtoCalendar` on first use. It opens via:

- Clicking the edit-note ghost icon (▾) in the top-left corner of a day cell
- Clicking an existing note indicator
- Long-pressing (500ms) any current-month day cell

On save, the calendar stores the note in its `_selectedNotes` map and includes it in `getSelectedRequests()` output for submission.
