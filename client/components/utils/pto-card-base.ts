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
                    background: var(--color-background);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-lg);
                    padding: var(--space-lg);
                    box-shadow: var(--shadow-md);
                }

                .card h4 {
                    margin: 0 0 var(--space-md) 0;
                    font-size: var(--font-size-lg);
                    color: var(--color-text);
                    font-weight: var(--font-weight-semibold);
                }

                .card .row {
                    display: flex;
                    justify-content: space-between;
                    gap: var(--space-lg);
                    margin: var(--space-xs) 0;
                    font-size: var(--font-size-sm);
                    color: var(--color-text-secondary);
                }

                .card .label {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
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
                    background: var(--color-background);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-lg);
                    padding: var(--space-lg);
                    box-shadow: var(--shadow-md);
                }

                .card h4 {
                    margin: 0 0 var(--space-md) 0;
                    font-size: var(--font-size-lg);
                    color: var(--color-text);
                    font-weight: var(--font-weight-semibold);
                }

                .card .row {
                    display: flex;
                    justify-content: space-between;
                    gap: var(--space-lg);
                    margin: var(--space-xs) 0;
                    font-size: var(--font-size-sm);
                    color: var(--color-text-secondary);
                }

                .card .label {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .usage-section {
                    margin-top: var(--space-md);
                    border-top: var(--border-width) var(--border-style-solid) var(--color-border);
                    padding-top: var(--space-sm);
                }

                .usage-title {
                    font-size: var(--font-size-xs);
                    font-weight: var(--font-weight-semibold);
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                    color: var(--color-text-muted);
                    margin-bottom: var(--space-xs);
                }

                .usage-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    display: grid;
                    gap: var(--space-xs);
                    font-size: var(--font-size-xs);
                    color: var(--color-text-secondary);
                }

                .usage-list li {
                    display: flex;
                    justify-content: space-between;
                    gap: var(--space-md);
                }

                .empty {
                    color: var(--color-text-muted);
                    font-size: var(--font-size-xs);
                }
            </style>
            <div class="card">
                <h4>${this.cardTitle}</h4>
                ${body}
            </div>
        `;
    }
}