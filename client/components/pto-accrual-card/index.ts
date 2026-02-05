import { PtoSectionCard, monthNames } from "../utils/pto-card-base.js";
import { PtoCalendar, CalendarEntry } from "../pto-calendar/index.js";

type CalendarData = Record<number, Record<number, { type: string; hours: number }>>;

type AccrualData = {
    month: number;
    hours: number;
};

type UsageData = {
    month: number;
    hours: number;
};

export class PtoAccrualCard extends PtoSectionCard {
    private accruals: AccrualData[] = [];
    private usage: UsageData[] = [];
    private calendarData: CalendarData = {};
    private selectedMonth: number | null = null;
    private year: number = new Date().getFullYear();

    static get observedAttributes() {
        return ["accruals", "usage", "calendar", "year"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === "accruals") {
            this.accruals = JSON.parse(newValue) as AccrualData[];
        }
        if (name === "usage") {
            this.usage = JSON.parse(newValue) as UsageData[];
        }
        if (name === "calendar") {
            this.calendarData = JSON.parse(newValue) as CalendarData;
        }
        if (name === "year") {
            this.year = parseInt(newValue, 10) || this.year;
        }
        this.render();
    }

    set monthlyAccruals(value: AccrualData[]) {
        this.accruals = value;
        this.render();
    }

    set monthlyUsage(value: UsageData[]) {
        this.usage = value;
        this.render();
    }

    set calendar(value: CalendarData) {
        this.calendarData = value;
        this.render();
    }

    set calendarYear(value: number) {
        this.year = value;
        this.render();
    }

    private render() {
        const usageByMonth = new Map(this.usage.map((entry) => [entry.month, entry.hours]));
        const rows = this.accruals
            .map((accrual) => {
                const monthName = monthNames[accrual.month - 1] ?? `Month ${accrual.month}`;
                const usedHours = usageByMonth.get(accrual.month);
                return `
                    <div class="accrual-row">
                        <span class="month">${monthName}</span>
                        <span class="hours">${accrual.hours.toFixed(1)}</span>
                        <span class="used">${usedHours !== undefined ? usedHours.toFixed(1) : "—"}</span>
                        <button class="calendar-button" data-month="${accrual.month}" aria-label="Show ${monthName} calendar">📅</button>
                    </div>
                `;
            })
            .join("");

        // Convert calendarData to CalendarEntry format for the calendar component
        const calendarEntries: CalendarEntry[] = [];
        if (this.selectedMonth && this.calendarData[this.selectedMonth]) {
            Object.entries(this.calendarData[this.selectedMonth]).forEach(([day, entry]) => {
                const dateStr = `${this.year}-${String(this.selectedMonth).padStart(2, '0')}-${String(parseInt(day, 10)).padStart(2, '0')}`;
                calendarEntries.push({
                    date: dateStr,
                    hours: entry.hours,
                    type: entry.type
                });
            });
        }

        const body = `
            <div class="accrual-grid">
                ${rows ? `
                    <div class="accrual-row header">
                        <span></span>
                        <span class="label">Accrued</span>
                        <span class="label">Used</span>
                        <span></span>
                    </div>
                    ${rows}
                ` : '<div class="empty">No accrual data available.</div>'}
            </div>
            ${this.selectedMonth ? `<pto-calendar month="${this.selectedMonth - 1}" year="${this.year}" entries='${JSON.stringify(calendarEntries)}' selected-month="${this.selectedMonth}"></pto-calendar>` : ''}
        `;

        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                }

                .card {
                    background: #ffffff;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 16px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
                }

                h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #2c3e50;
                }

                .accrual-grid {
                    display: grid;
                    gap: 8px;
                }

                .accrual-row {
                    display: grid;
                    grid-template-columns: 1fr auto auto auto;
                    gap: 12px;
                    align-items: center;
                    font-size: 14px;
                    color: #34495e;
                }

                .accrual-row.header {
                    font-size: 12px;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: #6c757d;
                }

                .accrual-row.header .label {
                    text-align: right;
                }

                .accrual-row .month {
                    font-weight: 600;
                }

                .accrual-row .hours,
                .accrual-row .used {
                    text-align: right;
                }

                .calendar-button {
                    border: none;
                    background: #f2f4f7;
                    border-radius: 6px;
                    padding: 4px 8px;
                    cursor: pointer;
                }

                .empty {
                    color: #6c757d;
                    font-size: 13px;
                }
            </style>
            <div class="card">
                <h4>Monthly Accrual Breakdown</h4>
                ${body}
            </div>
        `;

        this.shadow.querySelectorAll<HTMLButtonElement>(".calendar-button").forEach((button) => {
            button.addEventListener("click", () => {
                const month = parseInt(button.dataset.month || "", 10);
                this.selectedMonth = Number.isFinite(month) ? month : null;
                this.render();
            });
        });
    }
}

customElements.define("pto-accrual-card", PtoAccrualCard);