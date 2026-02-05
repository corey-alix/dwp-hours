import { test, expect } from '@playwright/test';

test('pto-request-queue component test', async ({ page }) => {
    // Listen for console messages
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Navigate to the test page
    await page.goto('/components/pto-request-queue/test.html');

    // Wait for the page to load and component to initialize
    await page.waitForSelector('#test-output');

    // Check that no console errors occurred during loading
    const errors = consoleMessages.filter(msg => msg.type === 'error');
    expect(errors).toHaveLength(0);

    // Check that expected log messages are present
    const logs = consoleMessages.filter(msg => msg.type === 'log');
    expect(logs.some(log => log.text.includes('Starting PTO Request Queue playground test'))).toBe(true);

    // Check that PTO request queue is visible
    const ptoQueue = page.locator('pto-request-queue');
    await expect(ptoQueue).toBeVisible();

    // Check header elements
    const queueTitle = ptoQueue.locator('.queue-title');
    await expect(queueTitle).toContainText('PTO Request Queue');

    const statValue = ptoQueue.locator('.stat-value');
    await expect(statValue).toBeVisible();

    // Check request cards
    const requestCards = ptoQueue.locator('.request-card');
    const initialCount = await requestCards.count();

    if (initialCount > 0) {
        // Test request card structure
        const firstCard = requestCards.first();

        // Check employee name
        const employeeName = firstCard.locator('.employee-name');
        await expect(employeeName).toBeVisible();

        // Check request details
        const requestDetails = firstCard.locator('.request-details');
        await expect(requestDetails).toBeVisible();

        // Check action buttons
        const approveButton = firstCard.locator('.action-btn.approve');
        const rejectButton = firstCard.locator('.action-btn.reject');

        await expect(approveButton).toBeVisible();
        await expect(rejectButton).toBeVisible();

        // Test approve button
        await approveButton.click();

        // Check output shows approve action
        const output = page.locator('#test-output');
        await expect(output).toContainText('Approved request ID:');

        // Test reject button
        await rejectButton.click();
        await expect(output).toContainText('Rejected request ID:');
    } else {
        // Check empty state
        const emptyState = ptoQueue.locator('.empty-state');
        await expect(emptyState).toBeVisible();
        await expect(emptyState).toContainText('No pending requests');
    }

    // Test statistics display
    const statLabel = ptoQueue.locator('.stat-label');
    await expect(statLabel).toContainText('Pending');

    // Ensure no console errors throughout the test
    const finalErrors = consoleMessages.filter(msg => msg.type === 'error');
    expect(finalErrors).toHaveLength(0);
});