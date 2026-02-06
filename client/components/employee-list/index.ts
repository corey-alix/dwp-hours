interface Employee {
    id: number;
    name: string;
    identifier: string;
    ptoRate: number;
    carryoverHours: number;
    role: string;
    hash: string;
}

export class EmployeeList extends HTMLElement {
    private shadow: ShadowRoot;
    private _employees: Employee[] = [];
    private _filteredEmployees: Employee[] = [];
    private _searchTerm = '';

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['employees'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue && name === 'employees') {
            try {
                this._employees = JSON.parse(newValue);
                this.filterEmployees();
                this.render();
            } catch (e) {
                console.error('Invalid employees JSON:', e);
            }
        }
    }

    set employees(value: Employee[]) {
        this.setAttribute('employees', JSON.stringify(value));
    }

    get employees(): Employee[] {
        return this._employees;
    }

    private filterEmployees() {
        if (!this._searchTerm) {
            this._filteredEmployees = [...this._employees];
        } else {
            const term = this._searchTerm.toLowerCase();
            this._filteredEmployees = this._employees.filter(emp =>
                emp.name.toLowerCase().includes(term) ||
                emp.identifier.toLowerCase().includes(term) ||
                emp.role.toLowerCase().includes(term)
            );
        }
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100%;
                }

                .employee-list {
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .toolbar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid var(--color-border);
                    background: var(--color-surface);
                }

                .search-container {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .search-input {
                    padding: 8px 12px;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                    font-size: 14px;
                    width: 250px;
                    background: var(--color-background);
                    color: var(--color-text);
                }

                .search-input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px var(--color-primary-light);
                }

                .search-container span {
                    font-size: 14px;
                    color: var(--color-text-secondary);
                }

                .action-buttons {
                    display: flex;
                    gap: 10px;
                }

                .btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s ease;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                }

                .btn-primary:hover {
                    background: var(--color-primary-hover);
                }

                .employee-grid {
                    flex: 1;
                    overflow-y: auto;
                    padding: 20px;
                }

                .employee-card {
                    background: var(--color-surface);
                    border-radius: 8px;
                    padding: 16px;
                    margin-bottom: 12px;
                    box-shadow: 0 2px 4px var(--color-shadow);
                    border: 1px solid var(--color-border);
                    transition: box-shadow 0.3s ease;
                }

                .employee-card:hover {
                    box-shadow: 0 4px 8px var(--color-shadow-dark);
                }

                .employee-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .employee-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--color-text);
                    margin: 0;
                }

                .employee-identifier {
                    color: var(--color-text-secondary);
                    font-size: 14px;
                    margin: 0;
                }

                .employee-role {
                    background: var(--color-primary);
                    color: var(--color-on-primary);
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .employee-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                    margin-bottom: 12px;
                }

                .detail-item {
                    display: flex;
                    flex-direction: column;
                }

                .detail-label {
                    font-size: 12px;
                    color: var(--color-text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 4px;
                }

                .detail-value {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--color-text);
                }

                .employee-actions {
                    display: flex;
                    gap: 8px;
                    justify-content: flex-end;
                }

                .action-btn {
                    padding: 6px 12px;
                    border: 1px solid var(--color-border);
                    background: var(--color-surface);
                    color: var(--color-text-secondary);
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.3s ease;
                }

                .action-btn:hover {
                    background: var(--color-surface-hover);
                    border-color: var(--color-border-hover);
                }

                .action-btn.acknowledge {
                    border-color: var(--color-success);
                    color: var(--color-success);
                }

                .action-btn.acknowledge:hover {
                    background: var(--color-success);
                    color: var(--color-on-success);
                }

                .action-btn.delete {
                    border-color: var(--color-error);
                    color: var(--color-error);
                }

                .action-btn.delete:hover {
                    background: var(--color-error);
                    color: var(--color-on-error);
                }

                .empty-state {
                    text-align: center;
                    padding: 40px;
                    color: var(--color-text-secondary);
                }

                .empty-state h3 {
                    margin: 0 0 10px;
                    font-size: 18px;
                    color: var(--color-text);
                }
            </style>

            <div class="employee-list">
                <div class="toolbar">
                    <div class="search-container">
                        <input type="text" class="search-input" placeholder="Search employees..." id="search-input">
                        <span>📊 ${this._filteredEmployees.length} employees</span>
                    </div>
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="add-employee">➕ Add Employee</button>
                    </div>
                </div>

                <div class="employee-grid">
                    ${this._filteredEmployees.length === 0 ?
                '<div class="empty-state"><h3>No employees found</h3><p>Try adjusting your search or add a new employee.</p></div>' :
                this._filteredEmployees.map(emp => this.renderEmployeeCard(emp)).join('')
            }
                </div>
            </div>
        `;
    }

    private renderEmployeeCard(employee: Employee): string {
        return `
            <div class="employee-card" data-employee-id="${employee.id}">
                <div class="employee-header">
                    <div>
                        <h3 class="employee-name">${employee.name}</h3>
                        <p class="employee-identifier">${employee.identifier}</p>
                    </div>
                    <span class="employee-role">${employee.role}</span>
                </div>

                <div class="employee-details">
                    <div class="detail-item">
                        <span class="detail-label">PTO Rate</span>
                        <span class="detail-value">${employee.ptoRate} hrs/day</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Carryover</span>
                        <span class="detail-value">${employee.carryoverHours} hrs</span>
                    </div>
                </div>

                <div class="employee-actions">
                    <button class="action-btn acknowledge" data-action="acknowledge" data-employee-id="${employee.id}">Acknowledge</button>
                    <button class="action-btn edit" data-action="edit" data-employee-id="${employee.id}">Edit</button>
                    <button class="action-btn delete" data-action="delete" data-employee-id="${employee.id}">Delete</button>
                </div>
            </div>
        `;
    }

    private setupEventListeners() {
        const searchInput = this.shadow.getElementById('search-input') as HTMLInputElement;
        const addButton = this.shadow.getElementById('add-employee') as HTMLButtonElement;

        searchInput?.addEventListener('input', (e) => {
            this._searchTerm = (e.target as HTMLInputElement).value;
            this.filterEmployees();
            this.render();
        });

        addButton?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('add-employee'));
        });

        // Event delegation for action buttons
        this.shadow.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('action-btn')) {
                const action = target.getAttribute('data-action');
                const employeeId = target.getAttribute('data-employee-id');

                if (action && employeeId) {
                    this.dispatchEvent(new CustomEvent(`employee-${action}`, {
                        detail: { employeeId: parseInt(employeeId) }
                    }));
                }
            }
        });
    }
}

customElements.define('employee-list', EmployeeList);