import { APIClient } from '../../APIClient.js';
import type { PTOYearReviewResponse } from '../../api-types.js';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PTO_TYPE_COLORS: Record<string, string> = {
    PTO: "var(--color-pto-vacation)",
    Sick: "var(--color-pto-sick)",
    Bereavement: "var(--color-pto-bereavement)",
    "Jury Duty": "var(--color-pto-jury-duty)",
    "Work Day": "var(--color-surface)"
};

export class PriorYearReview extends HTMLElement {
    private shadow: ShadowRoot;
    private api = new APIClient();
    private year: number;
    private data: PTOYearReviewResponse | null = null;
    private loading = false;
    private error: string | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.year = new Date().getFullYear() - 1; // Default to previous year
    }

    connectedCallback() {
        this.render();
        this.loadData();
    }

    private async loadData(): Promise<void> {
        this.loading = true;
        this.error = null;
        this.render();

        try {
            this.data = await this.api.getPTOYearReview(this.year);
        } catch (error) {
            console.error('Failed to load prior year review data:', error);
            this.error = 'Failed to load data. Please try again.';
        } finally {
            this.loading = false;
            this.render();
        }
    }

    private setYear(year: number): void {
        this.year = year;
        this.loadData();
    }

    private renderYearSelector(): string {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let y = currentYear - 1; y >= currentYear - 10; y--) {
            years.push(y);
        }

        return `
            <div class="year-selector">
                <label for="year-select">Prior Year:</label>
                <select id="year-select">
                    ${years.map(y => `<option value="${y}" ${y === this.year ? 'selected' : ''}>${y}</option>`).join('')}
                </select>
            </div>
        `;
    }

    private renderMonth(monthData: PTOYearReviewResponse['months'][0]): string {
        const monthName = monthNames[monthData.month - 1];
        const year = this.data!.year;

        // Create a simple calendar grid for the month
        const firstDay = new Date(year, monthData.month - 1, 1);
        const lastDay = new Date(year, monthData.month, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const calendarDays: { date: Date; isCurrentMonth: boolean; entry?: { type: string; hours: number } }[] = [];

        for (let d = new Date(startDate); d <= lastDay; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entriesForDate = monthData.ptoEntries.filter(e => e.date === dateStr);
            const isCurrentMonth = d.getMonth() === monthData.month - 1;

            let entry: { type: string; hours: number } | undefined;
            if (entriesForDate.length > 0) {
                // For simplicity, show the first entry or combine if multiple
                const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
                entry = { type: entriesForDate[0].type, hours: totalHours };
            }

            calendarDays.push({
                date: new Date(d),
                isCurrentMonth,
                entry
            });
        }

        const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // Short weekday names

        return `
            <div class="month-card">
                <div class="month-header">${monthName} ${year}</div>
                <div class="month-calendar">
                    <div class="calendar-header">
                        ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
                    </div>
                    <div class="calendar-grid">
                        ${calendarDays.map(({ date, isCurrentMonth, entry }) => {
            const dayClass = entry ? `day type-${entry.type.replace(/\s+/g, '-')}` : 'day';
            const emptyClass = isCurrentMonth ? '' : 'empty';
            const hoursDisplay = entry ? entry.hours.toFixed(0) : '';
            return `
                                <div class="${dayClass} ${emptyClass}">
                                    <div class="date">${date.getDate()}</div>
                                    ${hoursDisplay ? `<div class="hours">${hoursDisplay}</div>` : ''}
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
                <div class="month-summary">
                    <div class="summary-item">PTO: ${monthData.summary.ptoDays}</div>
                    <div class="summary-item">Sick: ${monthData.summary.sickDays}</div>
                    <div class="summary-item">Bereavement: ${monthData.summary.bereavementDays}</div>
                    <div class="summary-item">Jury Duty: ${monthData.summary.juryDutyDays}</div>
                </div>
            </div>
        `;
    }

    private render(): void {
        this.shadow.innerHTML = `
            <style>
                .container {
                    padding: 16px;
                }

                .year-selector {
                    margin-bottom: 16px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .year-selector label {
                    font-weight: 600;
                    color: var(--color-text);
                }

                .year-selector select {
                    padding: 4px 8px;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    background: var(--color-surface);
                    color: var(--color-text);
                }

                .loading {
                    text-align: center;
                    padding: 32px;
                    color: var(--color-text-secondary);
                }

                .error {
                    text-align: center;
                    padding: 32px;
                    color: var(--color-error);
                    background: var(--color-error-light);
                    border-radius: 8px;
                    margin: 16px 0;
                }

                .no-data {
                    text-align: center;
                    padding: 32px;
                    color: var(--color-text-secondary);
                }

                .months-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 16px;
                    max-width: 1200px;
                }

                .month-card {
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    background: var(--color-surface);
                    overflow: hidden;
                }

                .month-header {
                    font-weight: 600;
                    padding: 12px;
                    background: var(--color-surface-hover);
                    border-bottom: 1px solid var(--color-border);
                    text-align: center;
                }

                .month-calendar {
                    padding: 8px;
                }

                .calendar-header {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                    margin-bottom: 4px;
                }

                .weekday {
                    font-size: 10px;
                    font-weight: 600;
                    color: var(--color-text-secondary);
                    text-align: center;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 2px;
                }

                .day {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 4px;
                    background: var(--color-surface);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    font-size: 11px;
                    min-height: 24px;
                }

                .day.empty {
                    background: transparent;
                    border: none;
                }

                .day .date {
                    font-weight: 600;
                    color: var(--color-text);
                }

                .day .hours {
                    position: absolute;
                    bottom: 1px;
                    right: 2px;
                    font-size: 8px;
                    color: var(--color-text-secondary);
                    font-weight: 600;
                }

                .type-PTO { background: ${PTO_TYPE_COLORS.PTO}; }
                .type-Sick { background: ${PTO_TYPE_COLORS.Sick}; }
                .type-Bereavement { background: ${PTO_TYPE_COLORS.Bereavement}; }
                .type-Jury-Duty { background: ${PTO_TYPE_COLORS["Jury Duty"]}; }

                /* Make text white on colored backgrounds for better contrast */
                .type-PTO .date,
                .type-PTO .hours,
                .type-Sick .date,
                .type-Sick .hours,
                .type-Bereavement .date,
                .type-Bereavement .hours,
                .type-Jury-Duty .date,
                .type-Jury-Duty .hours {
                    color: white;
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
                }

                @media (max-width: 768px) {
                    .months-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="container">
                ${this.renderYearSelector()}

                ${this.loading ? `
                    <div class="loading">Loading prior year data...</div>
                ` : this.error ? `
                    <div class="error">${this.error}</div>
                ` : this.data ? (
                this.data.months.some(m => m.ptoEntries.length > 0) ? `
                        <div class="months-grid">
                            ${this.data.months.map(month => this.renderMonth(month)).join('')}
                        </div>
                    ` : `
                        <div class="no-data">No data found for ${this.year}</div>
                    `
            ) : ''}
            </div>
        `;

        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        const yearSelect = this.shadow.querySelector('#year-select') as HTMLSelectElement;
        if (yearSelect) {
            yearSelect.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                this.setYear(parseInt(target.value, 10));
            });
        }
    }
}

customElements.define('prior-year-review', PriorYearReview);