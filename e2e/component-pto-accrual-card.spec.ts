import { test, expect } from '@playwright/test';

test('pto-accrual-card component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/components/pto-accrual-card/test.html');
    await page.waitForSelector('#test-output');

    // Allow for non-critical errors (like missing favicon)
    const criticalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);

    await expect(page.locator('pto-accrual-card')).toBeVisible();
    await expect(page.locator('#test-output')).toContainText('Accrual data set. Click calendar buttons to view details.');

    // Test calendar button click
    const januaryButton = page.locator('button.calendar-button').first();
    await januaryButton.click();

    const calendar = page.locator('pto-calendar');
    await expect(calendar).toBeVisible();
});