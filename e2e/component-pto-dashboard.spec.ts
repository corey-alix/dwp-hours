import { test, expect } from '@playwright/test';

test('pto-dashboard component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    await page.goto('/components/pto-dashboard/test.html');
    await page.waitForSelector('#test-output');

    // Allow for non-critical errors (like missing favicon)
    const criticalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest')
    );
    expect(criticalErrors).toHaveLength(0);

    await expect(page.locator('pto-summary-card[data]')).toBeVisible();
    await expect(page.locator('pto-accrual-card[accruals]')).toBeVisible();
    await expect(page.locator('pto-sick-card[data]')).toBeVisible();
    await expect(page.locator('pto-bereavement-card[data]')).toBeVisible();
    await expect(page.locator('pto-jury-duty-card[data]')).toBeVisible();
    await expect(page.locator('pto-employee-info-card[data]')).toBeVisible();

    // Test calendar colorings for February (month 2)
    const februaryButton = page.locator('button.calendar-button').nth(1); // Second button is February
    await februaryButton.click();

    const calendar = page.locator('pto-calendar');
    await expect(calendar).toBeVisible();

    // Check that February sick days are correctly colored (based on actual rendering)
    const day12 = calendar.locator('.day').filter({ hasText: '12' });
    await expect(day12).toHaveClass(/type-Sick/);
    await expect(day12).toContainText('8.0');

    const day14 = calendar.locator('.day').filter({ hasText: '14' });
    await expect(day14).toHaveClass(/type-Sick/);
    await expect(day14).toContainText('8.0');

    const day16 = calendar.locator('.day').filter({ hasText: '16' });
    await expect(day16).toHaveClass(/type-Sick/);
    await expect(day16).toContainText('8.0');

    // Check that February PTO days are correctly colored
    const day20 = calendar.locator('.day').filter({ hasText: '20' });
    await expect(day20).toHaveClass(/type-PTO/);
    await expect(day20).toContainText('8.0');

    const day22 = calendar.locator('.day').filter({ hasText: '22' });
    await expect(day22).toHaveClass(/type-PTO/);
    await expect(day22).toContainText('8.0');

    const day24 = calendar.locator('.day').filter({ hasText: '24' });
    await expect(day24).toHaveClass(/type-PTO/);
    await expect(day24).toContainText('8.0');

    // Check that other days in February are not colored
    const day13 = calendar.locator('.day').filter({ hasText: '13' });
    await expect(day13).not.toHaveClass(/type-/);

    const day15 = calendar.locator('.day').filter({ hasText: '15' });
    await expect(day15).not.toHaveClass(/type-/);

    const day17 = calendar.locator('.day').filter({ hasText: '17' });
    await expect(day17).not.toHaveClass(/type-/);

    const day21 = calendar.locator('.day').filter({ hasText: '21' });
    await expect(day21).not.toHaveClass(/type-/);

    const day23 = calendar.locator('.day').filter({ hasText: '23' });
    await expect(day23).not.toHaveClass(/type-/);

    const day25 = calendar.locator('.day').filter({ hasText: '25' });
    await expect(day25).not.toHaveClass(/type-/);

    // Check that January calendar (when clicked) has no colored days
    const januaryButton = page.locator('button.calendar-button').first();
    await januaryButton.click();

    const janCalendar = page.locator('pto-accrual-card[accruals]').locator('.calendar');
    await expect(janCalendar).toBeVisible();

    // All days in January should not have type classes
    const janDays = janCalendar.locator('.day:not(.empty)');
    const janDayCount = await janDays.count();
    for (let i = 0; i < janDayCount; i++) {
        await expect(janDays.nth(i)).not.toHaveClass(/type-/);
    }
});
