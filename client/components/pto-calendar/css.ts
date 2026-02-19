export const PTO_TYPE_COLORS: Record<string, string> = {
  PTO: "var(--color-pto-vacation)",
  Sick: "var(--color-pto-sick)",
  Bereavement: "var(--color-pto-bereavement)",
  "Jury Duty": "var(--color-pto-jury-duty)",
  "Work Day": "var(--color-surface)",
};

export const styles = `
:host {
    display: block;
}

@media (max-width: 320px) {
    .calendar {
        transform: scale(var(--scale-factor, 0.8));
        transform-origin: top left;
    }
}

.calendar {
    margin-top: 16px;
    padding: var(--space-sm);
}

.calendar-header {
    font-weight: 600;
    margin-bottom: 8px;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.weekday {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-align: center;
}

.day {
    position: relative;
    aspect-ratio: 1;
    border: var(--border-width) var(--border-style-solid) var(--color-border);
    border-radius: 6px;
    background: var(--color-surface);
    padding: var(--space-xs);
    font-size: clamp(var(--font-size-xs), 2vw, var(--font-size-sm));
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: 3ch;
}

.day.empty {
    background: transparent;
    border: none;
    visibility: hidden;
}

.day.clickable {
    cursor: pointer;
}

.day.clickable:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

.day.clickable:focus-visible,
.day.clickable:focus {
    box-shadow: 0 0 0 1px var(--color-focus);
}

.day.selected {
    border: 2px solid var(--color-primary);
    box-shadow: 0 0 0 2px rgb(59 130 246 / 25%);
}

.day .date {
    font-weight: 600;
    color: var(--color-text);
}

.day .checkmark {
    position: absolute;
    top: 2px;
    right: 2px;
    color: var(--color-success);
    font-size: var(--font-size-sm);
    font-weight: bold;
    z-index: 1;
}

.day .hours {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: clamp(var(--font-size-xs), 2vw, var(--font-size-sm));
    color: var(--color-text-secondary);
}

.type-PTO { /* No background - type indicated by hours color */ }

.type-Sick { /* No background - type indicated by hours color */ }

.type-Bereavement { /* No background - type indicated by hours color */ }

.type-Jury-Duty { /* No background - type indicated by hours color */ }

.type-Work-Day { background: ${PTO_TYPE_COLORS["Work Day"]}; border: 1px solid var(--color-border); }

/* Make text adapt to theme for better contrast */
.type-PTO .date,
.type-Sick .date,
.type-Bereavement .date,
.type-Jury-Duty .date {
    color: var(--color-text);
}

/* Make hours text indicate PTO type with color */
.type-PTO .hours { color: ${PTO_TYPE_COLORS.PTO}; }
.type-Sick .hours { color: ${PTO_TYPE_COLORS.Sick}; }
.type-Bereavement .hours { color: ${PTO_TYPE_COLORS.Bereavement}; }
.type-Jury-Duty .hours { color: ${PTO_TYPE_COLORS["Jury Duty"]}; }

/* Clearing state: day selected with 0 hours to unschedule */
.day.clearing {
    background: var(--color-surface);
    opacity: 0.6;
}

.day.clearing .date {
    text-decoration: line-through;
    color: var(--color-text-secondary);
}

.hours-clearing {
    color: var(--color-pto-sick);
    font-weight: 600;
}

.legend {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    margin-top: 12px;
    font-size: 12px;
    color: var(--color-text-secondary);
}

.legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.legend-item.clickable {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
}

.legend-item.clickable:hover {
    background: var(--color-surface-hover);
    transform: scale(1.05);
}

.legend-item.clickable:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}

.legend-item.selected {
    background: var(--color-primary-light);
    border: 1px solid var(--color-primary);
    font-weight: 600;
}

.legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    border: 1px solid var(--color-border);
}

.submit-slot {
    margin-top: 16px;
    text-align: center;
}

@keyframes day-pulse {
    0% { box-shadow: 0 0 0 0 rgb(59 130 246 / 40%); }
    50% { box-shadow: 0 0 0 4px rgb(59 130 246 / 20%); }
    100% { box-shadow: 0 0 0 0 rgb(59 130 246 / 0%); }
}

.day-changed {
    animation: day-pulse 200ms ease-out;
}

.hours-full {
    opacity: 1;
}

.hours-partial {
    opacity: 0.6;
}

.day.partial-day {
    opacity: 0.75;
}
`;
