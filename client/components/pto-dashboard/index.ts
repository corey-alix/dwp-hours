type CalendarDay = {
    type: string;
    hours: number;
};

type CalendarData = Record<number, Record<number, CalendarDay>>;

type SummaryData = {
    annualAllocation: number;
    availablePTO: number;
    usedPTO: number;
    carryoverFromPreviousYear: number;
};

type AccrualData = {
    month: number;
    hours: number;
};

type UsageData = {
    month: number;
    hours: number;
};

type TimeBucketData = {
    allowed: number;
    used: number;
    remaining: number;
};

type EmployeeInfoData = {
    hireDate: string;
    nextRolloverDate: string;
};

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

class PtoSectionCard extends HTMLElement {
    protected shadow: ShadowRoot;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
    }

    protected renderCard(title: string, body: string): void {
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

                .card h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #2c3e50;
                }

                .card .row {
                    display: flex;
                    justify-content: space-between;
                    gap: 16px;
                    margin: 6px 0;
                    font-size: 14px;
                    color: #34495e;
                }

                .card .label {
                    font-weight: 600;
                }
            </style>
            <div class="card">
                <h4>${title}</h4>
                ${body}
            </div>
        `;
    }
}

export class PtoSummaryCard extends PtoSectionCard {
    private data: SummaryData | null = null;

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === "data") {
            this.data = JSON.parse(newValue) as SummaryData;
            this.render();
        }
    }

    set summary(value: SummaryData) {
        this.data = value;
        this.render();
    }

    private render() {
        if (!this.data) {
            this.renderCard("Regular PTO", "<div>Loading...</div>");
            return;
        }

        const body = `
            <div class="row"><span class="label">Annual Allocation</span><span>${this.data.annualAllocation} hours</span></div>
            <div class="row"><span class="label">Available</span><span>${this.data.availablePTO.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Used</span><span>${this.data.usedPTO.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Carryover</span><span>${this.data.carryoverFromPreviousYear.toFixed(2)} hours</span></div>
        `;

        this.renderCard("Regular PTO", body);
    }
}

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

    private renderCalendar() {
        if (!this.selectedMonth) {
            return "";
        }

        const monthIndex = this.selectedMonth - 1;
        const firstDay = new Date(this.year, monthIndex, 1);
        const daysInMonth = new Date(this.year, monthIndex + 1, 0).getDate();
        const startDay = firstDay.getDay();
        const cells: string[] = [];

        for (let i = 0; i < startDay; i += 1) {
            cells.push('<div class="day empty"></div>');
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const dayInfo = this.calendarData?.[this.selectedMonth]?.[day];
            const typeClass = dayInfo ? `type-${dayInfo.type.replace(/\s+/g, "-")}` : "";
            const hoursLabel = dayInfo ? `<span class="hours">${dayInfo.hours.toFixed(1)}</span>` : "";
            cells.push(`
                <div class="day ${typeClass}">
                    <span class="date">${day}</span>
                    ${hoursLabel}
                </div>
            `);
        }

        return `
            <div class="calendar">
                <div class="calendar-header">${monthNames[monthIndex]} ${this.year}</div>
                <div class="calendar-grid">
                    <div class="weekday">Sun</div>
                    <div class="weekday">Mon</div>
                    <div class="weekday">Tue</div>
                    <div class="weekday">Wed</div>
                    <div class="weekday">Thu</div>
                    <div class="weekday">Fri</div>
                    <div class="weekday">Sat</div>
                    ${cells.join("")}
                </div>
                <div class="legend">
                    ${Object.entries(PTO_TYPE_COLORS)
                .map(([type, color]) => `<span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>${type}</span>`)
                .join("")}
                </div>
            </div>
        `;
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
            ${this.renderCalendar()}
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

                .calendar {
                    margin-top: 16px;
                    border-top: 1px solid #eef0f2;
                    padding-top: 12px;
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

class SimplePtoBucketCard extends PtoSectionCard {
    private cardTitle: string;
    private data: TimeBucketData | null = null;

    constructor(title: string) {
        super();
        this.cardTitle = title;
    }

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === "data") {
            this.data = JSON.parse(newValue) as TimeBucketData;
            this.render();
        }
    }

    set bucket(value: TimeBucketData) {
        this.data = value;
        this.render();
    }

    protected render() {
        if (!this.data) {
            this.renderCard(this.cardTitle, "<div>Loading...</div>");
            return;
        }

        const body = `
            <div class="row"><span class="label">Allowed</span><span>${this.data.allowed} hours</span></div>
            <div class="row"><span class="label">Used</span><span>${this.data.used.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Remaining</span><span>${this.data.remaining.toFixed(2)} hours</span></div>
        `;

        this.renderCard(this.cardTitle, body);
    }
}

export class PtoSickCard extends SimplePtoBucketCard {
    constructor() {
        super("Sick Time");
    }

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
    }
}

export class PtoBereavementCard extends SimplePtoBucketCard {
    constructor() {
        super("Bereavement");
    }

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
    }
}

export class PtoJuryDutyCard extends SimplePtoBucketCard {
    constructor() {
        super("Jury Duty");
    }

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        super.attributeChangedCallback(name, oldValue, newValue);
    }
}

export class PtoEmployeeInfoCard extends PtoSectionCard {
    private data: EmployeeInfoData | null = null;

    static get observedAttributes() {
        return ["data"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, _oldValue: string, newValue: string) {
        if (name === "data") {
            this.data = JSON.parse(newValue) as EmployeeInfoData;
            this.render();
        }
    }

    set info(value: EmployeeInfoData) {
        this.data = value;
        this.render();
    }

    private render() {
        if (!this.data) {
            this.renderCard("Employee Information", "<div>Loading...</div>");
            return;
        }

        const body = `
            <div class="row"><span class="label">Hire Date</span><span>${this.data.hireDate}</span></div>
            <div class="row"><span class="label">Next Rollover</span><span>${this.data.nextRolloverDate}</span></div>
        `;

        this.renderCard("Employee Information", body);
    }
}

customElements.define("pto-section-card", PtoSectionCard);
customElements.define("pto-summary-card", PtoSummaryCard);
customElements.define("pto-accrual-card", PtoAccrualCard);
customElements.define("pto-sick-card", PtoSickCard);
customElements.define("pto-bereavement-card", PtoBereavementCard);
customElements.define("pto-jury-duty-card", PtoJuryDutyCard);
customElements.define("pto-employee-info-card", PtoEmployeeInfoCard);
