import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { compareAndUpdateScreenshot } from './screenshot-utils';

test.use({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    locale: 'en-US',
    timezoneId: 'UTC',
    colorScheme: 'dark'
});

async function stabilizePage(page: Page) {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addStyleTag({
        content: `
            *, *::before, *::after {
                animation: none !important;
                transition: none !important;
                caret-color: transparent !important;
            }
            html {
                scroll-behavior: auto !important;
            }
        `
    });
}

test('PTO submission form screenshot', async ({ page }) => {
    // Create a simple test page for PTO form
    await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>PTO Submission Form Test</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                form { max-width: 400px; margin: 0 auto; }
                label { display: block; margin-top: 10px; }
                input, select { width: 100%; padding: 8px; margin-top: 5px; }
                button { margin-top: 20px; padding: 10px; background: #007bff; color: white; border: none; cursor: pointer; }
            </style>
        </head>
        <body>
            <h2>Submit Time Off</h2>
            <form id="pto-entry-form">
                <label for="start-date">Start Date:</label>
                <input type="date" id="start-date" required />

                <label for="pto-type">Type:</label>
                <select id="pto-type" required>
                    <option value="Sick">Sick</option>
                    <option value="PTO">PTO</option>
                    <option value="Bereavement">Bereavement</option>
                    <option value="Jury Duty">Jury Duty</option>
                </select>

                <label for="hours">Total Hours:</label>
                <input type="number" id="hours" step="0.5" required />

                <button type="submit">Submit Time Off</button>
            </form>
            <p><em>Note: End date will be automatically calculated based on workdays</em></p>
        </body>
        </html>
    `);
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-submission-form.png');
});

test('admin-panel component screenshot', async ({ page }) => {
    await page.goto('/components/admin-panel/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/admin-panel-component.png');
});

test('confirmation-dialog component screenshot', async ({ page }) => {
    await page.goto('/components/confirmation-dialog/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/confirmation-dialog-component.png');
});

test('data-table component screenshot', async ({ page }) => {
    await page.goto('/components/data-table/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/data-table-component.png');
});

test('employee-form component screenshot', async ({ page }) => {
    await page.goto('/components/employee-form/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/employee-form-component.png');
});

test('employee-list component screenshot', async ({ page }) => {
    await page.goto('/components/employee-list/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/employee-list-component.png');
});

test('pto-request-queue component screenshot', async ({ page }) => {
    await page.goto('/components/pto-request-queue/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-request-queue-component.png');
});

test('report-generator component screenshot', async ({ page }) => {
    await page.goto('/components/report-generator/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/report-generator-component.png');
});

test('pto-summary-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-summary-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-summary-card-component.png');
});

test('pto-accrual-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-accrual-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-accrual-card-component.png');
});

test('pto-sick-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-sick-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-sick-card-component.png');
});

test('pto-bereavement-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-bereavement-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-bereavement-card-component.png');
});

test('pto-jury-duty-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-jury-duty-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-jury-duty-card-component.png');
});

test('pto-employee-info-card component screenshot', async ({ page }) => {
    await page.goto('/components/pto-employee-info-card/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await stabilizePage(page);
    await compareAndUpdateScreenshot(await page.screenshot({ fullPage: true }), 'assets/pto-employee-info-card-component.png');
});