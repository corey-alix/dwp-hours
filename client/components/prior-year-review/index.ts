import type { PTOYearReviewResponse } from '../../api-types.js';
import { parseDate, addDays, getCalendarStartDate, isInMonth, compareDates } from '../../../shared/dateUtils.js';

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
    private _data: PTOYearReviewResponse | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    get data(): PTOYearReviewResponse | null {
        return this._data;
    }

    set data(value: PTOYearReviewResponse | null) {
        this._data = value;
        this.render();
    }

    connectedCallback() {
        this.render();
    }



    private renderMonth(monthData: PTOYearReviewResponse['months'][0]): string {
        const monthName = monthNames[monthData.month - 1];
        const year = this.data!.year;

        // Create a calendar grid that always shows 6 weeks (42 days) for consistent height
        const startDateStr = getCalendarStartDate(year, monthData.month);
        const endDateStr = addDays(startDateStr, 41); // 6 weeks * 7 days - 1 = 41 days to add for 42 total days

        const calendarDays: { dateStr: string; isCurrentMonth: boolean; entry?: { type: string; hours: number } }[] = [];

        let currentDateStr = startDateStr;
        while (compareDates(currentDateStr, endDateStr) <= 0) {
            const entriesForDate = monthData.ptoEntries.filter(e => e.date === currentDateStr);
            const isCurrentMonth = isInMonth(currentDateStr, year, monthData.month);

            let entry: { type: string; hours: number } | undefined;
            if (entriesForDate.length > 0) {
                // For simplicity, show the first entry or combine if multiple
                const totalHours = entriesForDate.reduce((sum, e) => sum + e.hours, 0);
                entry = { type: entriesForDate[0].type, hours: totalHours };
            }

            calendarDays.push({
                dateStr: currentDateStr,
                isCurrentMonth,
                entry
            });
            currentDateStr = addDays(currentDateStr, 1);
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
                        ${calendarDays.map(({ dateStr, isCurrentMonth, entry }) => {
            const dayClass = entry ? `day type-${entry.type.replace(/\s+/g, '-')}` : 'day';
            const emptyClass = isCurrentMonth ? '' : 'empty';
            const hoursDisplay = entry ? entry.hours.toFixed(0) : '';
            const dayNumber = parseDate(dateStr).day;
            return `
                                <div class="${dayClass} ${emptyClass}">
                                    <div class="date">${dayNumber}</div>
                                    ${hoursDisplay ? `<div class="hours">${hoursDisplay}</div>` : ''}
                                </div>
                            `;
        }).join('')}
                    </div>
                </div>
                <div class="month-summary">
                    <div class="summary-item">
                        <span class="summary-label">PTO:</span>
                        <span class="summary-value ${monthData.summary.ptoHours > 0 ? 'summary-pto' : ''}">${monthData.summary.ptoHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Sick:</span>
                        <span class="summary-value ${monthData.summary.sickHours > 0 ? 'summary-sick' : ''}">${monthData.summary.sickHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Bereavement:</span>
                        <span class="summary-value ${monthData.summary.bereavementHours > 0 ? 'summary-bereavement' : ''}">${monthData.summary.bereavementHours}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Jury Duty:</span>
                        <span class="summary-value ${monthData.summary.juryDutyHours > 0 ? 'summary-jury-duty' : ''}">${monthData.summary.juryDutyHours}</span>
                    </div>
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

                .no-data {
                    text-align: center;
                    padding: 32px;
                    color: var(--color-text-secondary);
                }

                .months-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                    gap: 16px;
                    max-width: 1540px;
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
                    opacity: 0;
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

                /* Color consistency: summary values match calendar day colors */
                .summary-pto { color: ${PTO_TYPE_COLORS.PTO}; }
                .summary-sick { color: ${PTO_TYPE_COLORS.Sick}; }
                .summary-bereavement { color: ${PTO_TYPE_COLORS.Bereavement}; }
                .summary-jury-duty { color: ${PTO_TYPE_COLORS["Jury Duty"]}; }

                /* Visual hierarchy: larger font for non-zero values */
                .summary-pto,
                .summary-sick,
                .summary-bereavement,
                .summary-jury-duty {
                    font-size: 14px;
                    font-weight: 600;
                }

                @media (max-width: 768px) {
                    .months-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>

            <div class="container">
                ${this.data ? (
                this.data.months.some(m => m.ptoEntries.length > 0) ? `
                        <div class="months-grid">
                            ${this.data.months.map(month => this.renderMonth(month)).join('')}
                        </div>
                    ` : `
                        <div class="no-data">No data available</div>
                    `
            ) : `
                <div class="no-data">No data available</div>
            `}
            </div>
        `;

        this.attachEventListeners();
    }

    private attachEventListeners(): void {
        // No event listeners needed for this component
    }
}

customElements.define('prior-year-review', PriorYearReview);