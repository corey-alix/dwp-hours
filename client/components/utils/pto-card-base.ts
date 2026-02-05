export const monthNames = [
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

export class PtoSectionCard extends HTMLElement {
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

export class SimplePtoBucketCard extends PtoSectionCard {
    private cardTitle: string;
    private data: any = null;
    private entries: any[] = [];

    constructor(title: string) {
        super();
        this.cardTitle = title;
    }

    static get observedAttributes() {
        return ["data", "entries"];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (name === "data") {
            this.data = JSON.parse(newValue);
            this.render();
        }
        if (name === "entries") {
            this.entries = JSON.parse(newValue);
            this.render();
        }
    }

    set bucket(value: any) {
        this.data = value;
        this.render();
    }

    set usageEntries(value: any[]) {
        this.entries = value;
        this.render();
    }

    protected render() {
        if (!this.data) {
            this.renderCard(this.cardTitle, "<div>Loading...</div>");
            return;
        }

        const rows = this.entries
            .map((entry: any) => {
                const [year, month, day] = entry.date.split('-').map(Number);
                const parsedDate = new Date(year, month - 1, day);
                const label = Number.isNaN(parsedDate.getTime())
                    ? entry.date
                    : parsedDate.toLocaleDateString();
                return `<li><span>${label}</span><span>${entry.hours.toFixed(1)} hours</span></li>`;
            })
            .join("");

        const list = rows
            ? `<ul class="usage-list">${rows}</ul>`
            : `<div class="empty">No entries recorded.</div>`;

        const body = `
            <div class="row"><span class="label">Allowed</span><span>${this.data.allowed} hours</span></div>
            <div class="row"><span class="label">Used</span><span>${this.data.used.toFixed(2)} hours</span></div>
            <div class="row"><span class="label">Remaining</span><span>${this.data.remaining.toFixed(2)} hours</span></div>
            <div class="usage-section">
                <div class="usage-title">Dates Used</div>
                ${list}
            </div>
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

                .usage-section {
                    margin-top: 12px;
                    border-top: 1px solid #eef0f2;
                    padding-top: 10px;
                }

                .usage-title {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: #6c757d;
                    margin-bottom: 6px;
                }

                .usage-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    gap: 6px;
                    font-size: 13px;
                    color: #34495e;
                }

                .usage-list li {
                    display: flex;
                    justify-content: space-between;
                    gap: 12px;
                }

                .empty {
                    color: #6c757d;
                    font-size: 13px;
                }
            </style>
            <div class="card">
                <h4>${this.cardTitle}</h4>
                ${body}
            </div>
        `;
    }
}