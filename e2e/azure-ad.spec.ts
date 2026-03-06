import { test, expect } from "@playwright/test";

/**
 * E2E tests for Azure AD authentication integration.
 * These tests verify the login page behavior based on the azureAdEnabled feature flag.
 * They do NOT test the actual Azure AD flow (which requires a real Azure tenant).
 */

test.describe("Azure AD Login", () => {
  test("Azure login button is hidden when feature flag is off", async ({
    page,
  }) => {
    // Mock the feature flags endpoint to return azureAdEnabled: false
    await page.route("**/api/config/flags", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          enableBrowserImport: true,
          enableImportAutoApprove: true,
          azureAdEnabled: false,
        }),
      });
    });

    await page.goto("/login");
    // The Azure button should NOT be present
    const azureBtn = page.locator("#azure-login-btn");
    await expect(azureBtn).toHaveCount(0);
  });

  test("Azure login button is visible when feature flag is on", async ({
    page,
  }) => {
    // Mock the feature flags endpoint to return azureAdEnabled: true
    await page.route("**/api/config/flags", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          enableBrowserImport: true,
          enableImportAutoApprove: true,
          azureAdEnabled: true,
        }),
      });
    });

    await page.goto("/login");

    // Wait a moment for the async flag fetch to complete and re-render
    // The button lives inside a shadow DOM, so we need to use frame locator-style queries
    // Wait for the azure login button to appear (async flag fetch)
    await expect(
      page.locator("login-page").locator("css=#azure-login-btn"),
    ).toBeVisible({ timeout: 5000 });
  });

  test("magic-link flow works regardless of Azure flag", async ({ page }) => {
    // Mock feature flags with Azure enabled
    await page.route("**/api/config/flags", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          enableBrowserImport: true,
          enableImportAutoApprove: true,
          azureAdEnabled: true,
        }),
      });
    });

    await page.goto("/login");

    // The magic-link form should still be present
    const loginForm = page.locator("login-page").locator("css=#login-form");
    await expect(loginForm).toBeVisible({ timeout: 5000 });
  });
});
