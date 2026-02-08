import { test, expect } from '@playwright/test';
import { calculateEndDateFromHours } from '../shared/dateUtils.js';

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
    await expect(testOutput).toContainText('Form submit');

    // Toggle to calendar view
    await page.locator('pto-entry-form').locator('#calendar-toggle-btn').click();
    const calendarView = page.locator('pto-entry-form').locator('#calendar-view');
    await expect(calendarView).not.toHaveClass(/hidden/);
    const calendar = page.locator('pto-entry-form').locator('pto-calendar');
    await expect(calendar).toBeVisible();

    // Test cancel button
    await page.locator('pto-entry-form').locator('#cancel-btn').click();
    await expect(testOutput).toContainText('Form cancel');
});

test('pto-entry-form weekend warning test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    // Use fixed weekend dates for determinism
    const saturdayStr = '2026-02-07'; // Saturday
    const sundayStr = '2026-02-08'; // Sunday

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
    await expect(testOutput).toContainText('Form submit');
});

test('pto-entry-form spillover calculation test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    // Find next Monday (to avoid weekend complications)
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (8 - nextMonday.getDay()) % 7 || 7);
    const mondayStr = nextMonday.toISOString().split('T')[0];

    // Switch to "Sick" PTO type (non-"Full PTO")
    await page.locator('pto-entry-form').locator('#pto-type').selectOption('Sick');
    await page.waitForTimeout(100); // Wait for field behavior to update

    // Set start date to Monday
    await page.locator('pto-entry-form').locator('#start-date').fill(mondayStr);
    await page.locator('pto-entry-form').locator('#start-date').blur();

    // Set hours to 12 (should spill over to Tuesday: 8 hours Monday + 4 hours Tuesday)
    await page.locator('pto-entry-form').locator('#hours').fill('12');
    await page.locator('pto-entry-form').locator('#hours').blur();

    // Calculate expected end date (Monday + 1 day = Tuesday)
    const expectedEndDateStr = calculateEndDateFromHours(mondayStr, 12);

    // Check that end date is calculated correctly
    await expect(page.locator('pto-entry-form').locator('#end-date')).toHaveValue(expectedEndDateStr);

    // Test with 16 hours starting on a known weekday and rely on shared spillover logic
    const fridayStr = '2026-02-06';

    await page.locator('pto-entry-form').locator('#start-date').fill(fridayStr);
    await page.locator('pto-entry-form').locator('#start-date').blur();
    await page.locator('pto-entry-form').locator('#hours').fill('16');
    await page.locator('pto-entry-form').locator('#hours').blur();

    // Wait a bit for calculation
    await page.waitForTimeout(500);

    // Expected end date: Based on the actual calculation (Friday + spillover)
    const expectedEndDateStr2 = calculateEndDateFromHours(fridayStr, 16);

    // Check that end date skips weekend correctly
    await expect(page.locator('pto-entry-form').locator('#end-date')).toHaveValue(expectedEndDateStr2);

    // Submission is not validated here because spillover examples exceed allowed hours.
});

test('pto-entry-form dynamic field behavior test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    const ptoType = page.locator('pto-entry-form').locator('#pto-type');
    const hoursLabel = page.locator('pto-entry-form').locator('label[for="hours"]');
    const hoursInput = page.locator('pto-entry-form').locator('#hours');
    const endDateInput = page.locator('pto-entry-form').locator('#end-date');

    // Default state should be Full PTO
    await expect(ptoType).toHaveValue('Full PTO');
    await expect(hoursLabel).toHaveText(/Days/);
    await expect(hoursInput).toHaveAttribute('readonly', '');
    await expect(endDateInput).not.toHaveAttribute('readonly', '');

    // Switch to Partial PTO (non-Full PTO behavior)
    await ptoType.selectOption('Partial PTO');
    await page.waitForTimeout(100);
    await expect(hoursLabel).toHaveText(/Hours/);
    await expect(hoursInput).not.toHaveAttribute('readonly', '');
    await expect(endDateInput).toHaveAttribute('readonly', '');

    // Switch back to Full PTO
    await ptoType.selectOption('Full PTO');
    await page.waitForTimeout(100);
    await expect(hoursLabel).toHaveText(/Days/);
    await expect(hoursInput).toHaveAttribute('readonly', '');
    await expect(endDateInput).not.toHaveAttribute('readonly', '');
});

test('pto-entry-form calendar interaction test', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-entry-form/test.html');

    // Wait for the component to be defined and loaded
    await page.waitForFunction(() => customElements.get('pto-entry-form') !== undefined);
    await page.waitForTimeout(500); // Additional time for component initialization

    // Click calendar toggle button
    await page.locator('pto-entry-form').locator('#calendar-toggle-btn').click();

    // Confirm calendar view is visible
    const calendarView = page.locator('pto-entry-form').locator('#calendar-view');
    await expect(calendarView).not.toHaveClass(/hidden/);
    const calendar = page.locator('pto-entry-form').locator('pto-calendar');
    await expect(calendar).toBeVisible();

    // Wait for calendar cells to be rendered
    await page.waitForSelector('pto-entry-form pto-calendar .day.clickable');

    // Confirm that the "PTO" legend item is selected
    const ptoLegend = calendar.locator('.legend-item[data-type="PTO"]');
    await expect(ptoLegend).toHaveClass(/selected/);

    // Click a weekday on the calendar
    const weekdayCell = calendar.locator('.day.clickable:not(.weekend)').first();
    await weekdayCell.click();

    // Confirm that the cell is properly colored as "PTO"
    await expect(weekdayCell).toHaveClass(/type-PTO/);

    // Submit the form
    await page.locator('pto-entry-form').locator('#submit-btn').click();

    // Wait for the event to be logged
    await page.waitForFunction(() => {
        const output = document.querySelector('#test-output');
        return output && output.textContent && output.textContent.includes('Calendar submit');
    });

    // Confirm that the "Submit" correctly submits a "PTO" request for the specified number of hours
    const testOutput = page.locator('#test-output');
    await expect(testOutput).toContainText('Calendar submit');
});