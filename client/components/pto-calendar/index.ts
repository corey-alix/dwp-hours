import { PtoEntry } from "../../../src/entities/index.js";

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

const PTO_TYPE_COLORS: Record<string, string> = {
    PTO: "#FFFF00",
    Sick: "#00B050",
    Bereavement: "#BFBFBF",
    "Jury Duty": "#FF0000",
    "Planned PTO": "#00B0F0"
};

export interface CalendarEntry {
    date: string;
    hours: number;
    type: string;
}

export class PtoCalendar extends HTMLElement {
    private shadow: ShadowRoot;
    private month: number;
    private year: number;
    private entries: CalendarEntry[];
    private selectedMonth: number | null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        this.month = 0;
        this.year = 0;
        this.entries = [];
        this.selectedMonth = null;
    }

    static get observedAttributes() {
        return ['month', 'year', 'entries', 'selected-month'];
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue === newValue) return;

        switch (name) {
            case 'month':
                this.month = parseInt(newValue, 10);
                break;
            case 'year':
                this.year = parseInt(newValue, 10);
                break;
            case 'entries':
                try {
                    this.entries = JSON.parse(newValue);
                } catch (e) {
                    this.entries = [];
                }
                break;
            case 'selected-month':
                this.selectedMonth = newValue === 'null' ? null : parseInt(newValue, 10);
                break;
        }
        this.render();
    }

    setMonth(month: number) {
        this.month = month;
        this.setAttribute('month', month.toString());
    }

    setYear(year: number) {
        this.year = year;
        this.setAttribute('year', year.toString());
    }

    setEntries(entries: CalendarEntry[]) {
        this.entries = entries;
        this.setAttribute('entries', JSON.stringify(entries));
    }

    setSelectedMonth(selectedMonth: number | null) {
        this.selectedMonth = selectedMonth;
        this.setAttribute('selected-month', selectedMonth === null ? 'null' : selectedMonth.toString());
    }

    private renderCalendar(): string {
        const firstDay = new Date(this.year, this.month, 1);
        const lastDay = new Date(this.year, this.month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

        const calendarDays: { date: Date; isCurrentMonth: boolean; entry?: CalendarEntry }[] = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            const entry = this.entries.find(e => e.date === dateStr);
            calendarDays.push({
                date: new Date(d),
                isCurrentMonth: d.getMonth() === this.month,
                entry
            });
        }

        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return `
            <div class="calendar">
                <div class="calendar-header">
                    ${monthNames[this.month]} ${this.year}
                </div>
                <div class="calendar-grid">
                    ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
                    ${calendarDays.map(({ date, isCurrentMonth, entry }) => {
            const dayClass = entry ? `day type-${entry.type.replace(/\s+/g, '-')}` : 'day';
            const emptyClass = isCurrentMonth ? '' : 'empty';
            return `
                            <div class="${dayClass} ${emptyClass}">
                                <div class="date">${date.getDate()}</div>
                                ${entry ? `<div class="hours">${entry.hours.toFixed(1)}</div>` : ''}
                            </div>
                        `;
        }).join('')}
                </div>
                <div class="legend">
                    ${Object.entries(PTO_TYPE_COLORS).map(([type, color]) => `
                        <div class="legend-item">
                            <div class="legend-swatch" style="background: ${color}"></div>
                            <span>${type}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                .calendar {
                    margin-top: 16px;
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
                    font-size: 11px;
                    font-weight: 600;
                    color: #6c757d;
                    text-align: center;
                }

                .day {
                    position: relative;
                    min-height: 50px;
                    border-radius: 6px;
                    background: #f8f9fa;
                    padding: 4px;
                    font-size: 12px;
                }

                .day.empty {
                    background: transparent;
                    border: none;
                }

                .day .date {
                    font-weight: 600;
                    color: #34495e;
                }

                .day .hours {
                    position: absolute;
                    bottom: 4px;
                    right: 6px;
                    font-size: 10px;
                    color: #2c3e50;
                }

                .type-PTO { background: ${PTO_TYPE_COLORS.PTO}; }
                .type-Sick { background: ${PTO_TYPE_COLORS.Sick}; }
                .type-Bereavement { background: ${PTO_TYPE_COLORS.Bereavement}; }
                .type-Jury-Duty { background: ${PTO_TYPE_COLORS["Jury Duty"]}; }
                .type-Planned-PTO { background: ${PTO_TYPE_COLORS["Planned PTO"]}; }

                .legend {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px 12px;
                    margin-top: 12px;
                    font-size: 12px;
                    color: #6c757d;
                }

                .legend-item {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                }

                .legend-swatch {
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    border: 1px solid #d0d7de;
                }
            </style>
            ${this.renderCalendar()}
        `;
    }
}

customElements.define('pto-calendar', PtoCalendar);