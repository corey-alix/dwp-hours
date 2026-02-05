interface Employee {
    id?: number;
    name: string;
    identifier: string;
    ptoRate: number;
    carryoverHours: number;
    role: string;
    hash?: string;
}

export class EmployeeForm extends HTMLElement {
    private shadow: ShadowRoot;
    private _employee: Employee | null = null;
    private _isEdit = false;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['employee', 'is-edit'];
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        if (oldValue !== newValue) {
            if (name === 'employee') {
                try {
                    this._employee = JSON.parse(newValue);
                    this._isEdit = !!this._employee?.id;
                } catch (e) {
                    console.error('Invalid employee JSON:', e);
                    this._employee = null;
                    this._isEdit = false;
                }
            } else if (name === 'is-edit') {
                this._isEdit = newValue === 'true';
            }
            if (this.shadow) {
                this.render();
            }
        }
    }

    set employee(value: Employee | null) {
        this.setAttribute('employee', value ? JSON.stringify(value) : '');
    }

    get employee(): Employee | null {
        return this._employee;
    }

    set isEdit(value: boolean) {
        this.setAttribute('is-edit', value.toString());
    }

    get isEdit(): boolean {
        return this._isEdit;
    }

    private render() {
        const title = this._isEdit ? 'Edit Employee' : 'Add New Employee';

        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .form-container {
                    padding: 24px;
                }

                .form-header {
                    margin-bottom: 24px;
                    text-align: center;
                }

                .form-header h2 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 600;
                    color: #2c3e50;
                }

                .form-group {
                    margin-bottom: 20px;
                }

                .form-label {
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: #2c3e50;
                    font-size: 14px;
                }

                .form-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: border-color 0.3s ease;
                    box-sizing: border-box;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }

                .form-input.error {
                    border-color: #e74c3c;
                }

                .form-select {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                    box-sizing: border-box;
                }

                .form-select:focus {
                    outline: none;
                    border-color: #3498db;
                    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
                }

                .error-message {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: 4px;
                    display: block;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .form-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 32px;
                    padding-top: 20px;
                    border-top: 1px solid #e9ecef;
                }

                .btn {
                    padding: 10px 20px;
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

                .required {
                    color: #e74c3c;
                }
            </style>

            <div class="form-container">
                <div class="form-header">
                    <h2>${title}</h2>
                </div>

                <form id="employee-form">
                    <div class="form-group">
                        <label class="form-label" for="name">
                            Full Name <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            class="form-input"
                            value="${this._employee?.name || ''}"
                            required
                        >
                        <span class="error-message" id="name-error"></span>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="identifier">
                            Employee ID <span class="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            name="identifier"
                            class="form-input"
                            value="${this._employee?.identifier || ''}"
                            required
                        >
                        <span class="error-message" id="identifier-error"></span>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="ptoRate">
                                PTO Rate (hrs/day)
                            </label>
                            <input
                                type="number"
                                id="ptoRate"
                                name="ptoRate"
                                class="form-input"
                                value="${this._employee?.ptoRate || 0.71}"
                                step="0.01"
                                min="0"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="carryoverHours">
                                Carryover Hours
                            </label>
                            <input
                                type="number"
                                id="carryoverHours"
                                name="carryoverHours"
                                class="form-input"
                                value="${this._employee?.carryoverHours || 0}"
                                step="0.5"
                                min="0"
                            >
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="role">
                            Role
                        </label>
                        <select id="role" name="role" class="form-select">
                            <option value="Employee" ${this._employee?.role === 'Employee' ? 'selected' : ''}>Employee</option>
                            <option value="Admin" ${this._employee?.role === 'Admin' ? 'selected' : ''}>Admin</option>
                        </select>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                        <button type="submit" class="btn btn-primary" id="submit-btn">
                            ${this._isEdit ? 'Update Employee' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    private setupEventListeners() {
        const form = this.shadow.getElementById('employee-form') as HTMLFormElement;
        const cancelBtn = this.shadow.getElementById('cancel-btn') as HTMLButtonElement;

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                const formData = new FormData(form);
                const employeeData: Employee = {
                    id: this._employee?.id,
                    name: formData.get('name') as string,
                    identifier: formData.get('identifier') as string,
                    ptoRate: parseFloat(formData.get('ptoRate') as string) || 0.71,
                    carryoverHours: parseFloat(formData.get('carryoverHours') as string) || 0,
                    role: formData.get('role') as string,
                    hash: this._employee?.hash
                };

                this.dispatchEvent(new CustomEvent('employee-submit', {
                    detail: { employee: employeeData, isEdit: this._isEdit }
                }));
            }
        });

        cancelBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('form-cancel'));
        });

        // Real-time validation
        const inputs = this.shadow.querySelectorAll('.form-input');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement);
            });
        });
    }

    private validateForm(): boolean {
        let isValid = true;

        const nameInput = this.shadow.getElementById('name') as HTMLInputElement;
        const identifierInput = this.shadow.getElementById('identifier') as HTMLInputElement;

        if (!this.validateField(nameInput)) isValid = false;
        if (!this.validateField(identifierInput)) isValid = false;

        return isValid;
    }

    private validateField(input: HTMLInputElement): boolean {
        const value = input.value.trim();
        const errorElement = this.shadow.getElementById(`${input.id}-error`) as HTMLElement;

        input.classList.remove('error');
        errorElement.textContent = '';

        if (input.hasAttribute('required') && !value) {
            input.classList.add('error');
            errorElement.textContent = 'This field is required';
            return false;
        }

        if (input.id === 'identifier' && value && !/^[A-Z]{2}\d{3}$/.test(value)) {
            input.classList.add('error');
            errorElement.textContent = 'Employee ID must be in format: XX000 (e.g., JD001)';
            return false;
        }

        return true;
    }
}

customElements.define('employee-form', EmployeeForm);