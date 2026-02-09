import { test, expect } from "@playwright/test";

test("prior-year-review component loads", async ({ page }) => {
  await page.goto("/components/prior-year-review/test.html");

  // Wait for the page to load
  await page.waitForLoadState("networkidle");

  // Check that the component exists in the DOM
  const component = await page.locator("prior-year-review");
  await expect(component).toBeAttached();

  // Check that the page title is correct
  await expect(page).toHaveTitle("Prior Year Review Component Test");

  // Check that the test output div exists
  const testOutput = await page.locator("#test-output");
  await expect(testOutput).toBeVisible();
});
