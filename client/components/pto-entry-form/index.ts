interface PtoRequest {
    startDate: string;
    endDate: string;
    ptoType: string;
    hours: number;
}

import { querySingle } from '../test-utils';
import { today, isWeekend, addDays, getWeekdaysBetween, calculateEndDateFromHours } from '../../../shared/dateUtils.js';

export class PtoEntryForm extends HTMLElement {
    private shadow: ShadowRoot;
    private dateWatchInterval: number | null = null;

    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return [];
    }

    connectedCallback() {
        this.render();
        this.initializeFormDefaults();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        // Clean up event listeners if needed
        if (this.dateWatchInterval !== null) {
            window.clearInterval(this.dateWatchInterval);
            this.dateWatchInterval = null;
        }
    }

    private getNextBusinessDay(dateStr: string): string {
        let currentDate = dateStr;
        while (isWeekend(currentDate)) {
            currentDate = addDays(currentDate, 1);
        }
        return currentDate;
    }

    private initializeFormDefaults(): void {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);

        // Set default dates to today (or next business day if today is weekend)
        const defaultDate = this.getNextBusinessDay(today());
        startDateInput.value = defaultDate;
        endDateInput.value = defaultDate;

        // Set default PTO type to "Full PTO"
        ptoTypeSelect.value = 'Full PTO';

        // Apply conditional field behavior
        this.updateFieldBehavior('Full PTO');

        // Set initial end date min constraint
        this.updateEndDateMinConstraint();
    }

    private updateFieldBehavior(ptoType: string): void {
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursLabel = querySingle<HTMLLabelElement>('label[for="hours"]', this.shadow);

        if (ptoType === 'Full PTO') {
            // For "Full PTO": End Date editable, Hours readonly (calculated from date range)
            hoursLabel.textContent = 'Days';
            hoursInput.readOnly = true;
            this.updateDaysFromDateRange(); // Calculate days from current date range
            endDateInput.readOnly = false;
        } else {
            // For other types: Hours editable, End Date readonly (calculated based on spillover logic)
            hoursLabel.textContent = 'Hours';
            hoursInput.readOnly = false;
            hoursInput.value = '4'; // Default to 4 hours
            endDateInput.readOnly = true;
            this.updateEndDateFromHours(); // Calculate end date from hours
        }
    }

    private updateDaysFromDateRange(): void {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;

        if (startDate && endDate) {
            try {
                const weekdays = getWeekdaysBetween(startDate, endDate);
                hoursInput.value = weekdays.toString();
            } catch (error) {
                console.error('Error calculating weekdays:', error);
                hoursInput.value = '0';
            }
        }
    }

    private updateEndDateFromHours(): void {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);

        const startDate = startDateInput.value;
        const hoursValue = parseFloat(hoursInput.value);

        if (startDate && !isNaN(hoursValue) && hoursValue > 0) {
            try {
                const endDate = calculateEndDateFromHours(startDate, hoursValue);
                endDateInput.value = endDate;
                this.updateWeekendWarning(endDateInput);
            } catch (error) {
                console.error('Error calculating end date from hours:', error);
                endDateInput.value = startDate;
                this.updateWeekendWarning(endDateInput);
            }
        }
    }

    private updateWeekendWarning(input: HTMLInputElement): void {
        const value = input.value.trim();
        if (!value) {
            return;
        }

        if (isWeekend(value)) {
            this.setFieldWarning(input, 'Warning: Selected date is a weekend. PTO is typically for weekdays.');
        } else {
            this.clearFieldError(input);
        }
    }

    private updateEndDateMinConstraint(): void {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);

        const startDate = startDateInput.value;
        if (startDate) {
            endDateInput.min = startDate;
            // If current end date is before start date, update it
            if (endDateInput.value && endDateInput.value < startDate) {
                endDateInput.value = startDate;
                // Recalculate days if in Full PTO mode
                const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);
                if (ptoTypeSelect.value === 'Full PTO') {
                    this.updateDaysFromDateRange();
                }
            }
            if (endDateInput.value) {
                this.updateWeekendWarning(endDateInput);
            }
        }
    }

    private render() {
        this.shadow.innerHTML = `
            <style>
                :host {
                    display: block;
                    background: var(--color-surface);
                    border-radius: var(--border-radius-lg);
                    box-shadow: var(--shadow-md);
                    max-width: 500px;
                    margin: 0 auto;
                }

                .form-container {
                    padding: var(--space-lg);
                }

                .form-header {
                    margin-bottom: var(--space-lg);
                    text-align: center;
                }

                .form-header h2 {
                    margin: 0;
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .form-group {
                    margin-bottom: var(--space-md);
                }

                .form-label {
                    display: block;
                    margin-bottom: var(--space-xs);
                    font-weight: var(--font-weight-medium);
                    color: var(--color-text);
                    font-size: var(--font-size-sm);
                }

                .form-input,
                .form-select {
                    width: 100%;
                    padding: var(--space-sm) var(--space-md);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-md);
                    font-size: var(--font-size-sm);
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                    box-sizing: border-box;
                    background: var(--color-background);
                    color: var(--color-text);
                }

                .form-input:focus,
                .form-select:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 2px var(--color-primary-light, rgba(0, 123, 255, 0.25));
                }

                .form-input.error,
                .form-select.error {
                    border-color: var(--color-error);
                }

                .form-input.warning,
                .form-select.warning {
                    border-color: var(--color-warning, #ffc107);
                }

                .error-message {
                    color: var(--color-error);
                    font-size: var(--font-size-xs);
                    margin-top: var(--space-xs);
                    display: block;
                }

                .warning-message {
                    color: var(--color-warning, #ffc107);
                    font-size: var(--font-size-xs);
                    margin-top: var(--space-xs);
                    display: block;
                }

                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: var(--space-md);
                }

                .form-actions {
                    display: flex;
                    gap: var(--space-sm);
                    justify-content: flex-end;
                    margin-top: var(--space-lg);
                    padding-top: var(--space-md);
                    border-top: var(--border-width) var(--border-style-solid) var(--color-border);
                }

                .btn {
                    padding: var(--space-sm) var(--space-lg);
                    border: none;
                    border-radius: var(--border-radius-md);
                    cursor: pointer;
                    font-size: var(--font-size-sm);
                    font-weight: var(--font-weight-medium);
                    transition: all 0.3s ease;
                    min-width: 80px;
                }

                .btn-primary {
                    background: var(--color-primary);
                    color: white;
                }

                .btn-primary:hover {
                    background: var(--color-primary-hover, var(--color-primary));
                    transform: translateY(-1px);
                }

                .btn-secondary {
                    background: var(--color-secondary, var(--color-surface));
                    color: var(--color-text);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                }

                .btn-secondary:hover {
                    background: var(--color-surface-hover, var(--color-surface));
                }

                .required {
                    color: var(--color-error);
                }

                /* Responsive design */
                @media (max-width: 480px) {
                    .form-row {
                        grid-template-columns: 1fr;
                        gap: var(--space-sm);
                    }

                    .form-actions {
                        flex-direction: column;
                    }

                    .btn {
                        width: 100%;
                    }
                }
            </style>

            <div class="form-container">
                <div class="form-header">
                    <h2>Submit Time Off</h2>
                </div>

                <form id="pto-form" novalidate>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label" for="start-date">
                                Start Date <span class="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="start-date"
                                name="startDate"
                                class="form-input"
                                required
                            >
                            <span class="error-message" id="start-date-error"></span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="end-date">
                                End Date <span class="required">*</span>
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                name="endDate"
                                class="form-input"
                                required
                            >
                            <span class="error-message" id="end-date-error"></span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="pto-type">
                            Type <span class="required">*</span>
                        </label>
                        <select
                            id="pto-type"
                            name="ptoType"
                            class="form-select"
                            required
                        >
                            <option value="">Select Type</option>
                            <option value="Sick">Sick</option>
                            <option value="Full PTO">Full PTO</option>
                            <option value="Partial PTO">Partial PTO</option>
                            <option value="Bereavement">Bereavement</option>
                            <option value="Jury Duty">Jury Duty</option>
                        </select>
                        <span class="error-message" id="pto-type-error"></span>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="hours">
                            Hours <span class="required">*</span>
                        </label>
                        <input
                            type="number"
                            id="hours"
                            name="hours"
                            class="form-input"
                            step="4"
                            min="4"
                            required
                        >
                        <span class="error-message" id="hours-error"></span>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-btn">
                            Cancel
                        </button>
                        <button type="submit" class="btn btn-primary" id="submit-btn">
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        `;
    }

    private setupEventListeners() {
        const form = querySingle<HTMLFormElement>('#pto-form', this.shadow);
        const cancelBtn = querySingle<HTMLButtonElement>('#cancel-btn', this.shadow);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.handleSubmit();
            }
        });

        cancelBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('form-cancel'));
        });

        // PTO type change listener for dynamic field behavior
        ptoTypeSelect?.addEventListener('change', (e) => {
            const target = e.target as HTMLSelectElement;
            this.updateFieldBehavior(target.value);
        });

        // Date change listeners for "Full PTO" days calculation and min date constraints
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        let lastStartDateValue = startDateInput?.value ?? '';
        let lastEndDateValue = endDateInput?.value ?? '';

        startDateInput?.addEventListener('input', () => {
            if (startDateInput) {
                this.updateWeekendWarning(startDateInput);
            }
        });

        endDateInput?.addEventListener('input', () => {
            if (endDateInput) {
                this.updateWeekendWarning(endDateInput);
            }
        });

        if (this.dateWatchInterval === null) {
            this.dateWatchInterval = window.setInterval(() => {
                if (startDateInput && startDateInput.value !== lastStartDateValue) {
                    lastStartDateValue = startDateInput.value;
                    this.updateWeekendWarning(startDateInput);
                }
                if (endDateInput && endDateInput.value !== lastEndDateValue) {
                    lastEndDateValue = endDateInput.value;
                    this.updateWeekendWarning(endDateInput);
                }
            }, 200);
        }

        startDateInput?.addEventListener('change', () => {
            if (ptoTypeSelect.value === 'Full PTO') {
                this.updateDaysFromDateRange();
            } else {
                this.updateEndDateFromHours();
            }
            // Update end date min constraint
            this.updateEndDateMinConstraint();
        });

        endDateInput?.addEventListener('change', () => {
            if (ptoTypeSelect.value === 'Full PTO') {
                this.updateDaysFromDateRange();
            }
            if (endDateInput) {
                this.updateWeekendWarning(endDateInput);
            }
        });

        // Hours change listener for non-"Full PTO" types to calculate end date
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        hoursInput?.addEventListener('input', () => {
            if (ptoTypeSelect.value !== 'Full PTO') {
                this.updateEndDateFromHours();
            }
        });

        // Real-time validation
        const inputs = this.shadow.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input as HTMLInputElement | HTMLSelectElement);
            });
            input.addEventListener('input', () => {
                const element = input as HTMLInputElement | HTMLSelectElement;
                if (element.id === 'start-date' || element.id === 'end-date') {
                    this.updateWeekendWarning(element as HTMLInputElement);
                } else {
                    this.clearFieldError(element);
                }
            });
        });
    }

    private validateForm(): boolean {
        let isValid = true;

        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const ptoTypeInput = querySingle<HTMLSelectElement>('#pto-type', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);

        if (!this.validateField(startDateInput)) isValid = false;
        if (!this.validateField(endDateInput)) isValid = false;
        if (!this.validateField(ptoTypeInput)) isValid = false;
        
        // Only validate hours if it's not readonly
        if (!hoursInput.readOnly && !this.validateField(hoursInput)) isValid = false;

        // Cross-field validation: end date should be after start date
        if (isValid && startDateInput.value && endDateInput.value) {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            if (endDate < startDate) {
                this.setFieldError(endDateInput, 'End date must be after start date');
                isValid = false;
            }
        }

        return isValid;
    }

    private validateField(input: HTMLInputElement | HTMLSelectElement): boolean {
        const value = input.value.trim();
        const errorElement = querySingle<HTMLElement>(`#${input.id}-error`, this.shadow);

        this.clearFieldError(input);

        // Required field validation (always check, even for readonly fields)
        if (input.hasAttribute('required') && !value) {
            this.setFieldError(input, 'This field is required');
            return false;
        }

        // Skip further validation for readonly fields
        if ((input as HTMLInputElement).readOnly) {
            return true;
        }

        // Type-specific validation
        if (input.id === 'hours') {
            const hours = parseFloat(value);
            if (isNaN(hours) || hours <= 0) {
                this.setFieldError(input, 'Please enter a valid number of hours');
                return false;
            }
            if (!Number.isInteger(hours) || hours % 4 !== 0) {
                this.setFieldError(input, 'Hours must be in 4-hour increments');
                return false;
            }
        }

        if (input.id === 'start-date' || input.id === 'end-date') {
            const date = new Date(value);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Note: Past dates are allowed per business rules
            // Restrictions are on next year entries and acknowledged months (handled server-side)

            // Warn if weekend is selected (but don't prevent it)
            if (isWeekend(value)) {
                this.setFieldWarning(input, 'Warning: Selected date is a weekend. PTO is typically for weekdays.');
                // Don't return false - just warn
            }
        }

        return true;
    }

    private setFieldError(input: HTMLInputElement | HTMLSelectElement, message: string) {
        input.classList.add('error');
        const errorElement = querySingle<HTMLElement>(`#${input.id}-error`, this.shadow);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    private setFieldWarning(input: HTMLInputElement | HTMLSelectElement, message: string) {
        input.classList.add('warning');
        const errorElement = querySingle<HTMLElement>(`#${input.id}-error`, this.shadow);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.className = 'warning-message';
        }
    }

    private clearFieldError(input: HTMLInputElement | HTMLSelectElement) {
        input.classList.remove('error', 'warning');
        const errorElement = querySingle<HTMLElement>(`#${input.id}-error`, this.shadow);
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.className = 'error-message';
        }
    }

    private handleSubmit() {
        const form = querySingle<HTMLFormElement>('#pto-form', this.shadow);
        const formData = new FormData(form);

        const ptoRequest: PtoRequest = {
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            ptoType: formData.get('ptoType') as string,
            hours: parseFloat(formData.get('hours') as string)
        };

        this.dispatchEvent(new CustomEvent('pto-submit', {
            detail: { ptoRequest }
        }));
    }

    // Public methods for external control
    reset() {
        const form = querySingle<HTMLFormElement>('#pto-form', this.shadow);
        form?.reset();

        // Clear any error states
        const inputs = this.shadow.querySelectorAll('.form-input, .form-select');
        inputs.forEach(input => {
            this.clearFieldError(input as HTMLInputElement | HTMLSelectElement);
        });

        // Reinitialize form defaults
        this.initializeFormDefaults();
    }

    focus() {
        const firstInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        firstInput?.focus();
    }
}

customElements.define('pto-entry-form', PtoEntryForm);