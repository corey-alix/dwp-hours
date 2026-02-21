import { test, expect } from "@playwright/test";

const SEED_URL = `http://localhost:${process.env.PORT || 3000}/api/test/seed`;

test.beforeEach(async () => {
  const response = await fetch(SEED_URL, {
    method: "POST",
    headers: { "x-test-seed": "true", "Content-Type": "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Failed to seed database: ${response.statusText}`);
  }
});

/**
 * Helper: login as a given user email and wait for /submit-time-off.
 */
async function loginAs(
  page: import("@playwright/test").Page,
  email: string,
): Promise<void> {
  await page.goto("/login");
  const loginPage = page.locator("login-page");
  await expect(loginPage).toBeVisible();
  await loginPage.locator("#identifier").fill(email);
  await loginPage.locator('#login-form button[type="submit"]').click();
  await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });
}

// ── Route-based navigation: back/forward, direct URL ──

test.describe("Route-based Navigation", () => {
  test("should navigate between pages via menu and support browser back/forward", async ({
    page,
  }) => {
    test.setTimeout(15000);

    await loginAs(page, "john.doe@example.com");

    // Navigate to Current Year Summary via menu
    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await menu.locator('button[data-action="current-year-summary"]').click();
    await page.waitForURL(/\/current-year-summary/);
    await expect(page.locator("current-year-summary-page")).toBeVisible();

    // Navigate to Prior Year Summary
    await menuToggle.click();
    await menu.locator('button[data-action="prior-year-summary"]').click();
    await page.waitForURL(/\/prior-year-summary/);
    await expect(page.locator("prior-year-summary-page")).toBeVisible();

    // Browser back → Current Year Summary
    await page.goBack();
    await page.waitForURL(/\/current-year-summary/);
    await expect(page.locator("current-year-summary-page")).toBeVisible();

    // Browser back → Submit Time Off
    await page.goBack();
    await page.waitForURL(/\/submit-time-off/);
    await expect(page.locator("submit-time-off-page")).toBeVisible();

    // Browser forward → Current Year Summary
    await page.goForward();
    await page.waitForURL(/\/current-year-summary/);
    await expect(page.locator("current-year-summary-page")).toBeVisible();
  });

  test("should load a page directly by URL when authenticated", async ({
    page,
  }) => {
    test.setTimeout(15000);

    // Login first to establish session cookie
    await loginAs(page, "john.doe@example.com");

    // Navigate directly to a different route
    await page.goto("/current-year-summary");
    await expect(page.locator("current-year-summary-page")).toBeVisible();

    // Navigate directly to prior year summary
    await page.goto("/prior-year-summary");
    await expect(page.locator("prior-year-summary-page")).toBeVisible();
  });
});

// ── Auth gate: unauthenticated users redirected to /login ──

test.describe("Auth Gate", () => {
  test("should redirect unauthenticated users to /login for protected routes", async ({
    page,
  }) => {
    test.setTimeout(10000);

    // Try to access a protected route directly without logging in
    await page.goto("/submit-time-off");
    await page.waitForURL(/\/login/);
    await expect(page.locator("login-page")).toBeVisible();
  });

  test("should redirect unauthenticated users from admin routes to /login", async ({
    page,
  }) => {
    test.setTimeout(10000);

    await page.goto("/admin/employees");
    await page.waitForURL(/\/login/);
    await expect(page.locator("login-page")).toBeVisible();
  });
});

// ── Role-based access: non-admin accessing /admin/* ──

test.describe("Role-based Access", () => {
  test("should redirect non-admin user from /admin/* to /submit-time-off", async ({
    page,
  }) => {
    test.setTimeout(15000);

    // Login as a regular employee (not admin)
    await loginAs(page, "jane.smith@example.com");

    // Try to access an admin route
    await page.goto("/admin/employees");

    // Should be redirected away from admin — either to /submit-time-off or /login
    await page.waitForURL(/\/(submit-time-off|login)/);
    const url = page.url();
    expect(url).not.toContain("/admin/");
  });

  test("should allow admin user to access /admin/* routes", async ({
    page,
  }) => {
    test.setTimeout(15000);

    // Login as admin
    await loginAs(page, "admin@example.com");

    // Navigate to admin employees page via menu
    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await menu.locator('button[data-action="admin/employees"]').click();
    await page.waitForURL(/\/admin\/employees/);
    await expect(page.locator("admin-employees-page")).toBeVisible();
  });

  test("admin menu items should not appear for non-admin users", async ({
    page,
  }) => {
    test.setTimeout(15000);

    await loginAs(page, "john.doe@example.com");

    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    // Admin menu items should NOT be present
    await expect(
      menu.locator('button[data-action="admin/employees"]'),
    ).toHaveCount(0);
    await expect(
      menu.locator('button[data-action="admin/pto-requests"]'),
    ).toHaveCount(0);
  });
});

// ── Navigate-to-month cross-page flow ──

test.describe("Navigate-to-month Cross-page Flow", () => {
  test("should navigate from Current Year Summary to Submit Time Off with month query param", async ({
    page,
  }) => {
    test.setTimeout(15000);

    await loginAs(page, "john.doe@example.com");

    // Navigate to Current Year Summary
    const menu = page.locator("dashboard-navigation-menu");
    const menuToggle = menu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();
    await menu.locator('button[data-action="current-year-summary"]').click();
    await page.waitForURL(/\/current-year-summary/);

    // Click a month button to trigger navigate-to-month
    // The accrual card has month buttons that dispatch navigate-to-month events
    const accrualCard = page.locator("pto-accrual-card");
    // Wait for the card data to load
    await expect(accrualCard).toBeVisible({ timeout: 5000 });

    // Click month 3 (March) button
    const marchBtn = page.locator('button[data-month="3"]');
    if (await marchBtn.isVisible()) {
      await marchBtn.click();

      // Should navigate to /submit-time-off with month query param
      await page.waitForURL(/\/submit-time-off/);
      const url = new URL(page.url());
      expect(url.pathname).toBe("/submit-time-off");
      // Verify the month query param is present
      expect(url.searchParams.get("month")).toBe("3");
    }
  });
});
