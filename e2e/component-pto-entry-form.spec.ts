import { test, expect } from '@playwright/test';

test('pto-entry-form component test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    // Check that the component exists and has the expected structure
    const component = page.locator('pto-entry-form');
    await expect(component).toBeAttached();

    // Check form elements exist (within shadow DOM)
    await expect(page.locator('pto-entry-form').locator('#start-date')).toBeVisible();
    await expect(page.locator('pto-entry-form').locator('#end-date')).toBeVisible();
    await expect(page.locator('pto-entry-form').locator('#pto-type')).toBeVisible();
    await expect(page.locator('pto-entry-form').locator('#hours')).toBeVisible();
    await expect(page.locator('pto-entry-form').locator('#submit-btn')).toBeVisible();
    await expect(page.locator('pto-entry-form').locator('#cancel-btn')).toBeVisible();

    // Test form validation - clear form and try to submit empty form
    await page.locator('pto-entry-form').locator('#start-date').fill('');
    await page.locator('pto-entry-form').locator('#start-date').blur();
    await page.locator('pto-entry-form').locator('#end-date').fill('');
    await page.locator('pto-entry-form').locator('#end-date').blur();
    await page.locator('pto-entry-form').locator('#pto-type').selectOption('');
    await page.locator('pto-entry-form').locator('#hours').fill('');
    await page.locator('pto-entry-form').locator('#hours').blur();
    
    await page.locator('pto-entry-form').locator('#submit-btn').click();
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#pto-type-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#hours-error')).toHaveText('This field is required');

    // Fill out the form with valid data (use specific weekdays to avoid weekend warnings)
    // Monday of next week to ensure it's a weekday
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7 || 7);
    const startDateStr = nextMonday.toISOString().split('T')[0];

    // Tuesday of next week
    const nextTuesday = new Date(nextMonday);
    nextTuesday.setDate(nextMonday.getDate() + 1);
    const endDateStr = nextTuesday.toISOString().split('T')[0];

    await page.locator('pto-entry-form').locator('#start-date').fill(startDateStr);
    await page.locator('pto-entry-form').locator('#pto-type').selectOption('Full PTO');
    await page.waitForTimeout(100); // Wait for field behavior to update
    await page.locator('pto-entry-form').locator('#end-date').fill(endDateStr);
    // For "Full PTO", hours field is readonly and shows calculated days

    // Check that validation errors are cleared
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toBeEmpty();
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toBeEmpty();
    await expect(page.locator('pto-entry-form').locator('#pto-type-error')).toBeEmpty();
    // Hours field is readonly for "Full PTO", so no error expected

    // Test form submission
    await page.locator('pto-entry-form').locator('#submit-btn').click();

    // Check that the pto-submit event was fired (check test output)
    await page.waitForSelector('#test-output', { timeout: 5000 });
    const testOutput = page.locator('#test-output');
    await expect(testOutput).toContainText('PTO submitted');

    // Test cancel button
    await page.locator('pto-entry-form').locator('#cancel-btn').click();
    await expect(testOutput).toContainText('PTO form cancelled');
});

test('pto-entry-form weekend warning test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    // Find next Saturday
    const nextSaturday = new Date();
    nextSaturday.setDate(nextSaturday.getDate() + (6 - nextSaturday.getDay()) % 7 || 7);
    const saturdayStr = nextSaturday.toISOString().split('T')[0];

    // Find next Sunday
    const nextSunday = new Date(nextSaturday);
    nextSunday.setDate(nextSaturday.getDate() + 1);
    const sundayStr = nextSunday.toISOString().split('T')[0];

    // Fill start date with Saturday
    await page.locator('pto-entry-form').locator('#start-date').fill(saturdayStr);
    await page.locator('pto-entry-form').locator('#start-date').blur();
    await page.locator('pto-entry-form').locator('#pto-type').selectOption('Full PTO');
    await page.waitForTimeout(100); // Wait for field behavior to update
    await page.locator('pto-entry-form').locator('#end-date').fill(sundayStr);
    await page.locator('pto-entry-form').locator('#end-date').blur();

    // Check that weekend warnings appear
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toHaveText('Warning: Selected date is a weekend. PTO is typically for weekdays.');
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toHaveText('Warning: Selected date is a weekend. PTO is typically for weekdays.');

    // Verify warnings have correct styling (warning-message class)
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toHaveClass('warning-message');
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toHaveClass('warning-message');

    // Test that form can still be submitted with weekend warnings
    await page.locator('pto-entry-form').locator('#submit-btn').click();
    await page.waitForSelector('#test-output', { timeout: 5000 });
    const testOutput = page.locator('#test-output');
    await expect(testOutput).toContainText('PTO submitted');
});