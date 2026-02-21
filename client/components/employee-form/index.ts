interface Employee {
  id?: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  role: string;
  hash?: string;
}

import { querySingle } from "../test-utils";
import { BaseComponent } from "../base-component";
import { styles } from "./css.js";

export class EmployeeForm extends BaseComponent {
  private _employee: Employee | null = null;
  private _isEdit = false;
  private _isSubmitting = false;
  private _errors: Record<string, string> = {};
  private _stagedFormValues: Record<string, string> | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    // Focus the first form field when component is connected
    // Use setTimeout for compatibility with test environments
    setTimeout(() => {
      this.focusFirstField();
    }, 0);
  }

  private focusFirstField(): void {
    const firstInput = querySingle<HTMLInputElement>("#name", this.shadowRoot);
    if (firstInput) {
      firstInput.focus();
    }
  }

  private focusFirstError(): void {
    // Focus the first field with an error
    const errorFields = ["name", "identifier", "ptoRate", "carryoverHours"];
    for (const fieldId of errorFields) {
      if (this.hasError(fieldId)) {
        const input = this.shadowRoot?.querySelector(
          `#${fieldId}`,
        ) as HTMLElement;
        if (input) {
          input.focus();
          break;
        }
      }
    }
  }

  static get observedAttributes() {
    return ["is-edit"];
  }

  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue === newValue) return;
    if (name === "is-edit") {
      this._isEdit = newValue === "true";
      this.requestUpdate();
    }
  }

  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employee(value: Employee | null) {
    this._employee = value;
    this._isEdit = !!value?.id;
    this._stagedFormValues = null;
    this._errors = {};
    this.requestUpdate();
  }

  get employee(): Employee | null {
    return this._employee;
  }

  set isEdit(value: boolean) {
    this.setAttribute("is-edit", value.toString());
  }

  get isEdit(): boolean {
    return this._isEdit;
  }

  protected render(): string {
    const title = this._isEdit ? "Edit Employee" : "Add New Employee";

    return `
            ${styles}
            <div class="form-container">
                ${this.renderFormHeader(title)}
                <form id="employee-form" role="form" aria-labelledby="form-title">
                    ${this.renderFormFields()}
                    ${this.renderFormActions()}
                </form>
                <slot name="balance-summary"></slot>
            </div>
        `;
  }

  private renderFormHeader(title: string): string {
    return `
                <div class="form-header">
                    <h2 id="form-title">${title}</h2>
                </div>
        `;
  }

  private renderFormFields(): string {
    return `
                    <div class="form-group">
                        <label class="form-label" for="name">
                            Full Name <span class="required" aria-label="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          class="form-input ${this.hasError("name") ? "error" : ""}"
                          value="${this._stagedFormValues?.name ?? this._employee?.name ?? ""}"
                          required
                          aria-required="true"
                          aria-describedby="name-error"
                          aria-invalid="${this.hasError("name") ? "true" : "false"}"
                        >
                        <span class="error-message" id="name-error" role="alert" aria-live="polite">${this._errors["name"] ?? ""}</span>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="identifier">
                            Employee Email <span class="required" aria-label="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="identifier"
                          name="identifier"
                          class="form-input ${this.hasError("identifier") ? "error" : ""}"
                          value="${this._stagedFormValues?.identifier ?? this._employee?.identifier ?? ""}"
                          required
                          aria-required="true"
                          aria-describedby="identifier-error"
                          aria-invalid="${this.hasError("identifier") ? "true" : "false"}"
                        >
                        <span class="error-message" id="identifier-error" role="alert" aria-live="polite">${this._errors["identifier"] ?? ""}</span>
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
                              class="form-input ${this.hasError("ptoRate") ? "error" : ""}"
                              value="${this._stagedFormValues?.ptoRate ?? this._employee?.ptoRate ?? 0.71}"
                              step="0.01"
                              min="0"
                              max="2"
                              aria-describedby="ptoRate-error"
                              aria-invalid="${this.hasError("ptoRate") ? "true" : "false"}"
                            >
                            <span class="error-message" id="ptoRate-error" role="alert" aria-live="polite">${this._errors["ptoRate"] ?? ""}</span>
                        </div>

                        <div class="form-group">
                            <label class="form-label" for="carryoverHours">
                                Carryover Hours
                            </label>
                            <input
                              type="number"
                              id="carryoverHours"
                              name="carryoverHours"
                              class="form-input ${this.hasError("carryoverHours") ? "error" : ""}"
                              value="${this._stagedFormValues?.carryoverHours ?? this._employee?.carryoverHours ?? 0}"
                              step="0.5"
                              min="0"
                              aria-describedby="carryoverHours-error"
                              aria-invalid="${this.hasError("carryoverHours") ? "true" : "false"}"
                            >
                            <span class="error-message" id="carryoverHours-error" role="alert" aria-live="polite">${this._errors["carryoverHours"] ?? ""}</span>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="role">
                            Role
                        </label>
                        <select id="role" name="role" class="form-select" aria-describedby="role-hint">
                          <option value="Employee" ${(this._stagedFormValues?.role ?? this._employee?.role) === "Employee" ? "selected" : ""}>Employee</option>
                          <option value="Admin" ${(this._stagedFormValues?.role ?? this._employee?.role) === "Admin" ? "selected" : ""}>Admin</option>
                        </select>
                        <span id="role-hint" class="sr-only">Select the employee's role in the system</span>
                    </div>
        `;
  }

  private renderFormActions(): string {
    return `
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" id="cancel-btn" aria-label="Cancel and close form">
                            Cancel
                        </button>
                        <button type="button" class="btn btn-primary" id="submit-btn" ${this._isSubmitting ? 'disabled aria-disabled="true"' : ""} aria-describedby="submit-status">
                            ${this._isEdit ? "Update Employee" : "Add Employee"}
                        </button>
                        <div id="submit-status" class="sr-only" aria-live="polite" aria-atomic="true">
                            ${this._isSubmitting ? "Submitting form..." : ""}
                        </div>
                    </div>
        `;
  }

  protected handleDelegatedClick(e: Event): void {
    const target = e.target as HTMLElement;

    if (target.id === "submit-btn") {
      e.preventDefault();
      if (this._isSubmitting) {
        return;
      }
      // Mark submitting and re-render action state after collecting data
      this._isSubmitting = true;

      // Collect and validate form data before rendering to avoid losing user input
      const result = this.validateAndCollectData();
      if (result.isValid) {
        // Update UI to submitting state
        this.requestUpdate();

        // Dispatch submit event with collected data
        this.dispatchEvent(
          new CustomEvent("employee-submit", {
            detail: { employee: result.employee, isEdit: this._isEdit },
            bubbles: true,
            composed: true,
          }),
        );

        // Clear submitting state and staged values after dispatch so consumers can update
        this._isSubmitting = false;
        this._stagedFormValues = null;
        this._errors = {};
        this.requestUpdate();
      } else {
        // Focus first error field
        this.focusFirstError();
        this._isSubmitting = false;
        // Keep staged form values so user input is preserved when re-rendering
        this.requestUpdate();
      }
    } else if (target.id === "cancel-btn") {
      this.dispatchEvent(
        new CustomEvent("form-cancel", {
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  private validateAndCollectData(): { isValid: boolean; employee?: Employee } {
    if (!this.validateForm()) {
      return { isValid: false };
    }

    const employee = this.collectFormData();
    return { isValid: true, employee };
  }

  private collectFormData(): Employee {
    const form =
      this.shadowRoot?.querySelector<HTMLFormElement>("#employee-form");
    if (!form) {
      throw new Error("Form not found");
    }

    const formData = new FormData(form);

    // Type-safe form data extraction with validation
    const getStringValue = (key: string): string => {
      const value = formData.get(key);
      if (typeof value !== "string") {
        throw new Error(
          `Invalid form data for ${key}: expected string, got ${typeof value}`,
        );
      }
      return value;
    };

    const getNumberValue = (key: string, defaultValue: number): number => {
      const stringValue = getStringValue(key);
      if (stringValue.trim() === "") {
        return defaultValue;
      }
      const parsed = parseFloat(stringValue);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number format for ${key}: ${stringValue}`);
      }
      return parsed;
    };

    return {
      id: this._employee?.id,
      name: getStringValue("name"),
      identifier: getStringValue("identifier"),
      ptoRate: getNumberValue("ptoRate", 0.71),
      carryoverHours: getNumberValue("carryoverHours", 0),
      role: getStringValue("role"),
      hash: this._employee?.hash,
    };
  }

  protected handleDelegatedKeydown(e: KeyboardEvent): void {
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      // Allow Enter on inputs to work normally (form submission)
      return;
    }

    if (e.key === "Enter" && !this._isSubmitting) {
      // Enter on form elements (not inputs) triggers submit
      e.preventDefault();
      const submitBtn = this.shadowRoot?.querySelector(
        "#submit-btn",
      ) as HTMLButtonElement;
      if (submitBtn && !submitBtn.disabled) {
        submitBtn.click();
      }
    } else if (e.key === "Escape") {
      // Escape cancels the form
      e.preventDefault();
      const cancelBtn = this.shadowRoot?.querySelector(
        "#cancel-btn",
      ) as HTMLButtonElement;
      if (cancelBtn) {
        cancelBtn.click();
      }
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    // Capture current form values so a re-render preserves user input
    const nameInput = querySingle<HTMLInputElement>("#name", this.shadowRoot);
    const identifierInput = querySingle<HTMLInputElement>(
      "#identifier",
      this.shadowRoot,
    );
    const ptoRateInput = querySingle<HTMLInputElement>(
      "#ptoRate",
      this.shadowRoot,
    );
    const carryoverInput = querySingle<HTMLInputElement>(
      "#carryoverHours",
      this.shadowRoot,
    );

    this._stagedFormValues = {
      name: nameInput?.value ?? "",
      identifier: identifierInput?.value ?? "",
      ptoRate: ptoRateInput?.value ?? "",
      carryoverHours: carryoverInput?.value ?? "",
      role:
        this.shadowRoot?.querySelector<HTMLSelectElement>("#role")?.value ??
        this._employee?.role ??
        "Employee",
    };

    if (!this.validateField(nameInput)) isValid = false;
    if (!this.validateField(identifierInput)) isValid = false;
    if (!this.validatePtoRate(ptoRateInput)) isValid = false;
    if (!this.validateCarryoverHours(carryoverInput)) isValid = false;

    return isValid;
  }

  private hasError(fieldId: string): boolean {
    const v = this._errors[fieldId];
    return !!(v && v.trim() !== "");
  }

  private validateField(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    // Clear previous error for this field
    delete this._errors[input.id];

    if (input.hasAttribute("required") && !value) {
      this._errors[input.id] = "This field is required";
      return false;
    }

    if (input.id === "identifier" && value && !this.isValidEmail(value)) {
      this._errors[input.id] = "Employee email must be a valid email address";
      return false;
    }

    return true;
  }

  private isValidEmail(email: string): boolean {
    // Comprehensive email validation: no consecutive dots, proper format, length limit
    if (email.length > 254 || email.includes("..")) {
      return false;
    }

    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  }

  private validatePtoRate(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    delete this._errors["ptoRate"];

    if (!value) {
      // Optional field, use default
      return true;
    }

    const rate = parseFloat(value);
    if (isNaN(rate)) {
      this._errors["ptoRate"] = "PTO rate must be a valid number";
      return false;
    }

    if (rate < 0) {
      this._errors["ptoRate"] = "PTO rate cannot be negative";
      return false;
    }

    if (rate > 2) {
      this._errors["ptoRate"] = "PTO rate cannot exceed 2 hours per day";
      return false;
    }

    return true;
  }

  private validateCarryoverHours(input: HTMLInputElement): boolean {
    const value = input.value.trim();
    delete this._errors["carryoverHours"];

    if (!value) {
      // Optional field, use default
      return true;
    }

    const hours = parseFloat(value);
    if (isNaN(hours)) {
      this._errors["carryoverHours"] = "Carryover hours must be a valid number";
      return false;
    }

    if (hours < 0) {
      this._errors["carryoverHours"] = "Carryover hours cannot be negative";
      return false;
    }

    if (hours > 1000) {
      this._errors["carryoverHours"] =
        "Carryover hours cannot exceed 1000 hours";
      return false;
    }

    return true;
  }
}

customElements.define("employee-form", EmployeeForm);
