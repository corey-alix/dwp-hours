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

    // Assert pto-summary-card values
    await test.step('Assert pto-summary-card values', async () => {
        const summaryRows = await page.evaluate(() => {
            const card = document.querySelector('pto-summary-card');
            if (!card) return [];
            const shadow = card.shadowRoot;
            if (!shadow) return [];
            const rows = shadow.querySelectorAll('.row');
            return Array.from(rows).map(row => row.textContent.trim());
        });
        expect(summaryRows[0]).toBe('Carryover40.00 hours');
        expect(summaryRows[1]).toBe('Annual Allocated96.00 hours');
        expect(summaryRows[2]).toBe('Used40.00 hours');
        expect(summaryRows[3]).toBe('Available96.00 hours');
    });

    // Assert pto-accrual-card values
    await test.step('Assert pto-accrual-card values', async () => {
        const accrualData = await page.evaluate(() => {
            const card = document.querySelector('pto-accrual-card');
            if (!card) return [];
            const shadow = card.shadowRoot;
            if (!shadow) return [];
            const rows = shadow.querySelectorAll('.accrual-row:not(.header)');
            return Array.from(rows).map(row => {
                const month = row.querySelector('.month')?.textContent.trim();
                const hours = row.querySelector('.hours')?.textContent.trim();
                const used = row.querySelector('.used')?.textContent.trim();
                return { month, hours, used };
            });
        });
        expect(accrualData[0]).toEqual({ month: 'January', hours: '8.1', used: '0.0' });
        expect(accrualData[1]).toEqual({ month: 'February', hours: '7.4', used: '48.0' });
        expect(accrualData[2]).toEqual({ month: 'March', hours: '8.1', used: '16.0' });
    });

    // Assert pto-sick-card values
    await test.step('Assert pto-sick-card values', async () => {
        const sickData = await page.evaluate(() => {
            const card = document.querySelector('pto-sick-card');
            if (!card) return { rows: [], entries: [] };
            const shadow = card.shadowRoot;
            if (!shadow) return { rows: [], entries: [] };
            const rows = shadow.querySelectorAll('.row');
            const rowTexts = Array.from(rows).map(row => row.textContent.trim());
            const entries = shadow.querySelectorAll('.usage-list li');
            const entryTexts = Array.from(entries).map(li => li.textContent.trim());
            return { rows: rowTexts, entries: entryTexts };
        });
        expect(sickData.rows[0]).toBe('Allowed24 hours');
        expect(sickData.rows[1]).toBe('Used24.00 hours');
        expect(sickData.rows[2]).toBe('Remaining0.00 hours');
        expect(sickData.entries[0]).toBe('2/16/20268.0 hours');
        expect(sickData.entries[1]).toBe('2/14/20268.0 hours');
        expect(sickData.entries[2]).toBe('2/12/20268.0 hours');
    });

    // Assert pto-bereavement-card values
    await test.step('Assert pto-bereavement-card values', async () => {
        const bereavementData = await page.evaluate(() => {
            const card = document.querySelector('pto-bereavement-card');
            if (!card) return { rows: [], empty: '' };
            const shadow = card.shadowRoot;
            if (!shadow) return { rows: [], empty: '' };
            const rows = shadow.querySelectorAll('.row');
            const rowTexts = Array.from(rows).map(row => row.textContent.trim());
            const empty = shadow.querySelector('.empty')?.textContent.trim() || '';
            return { rows: rowTexts, empty };
        });
        expect(bereavementData.rows[0]).toBe('Allowed40 hours');
        expect(bereavementData.rows[1]).toBe('Used0.00 hours');
        expect(bereavementData.rows[2]).toBe('Remaining40.00 hours');
        expect(bereavementData.empty).toBe('No entries recorded.');
    });

    // Assert pto-jury-duty-card values
    await test.step('Assert pto-jury-duty-card values', async () => {
        const juryData = await page.evaluate(() => {
            const card = document.querySelector('pto-jury-duty-card');
            if (!card) return { rows: [], empty: '' };
            const shadow = card.shadowRoot;
            if (!shadow) return { rows: [], empty: '' };
            const rows = shadow.querySelectorAll('.row');
            const rowTexts = Array.from(rows).map(row => row.textContent.trim());
            const empty = shadow.querySelector('.empty')?.textContent.trim() || '';
            return { rows: rowTexts, empty };
        });
        expect(juryData.rows[0]).toBe('Allowed40 hours');
        expect(juryData.rows[1]).toBe('Used0.00 hours');
        expect(juryData.rows[2]).toBe('Remaining40.00 hours');
        expect(juryData.empty).toBe('No entries recorded.');
    });

    // Assert pto-employee-info-card values
    await test.step('Assert pto-employee-info-card values', async () => {
        const infoRows = await page.evaluate(() => {
            const card = document.querySelector('pto-employee-info-card');
            if (!card) return [];
            const shadow = card.shadowRoot;
            if (!shadow) return [];
            const rows = shadow.querySelectorAll('.row');
            return Array.from(rows).map(row => row.textContent.trim());
        });
        expect(infoRows[0]).toBe('Hire Date1/14/2020');
        expect(infoRows[1]).toBe('Next Rollover1/1/2027');
    });

    // Test calendar colorings for February (month 2)
    await test.step('Verify February calendar displays correct PTO and sick time entries', async () => {
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
    });

    // Check that January calendar (when clicked) has no colored days
    await test.step('Verify January calendar has no time entries', async () => {
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

    // Test calendar colorings for March (month 3)
    await test.step('Verify March calendar displays correct PTO entries', async () => {
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
});
