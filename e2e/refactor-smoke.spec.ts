import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for critical user flows affected by the
 * event delegation and global state refactors (Stage 5–6).
 *
 * These tests verify that the refactored components still work
 * end-to-end: navigation menu actions, page navigation, admin
 * employee management, and PTO request handling.
 */
test.describe("Refactor Smoke Tests", () => {
  /**
   * Helper: login as admin via the magic-link API.
   */
  async function loginAsAdmin(
    page: import("@playwright/test").Page,
    request: import("@playwright/test").APIRequestContext,
  ) {
    const linkResponse = await request.post("/api/auth/request-link", {
      data: { identifier: "admin@example.com" },
      headers: { "x-test-mode": "true" },
    });
    expect(linkResponse.ok()).toBe(true);
    const { magicLink } = await linkResponse.json();
    await page.goto(magicLink);
    await page.waitForURL(/\/(submit-time-off|admin)/);
  }

  test("navigation menu cycles through pages via click and keyboard", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);
    await loginAsAdmin(page, request);

    const navMenu = page.locator("dashboard-navigation-menu");
    const toggle = navMenu.locator("button.menu-toggle");

    // Open menu and navigate to admin/employees
    await toggle.click();
    const empBtn = navMenu.locator('button[data-action="admin/employees"]');
    await expect(empBtn).toBeVisible();
    await empBtn.click();
    await page.waitForURL(/\/admin\/employees/);

    // Wait for menu close animation to finish before toggling again
    await expect(navMenu.locator(".menu-items")).not.toBeVisible();

    // Open menu and navigate to admin/pto-requests
    await toggle.click();
    const ptoBtn = navMenu.locator('button[data-action="admin/pto-requests"]');
    await expect(ptoBtn).toBeVisible();
    await ptoBtn.click();
    await page.waitForURL(/\/admin\/pto-requests/);

    // Wait for menu close animation to finish before toggling again
    await expect(navMenu.locator(".menu-items")).not.toBeVisible();

    // Open menu and navigate back to submit-time-off
    await toggle.click();
    const timeOffBtn = navMenu.locator('button[data-action="submit-time-off"]');
    await expect(timeOffBtn).toBeVisible();
    await timeOffBtn.click();
    await page.waitForURL(/\/submit-time-off/);
  });

  test("admin employees page renders and handles edit toggle", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);
    await loginAsAdmin(page, request);
    await page.goto("/admin/employees");

    const adminPage = page.locator("admin-employees-page");
    const employeeList = adminPage.locator("employee-list");

    // Wait for employee cards to appear
    await expect(employeeList.locator(".employee-card").first()).toBeVisible({
      timeout: 5000,
    });

    // Click edit on first employee card
    const editBtn = employeeList
      .locator('.action-btn[data-action="edit"]')
      .first();
    await editBtn.click();

    // Inline editor should appear
    await expect(employeeList.locator(".inline-editor")).toBeVisible({
      timeout: 3000,
    });

    // Cancel the edit
    const cancelBtn = employeeList.locator("#cancel-btn");
    await expect(cancelBtn).toBeVisible();
    await cancelBtn.click();

    // Editor should disappear, card should return
    await expect(employeeList.locator(".employee-card").first()).toBeVisible({
      timeout: 3000,
    });
  });

  test("admin monthly review page renders review cards", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);
    await loginAsAdmin(page, request);
    await page.goto("/admin/monthly-review");

    const reviewPage = page.locator("admin-monthly-review-page");
    await expect(reviewPage).toBeVisible({ timeout: 5000 });

    // The review component should be present
    const review = reviewPage.locator("admin-monthly-review");
    await expect(review).toBeVisible();
  });
});
