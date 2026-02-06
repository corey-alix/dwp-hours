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

    // Test accrued and used values for all months
    await test.step('Check accrued and used values for all months', async () => {
        const expectedAccrued = [
            8.09, 7.36, 8.09, 8.09, 7.72, 8.09, 8.46, 7.72, 8.09, 8.09, 7.72, 8.46
        ];
        const expectedUsed = [24, 48, 16, 0, 0, 0, 80, 0, 0, 0, 0, 0];

        for (let month = 1; month <= 12; month++) {
            const monthRow = page.locator(`.accrual-row:has(button[data-month="${month}"])`);
            const accruedText = expectedAccrued[month - 1].toFixed(1);
            await expect(monthRow.locator('.hours')).toContainText(accruedText);
            const usedValue = expectedUsed[month - 1];
            const usedText = usedValue > 0 ? usedValue.toFixed(1) : "—";
            await expect(monthRow.locator('.used')).toContainText(usedText);
        }
    });

    // Test calendar state for key months
    await test.step('Check calendar for January', async () => {
        const januaryButton = page.locator('button[data-month="1"]');
        await januaryButton.click();
        const calendar = page.locator('pto-calendar');
        await expect(calendar).toBeVisible();
        // Check bereavement entries
        await expect(calendar.locator('[data-date="2026-01-21"]')).toHaveClass(/type-Bereavement/);
        await expect(calendar.locator('[data-date="2026-01-22"]')).toHaveClass(/type-Bereavement/);
        await expect(calendar.locator('[data-date="2026-01-23"]')).toHaveClass(/type-Bereavement/);
    });

    await test.step('Check calendar for February', async () => {
        const februaryButton = page.locator('button[data-month="2"]');
        await februaryButton.click();
        const calendar = page.locator('pto-calendar');
        await expect(calendar).toBeVisible();
        // Check sick entries
        await expect(calendar.locator('[data-date="2026-02-12"]')).toHaveClass(/type-Sick/);
        await expect(calendar.locator('[data-date="2026-02-14"]')).toHaveClass(/type-Sick/);
        await expect(calendar.locator('[data-date="2026-02-16"]')).toHaveClass(/type-Sick/);
        // Check PTO entries
        await expect(calendar.locator('[data-date="2026-02-20"]')).toHaveClass(/type-PTO/);
        await expect(calendar.locator('[data-date="2026-02-22"]')).toHaveClass(/type-PTO/);
        await expect(calendar.locator('[data-date="2026-02-24"]')).toHaveClass(/type-PTO/);
    });

    await test.step('Check calendar for March', async () => {
        const marchButton = page.locator('button[data-month="3"]');
        await marchButton.click();
        const calendar = page.locator('pto-calendar');
        await expect(calendar).toBeVisible();
        // Check PTO entries
        await expect(calendar.locator('[data-date="2026-03-02"]')).toHaveClass(/type-PTO/);
        await expect(calendar.locator('[data-date="2026-03-03"]')).toHaveClass(/type-PTO/);
        await expect(calendar.locator('[data-date="2026-03-04"]')).toHaveClass(/type-PTO/);
        await expect(calendar.locator('[data-date="2026-03-05"]')).toHaveClass(/type-PTO/);
    });

    await test.step('Check calendar for July', async () => {
        const julyButton = page.locator('button[data-month="7"]');
        await julyButton.click();
        const calendar = page.locator('pto-calendar');
        await expect(calendar).toBeVisible();
        // Check jury duty entries
        const juryDates = [20, 21, 22, 23, 24, 27, 28, 29, 30, 31];
        for (const date of juryDates) {
            await expect(calendar.locator(`[data-date="2026-07-${date}"]`)).toHaveClass(/type-Jury-Duty/);
        }
    });

    // Test PTO types in legend
    await test.step('Check PTO types in legend', async () => {
        const legend = page.locator('.legend');
        await expect(legend).toContainText('PTO');
        await expect(legend).toContainText('Sick');
        await expect(legend).toContainText('Bereavement');
        await expect(legend).toContainText('Jury Duty');
    });

    // Test calendar button click (existing)
    const januaryButton = page.locator('button.calendar-button').first();
    await januaryButton.click();

    const calendar = page.locator('pto-calendar');
    await expect(calendar).toBeVisible();

    await test.step('Verify calendar scrolls into view', async () => {
        // Wait for smooth scroll animation to complete
        await page.waitForTimeout(1000);

        // Check if the calendar is fully in the viewport
        const isInViewport = await calendar.evaluate((el) => {
            const rect = el.getBoundingClientRect();
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            return rect.top >= 0 && rect.left >= 0 && rect.bottom <= viewportHeight && rect.right <= viewportWidth;
        });

        expect(isInViewport).toBe(true);
    });
});