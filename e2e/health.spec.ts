import { test, expect } from '@playwright/test';

test('health check', async ({ page }) => {
  // Placeholder E2E test - assumes server is running on localhost:3000
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/DWP Hours/); // Adjust based on actual title
});