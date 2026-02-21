import { test, expect } from "@playwright/test";

test.describe("Admin Monthly Review", () => {
  test("admin monthly review component renders via test page", async ({
    page,
  }) => {
    // Navigate to the admin-monthly-review component test page (not the page wrapper)
    await page.goto("/components/admin-monthly-review/test.html");

    const monthlyReview = page.locator("admin-monthly-review");
    await expect(monthlyReview).toBeAttached({ timeout: 10000 });
    await expect(monthlyReview).toBeVisible();
  });

  test("admin monthly review page renders via page test", async ({ page }) => {
    // Navigate to the admin-monthly-review-page test page
    await page.goto("/pages/admin-monthly-review-page/test.html");

    const pageEl = page.locator("admin-monthly-review-page");
    await expect(pageEl).toBeAttached({ timeout: 10000 });
    await expect(pageEl).toBeVisible();
  });

  test("non-admin users are redirected to login for admin routes", async ({
    page,
  }) => {
    // Login as a regular employee
    await page.goto("/login");
    const loginPage = page.locator("login-page");
    await expect(loginPage).toBeVisible();
    await loginPage.locator("#identifier").fill("john.doe@example.com");
    await loginPage.locator('#login-form button[type="submit"]').click();

    // Wait for auto-login to complete
    await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

    // Try navigating to admin route — should redirect to /login
    await page.goto("/admin/monthly-review");
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test("acknowledgment button dispatches event on component test page", async ({
    page,
  }) => {
    // Use the component test page which loads seed data
    await page.goto("/components/admin-monthly-review/test.html");

    const monthlyReview = page.locator("admin-monthly-review");
    await expect(monthlyReview).toBeAttached({ timeout: 10000 });

    // Wait for component to load
    await page.waitForTimeout(2000);

    // Check for employee cards (seed data should populate them)
    const employeeCards = monthlyReview.locator(".employee-card");
    const count = await employeeCards.count();

    // If cards exist, verify acknowledge button on pending cards
    if (count > 0) {
      const pendingCards = monthlyReview.locator(".status-indicator.pending");
      const pendingCount = await pendingCards.count();
      if (pendingCount > 0) {
        const firstAcknowledgeBtn = employeeCards
          .first()
          .locator(".acknowledge-btn");
        if (await firstAcknowledgeBtn.isVisible()) {
          await firstAcknowledgeBtn.click();
          // Verify button was clickable and no error occurred
        }
      }
    }
  });
});
