import { test, expect } from '@playwright/test';

test('pto-dashboard component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/components/pto-dashboard/test.html');
    await page.waitForSelector('#test-output');

    const errors = consoleMessages.filter(msg => msg.type === 'error');
    expect(errors).toHaveLength(0);

    await expect(page.locator('pto-summary-card[data]')).toBeVisible();
    await expect(page.locator('pto-accrual-card[accruals]')).toBeVisible();
    await expect(page.locator('pto-sick-card[data]')).toBeVisible();
    await expect(page.locator('pto-bereavement-card[data]')).toBeVisible();
    await expect(page.locator('pto-jury-duty-card[data]')).toBeVisible();
    await expect(page.locator('pto-employee-info-card[data]')).toBeVisible();

    const calendarButton = page.locator('button.calendar-button').first();
    await calendarButton.click();
    await expect(page.locator('pto-accrual-card[accruals]').locator('.calendar')).toBeVisible();
});
