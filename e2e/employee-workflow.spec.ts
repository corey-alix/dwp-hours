import { test, expect } from '@playwright/test';

test.describe('Employee Authentication & Workflow', () => {
    test('should complete comprehensive PTO calendar request workflow', async ({ page }) => {
        test.setTimeout(10000);

        page.on('console', (msg) => {
            console.log(`[browser ${msg.type()}] ${msg.text()}`);
        });
        page.on('pageerror', (error) => {
            console.log(`[pageerror] ${error.message}`);
        });
        page.on('requestfailed', (request) => {
            if (request.url().includes('/api/pto')) {
                const failure = request.failure();
                console.log(
                    `[requestfailed] ${request.method()} ${request.url()} :: ${failure?.errorText ?? 'unknown'}`
                );
            }
        });
        page.on('response', async (response) => {
            if (response.url().includes('/api/pto')) {
                const status = response.status();
                const method = response.request().method();
                const contentType = response.headers()['content-type'] ?? '';
                let bodyPreview = '';
                if (contentType.includes('application/json')) {
                    try {
                        const body = await response.json();
                        bodyPreview = JSON.stringify(body);
                    } catch (error) {
                        bodyPreview = `json-parse-error:${(error as Error).message}`;
                    }
                }
                console.log(
                    `[response] ${method} ${status} ${response.url()}${bodyPreview ? ` :: ${bodyPreview}` : ''}`
                );
            }
        });

        // Use a fixed weekday date that won't conflict with seed data
        const testDateStr = '2026-03-12'; // Thursday

        // Navigate to the actual application
        await page.goto('http://localhost:3000');

        // Fill out login form with test user email
        await page.fill('#identifier', 'coreyalix@gmail.com');
        await page.click('#login-form button[type="submit"]');

        // Wait for magic link to appear
        await page.waitForSelector('#login-message', { timeout: 10000 });
        const magicLink = page.locator('#login-message a');
        await expect(magicLink).toBeVisible();
        await expect(magicLink).toHaveAttribute('href', /token=.+&ts=\d+/);

        // Click the magic link to login
        await magicLink.click();

        // Wait for dashboard to load
        await page.waitForSelector('#dashboard', { timeout: 10000 });
        await expect(page.locator('#pto-status')).toBeVisible();

        // Verify we're in request mode by default (Phase 13)
        const accrualCard = page.locator('pto-accrual-card');
        await expect(accrualCard).toBeVisible();
        const requestMode = await accrualCard.getAttribute('request-mode');
        expect(requestMode).toBe('true');

        // Select March (next month from February 2026)
        await page.click('button[data-month="3"]'); // March (1-based indexing)

        // Wait for calendar to load
        await page.waitForSelector('pto-calendar', { timeout: 5000 });

        // Click the "PTO" legend item to select PTO type
        await page.click('pto-calendar .legend-item[data-type="PTO"]');

        // Click on test date (random day in March, guaranteed to be unique)
        await page.click(`pto-calendar .day.clickable[data-date="${testDateStr}"]`);

        // Verify the cell is selected
        await expect(page.locator('pto-calendar .day.selected')).toHaveCount(1);

        // Edit hours to 4 (default is 8)
        const hoursInput = page.locator('.hours-input');
        await expect(hoursInput).toBeVisible();
        await hoursInput.fill('4');

        // Click "Submit PTO Request" button
        const submitButton = page.locator('button.submit-button');
        await expect(submitButton).toBeVisible();

        // Wait for the API call to complete and capture the response
        const [ptoResponse] = await Promise.all([
            page.waitForResponse(
                (response) => response.url().includes('/api/pto') && response.request().method() === 'POST',
                { timeout: 1000 }
            ),
            submitButton.click(),
        ]);

        // Wait for the response and verify it
        expect(ptoResponse.status()).toBe(201);
        const responseBody = await ptoResponse.json();

        // Verify the response contains expected PTO request data
        expect(responseBody).toBeDefined();
        expect(responseBody).toHaveProperty('message', 'PTO entries created successfully');
        expect(responseBody).toHaveProperty('ptoEntry');

        const ptoRequest = responseBody.ptoEntry;
        expect(ptoRequest).toBeDefined();
        expect(ptoRequest.employee_id).toBeDefined();
        expect(ptoRequest.date).toBe(testDateStr); // Date stored as YYYY-MM-DD string
        expect(ptoRequest.type).toBe('PTO');
        expect(ptoRequest.hours).toBe(4);

        // Verify success notification appears
        await expect(page.locator('.notification-toast.success')).toBeVisible();

        console.log('Comprehensive PTO calendar request workflow completed successfully');
    });
});