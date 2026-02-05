import { test, expect } from '@playwright/test';

test('pto-summary-card component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/components/pto-summary-card/test.html');
    await page.waitForSelector('#test-output');

    // Allow for non-critical errors (like missing favicon)
    const criticalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);

    await expect(page.locator('pto-summary-card')).toBeVisible();
    await expect(page.locator('#test-output')).toContainText('Initial data set via property');

    // Wait for attribute update
    await page.waitForTimeout(2500);
    await expect(page.locator('#test-output')).toContainText('Data updated via attribute');
});