import { test, expect } from '@playwright/test';

test('report-generator component test', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to the test page
    await page.goto('/components/report-generator/test.html');

    // Check what the page actually contains
    const pageContent = await page.content();
    console.log('Page title:', await page.title());
    console.log('Page contains report-generator:', pageContent.includes('report-generator'));
    console.log('Page contains test-output:', pageContent.includes('test-output'));

    // Check if app.js is accessible
    try {
        const response = await page.request.get('/app.js');
        console.log('app.js status:', response.status());
        console.log('app.js content length:', response.text().length);
    } catch (error) {
        console.log('Error fetching app.js:', error.message);
    }

    // Wait for the page to load and component to initialize
    await page.waitForSelector('#test-output');

    // Check that no console errors occurred during loading
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    expect(errors).toHaveLength(0);

    // Check that expected log messages are present
    const logs = consoleMessages.filter(msg => msg.type === 'log');
    expect(logs.some(log => log.text.includes('Starting Report Generator playground test'))).toBe(true);

    // Check that report generator is visible
    const reportGenerator = page.locator('report-generator');
    await expect(reportGenerator).toBeVisible();

    // Check if component is actually created
    const componentExists = await page.locator('report-generator').count();
    console.log('Component exists:', componentExists > 0);

    // Check component type
    const componentType = await page.evaluate(() => {
        const component = document.querySelector('report-generator');
        return component ? component.constructor.name : 'null';
    });
    console.log('Component type:', componentType);

    // Check header elements
    const reportTitle = reportGenerator.locator('.report-title');
    await expect(reportTitle).toContainText('PTO Reports');

    // Check control elements - these should be in Shadow DOM
    const reportTypeSelect = reportGenerator.locator('#report-type');
    const startDateInput = reportGenerator.locator('#start-date');
    const endDateInput = reportGenerator.locator('#end-date');
    const generateButton = reportGenerator.locator('#generate-report');
    const exportButton = reportGenerator.locator('#export-csv');

    // Check if elements exist
    const selectCount = await reportTypeSelect.count();
    console.log('Select element count:', selectCount);

    await expect(reportTypeSelect).toBeVisible();
    await expect(startDateInput).toBeVisible();
    await expect(endDateInput).toBeVisible();
    await expect(generateButton).toBeVisible();
    await expect(exportButton).toBeVisible();

    // Check initial report type
    await expect(reportTypeSelect).toHaveValue('summary');

    // Test report type change (just check that the select value changes)
    await reportTypeSelect.selectOption('detailed');
    await expect(reportTypeSelect).toHaveValue('detailed');

    // Test date inputs can be filled
    await startDateInput.fill('2024-01-01');
    await endDateInput.fill('2024-12-31');
    await expect(startDateInput).toHaveValue('2024-01-01');
    await expect(endDateInput).toHaveValue('2024-12-31');

    // Test generate button is clickable
    await generateButton.click();

    // Test export button is clickable
    await exportButton.click();

    // Test switching back to summary report
    await reportTypeSelect.selectOption('summary');
    await expect(reportTypeSelect).toHaveValue('summary');

    // Ensure no console errors throughout the test
    const finalErrors = consoleMessages.filter(msg => msg.type === 'error');
    expect(finalErrors).toHaveLength(0);
});