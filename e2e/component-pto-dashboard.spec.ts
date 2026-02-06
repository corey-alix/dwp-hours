import { test, expect } from '@playwright/test';

test('pto-dashboard component test', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
        console.log('PAGE CONSOLE:', msg.type(), msg.text()); // Add this to see logs
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

    await expect(page.locator('pto-summary-card')).toBeVisible();
    await expect(page.locator('pto-accrual-card')).toBeVisible();
    await expect(page.locator('pto-sick-card')).toBeVisible();
    await expect(page.locator('pto-bereavement-card')).toBeVisible();
    await expect(page.locator('pto-jury-duty-card')).toBeVisible();
    await expect(page.locator('pto-employee-info-card')).toBeVisible();

    // Test calendar colorings for February (month 2)
    const februaryButton = page.locator('button.calendar-button').nth(1); // Second button is February
    await februaryButton.click();

    const calendar = page.locator('pto-calendar');
    await expect(calendar).toBeVisible();

    // Check that February sick days are correctly colored (based on actual rendering)
    const day12 = calendar.locator('.day[data-date="2026-02-12"]');
    await expect(day12).toHaveClass(/type-Sick/);
    await expect(day12).toContainText('8');

    const day14 = calendar.locator('.day[data-date="2026-02-14"]');
    await expect(day14).toHaveClass(/type-Sick/);
    await expect(day14).toContainText('8');

    const day16 = calendar.locator('.day[data-date="2026-02-16"]');
    await expect(day16).toHaveClass(/type-Sick/);
    await expect(day16).toContainText('8');

    // Check that February PTO days are correctly colored
    const day20 = calendar.locator('.day[data-date="2026-02-20"]');
    await expect(day20).toHaveClass(/type-PTO/);
    await expect(day20).toContainText('8');

    const day22 = calendar.locator('.day[data-date="2026-02-22"]');
    await expect(day22).toHaveClass(/type-PTO/);
    await expect(day22).toContainText('8');

    const day24 = calendar.locator('.day[data-date="2026-02-24"]');
    await expect(day24).toHaveClass(/type-PTO/);
    await expect(day24).toContainText('8');

    // Check that other days in February are not colored
    const day1 = calendar.locator('.day[data-date="2026-02-01"]');
    await expect(day1).not.toHaveClass(/type-/);

    const day5 = calendar.locator('.day[data-date="2026-02-05"]');
    await expect(day5).not.toHaveClass(/type-/);

    const day10 = calendar.locator('.day[data-date="2026-02-10"]');
    await expect(day10).not.toHaveClass(/type-/);

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

    // Test calendar colorings for March (month 3)
    const marchButton = page.locator('button.calendar-button').nth(2); // Third button is March
    await marchButton.click();

    const marchCalendar = page.locator('pto-calendar');
    await expect(marchCalendar).toBeVisible();

    // Debug: check the pto-entries attribute
    const ptoEntriesAttr = await marchCalendar.getAttribute('pto-entries');
    console.log('DEBUG: pto-entries attribute on pto-calendar:', ptoEntriesAttr);

    // Check that March 1st is correctly colored with PTO
    const marchDay1 = marchCalendar.locator('.day[data-date="2026-03-01"]');
    await expect(marchDay1).toHaveClass(/type-PTO/);
    await expect(marchDay1).toContainText('16');

    // Check that other days in March are not colored
    const marchDay2 = marchCalendar.locator('.day[data-date="2026-03-02"]');
    await expect(marchDay2).not.toHaveClass(/type-/);

    const marchDay5 = marchCalendar.locator('.day[data-date="2026-03-05"]');
    await expect(marchDay5).not.toHaveClass(/type-/);

    const marchDay10 = marchCalendar.locator('.day[data-date="2026-03-10"]');
    await expect(marchDay10).not.toHaveClass(/type-/);
});
