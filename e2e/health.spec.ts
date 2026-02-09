import { test, expect } from "@playwright/test";

test("health check", async ({ page }) => {
  // Placeholder E2E test - assumes server is running on the configured port
  await page.goto("/");
  await expect(page).toHaveTitle(/DWP Hours/); // Adjust based on actual title
});
