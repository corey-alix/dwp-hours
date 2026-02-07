import { APIClient } from '../../APIClient.js';
import type * as ApiTypes from '../../api-types.js';

interface Employee {
    id: number;
    name: string;
    identifier: string;
    ptoRate: number;
    carryoverHours: number;
    hireDate: string;
    role: string;
    hash?: string;
}

export class AdminPanel extends HTMLElement {
    private shadow: ShadowRoot;
    private _currentView = 'pto-requests';
    private _employees: Employee[] = [];
    private _showEmployeeForm = false;
    private _editingEmployee: Employee | null = null;
    private api = new APIClient();

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['current-view'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
        this.setupChildEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue && name === 'current-view') {
            this._currentView = newValue;
            if (newValue === 'employees') {
                this.loadEmployees();
            }
            this.render();
            this.setupEventListeners();
            this.setupChildEventListeners();
        }
    }

    set currentView(value: string) {
        this.setAttribute('current-view', value);
    }

    get currentView(): string {
        return this.getAttribute('current-view') || 'pto-requests';
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    height: 100vh;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }

                .admin-panel {
                    display: flex;
                    height: 100%;
                }

                .sidebar {
                    width: 250px;
                    background: var(--color-surface);
                    color: var(--color-text);
                    padding: 20px 0;
                    box-shadow: 2px 0 5px var(--color-shadow);
                    border-right: 1px solid var(--color-border);
                }

                .sidebar-header {
                    padding: 0 20px 20px;
                    border-bottom: 1px solid var(--color-border);
                    margin-bottom: 20px;
                }

                .sidebar-header h2 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: var(--color-text);
                }

                .nav-menu {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .nav-item {
                    margin-bottom: 5px;
                }

                .nav-link {
                    display: block;
                    padding: 12px 20px;
                    color: var(--color-text-secondary);
                    text-decoration: none;
                    transition: all 0.3s ease;
                    border-left: 3px solid transparent;
                }

                .nav-link:hover {
                    background: var(--color-surface-hover);
                    color: var(--color-text);
                    border-left-color: var(--color-primary);
                }

                .nav-link:focus-visible {
                    outline: 2px solid var(--color-primary);
                    outline-offset: 2px;
                    border-left-color: var(--color-primary);
                    color: var(--color-text);
                }

                .nav-link.active {
                    background: var(--color-primary);
                    color: white;
                    border-left-color: var(--color-primary-hover);
                }

                .main-content {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: var(--color-background);
                }

                .header {
                    background: var(--color-surface);
                    padding: 20px;
                    border-bottom: 1px solid var(--color-border);
                    box-shadow: 0 2px 4px var(--color-shadow);
                }

                .header h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: var(--color-text);
                }

                .content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                }

                .view-container {
                    background: var(--color-surface);
                    border-radius: 8px;
                    box-shadow: 0 2px 4px var(--color-shadow);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid var(--color-border);
                }
            </style>

            <div class="admin-panel">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h2>Admin Panel</h2>
                    </div>
                    <nav>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === 'pto-requests' ? 'active' : ''}" data-view="pto-requests">
                                    📋 PTO Requests
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === 'employees' ? 'active' : ''}" data-view="employees">
                                    👥 Employees
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === 'reports' ? 'active' : ''}" data-view="reports">
                                    📊 Reports
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#" class="nav-link ${this._currentView === 'settings' ? 'active' : ''}" data-view="settings">
                                    ⚙️ Settings
                                </a>
                            </li>
                        </ul>
                    </nav>
                </aside>

                <main class="main-content">
                    <header class="header">
                        <h1>${this.getViewTitle(this._currentView)}</h1>
                    </header>
                    <div class="content">
                        <div class="view-container">
                            ${this.renderCurrentView()}
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    private getViewTitle(view: string): string {
        const titles: Record<string, string> = {
            employees: 'Employee Management',
            'pto-requests': 'PTO Request Queue',
            reports: 'Reports & Analytics',
            settings: 'System Settings'
        };
        return titles[view] || 'Admin Panel';
    }

    private renderCurrentView(): string {
        switch (this._currentView) {
            case 'employees':
                const employeeForm = this._showEmployeeForm ? 
                    `<employee-form employee='${JSON.stringify(this._editingEmployee)}' is-edit='${!!this._editingEmployee}'></employee-form>` : 
                    '';
                return `<employee-list></employee-list>${employeeForm}`;
            case 'pto-requests':
                return '<pto-request-queue></pto-request-queue>';
            case 'reports':
                return '<report-generator></report-generator>';
            case 'settings':
                return `
                    <div style="padding: 20px;">
                        <h3 style="margin: 0 0 12px;">Settings</h3>
                        <ul style="margin: 0; padding-left: 18px;">
                            <li>Total holidays for the year (placeholder)</li>
                            <li>Total sick day limits (placeholder)</li>
                            <li>Accrual rate rules (placeholder)</li>
                        </ul>
                    </div>
                `;
            default:
                return '<div style="padding: 20px;">Select a view from the sidebar</div>';
        }
    }

    private setupChildEventListeners() {
        // Handle events from child components
        this.shadow.addEventListener('add-employee', () => {
            this.showEmployeeForm();
        });

        this.shadow.addEventListener('employee-edit', ((e: Event) => {
            const employeeId = (e as CustomEvent).detail.employeeId;
            this.showEmployeeForm(employeeId);
        }) as EventListener);

        this.shadow.addEventListener('employee-submit', ((e: Event) => {
            const { employee, isEdit } = (e as CustomEvent).detail;
            this.handleEmployeeSubmit(employee, isEdit);
        }) as EventListener);

        this.shadow.addEventListener('form-cancel', () => {
            this.hideEmployeeForm();
        });

        this.shadow.addEventListener('employee-delete', ((e: Event) => {
            this.dispatchEvent(new CustomEvent('employee-delete', {
                detail: (e as CustomEvent).detail,
                bubbles: true,
                composed: true
            }));
        }) as EventListener);

        this.shadow.addEventListener('employee-acknowledge', ((e: Event) => {
            this.dispatchEvent(new CustomEvent('employee-acknowledge', {
                detail: (e as CustomEvent).detail,
                bubbles: true,
                composed: true
            }));
        }) as EventListener);
    }

    private setupEventListeners() {
        const navLinks = this.shadow.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = (e.target as HTMLElement).closest('.nav-link') as HTMLElement | null;
                const view = target?.getAttribute('data-view');
                if (view) {
                    this.currentView = view;
                    this.dispatchEvent(new CustomEvent('view-change', {
                        detail: { view }
                    }));
                }
            });
        });
    }

    private async loadEmployees() {
        try {
            const response = await this.api.getEmployees();
            this._employees = response.map((emp: any) => ({
                id: emp.id,
                name: emp.name,
                identifier: emp.identifier,
                ptoRate: 0.71, // Default, could be fetched from server
                carryoverHours: 0, // Default, could be fetched from server
                hireDate: emp.hire_date,
                role: emp.role,
                hash: '' // Not needed for display
            }));
            this.render();
            this.setupChildEventListeners();
        } catch (error) {
            console.error('Failed to load employees:', error);
            // Could show error message to user
        }
    }

    private showEmployeeForm(employeeId?: number) {
        if (employeeId) {
            this._editingEmployee = this._employees.find(emp => emp.id === employeeId) || null;
        } else {
            this._editingEmployee = null;
        }
        this._showEmployeeForm = true;
        this.render();
        this.setupChildEventListeners();
    }

    private hideEmployeeForm() {
        this._showEmployeeForm = false;
        this._editingEmployee = null;
        this.render();
        this.setupChildEventListeners();
    }

    private async handleEmployeeSubmit(employee: Employee, isEdit: boolean) {
        try {
            if (isEdit) {
                await this.api.updateEmployee(employee.id!, {
                    name: employee.name,
                    identifier: employee.identifier,
                    ptoRate: employee.ptoRate,
                    carryoverHours: employee.carryoverHours,
                    role: employee.role
                });
            } else {
                await this.api.createEmployee({
                    name: employee.name,
                    identifier: employee.identifier,
                    ptoRate: employee.ptoRate,
                    carryoverHours: employee.carryoverHours,
                    hireDate: new Date().toISOString().split('T')[0], // Today's date as default
                    role: employee.role
                });
            }
            this.hideEmployeeForm();
            await this.loadEmployees(); // Refresh the list
        } catch (error) {
            console.error('Failed to save employee:', error);
            // Could show error message to user
        }
    }
}

customElements.define('admin-panel', AdminPanel);