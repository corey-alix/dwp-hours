import { test, expect } from '@playwright/test';

test('admin-panel component test', async ({ page }) => {
    // Navigate to the main app first to authenticate
    await page.goto('/');

    // Fill out login form with admin user email
    await page.fill('#identifier', 'admin@example.com');
    await page.click('#login-form button[type="submit"]');

    // Wait for magic link to appear
    await page.waitForSelector('#login-message', { timeout: 10000 });
    const magicLink = page.locator('#login-message a');
    await expect(magicLink).toBeVisible();

    // Click the magic link to login
    await magicLink.click();

    // Wait for dashboard to load (confirms authentication worked)
    await page.waitForSelector('#dashboard', { timeout: 10000 });

    // Check that auth cookie is set
    const cookies = await page.context().cookies();
    const authCookie = cookies.find(c => c.name === 'auth_hash');
    expect(authCookie).toBeTruthy();

    // Listen for console messages only on the test page
    const consoleMessages: { type: string; text: string }[] = [];
    page.on('console', msg => {
        consoleMessages.push({ type: msg.type(), text: msg.text() });
    });

    // Now navigate to the test page
    await page.goto('/components/admin-panel/test.html');

    // Wait for the page to load and component to initialize
    await page.waitForSelector('#test-output');

    // Allow for non-critical errors (like missing favicon)
    const errors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest') &&
        !msg.text.includes('Failed to load PTO status')
    );
    expect(errors).toHaveLength(0);

    // Check that expected log messages are present
    const logs = consoleMessages.filter(msg => msg.type === 'log');
    expect(logs.some(log => log.text.includes('Starting Admin Panel playground test'))).toBe(true);

    // Check that admin panel is visible
    const adminPanel = page.locator('admin-panel');
    await expect(adminPanel).toBeVisible();

    // Check sidebar navigation
    const sidebar = adminPanel.locator('.sidebar');
    await expect(sidebar).toBeVisible();

    // Check sidebar header
    const sidebarHeader = sidebar.locator('.sidebar-header h2');
    await expect(sidebarHeader).toContainText('Admin Panel');

    // Check navigation menu
    const navMenu = sidebar.locator('.nav-menu');
    await expect(navMenu).toBeVisible();

    // Check navigation links
    const navLinks = navMenu.locator('.nav-link');
    await expect(navLinks).toHaveCount(4);

    // Check that all expected navigation items are present
    await expect(navLinks.filter({ hasText: '👥 Employees' })).toBeVisible();
    await expect(navLinks.filter({ hasText: '📋 PTO Requests' })).toBeVisible();
    await expect(navLinks.filter({ hasText: '📊 Reports' })).toBeVisible();
    await expect(navLinks.filter({ hasText: '⚙️ Settings' })).toBeVisible();

    // Check main content area
    const mainContent = adminPanel.locator('.main-content');
    await expect(mainContent).toBeVisible();

    // Check header
    const header = mainContent.locator('.header');
    await expect(header).toBeVisible();

    const headerTitle = header.locator('h1');
    await expect(headerTitle).toBeVisible();

    // Check content area
    const content = mainContent.locator('.content');
    await expect(content).toBeVisible();

    // Test basic navigation clicks (just check they don't error)
    const employeesLink = navLinks.filter({ hasText: '👥 Employees' });
    await employeesLink.click();
    // Just check the click doesn't cause errors

    // Ensure no console errors throughout the test
    const finalErrors = consoleMessages.filter(msg =>
        msg.type === 'error' &&
        !msg.text.includes('favicon') &&
        !msg.text.includes('manifest') &&
        !msg.text.includes('Failed to load PTO status')
    );
    expect(finalErrors).toHaveLength(0);
});