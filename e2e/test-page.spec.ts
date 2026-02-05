import { test, expect } from '@playwright/test';

test.describe('Main Test Page', () => {
    test('should complete automated TestWorkflow successfully', async ({ page }) => {
        test.setTimeout(30000); // Extended timeout for the full workflow

        // Navigate to the main test.html page
        await page.goto('http://localhost:3000/test.html');

        // Wait for the page to load and TestWorkflow to initialize
        await page.waitForSelector('#test-progress', { timeout: 10000 });

        // Verify the test progress section is present
        await expect(page.locator('#test-progress')).toBeVisible();

        // Wait for the TestWorkflow to initialize and start
        // The workflow should automatically start when the page loads
        await page.waitForTimeout(3000); // Give time for TestWorkflow to initialize

        // Check if the test output shows any activity
        const testOutput = page.locator('#test-output');

        // Wait for either success message or error message
        await Promise.race([
            page.waitForSelector('#test-output:has-text("All workflow steps completed successfully")', { timeout: 25000 }),
            page.waitForSelector('#test-output:has-text("Test failed to initialize")', { timeout: 25000 }),
            page.waitForSelector('#step-12', { timeout: 25000 })
        ]);

        // Check if we got a success message
        const outputText = await testOutput.textContent();
        if (outputText?.includes('Test failed to initialize')) {
            throw new Error(`TestWorkflow failed to initialize: ${outputText}`);
        }

        // Verify all steps completed successfully
        for (let i = 0; i < 13; i++) {
            const stepSelector = `#step-${i}`;
            await expect(page.locator(stepSelector)).toContainText('completed');
        }

        // Verify the final success message
        await expect(page.locator('#test-output')).toContainText('All workflow steps completed successfully');
    });
});