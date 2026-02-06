import { test, expect } from '@playwright/test';

test.describe('Employee Authentication & Workflow', () => {
    test('should complete comprehensive PTO calendar request workflow', async ({ page }) => {
        test.setTimeout(20000); // 20 seconds is enough to identify issues

        // Navigate to the actual application
        await page.goto('http://localhost:3000');

        // Wait for login form
        await page.waitForSelector('#login-section', { timeout: 10000 });

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

        // Click on March 6, 2026 (Thursday, no existing PTO)
        await page.click('pto-calendar .day.clickable[data-date="2026-03-06"]');

        // Verify the cell is selected
        await expect(page.locator('pto-calendar .day.selected')).toHaveCount(1);

        // Edit hours to 4 (default is 8)
        const hoursInput = page.locator('pto-calendar .hours-input');
        await expect(hoursInput).toBeVisible();
        await hoursInput.fill('4');

        // Click "Submit PTO Request" button
        const submitButton = page.locator('button.submit-button');
        await expect(submitButton).toBeVisible();

        // Wait for the API call to complete and capture the response
        const ptoResponsePromise = page.waitForResponse(
            (response) => response.url().includes('/api/pto') && response.request().method() === 'POST'
        );

        await submitButton.click();

        // Wait for the response and verify it
        const ptoResponse = await ptoResponsePromise;
        expect(ptoResponse.status()).toBe(201);
        const responseBody = await ptoResponse.json();

        // Verify the response contains expected PTO request data
        expect(responseBody).toBeDefined();
        expect(responseBody).toHaveProperty('message', 'PTO entries created successfully');
        expect(responseBody).toHaveProperty('ptoEntry');

        const ptoRequest = responseBody.ptoEntry;
        expect(ptoRequest).toBeDefined();
        expect(ptoRequest.employee_id).toBeDefined();
        expect(ptoRequest.date).toBe('2026-03-06'); // Date stored as YYYY-MM-DD string
        expect(ptoRequest.type).toBe('PTO');
        expect(ptoRequest.hours).toBe(4);

        // Verify success notification appears
        await expect(page.locator('.notification-toast.success')).toBeVisible();

        console.log('Comprehensive PTO calendar request workflow completed successfully');
    });
});