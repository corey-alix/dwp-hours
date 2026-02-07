interface ReportData {
    employeeId: number;
    employeeName: string;
    totalPTOHours: number;
    usedPTOHours: number;
    remainingPTOHours: number;
    carryoverHours: number;
}

import { querySingle } from '../test-utils';
import { startOfYear, endOfYear, today } from '../../../shared/dateUtils.js';

export class ReportGenerator extends HTMLElement {
    private shadow: ShadowRoot;
    private _reportData: ReportData[] = [];
    private _reportType: 'summary' | 'detailed' = 'summary';
    private _dateRange: { start: string; end: string } = {
        start: startOfYear(),
        end: endOfYear()
    };

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['report-data', 'report-type', 'date-range'];
    }

    connectedCallback() {
        console.log('ReportGenerator connectedCallback called');
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'report-data':
                    try {
                        this._reportData = JSON.parse(newValue);
                    } catch (e) {
                        console.error('Invalid report data JSON:', e);
                        this._reportData = [];
                    }
                    break;
                case 'report-type':
                    this._reportType = newValue as 'summary' | 'detailed';
                    break;
                case 'date-range':
                    try {
                        this._dateRange = JSON.parse(newValue);
                    } catch (e) {
                        console.error('Invalid date range JSON:', e);
                    }
                    break;
            }
            if (this.shadow) {
                this.render();
            }
        }
    }

    set reportData(value: ReportData[]) {
        this.setAttribute('report-data', JSON.stringify(value));
    }

    get reportData(): ReportData[] {
        return this._reportData;
    }

    set reportType(value: 'summary' | 'detailed') {
        this.setAttribute('report-type', value);
    }

    get reportType(): 'summary' | 'detailed' {
        return this._reportType;
    }

    set dateRange(value: { start: string; end: string }) {
        this.setAttribute('date-range', JSON.stringify(value));
    }

    get dateRange(): { start: string; end: string } {
        return this._dateRange;
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                    background: var(--color-background);
                    border-radius: var(--border-radius-lg);
                    box-shadow: var(--shadow-md);
                }

                .report-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .report-header {
                    padding: var(--space-xl);
                    border-bottom: var(--border-width) var(--border-style-solid) var(--color-border);
                    background: var(--color-surface);
                }

                .report-title {
                    font-size: var(--font-size-2xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-text);
                    margin: 0 0 var(--space-lg);
                }

                .report-controls {
                    display: flex;
                    gap: var(--space-lg);
                    align-items: center;
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: var(--space-xs);
                }

                .control-label {
                    font-size: var(--font-size-xs);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .control-input {
                    padding: var(--space-sm) var(--space-md);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius);
                    font-size: var(--font-size-sm);
                    background: var(--color-background);
                    color: var(--color-text);
                }

                .control-select {
                    padding: var(--space-sm) var(--space-md);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius);
                    background: var(--color-background);
                    font-size: var(--font-size-sm);
                    color: var(--color-text);
                }

                .action-buttons {
                    display: flex;
                    gap: var(--space-sm);
                }

                .btn {
                    padding: var(--space-sm) var(--space-lg);
                    border: none;
                    border-radius: var(--border-radius);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                }

                .btn-primary:hover {
                    background: var(--color-primary-hover);
                }

                .btn-secondary {
                    background: var(--color-secondary);
                    color: var(--color-background);
                }

                .btn-secondary:hover {
                    background: var(--color-secondary-hover);
                }

                .report-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: var(--space-xl);
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: var(--space-lg);
                    margin-bottom: var(--space-2xl);
                }

                .summary-card {
                    background: var(--color-background);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-lg);
                    padding: var(--space-lg);
                    text-align: center;
                }

                .card-value {
                    font-size: var(--font-size-2xl);
                    font-weight: var(--font-weight-bold);
                    color: var(--color-primary);
                    margin-bottom: var(--space-xs);
                }

                .card-label {
                    font-size: var(--font-size-xs);
                    color: var(--color-text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: var(--color-background);
                    border-radius: var(--border-radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-md);
                }

                .report-table th,
                .report-table td {
                    padding: var(--space-md) var(--space-lg);
                    text-align: left;
                    border-bottom: var(--border-width) var(--border-style-solid) var(--color-border);
                }

                .report-table th {
                    background: var(--color-surface);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                    border-bottom: var(--border-width-thick) var(--border-style-solid) var(--color-border-hover);
                }

                .report-table tbody tr:hover {
                    background: var(--color-surface-hover);
                }

                .hours-cell {
                    font-weight: var(--font-weight-medium);
                }

                .hours-positive {
                    color: var(--color-success);
                }

                .hours-negative {
                    color: var(--color-error);
                }

                .empty-state {
                    text-align: center;
                    padding: var(--space-2xl) * 2;
                    color: var(--color-text-muted);
                }

                .empty-state h3 {
                    margin: 0 0 var(--space-sm);
                    font-size: var(--font-size-lg);
                    color: var(--color-text);
                }
            </style>

            <div class="report-container">
                <div class="report-header">
                    <h1 class="report-title">PTO Reports</h1>
                    <div class="report-controls">
                        <div class="control-group">
                            <label class="control-label">Report Type</label>
                            <select class="control-select" id="report-type">
                                <option value="summary" ${this._reportType === 'summary' ? 'selected' : ''}>Summary</option>
                                <option value="detailed" ${this._reportType === 'detailed' ? 'selected' : ''}>Detailed</option>
                            </select>
                        </div>
                        <div class="control-group">
                            <label class="control-label">Start Date</label>
                            <input type="date" class="control-input" id="start-date" value="${this._dateRange.start}">
                        </div>
                        <div class="control-group">
                            <label class="control-label">End Date</label>
                            <input type="date" class="control-input" id="end-date" value="${this._dateRange.end}">
                        </div>
                        <div class="action-buttons">
                            <button class="btn btn-primary" id="generate-report">Generate Report</button>
                            <button class="btn btn-secondary" id="export-csv">Export CSV</button>
                        </div>
                    </div>
                </div>

                <div class="report-content">
                    ${this._reportData.length === 0 ?
                '<div class="empty-state"><h3>No report data available</h3><p>Generate a report to view PTO usage statistics.</p></div>' :
                this.renderReportContent()
            }
                </div>
            </div>
        `;
    }

    private renderReportContent(): string {
        const summaryStats = this.calculateSummaryStats();

        return `
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="card-value">${summaryStats.totalEmployees}</div>
                    <div class="card-label">Total Employees</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${summaryStats.totalPTOHours.toFixed(1)}</div>
                    <div class="card-label">Total PTO Hours</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${summaryStats.totalUsedHours.toFixed(1)}</div>
                    <div class="card-label">Used Hours</div>
                </div>
                <div class="summary-card">
                    <div class="card-value">${summaryStats.averageUtilization.toFixed(1)}%</div>
                    <div class="card-label">Avg Utilization</div>
                </div>
            </div>

            <table class="report-table">
                <thead>
                    <tr>
                        <th>Employee</th>
                        <th>Total PTO</th>
                        <th>Used Hours</th>
                        <th>Remaining</th>
                        <th>Carryover</th>
                        <th>Utilization</th>
                    </tr>
                </thead>
                <tbody>
                    ${this._reportData.map(employee => this.renderEmployeeRow(employee)).join('')}
                </tbody>
            </table>
        `;
    }

    private renderEmployeeRow(employee: ReportData): string {
        const utilization = employee.totalPTOHours > 0 ?
            ((employee.usedPTOHours / employee.totalPTOHours) * 100).toFixed(1) : '0.0';

        return `
            <tr>
                <td>${employee.employeeName}</td>
                <td class="hours-cell">${employee.totalPTOHours.toFixed(1)}</td>
                <td class="hours-cell">${employee.usedPTOHours.toFixed(1)}</td>
                <td class="hours-cell hours-${employee.remainingPTOHours >= 0 ? 'positive' : 'negative'}">
                    ${employee.remainingPTOHours.toFixed(1)}
                </td>
                <td class="hours-cell">${employee.carryoverHours.toFixed(1)}</td>
                <td class="hours-cell">${utilization}%</td>
            </tr>
        `;
    }

    private calculateSummaryStats() {
        const totalEmployees = this._reportData.length;
        const totalPTOHours = this._reportData.reduce((sum, emp) => sum + emp.totalPTOHours, 0);
        const totalUsedHours = this._reportData.reduce((sum, emp) => sum + emp.usedPTOHours, 0);
        const averageUtilization = totalPTOHours > 0 ? (totalUsedHours / totalPTOHours) * 100 : 0;

        return {
            totalEmployees,
            totalPTOHours,
            totalUsedHours,
            averageUtilization
        };
    }

    private setupEventListeners() {
        console.log('ReportGenerator setupEventListeners called');
        const reportTypeSelect = querySingle<HTMLSelectElement>('#report-type', this.shadow);
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const generateBtn = querySingle<HTMLButtonElement>('#generate-report', this.shadow);
        const exportBtn = querySingle<HTMLButtonElement>('#export-csv', this.shadow);

        reportTypeSelect?.addEventListener('change', (e) => {
            console.log('Report type select changed:', (e.target as HTMLSelectElement).value);
            this.reportType = (e.target as HTMLSelectElement).value as 'summary' | 'detailed';
            console.log('Dispatching report-type-change event with:', this._reportType);
            this.dispatchEvent(new CustomEvent('report-type-change', {
                detail: { reportType: this._reportType }
            }));
        });

        startDateInput?.addEventListener('change', () => {
            this.updateDateRange();
        });

        endDateInput?.addEventListener('change', () => {
            this.updateDateRange();
        });

        generateBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('generate-report', {
                detail: {
                    reportType: this._reportType,
                    dateRange: this._dateRange
                }
            }));
        });

        exportBtn?.addEventListener('click', () => {
            this.exportToCSV();
        });
    }

    private updateDateRange() {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);

        this._dateRange = {
            start: startDateInput.value,
            end: endDateInput.value
        };

        this.dispatchEvent(new CustomEvent('date-range-change', {
            detail: { dateRange: this._dateRange }
        }));
    }

    private exportToCSV() {
        if (this._reportData.length === 0) return;

        const headers = ['Employee', 'Total PTO', 'Used Hours', 'Remaining', 'Carryover', 'Utilization'];
        const rows = this._reportData.map(employee => {
            const utilization = employee.totalPTOHours > 0 ?
                ((employee.usedPTOHours / employee.totalPTOHours) * 100).toFixed(1) : '0.0';

            return [
                employee.employeeName,
                employee.totalPTOHours.toFixed(1),
                employee.usedPTOHours.toFixed(1),
                employee.remainingPTOHours.toFixed(1),
                employee.carryoverHours.toFixed(1),
                `${utilization}%`
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `pto-report-${today()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.dispatchEvent(new CustomEvent('report-exported', {
            detail: { format: 'csv', filename: `pto-report-${today()}.csv` }
        }));
    }
}

customElements.define('report-generator', ReportGenerator);