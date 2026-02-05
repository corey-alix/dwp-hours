import { test, expect } from '@playwright/test';

test('pto-calendar component test', async ({ page }) => {
    await page.goto('/components/pto-calendar/test.html');

    // Wait for the component to load
    await page.waitForSelector('pto-calendar');

    // Check that the component exists
    const component = await page.locator('pto-calendar');
    await expect(component).toBeVisible();

    // Check that the calendar grid exists
    const calendarGrid = await page.locator('pto-calendar').locator('.calendar-grid');
    await expect(calendarGrid).toBeVisible();

    // Check that legend exists
    const legend = await page.locator('pto-calendar').locator('.legend');
    await expect(legend).toBeVisible();

    // Check legend items count (should be 5: PTO, Sick, Bereavement, Jury Duty, Planned PTO)
    const legendItems = await page.locator('pto-calendar').locator('.legend-item');
    await expect(legendItems).toHaveCount(5);

    // Test readonly mode (default) - legend items should not be clickable
    const legendItem = await page.locator('pto-calendar').locator('.legend-item').first();
    await expect(legendItem).not.toHaveClass(/clickable/);

    // Test editable mode - set readonly to false
    await page.evaluate(() => {
        const calendar = document.querySelector('pto-calendar') as any;
        calendar.setReadonly(false);
    });

    // Now legend items should be clickable
    await expect(legendItem).toHaveClass(/clickable/);

    // Test legend item selection
    await legendItem.click();
    await expect(legendItem).toHaveClass(/selected/);

    // Test cell selection - click on a weekday cell
    const calendarCells = await page.locator('pto-calendar').locator('.day.clickable');
    const firstCell = calendarCells.first();

    // Get the date attribute before clicking
    const cellDate = await firstCell.getAttribute('data-date');

    // Click the cell
    await firstCell.click();

    // Cell should now be selected
    await expect(firstCell).toHaveClass(/selected/);

    // Check that hours input appears for selected cell
    const hoursInput = await page.locator('pto-calendar').locator('.hours-input');
    await expect(hoursInput).toBeVisible();

    // Test hours editing
    await hoursInput.fill('6.5');
    await hoursInput.press('Tab'); // Trigger change event

    // Verify the value was set
    await expect(hoursInput).toHaveValue('6.5');

    // Test invalid hours (should show error styling)
    await hoursInput.fill('25'); // Invalid - over 24 hours
    await hoursInput.press('Tab');

    // Should have invalid class
    await expect(hoursInput).toHaveClass(/invalid/);

    // Test submit button injection
    // First add a submit button via slot
    await page.evaluate(() => {
        const calendar = document.querySelector('pto-calendar') as any;
        const submitButton = document.createElement('button');
        submitButton.setAttribute('slot', 'submit');
        submitButton.textContent = 'Submit Request';
        submitButton.id = 'test-submit-btn';
        submitButton.addEventListener('click', () => {
            calendar.submitRequest();
        });
        calendar.appendChild(submitButton);
    });

    // Check that submit button appears in the slot
    const submitButton = await page.locator('pto-calendar').locator('#test-submit-btn');
    await expect(submitButton).toBeVisible();

    // Test submit functionality
    let eventFired = false;
    page.on('console', msg => {
        if (msg.text().includes('PTO Request Submitted')) {
            eventFired = true;
        }
    });

    // Click submit button
    await submitButton.click();

    // Check that event was fired (by checking console message from test.html)
    await page.waitForTimeout(100); // Give time for event to fire
    expect(eventFired).toBe(true);

    // Test clear selection
    await page.evaluate(() => {
        const calendar = document.querySelector('pto-calendar') as any;
        calendar.clearSelection();
    });

    // Selected cell should no longer be selected
    await expect(firstCell).not.toHaveClass(/selected/);

    // Legend item should no longer be selected
    await expect(legendItem).not.toHaveClass(/selected/);
});