import { test, expect } from '@playwright/test';

test('pto-employee-info-card component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/components/pto-employee-info-card/test.html');
    await page.waitForSelector('#test-output');

    // Allow for non-critical errors (like missing favicon)
    const criticalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);

    await expect(page.locator('pto-employee-info-card')).toBeVisible();
    await expect(page.locator('#test-output')).toContainText('Employee info data set.');
});