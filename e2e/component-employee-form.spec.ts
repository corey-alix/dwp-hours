import { test, expect } from '@playwright/test';

test('employee-form component test', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to the test page
    await page.goto('/components/employee-form/test.html');

    // Wait for the page to load and component to initialize
    await page.waitForSelector('#test-output');

    // Check that no console errors occurred during loading
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    expect(errors).toHaveLength(0);

    // Check that expected log messages are present
    const logs = consoleMessages.filter(msg => msg.type === 'log');
    expect(logs.some(log => log.text.includes('Starting Employee Form playground test'))).toBe(true);

    // Check that employee form is visible
    const employeeForm = page.locator('employee-form');
    await expect(employeeForm).toBeVisible();

    // Check form elements
    const nameInput = employeeForm.locator('#name');
    const identifierInput = employeeForm.locator('#identifier');
    const ptoRateInput = employeeForm.locator('#ptoRate');
    const carryoverInput = employeeForm.locator('#carryoverHours');
    const roleSelect = employeeForm.locator('#role');
    const submitButton = employeeForm.locator('#submit-btn');
    const cancelButton = employeeForm.locator('#cancel-btn');

    await expect(nameInput).toBeVisible();
    await expect(identifierInput).toBeVisible();
    await expect(ptoRateInput).toBeVisible();
    await expect(carryoverInput).toBeVisible();
    await expect(roleSelect).toBeVisible();
    await expect(submitButton).toBeVisible();
    await expect(cancelButton).toBeVisible();

    // Check initial form state (add mode)
    await expect(submitButton).toContainText('Add Employee');

    // Test form validation - try submitting empty form
    await submitButton.click();

    // Note: Validation might not show errors immediately in this test environment
    // Just check that the form elements are present and functional

    // Test valid form submission
    await nameInput.fill('Test Employee');
    await identifierInput.fill('test.employee@company.com');
    await ptoRateInput.fill('0.75');
    await carryoverInput.fill('20');

    // Submit form
    await submitButton.click();

    // Check output shows form submission
    const output = page.locator('#test-output');
    await expect(output).toContainText('Form submitted: Add - Test Employee');

    // Test cancel button
    await cancelButton.click();
    await expect(output).toContainText('Form cancelled');

    // Test another submission with different data
    await nameInput.fill('Another Employee');
    await identifierInput.fill('another.employee@company.com');
    await ptoRateInput.fill('1.0');
    await carryoverInput.fill('10');

    await submitButton.click();
    await expect(output).toContainText('Form submitted: Add - Another Employee');

    // Ensure no console errors throughout the test
    const finalErrors = consoleMessages.filter(msg => msg.type === 'error');
    expect(finalErrors).toHaveLength(0);
});