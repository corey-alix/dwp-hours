import { PtoSectionCard, monthNames } from "../utils/pto-card-base.js";
import { PtoCalendar, CalendarEntry } from "../pto-calendar/index.js";
import { getWorkDays, getTotalWorkDaysInYear, getAllocationRate } from "../../../src/workDays.js";

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
    private _requestMode: boolean = false;
    private _annualAllocation: number = 96; // Default 96 hours annual PTO

    static get observedAttributes() {
        return ["accruals", "usage", "calendar", "year", "request-mode", "annual-allocation"];
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
        if (name === "request-mode") {
            this._requestMode = newValue === "true";
        }
        if (name === "annual-allocation") {
            this._annualAllocation = parseFloat(newValue) || 96;
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

    set requestMode(value: boolean) {
        this._requestMode = value;
        this.setAttribute("request-mode", value.toString());
    }

    set annualAllocation(value: number) {
        this._annualAllocation = value;
        this.setAttribute("annual-allocation", value.toString());
    }

    private render() {
        // Create maps for quick lookup
        const accrualByMonth = new Map(this.accruals.map((entry) => [entry.month, entry.hours]));
        const usageByMonth = new Map(this.usage.map((entry) => [entry.month, entry.hours]));

        // Generate rows for all 12 months
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-based
        const currentYear = currentDate.getFullYear();

        // Calculate PTO rate for projected accruals
        const totalWorkDaysInYear = getTotalWorkDaysInYear(this.year);
        const ptoRate = this._annualAllocation / totalWorkDaysInYear;

        const rows = Array.from({ length: 12 }, (_, i) => {
            const month = i + 1; // 1-based month
            const monthName = monthNames[month - 1];
            const accruedHours = accrualByMonth.get(month);
            const usedHours = usageByMonth.get(month);

            // Determine if this is a future month for projected data
            const isFutureMonth = this.year > currentYear || (this.year === currentYear && month > currentMonth);
            const isCurrentMonth = this.year === currentYear && month === currentMonth;

            // Calculate projected accrual for future months
            let displayAccrued: string;
            if (accruedHours !== undefined) {
                displayAccrued = accruedHours.toFixed(1);
            } else if (isFutureMonth) {
                const workDaysInMonth = getWorkDays(this.year, month);
                const projectedAccrual = ptoRate * workDaysInMonth;
                displayAccrued = `${projectedAccrual.toFixed(1)}`; // css renders the ~ for future dates
            } else {
                displayAccrued = "0.0";
            }

            return `
                <div class="accrual-row ${isFutureMonth ? 'projected' : ''} ${isCurrentMonth ? 'current' : ''}">
                    <span class="month">${monthName}</span>
                    <span class="hours">${displayAccrued}</span>
                    <span class="used">${usedHours !== undefined ? usedHours.toFixed(1) : "—"}</span>
                    <button class="calendar-button ${this._requestMode ? 'request-mode' : ''}" data-month="${month}" aria-label="${this._requestMode ? 'Request PTO for' : 'Show'} ${monthName} calendar">${this._requestMode ? '✏️' : '📅'}</button>
                </div>
            `;
        }).join("");

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
                <div class="accrual-row header">
                    <span></span>
                    <span class="label">Accrued</span>
                    <span class="label">Used</span>
                    <span></span>
                </div>
                ${rows}
            </div>
            ${this.selectedMonth ? `<pto-calendar month="${this.selectedMonth - 1}" year="${this.year}" entries='${JSON.stringify(calendarEntries)}' selected-month="${this.selectedMonth}" readonly="${!this._requestMode}">
                ${this._requestMode ? '<button slot="submit" class="submit-button">Submit PTO Request</button>' : ''}
            </pto-calendar>` : ''}
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
                    grid-template-columns: 1fr auto auto auto;
                    gap: 8px 12px;
                }

                .accrual-row {
                    display: grid;
                    grid-template-columns: subgrid;
                    grid-column: 1 / -1;
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

                .accrual-row.projected {
                    opacity: 0.7;
                }

                .accrual-row.projected .hours::before {
                    content: "~";
                    opacity: 0.6;
                }

                .accrual-row.current {
                    background: #e8f4fd;
                    border-radius: 4px;
                    padding: 4px 8px;
                    margin: 0 -8px;
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

                .calendar-button.request-mode {
                    background: #007bff;
                    color: white;
                }

                .calendar-button.request-mode:hover {
                    background: #0056b3;
                }

                .empty {
                    color: #6c757d;
                    font-size: 13px;
                }

                .submit-button {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }

                .submit-button:hover {
                    background: #0056b3;
                }

                .submit-button:disabled {
                    background: #6c757d;
                    cursor: not-allowed;
                }
            </style>
            <div class="card">
                <h4>${this._requestMode ? 'PTO Request - Select Month' : 'Monthly Accrual Breakdown'}</h4>
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

        // Handle PTO request submission
        const calendar = this.shadow.querySelector('pto-calendar') as any;
        if (calendar) {
            calendar.addEventListener('pto-request-submit', (e: any) => {
                console.log('PtoAccrualCard received pto-request-submit event from calendar:', e.detail);
                e.stopPropagation();
                this.handlePtoRequestSubmit(e.detail.requests);
            });
        }
    }

    private async handlePtoRequestSubmit(requests: CalendarEntry[]) {
        console.log('PtoAccrualCard.handlePtoRequestSubmit called with requests:', requests);
        try {
            // Dispatch event to parent component for API submission
            const event = new CustomEvent('pto-request-submit', {
                detail: { requests },
                bubbles: true,
                composed: true
            });
            console.log('PtoAccrualCard dispatching pto-request-submit event:', event);
            this.dispatchEvent(event);
        } catch (error) {
            console.error('Error submitting PTO request:', error);
            // Could add error display here
        }
    }
}

customElements.define("pto-accrual-card", PtoAccrualCard);