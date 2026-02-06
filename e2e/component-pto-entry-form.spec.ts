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

    // Test form validation - try to submit empty form
    await page.locator('pto-entry-form').locator('#submit-btn').click();
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#pto-type-error')).toHaveText('This field is required');
    await expect(page.locator('pto-entry-form').locator('#hours-error')).toHaveText('This field is required');

    // Fill out the form with valid data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startDateStr = tomorrow.toISOString().split('T')[0];

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    const endDateStr = dayAfter.toISOString().split('T')[0];

    await page.locator('pto-entry-form').locator('#start-date').fill(startDateStr);
    await page.locator('pto-entry-form').locator('#end-date').fill(endDateStr);
    await page.locator('pto-entry-form').locator('#pto-type').selectOption('Full PTO');
    await page.locator('pto-entry-form').locator('#hours').fill('8');

    // Check that validation errors are cleared
    await expect(page.locator('pto-entry-form').locator('#start-date-error')).toBeEmpty();
    await expect(page.locator('pto-entry-form').locator('#end-date-error')).toBeEmpty();
    await expect(page.locator('pto-entry-form').locator('#pto-type-error')).toBeEmpty();
    await expect(page.locator('pto-entry-form').locator('#hours-error')).toBeEmpty();

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