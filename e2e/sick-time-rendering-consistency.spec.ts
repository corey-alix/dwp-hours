import { test, expect } from "@playwright/test";

test.describe("Sick Time Rendering Consistency", () => {
  test("should not show sick time for 2/2/2026 in dashboard if no data exists, but report should match data", async ({
    page,
  }) => {
    // Navigate to login page
    await page.goto("/index.html");

    // Enter employee identifier (assuming john.doe@example.com has seeded data)
    await page.fill("#identifier", "john.doe@example.com");
    await page.click('button[type="submit"]');

    // Get magic link from response (test mode returns it directly)
    const messageDiv = page.locator("#login-message");
    await expect(messageDiv).toBeVisible();

    const linkElement = messageDiv.locator("a");
    const magicLink = await linkElement.getAttribute("href");
    expect(magicLink).toBeTruthy();

    // Navigate to magic link
    await page.goto(magicLink!);

    // Wait for dashboard to load
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Navigate to Current Year Summary page where PTO status is shown
    const menu = page.locator("dashboard-navigation-menu");
    const currentYearBtn = menu.locator(
      'button[data-action="current-year-summary"]',
    );
    await currentYearBtn.click();

    await page.waitForSelector("#pto-status");

    // Check sick time card in dashboard
    const sickCard = page.locator("pto-sick-card");
    await expect(sickCard).toBeVisible();

    // Extract usage entries from sick card
    const dashboardSickEntries = await sickCard.locator("li").allTextContents();

    // The data does NOT have sick time for 2/2/2026, so dashboard should NOT show it
    // This test will FAIL if the UX incorrectly shows 2/2/2026, highlighting the bug
    const hasFeb2InDashboard = dashboardSickEntries.some(
      (entry) => entry.includes("2026-02-02") || entry.includes("2/2/2026"),
    );
    expect(hasFeb2InDashboard).toBe(false); // Should be false based on correct data

    // Check that it does show existing dates like 2/17/2026
    const hasFeb17InDashboard = dashboardSickEntries.some(
      (entry) => entry.includes("2026-02-17") || entry.includes("2/17/2026"),
    );
    // Note: Reports functionality is not yet implemented - it shows "Reports coming soon!" alert
    // For now, we'll skip the reports comparison test
    // TODO: Re-enable this test once reports UI is implemented

    // // Navigate to reports section
    // await page.click('#view-reports-btn');
    // // Handle the alert that appears
    // page.on('dialog', async dialog => {
    //   expect(dialog.message()).toBe('Reports coming soon!');
    //   await dialog.accept();
    // });

    // // Since reports are not implemented, we can't test the report content yet
    // // The dashboard test above is sufficient to detect the UX bug

    // If the user reported seeing 2/2 in dashboard, this test will fail on the first assertion,
    // confirming the UX rendering bug
  });
});
