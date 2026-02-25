// @vitest-environment happy-dom

import { describe, it, expect, beforeEach } from "vitest";
import { EmployeeForm } from "../../client/components/employee-form/index.js";

describe("EmployeeForm Component", () => {
  let element: EmployeeForm;

  /** Set the hireDate input to a default value so required-field validation passes. */
  function fillHireDate(value = "2020-01-15"): void {
    const input = element.shadowRoot?.querySelector(
      "#hireDate",
    ) as HTMLInputElement;
    if (input) input.value = value;
  }

  beforeEach(() => {
    // Happy DOM provides global document, window, etc.
    element = new EmployeeForm();
    document.body.appendChild(element);
  });

  it("should render form in add mode", () => {
    expect(element.shadowRoot?.querySelector("form")).toBeTruthy();
    expect(element.shadowRoot?.querySelector("h2")?.textContent).toBe(
      "Add New Employee",
    );
  });

  it("should render form in edit mode when employee is set", () => {
    const testEmployee = {
      id: 1,
      name: "Test Employee",
      identifier: "test@example.com",
      ptoRate: 0.8,
      carryoverHours: 10,
      role: "Employee",
    };

    element.employee = testEmployee;

    expect(element.shadowRoot?.querySelector("h2")?.textContent).toBe(
      "Edit Employee",
    );
    expect(
      element.shadowRoot?.querySelector("#name")?.getAttribute("value"),
    ).toBe("Test Employee");
    expect(
      element.shadowRoot?.querySelector("#identifier")?.getAttribute("value"),
    ).toBe("test@example.com");
  });

  it("should instantiate without errors", () => {
    expect(element).toBeInstanceOf(EmployeeForm);
    expect(element.shadowRoot).toBeTruthy();
  });

  describe("Template Functions", () => {
    it("should render styles via css.ts import", () => {
      const shadowHtml = element.shadowRoot?.innerHTML || "";
      expect(shadowHtml).toContain("<style>");
      expect(shadowHtml).toContain(":host");
      expect(shadowHtml).toContain(".form-container");
      expect(shadowHtml).toContain(".btn-primary");
    });

    it("should render form header with correct title", () => {
      const header = (element as any).renderFormHeader("Add New Employee");
      expect(header).toContain('<div class="form-header">');
      expect(header).toContain('<h2 id="form-title">Add New Employee</h2>');
    });

    it("should render form fields with input elements", () => {
      const fields = (element as any).renderFormFields();
      expect(fields).toContain('id="name"');
      expect(fields).toContain('id="identifier"');
      expect(fields).toContain('id="ptoRate"');
      expect(fields).toContain('id="carryoverHours"');
      expect(fields).toContain('id="role"');
    });

    it("should render form actions with buttons", () => {
      const actions = (element as any).renderFormActions();
      expect(actions).toContain('id="cancel-btn"');
      expect(actions).toContain('id="submit-btn"');
      expect(actions).toContain("Add Employee");
    });
  });

  describe("Data Collection and Validation", () => {
    it("should collect form data correctly", () => {
      // Set up form with test data
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;
      const roleSelect = element.shadowRoot?.querySelector(
        "#role",
      ) as HTMLSelectElement;
      const hireDateInput = element.shadowRoot?.querySelector(
        "#hireDate",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (ptoRateInput) ptoRateInput.value = "0.8";
      if (carryoverInput) carryoverInput.value = "15";
      if (roleSelect) roleSelect.value = "Admin";
      if (hireDateInput) hireDateInput.value = "2020-01-15";

      const data = (element as any).collectFormData();

      expect(data.name).toBe("John Doe");
      expect(data.identifier).toBe("john@example.com");
      expect(data.ptoRate).toBe(0.8);
      expect(data.carryoverHours).toBe(15);
      expect(data.role).toBe("Admin");
      expect(data.hireDate).toBe("2020-01-15");
    });

    it("should validate and collect data when form is valid", () => {
      // Fill required fields
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";

      const hireDateInput = element.shadowRoot?.querySelector(
        "#hireDate",
      ) as HTMLInputElement;
      if (hireDateInput) hireDateInput.value = "2020-01-15";

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(true);
      expect(result.employee?.name).toBe("John Doe");
      expect(result.employee?.identifier).toBe("john@example.com");
    });

    it("should return invalid when required fields are empty", () => {
      // Leave required fields empty
      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(false);
      expect(result.employee).toBeUndefined();
    });

    it("should validate email format", () => {
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "invalid-email";

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(false);
    });

    it("should validate PTO rate range", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (ptoRateInput) ptoRateInput.value = "3"; // Invalid: too high

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(false);
    });

    it("should validate negative PTO rate", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (ptoRateInput) ptoRateInput.value = "-0.5"; // Invalid: negative

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(false);
    });

    it("should validate carryover hours range", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (carryoverInput) carryoverInput.value = "1500"; // Invalid: too high

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(false);
    });

    it("should accept valid PTO rate and carryover values", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (ptoRateInput) ptoRateInput.value = "1.5"; // Valid
      if (carryoverInput) carryoverInput.value = "50"; // Valid
      fillHireDate();

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(true);
      expect(result.employee?.ptoRate).toBe(1.5);
      expect(result.employee?.carryoverHours).toBe(50);
    });

    it("should handle empty optional numeric fields with defaults", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      if (identifierInput) identifierInput.value = "john@example.com";
      if (ptoRateInput) ptoRateInput.value = ""; // Empty
      if (carryoverInput) carryoverInput.value = ""; // Empty
      fillHireDate();

      const result = (element as any).validateAndCollectData();

      expect(result.isValid).toBe(true);
      expect(result.employee?.ptoRate).toBe(0.71); // Default
      expect(result.employee?.carryoverHours).toBe(0); // Default
    });

    it("should validate complex email formats", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;

      if (nameInput) nameInput.value = "John Doe";
      fillHireDate();

      // Test valid emails
      const validEmails = [
        "test@example.com",
        "user.name+tag@example.co.uk",
        "test.email@subdomain.example.com",
      ];

      for (const email of validEmails) {
        if (identifierInput) identifierInput.value = email;
        const result = (element as any).validateAndCollectData();
        expect(result.isValid).toBe(true);
      }

      // Test invalid emails
      const invalidEmails = [
        "invalid-email",
        "@example.com",
        "test@",
        "test..test@example.com",
      ];

      for (const email of invalidEmails) {
        if (identifierInput) identifierInput.value = email;
        const result = (element as any).validateAndCollectData();
        if (result.isValid) {
          console.log("Unexpectedly valid email:", email);
        }
        expect(result.isValid).toBe(false);
      }
    });
  });

  describe("Accessibility and UX Enhancements", () => {
    it("should have proper ARIA attributes on form", () => {
      const form = element.shadowRoot?.querySelector("form");
      expect(form?.getAttribute("role")).toBe("form");
      expect(form?.getAttribute("aria-labelledby")).toBe("form-title");
    });

    it("should have proper ARIA attributes on required fields", () => {
      const nameInput = element.shadowRoot?.querySelector(
        "#name",
      ) as HTMLInputElement;
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;

      expect(nameInput?.getAttribute("aria-required")).toBe("true");
      expect(nameInput?.getAttribute("aria-describedby")).toBe("name-error");
      expect(identifierInput?.getAttribute("aria-required")).toBe("true");
      expect(identifierInput?.getAttribute("aria-describedby")).toBe(
        "identifier-error",
      );
    });

    it("should have proper ARIA attributes on error messages", () => {
      const nameError = element.shadowRoot?.querySelector("#name-error");
      const identifierError =
        element.shadowRoot?.querySelector("#identifier-error");

      expect(nameError?.getAttribute("role")).toBe("alert");
      expect(nameError?.getAttribute("aria-live")).toBe("polite");
      expect(identifierError?.getAttribute("role")).toBe("alert");
      expect(identifierError?.getAttribute("aria-live")).toBe("polite");
    });

    it("should have screen reader only hint for role select", () => {
      const roleHint = element.shadowRoot?.querySelector("#role-hint");
      expect(roleHint?.classList.contains("sr-only")).toBe(true);
      expect(roleHint?.textContent).toContain("Select the employee");
    });

    it("should disable submit button when submitting", () => {
      // Simulate submitting state
      (element as any)._isSubmitting = true;
      (element as any).requestUpdate();

      const submitBtn = element.shadowRoot?.querySelector(
        "#submit-btn",
      ) as HTMLButtonElement;

      // Should be disabled
      expect(submitBtn?.disabled).toBe(true);
      expect(submitBtn?.getAttribute("aria-disabled")).toBe("true");
    });

    it("should have proper input types for better UX", () => {
      const identifierInput = element.shadowRoot?.querySelector(
        "#identifier",
      ) as HTMLInputElement;
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;

      expect(identifierInput?.type).toBe("email");
      expect(ptoRateInput?.type).toBe("number");
      expect(carryoverInput?.type).toBe("number");
    });

    it("should have proper min/max/step attributes on number inputs", () => {
      const ptoRateInput = element.shadowRoot?.querySelector(
        "#ptoRate",
      ) as HTMLInputElement;
      const carryoverInput = element.shadowRoot?.querySelector(
        "#carryoverHours",
      ) as HTMLInputElement;

      expect(ptoRateInput?.getAttribute("min")).toBe("0");
      expect(ptoRateInput?.getAttribute("max")).toBe("2");
      expect(ptoRateInput?.getAttribute("step")).toBe("0.01");
      expect(carryoverInput?.getAttribute("min")).toBe("0");
      expect(carryoverInput?.getAttribute("step")).toBe("0.5");
    });

    it("should handle keyboard navigation", () => {
      // Test that the keyboard handler method exists
      expect(typeof (element as any).handleDelegatedKeydown).toBe("function");

      // Test Enter key handling by calling the method directly
      const enterEvent = new KeyboardEvent("keydown", { key: "Enter" });
      (element as any).handleDelegatedKeydown(enterEvent);

      // Test Escape key handling
      const escapeEvent = new KeyboardEvent("keydown", { key: "Escape" });
      (element as any).handleDelegatedKeydown(escapeEvent);

      // The actual click behavior is tested elsewhere
    });
  });
});
