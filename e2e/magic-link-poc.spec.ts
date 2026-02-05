import { test, expect } from '@playwright/test';

test.describe('Magic link POC', () => {
    test('posting email returns a magic link', async ({ page }) => {
        test.setTimeout(5000);

        await page.goto('http://localhost:3000/index.html');
        await expect(page.locator('#login-form')).toBeVisible();

        await page.fill('#identifier', 'coreyalix@gmail.com');
        await page.click('#login-form button[type="submit"]');

        const magicLink = page.locator('#login-message a');
        await expect(magicLink).toBeVisible();
        await expect(magicLink).toHaveAttribute('href', /token=.+&ts=\d+/);
    });
});
