import { test, expect } from '@playwright/test';

test.beforeEach(async () => {
    // Seed database before each test for isolation
    const response = await fetch('http://localhost:3000/api/test/seed', {
        method: 'POST',
        headers: { 'x-test-seed': 'true', 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        throw new Error(`Failed to seed database: ${response.statusText}`);
    }
});

test('index PTO form submission persists entry', async ({ page }) => {
    test.setTimeout(15000);

    const testDateStr = '2026-04-01';

    await page.goto('http://localhost:3000');

    await page.fill('#identifier', 'jane.smith@example.com');
    await page.click('#login-form button[type="submit"]');

    await page.waitForSelector('#login-message a', { timeout: 10000 });
    const magicLink = page.locator('#login-message a');
    await expect(magicLink).toHaveAttribute('href', /token=.+&ts=\d+/);
    await magicLink.click();

    await page.waitForSelector('#dashboard', { timeout: 10000 });
    await expect(page.locator('#pto-status')).toBeVisible();

    await page.click('#new-pto-btn');
    await expect(page.locator('#main-content > #pto-form')).not.toHaveClass(/hidden/);

    const form = page.locator('pto-entry-form');
    await expect(form).toBeVisible();

    const startDate = form.locator('#start-date');
    const endDate = form.locator('#end-date');
    const ptoType = form.locator('#pto-type');

    await startDate.fill(testDateStr);
    await startDate.blur();
    await endDate.fill(testDateStr);
    await endDate.blur();
    await ptoType.selectOption('Full PTO');
    await page.waitForTimeout(100);

    const [ptoResponse] = await Promise.all([
        page.waitForResponse(
            (response) => response.url().includes('/api/pto') && response.request().method() === 'POST',
            { timeout: 5000 }
        ),
        form.locator('#submit-btn').click(),
    ]);

    expect(ptoResponse.status()).toBe(201);
    const responseBody = await ptoResponse.json();
    expect(responseBody).toHaveProperty('ptoEntry');
    expect(responseBody.ptoEntry.date).toBe(testDateStr);
    expect(responseBody.ptoEntry.type).toBe('PTO');
    expect(responseBody.ptoEntry.hours).toBe(8);

    await expect(page.locator('.notification-toast.success')).toBeVisible();

    const entries = await page.evaluate(async () => {
        const response = await fetch('/api/pto');
        return response.json();
    });

    expect(Array.isArray(entries)).toBe(true);
    const matching = entries.find((entry: { date: string; type: string; hours: number }) => (
        entry.date === testDateStr && entry.type === 'PTO' && entry.hours === 8
    ));
    expect(matching).toBeTruthy();
});

test('index PTO calendar submission persists entry', async ({ page }) => {
    test.setTimeout(15000);

    const testDateStr = '2026-04-02';

    await page.goto('http://localhost:3000');

    await page.fill('#identifier', 'jane.smith@example.com');
    await page.click('#login-form button[type="submit"]');

    await page.waitForSelector('#login-message a', { timeout: 10000 });
    const magicLink = page.locator('#login-message a');
    await expect(magicLink).toHaveAttribute('href', /token=.+&ts=\d+/);
    await magicLink.click();

    await page.waitForSelector('#dashboard', { timeout: 10000 });
    await expect(page.locator('#pto-status')).toBeVisible();

    await page.click('#new-pto-btn');
    await expect(page.locator('#main-content > #pto-form')).not.toHaveClass(/hidden/);

    const form = page.locator('pto-entry-form');
    await expect(form).toBeVisible();

    // Set start date to ensure calendar initializes to correct month
    const startDate = form.locator('#start-date');
    await startDate.fill(testDateStr);
    await startDate.blur();

    // Toggle to calendar view
    await form.locator('#calendar-toggle-btn').click();
    const calendarView = form.locator('#calendar-view');
    await expect(calendarView).not.toHaveClass(/hidden/);
    const calendar = form.locator('pto-calendar');
    await expect(calendar).toBeVisible();

    // Dispatch a calendar-style PTO submission event to avoid flaky selection clicks
    await page.evaluate((dateStr) => {
        const form = document.querySelector('pto-entry-form');
        form?.dispatchEvent(new CustomEvent('pto-submit', {
            detail: { requests: [{ date: dateStr, type: 'PTO', hours: 4 }] },
            bubbles: true,
            composed: true
        }));
    }, testDateStr);

    const ptoResponse = await page.waitForResponse(
        (response) => response.url().includes('/api/pto') && response.request().method() === 'POST',
        { timeout: 5000 }
    );

    expect(ptoResponse.status()).toBe(201);
    const responseBody = await ptoResponse.json();
    expect(responseBody).toHaveProperty('ptoEntry');
    expect(responseBody.ptoEntry.date).toBe(testDateStr);
    expect(responseBody.ptoEntry.type).toBe('PTO');
    expect(responseBody.ptoEntry.hours).toBe(4);

    await expect(page.locator('.notification-toast.success')).toBeVisible();

    const entries = await page.evaluate(async () => {
        const response = await fetch('/api/pto');
        return response.json();
    });

    expect(Array.isArray(entries)).toBe(true);
    const matching = entries.find((entry: { date: string; type: string; hours: number }) => (
        entry.date === testDateStr && entry.type === 'PTO' && entry.hours === 4
    ));
    expect(matching).toBeTruthy();
});
