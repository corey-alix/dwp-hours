import { test, expect } from '@playwright/test';

test.describe('Authentication Logout', () => {
    test('should login, verify cookie, logout, and verify cookie removal', async ({ page }) => {
        test.setTimeout(10000);

        // Step 1: Navigate to login page
        await page.goto('http://localhost:3000/index.html');
        await expect(page.locator('#login-form')).toBeVisible();

        // Step 2: Login using email address
        await page.fill('#identifier', 'john.doe@gmail.com');
        await page.click('#login-form button[type="submit"]');

        // Step 3: Get the magic link and redirect to it
        const magicLink = page.locator('#login-message a');
        await expect(magicLink).toBeVisible();
        await expect(magicLink).toHaveAttribute('href', /token=.+&ts=\d+/);

        const href = await magicLink.getAttribute('href');
        expect(href).toBeTruthy();

        // Navigate to the magic link URL
        await page.goto(href!);

        // Step 4: Verify cookie has been set
        await expect(page.locator('#dashboard')).toBeVisible();

        // Check that auth_hash cookie exists
        const cookies = await page.context().cookies();
        const authCookie = cookies.find(cookie => cookie.name === 'auth_hash');
        expect(authCookie).toBeTruthy();
        expect(authCookie?.value).toBeTruthy();
        expect(authCookie?.value).not.toBe('');

        // Step 5: Click the logout button
        const logoutBtn = page.locator('#logout-btn');
        await expect(logoutBtn).toBeVisible();
        await logoutBtn.click();

        // Step 6: Verify we're back to login form
        await expect(page.locator('#login-form')).toBeVisible(); // Should show login form again

        // Check that auth_hash cookie is no longer present
        const cookiesAfterLogout = await page.context().cookies();
        const authCookieAfterLogout = cookiesAfterLogout.find(cookie => cookie.name === 'auth_hash');
        expect(authCookieAfterLogout).toBeFalsy(); // Cookie should be gone
    });
});