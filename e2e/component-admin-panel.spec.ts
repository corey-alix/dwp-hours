import { test, expect } from "@playwright/test";

// The admin-panel component has been replaced by individual admin page components
// as part of the UI router migration. These tests verify the new page components.

test.describe("Admin Page Components", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    const loginPage = page.locator("login-page");
    await expect(loginPage).toBeVisible();
    await loginPage.locator("#identifier").fill("admin@example.com");
    await loginPage.locator('#login-form button[type="submit"]').click();
    await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });
  });

  test("admin employees page loads", async ({ page }) => {
    await page.goto("/admin/employees");
    const employeesPage = page.locator("admin-employees-page");
    await expect(employeesPage).toBeVisible();

    // Check that employee list is visible
    const employeeList = employeesPage.locator("employee-list");
    await expect(employeeList).toBeVisible();
  });

  test("admin PTO requests page loads", async ({ page }) => {
    await page.goto("/admin/pto-requests");
    const ptoRequestsPage = page.locator("admin-pto-requests-page");
    await expect(ptoRequestsPage).toBeVisible();

    // Check that PTO request queue is visible
    const ptoRequestQueue = ptoRequestsPage.locator("pto-request-queue");
    await expect(ptoRequestQueue).toBeVisible();
  });

  test("admin monthly review page loads", async ({ page }) => {
    await page.goto("/admin/monthly-review");
    const monthlyReviewPage = page.locator("admin-monthly-review-page");
    await expect(monthlyReviewPage).toBeVisible();

    // Check that admin monthly review component is visible
    const monthlyReview = monthlyReviewPage.locator("admin-monthly-review");
    await expect(monthlyReview).toBeVisible();
  });

  test("admin settings page loads", async ({ page }) => {
    await page.goto("/admin/settings");
    const settingsPage = page.locator("admin-settings-page");
    await expect(settingsPage).toBeVisible();
  });

  test("navigation between admin pages works", async ({ page }) => {
    // Start on employees page
    await page.goto("/admin/employees");
    await expect(page.locator("admin-employees-page")).toBeVisible();

    // Navigate to PTO requests via menu
    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    const ptoRequestsBtn = menu.locator(
      'button[data-action="admin-pto-requests"]',
    );
    await ptoRequestsBtn.click();
    await page.waitForURL(/\/admin\/pto-requests/);
    await expect(page.locator("admin-pto-requests-page")).toBeVisible();
  });
});
