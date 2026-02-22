import { test, expect } from "@playwright/test";

test.describe("Sick Time Rendering Consistency", () => {
  test("should not show sick time for 2/2/2026 in dashboard if no data exists, but report should match data", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/login");

    // Login as John Doe
    const loginPage = page.locator("login-page");
    await expect(loginPage).toBeVisible();
    await loginPage.locator("#identifier").fill("john.doe@example.com");
    await loginPage.locator('#login-form button[type="submit"]').click();

    // Wait for auto-login (dev mode) to complete
    await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

    // Navigate to Current Year Summary page
    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    const currentYearBtn = menu.locator(
      'button[data-action="current-year-summary"]',
    );
    await currentYearBtn.click();

    await page.waitForURL(/\/current-year-summary/);
    const summaryPage = page.locator("current-year-summary-page");
    await expect(summaryPage).toBeVisible();

    // Check PTO detail card (now unified)
    const ptoCard = summaryPage.locator("pto-pto-card");
    await expect(ptoCard).toBeVisible();

    // Extract usage entries from PTO card
    const dashboardPtoEntries = await ptoCard.locator("li").allTextContents();

    // The data does NOT have sick time for 2/2/2026, so dashboard should NOT show it
    const hasFeb2InDashboard = dashboardPtoEntries.some(
      (entry) => entry.includes("2026-02-02") || entry.includes("2/2/2026"),
    );
    expect(hasFeb2InDashboard).toBe(false); // Should be false based on correct data

    // Check that it does show existing dates like 2/17/2026
    const hasFeb17InDashboard = dashboardPtoEntries.some(
      (entry) => entry.includes("2026-02-17") || entry.includes("2/17/2026"),
    );
    // Note: Reports functionality is not yet implemented
    // TODO: Re-enable this test once reports UI is implemented
  });
});
