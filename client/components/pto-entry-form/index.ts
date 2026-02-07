interface PtoRequest {
    startDate: string;
    endDate: string;
    ptoType: string;
    hours: number;
}

import { querySingle } from '../test-utils';
import { today, isWeekend, addDays, getWeekdaysBetween, calculateEndDateFromHours, parseDate } from '../../../shared/dateUtils.js';
import { normalizePTOType, validateHours, validatePTOType, validateWeekday, VALIDATION_MESSAGES } from '../../../shared/businessRules.js';
import type { MessageKey } from '../../../shared/businessRules.js';
import type { CalendarEntry } from '../pto-calendar/index.js';

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

        this.updateCalculationDetails();
    }

    private updateFieldBehavior(ptoType: string): void {
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursLabel = querySingle<HTMLLabelElement>('label[for="hours"]', this.shadow);
        const wasReadOnly = hoursInput.readOnly;

        if (ptoType === 'Full PTO') {
            // For "Full PTO": End Date editable, Hours readonly (calculated from date range)
            hoursLabel.textContent = 'Days';
            hoursInput.readOnly = true;
            hoursInput.step = '1';
            hoursInput.min = '1';
            this.updateDaysFromDateRange(); // Calculate days from current date range
            endDateInput.readOnly = false;
        } else {
            // For other types: Hours editable, End Date readonly (calculated based on spillover logic)
            hoursLabel.textContent = 'Hours';
            hoursInput.readOnly = false;
            hoursInput.step = '4';
            hoursInput.min = '4';
            if (wasReadOnly) {
                const previousDays = parseInt(hoursInput.value, 10);
                if (Number.isInteger(previousDays) && previousDays > 0) {
                    hoursInput.value = (previousDays * 8).toString();
                }
            }
            if (!hoursInput.value || Number.isNaN(parseFloat(hoursInput.value))) {
                hoursInput.value = '4'; // Default to 4 hours
            }
            endDateInput.readOnly = true;
            this.updateEndDateFromHours(); // Calculate end date from hours
        }

        this.updateCalculationDetails();
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
                this.updateCalculationDetails();
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
                this.updateCalculationDetails();
            } catch (error) {
                console.error('Error calculating end date from hours:', error);
                endDateInput.value = startDate;
                this.updateWeekendWarning(endDateInput);
            }
        }
    }

    private updateCalculationDetails(): void {
        const detailsElement = querySingle<HTMLDivElement>('#calculation-details', this.shadow);
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);

        const startDate = startDateInput.value;
        const endDate = endDateInput.value;
        const ptoType = ptoTypeSelect.value;

        detailsElement.textContent = '';
        detailsElement.classList.remove('spillover');

        if (!startDate || !endDate) {
            return;
        }

        if (ptoType === 'Full PTO') {
            try {
                const weekdays = getWeekdaysBetween(startDate, endDate);
                if (weekdays <= 0) {
                    return;
                }
                const hours = weekdays * 8;
                detailsElement.textContent = `${weekdays} ${weekdays === 1 ? 'day' : 'days'} (${hours} hours) ending ${endDate}`;
            } catch (error) {
                console.error('Error building Full PTO details:', error);
            }
            return;
        }

        const hours = parseFloat(hoursInput.value);
        if (Number.isNaN(hours) || hours <= 0) {
            return;
        }

        const workdays = Math.max(1, Math.ceil(hours / 8));
        const spillover = workdays > 1;
        detailsElement.textContent = `${spillover ? 'Spillover: ' : ''}${hours} hours over ${workdays} ${workdays === 1 ? 'workday' : 'workdays'} ending ${endDate}`;
        if (spillover) {
            detailsElement.classList.add('spillover');
        }
    }

    private toggleCalendarView(showCalendar: boolean): void {
        const formView = querySingle<HTMLDivElement>('#form-view', this.shadow);
        const calendarView = querySingle<HTMLDivElement>('#calendar-view', this.shadow);

        formView.classList.toggle('hidden', showCalendar);
        calendarView.classList.toggle('hidden', !showCalendar);

        if (showCalendar) {
            this.ensureCalendarReady();
        }
    }

    private ensureCalendarReady(): void {
        const calendarContainer = querySingle<HTMLDivElement>('#calendar-container', this.shadow);
        let calendar = calendarContainer.querySelector('pto-calendar') as HTMLElement | null;

        if (!calendar) {
            calendar = document.createElement('pto-calendar');
            calendar.setAttribute('readonly', 'false');

            const submitButton = document.createElement('button');
            submitButton.type = 'button';
            submitButton.textContent = 'Apply selection';
            submitButton.className = 'btn btn-primary';
            submitButton.slot = 'submit';
            calendar.appendChild(submitButton);

            calendar.addEventListener('pto-request-submit', (event: Event) => {
                const customEvent = event as CustomEvent<{ requests: CalendarEntry[] }>;
                this.applyCalendarSelection(customEvent.detail.requests);
                this.toggleCalendarView(false);
            });

            calendarContainer.appendChild(calendar);
        }

        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const fallbackDate = this.getNextBusinessDay(today());
        const seedDate = startDateInput.value || fallbackDate;
        const { year, month } = parseDate(seedDate);
        calendar.setAttribute('month', (month - 1).toString());
        calendar.setAttribute('year', year.toString());
        calendar.setAttribute('selected-month', month.toString());
        calendar.setAttribute('pto-entries', '[]');
    }

    private applyCalendarSelection(requests: CalendarEntry[]): void {
        if (!requests.length) {
            return;
        }

        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);

        const sorted = [...requests].sort((a, b) => a.date.localeCompare(b.date));
        const startDate = sorted[0].date;
        const endDate = sorted[sorted.length - 1].date;
        const totalHours = sorted.reduce((sum, entry) => sum + entry.hours, 0);
        const selectedType = sorted[0].type;

        let nextType = selectedType;
        if (selectedType === 'PTO') {
            const allFullDays = sorted.every(entry => entry.hours === 8);
            nextType = allFullDays ? 'Full PTO' : 'Partial PTO';
        }

        startDateInput.value = startDate;
        endDateInput.value = endDate;
        ptoTypeSelect.value = nextType;
        this.updateEndDateMinConstraint();
        this.updateFieldBehavior(nextType);

        if (nextType === 'Full PTO') {
            this.updateDaysFromDateRange();
        } else {
            hoursInput.value = totalHours.toString();
            this.updateEndDateFromHours();
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
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .form-header h2 {
                    margin: 0;
                    font-size: var(--font-size-xl);
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
                }

                .calendar-toggle {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    border-radius: var(--border-radius-md);
                    background: var(--color-surface);
                    padding: 6px;
                    cursor: pointer;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }

                .calendar-toggle:hover {
                    border-color: var(--color-primary);
                }

                .calendar-toggle svg {
                    width: 18px;
                    height: 18px;
                    fill: var(--color-text);
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

                .calculation-details {
                    margin-top: var(--space-xs);
                    padding: var(--space-xs) var(--space-sm);
                    border-radius: var(--border-radius-md);
                    background: var(--color-surface);
                    border: var(--border-width) var(--border-style-solid) var(--color-border);
                    font-size: var(--font-size-xs);
                    color: var(--color-text-secondary);
                }

                .calculation-details.spillover {
                    border-color: var(--color-warning, #ffc107);
                    color: var(--color-text);
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

                .hidden {
                    display: none;
                }

                .calendar-view {
                    margin-top: var(--space-md);
                }

                .calendar-toolbar {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: var(--space-md);
                }

                .calendar-title {
                    font-weight: var(--font-weight-semibold);
                    color: var(--color-text);
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
                    <button type="button" class="calendar-toggle" id="calendar-toggle-btn" aria-label="Open calendar">
                        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                            <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7zm12 8H5v10h14V10zm0-2V6H5v2h14z" />
                        </svg>
                    </button>
                </div>

                <div class="form-view" id="form-view">
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
                        <div class="calculation-details" id="calculation-details" aria-live="polite"></div>
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

                <div class="calendar-view hidden" id="calendar-view">
                    <div class="calendar-toolbar">
                        <span class="calendar-title">Select dates</span>
                        <button type="button" class="btn btn-secondary" id="calendar-back-btn">Back to form</button>
                    </div>
                    <div id="calendar-container"></div>
                </div>
            </div>
        `;
    }

    private setupEventListeners() {
        const form = querySingle<HTMLFormElement>('#pto-form', this.shadow);
        const cancelBtn = querySingle<HTMLButtonElement>('#cancel-btn', this.shadow);
        const ptoTypeSelect = querySingle<HTMLSelectElement>('#pto-type', this.shadow);
        const calendarToggleBtn = querySingle<HTMLButtonElement>('#calendar-toggle-btn', this.shadow);
        const calendarBackBtn = querySingle<HTMLButtonElement>('#calendar-back-btn', this.shadow);

        form?.addEventListener('submit', (e) => {
            e.preventDefault();
            if (this.validateForm()) {
                this.handleSubmit();
            }
        });

        cancelBtn?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('form-cancel'));
        });

        calendarToggleBtn?.addEventListener('click', () => {
            this.toggleCalendarView(true);
        });

        calendarBackBtn?.addEventListener('click', () => {
            this.toggleCalendarView(false);
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
            this.updateCalculationDetails();
        });

        endDateInput?.addEventListener('change', () => {
            if (ptoTypeSelect.value === 'Full PTO') {
                this.updateDaysFromDateRange();
            }
            if (endDateInput) {
                this.updateWeekendWarning(endDateInput);
            }
            this.updateCalculationDetails();
        });

        // Hours change listener for non-"Full PTO" types to calculate end date
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);
        hoursInput?.addEventListener('input', () => {
            if (ptoTypeSelect.value !== 'Full PTO') {
                this.updateEndDateFromHours();
            }
            this.updateCalculationDetails();
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

        if (ptoTypeInput.value === 'Full PTO') {
            const days = parseInt(hoursInput.value, 10);
            if (!Number.isInteger(days) && hoursInput.value.trim()) {
                this.setFieldError(hoursInput, 'Days must be a whole number');
                isValid = false;
            }
        }

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

            const hoursError = validateHours(hours);
            if (hoursError) {
                this.setFieldError(input, VALIDATION_MESSAGES[hoursError.messageKey as MessageKey]);
                return false;
            }
        }

        if (input.id === 'pto-type') {
            const normalized = normalizePTOType(value);
            const typeError = validatePTOType(normalized);
            if (typeError) {
                this.setFieldError(input, VALIDATION_MESSAGES[typeError.messageKey as MessageKey]);
                return false;
            }
        }

        if (input.id === 'start-date' || input.id === 'end-date') {
            try {
                const { year, month, day } = parseDate(value);
                const weekdayError = validateWeekday(new Date(year, month - 1, day));
                if (weekdayError) {
                    this.setFieldWarning(input, VALIDATION_MESSAGES[weekdayError.messageKey as MessageKey]);
                    // Don't return false - just warn
                }
            } catch (error) {
                this.setFieldError(input, VALIDATION_MESSAGES['date.invalid']);
                return false;
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
            hours: this.getHoursForSubmit(formData.get('ptoType') as string)
        };

        this.dispatchEvent(new CustomEvent('pto-submit', {
            detail: { ptoRequest }
        }));
    }

    private getHoursForSubmit(ptoType: string): number {
        const startDateInput = querySingle<HTMLInputElement>('#start-date', this.shadow);
        const endDateInput = querySingle<HTMLInputElement>('#end-date', this.shadow);
        const hoursInput = querySingle<HTMLInputElement>('#hours', this.shadow);

        if (ptoType === 'Full PTO' && startDateInput.value && endDateInput.value) {
            const days = getWeekdaysBetween(startDateInput.value, endDateInput.value);
            return Math.max(0, days) * 8;
        }

        const hours = parseFloat(hoursInput.value);
        return Number.isNaN(hours) ? 0 : hours;
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