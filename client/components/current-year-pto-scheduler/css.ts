const PTO_TYPE_COLORS: Record<string, string> = {
  PTO: "var(--color-pto-vacation)",
  Sick: "var(--color-pto-sick)",
  Bereavement: "var(--color-pto-bereavement)",
  "Jury Duty": "var(--color-pto-jury-duty)",
  "Work Day": "var(--color-surface)",
};

export const styles = `
.months-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-sm);
}

@media (min-width: 480px) {
    .months-grid {
        grid-template-columns: repeat(1, 1fr);
    }
}

@media (min-width: 720px) {
    .months-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 960px) {
    .months-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1200px) {
    .months-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

@media (min-width: 1600px) {
    .months-grid {
        grid-template-columns: repeat(6, 1fr);
    }
}

.month-card {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr auto; /* Calendar takes available space, summary docks at bottom */
}

.month-summary {
    display: flex;
    justify-content: space-around;
    padding: 8px;
    background: var(--color-surface-hover);
    border-top: 1px solid var(--color-border);
    font-size: 12px;
    color: var(--color-text-secondary);
}

.summary-item {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.summary-label {
    font-size: 10px;
    margin-bottom: 2px;
}

.summary-value {
    font-size: 12px;
    font-weight: 400;
}

/* Color consistency: summary values use black text for better contrast */
.summary-pto { color: black; }
.summary-sick { color: black; }
.summary-bereavement { color: black; }
.summary-jury-duty { color: black; }

/* Visual hierarchy: larger font for non-zero values */
.summary-pto,
.summary-sick,
.summary-bereavement,
.summary-jury-duty {
    font-size: 14px;
    font-weight: 600;
}

.submit-section {
    text-align: center;
    padding: 16px;
    border-top: 1px solid var(--color-border);
    margin-top: 16px;
}

.submit-button {
    background: var(--color-primary);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 4px;
    font-size: 16px;
    cursor: pointer;
}

.submit-button:hover {
    background: var(--color-primary-hover);
}

.no-data {
    text-align: center;
    padding: 32px;
    color: var(--color-text-secondary);
}

`;
