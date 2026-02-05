import { test, expect } from '@playwright/test';

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

    await page.screenshot({ path: 'assets/pto-submission-form.png', fullPage: true });
});

test('admin-panel component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/admin-panel/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/admin-panel-component.png', fullPage: true });
});

test('confirmation-dialog component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/confirmation-dialog/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/confirmation-dialog-component.png', fullPage: true });
});

test('data-table component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/data-table/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/data-table-component.png', fullPage: true });
});

test('employee-form component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/employee-form/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/employee-form-component.png', fullPage: true });
});

test('employee-list component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/employee-list/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/employee-list-component.png', fullPage: true });
});

test('pto-request-queue component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/pto-request-queue/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/pto-request-queue-component.png', fullPage: true });
});

test('report-generator component screenshot', async ({ page }) => {
    await page.goto('http://localhost:3000/components/report-generator/test.html');
    await page.waitForSelector('#test-output', { timeout: 10000 });
    await page.screenshot({ path: 'assets/report-generator-component.png', fullPage: true });
});