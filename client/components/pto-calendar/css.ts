export const PTO_TYPE_COLORS: Record<string, string> = {
  PTO: "var(--color-pto-vacation)",
  Sick: "var(--color-pto-sick)",
  Bereavement: "var(--color-pto-bereavement)",
  "Jury Duty": "var(--color-pto-jury-duty)",
};

export const styles = `
:host {
    display: block;
}

@media screen {
    .legend {
        gap: var(--space-xs) var(--space-sm);
    }
    .legend-item {
        gap: var(--space-lg);
    }
}

@media (max-width: 480px) {
    .legend {
        gap: var(--space-xs);
    }
    .legend-item {
        gap: var(--space-xs);
    }
}

.calendar {
    margin-top: var(--space-md);
    padding: var(--space-sm);
}

.calendar-header {
    text-align: center;
    text-transform: uppercase;
}

.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
}

.weekday {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-secondary);
    text-align: center;
}

.day {
    position: relative;
    aspect-ratio: 1;
    border: var(--border-width) var(--border-style-solid) var(--color-border);
    background: color-mix(in srgb, var(--color-surface) 85%, transparent);
    padding: var(--space-xs);
    font-size: clamp(var(--font-size-xs), 2vw, var(--font-size-sm));
    text-align: center;
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-width: max(3ch, --space-md);
    min-height: var(--space-md);
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
    box-shadow: var(--shadow-md);
}

.day.clickable:focus-visible,
.day.clickable:focus {
    box-shadow: 0 0 0 1px var(--color-focus);
}

.day.selected {
    outline: 2px solid var(--color-primary);
}

.day.today .date {
    opacity: 0.8;
    transform: scale(2);
}

.day .date {
    font-weight: var(--font-weight-semibold);
    color: var(--color-text);
}

.day .checkmark {
    position: absolute;
    top: 2px;
    right: 2px;
    color: var(--color-success);
    font-size: var(--font-size-sm);
    font-weight: bold;
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
    margin-top: var(--space-sm);
    font-size: var(--font-size-xs);
    color: var(--color-text-secondary);
}

.legend-item {
    display: inline-flex;
    align-items: center;
}

.legend-item.clickable {
    cursor: pointer;
    padding: var(--space-xs) var(--space-sm);
    border-radius: var(--border-radius);
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
    border: var(--border-width) solid var(--color-primary);
    font-weight: var(--font-weight-semibold);
}

.legend-swatch {
    width: 10px;
    height: 10px;
    border-radius: var(--border-radius-sm);
    border: var(--border-width) solid var(--color-border);
}

.submit-slot {
    margin-top: var(--space-md);
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
    opacity: 1;
}

.day.partial-day {
    opacity: 1;
}

/* Note indicator: small triangle in top-left corner */
.note-indicator {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    cursor: pointer;
    line-height: 1;
    z-index: 1;
    opacity: 0.7;
}

.note-indicator:hover {
    opacity: 1;
    transform: scale(1.3);
}

/* Superscript for partial-day hours */
.date sup.partial-hours {
    font-size: 0.65em;
    vertical-align: super;
    color: var(--color-text-secondary);
    font-weight: var(--font-weight-normal);
}

@media (prefers-reduced-motion: reduce) {
    .note-indicator:hover {
        transform: none;
    }
}
`;
