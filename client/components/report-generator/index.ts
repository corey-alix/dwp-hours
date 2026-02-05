interface ReportData {
    employeeId: number;
    employeeName: string;
    totalPTOHours: number;
    usedPTOHours: number;
    remainingPTOHours: number;
    carryoverHours: number;
}

export class ReportGenerator extends HTMLElement {
    private shadow: ShadowRoot;
    private _reportData: ReportData[] = [];
    private _reportType: 'summary' | 'detailed' = 'summary';
    private _dateRange: { start: string; end: string } = {
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0]
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
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .report-container {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .report-header {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                    background: #f8f9fa;
                }

                .report-title {
                    font-size: 24px;
                    font-weight: 600;
                    color: #2c3e50;
                    margin: 0 0 16px;
                }

                .report-controls {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                    flex-wrap: wrap;
                }

                .control-group {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .control-label {
                    font-size: 12px;
                    font-weight: 500;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .control-input {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .control-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    background: white;
                    font-size: 14px;
                }

                .action-buttons {
                    display: flex;
                    gap: 8px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.3s ease;
                }

                .btn-primary {
                    background: #3498db;
                    color: white;
                }

                .btn-primary:hover {
                    background: #2980b9;
                }

                .btn-secondary {
                    background: #95a5a6;
                    color: white;
                }

                .btn-secondary:hover {
                    background: #7f8c8d;
                }

                .report-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 16px;
                    margin-bottom: 24px;
                }

                .summary-card {
                    background: white;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    padding: 16px;
                    text-align: center;
                }

                .card-value {
                    font-size: 24px;
                    font-weight: 700;
                    color: #3498db;
                    margin-bottom: 4px;
                }

                .card-label {
                    font-size: 12px;
                    color: #6c757d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .report-table {
                    width: 100%;
                    border-collapse: collapse;
                    background: white;
                    border-radius: 8px;
                    overflow: hidden;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }

                .report-table th,
                .report-table td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid #e9ecef;
                }

                .report-table th {
                    background: #f8f9fa;
                    font-weight: 600;
                    color: #2c3e50;
                    border-bottom: 2px solid #dee2e6;
                }

                .report-table tbody tr:hover {
                    background: #f8f9fa;
                }

                .hours-cell {
                    font-weight: 500;
                }

                .hours-positive {
                    color: #27ae60;
                }

                .hours-negative {
                    color: #e74c3c;
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: #6c757d;
                }

                .empty-state h3 {
                    margin: 0 0 8px;
                    font-size: 18px;
                    color: #495057;
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
        const reportTypeSelect = this.shadow.getElementById('report-type') as HTMLSelectElement;
        const startDateInput = this.shadow.getElementById('start-date') as HTMLInputElement;
        const endDateInput = this.shadow.getElementById('end-date') as HTMLInputElement;
        const generateBtn = this.shadow.getElementById('generate-report') as HTMLButtonElement;
        const exportBtn = this.shadow.getElementById('export-csv') as HTMLButtonElement;

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
        const startDateInput = this.shadow.getElementById('start-date') as HTMLInputElement;
        const endDateInput = this.shadow.getElementById('end-date') as HTMLInputElement;

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
        link.setAttribute('download', `pto-report-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        this.dispatchEvent(new CustomEvent('report-exported', {
            detail: { format: 'csv', filename: `pto-report-${new Date().toISOString().split('T')[0]}.csv` }
        }));
    }
}

customElements.define('report-generator', ReportGenerator);