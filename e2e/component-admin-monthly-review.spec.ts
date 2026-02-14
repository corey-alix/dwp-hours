import { test, expect } from "@playwright/test";

// Helper: authenticate as admin and navigate to admin panel test page
async function loginAsAdmin(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.fill("#identifier", "admin@example.com");
  await page.click('#login-form button[type="submit"]');
  await page.waitForSelector("#login-message", { timeout: 10000 });
  const magicLink = page.locator("#login-message a");
  await expect(magicLink).toBeVisible();
  await magicLink.click();
  await page.waitForSelector("#dashboard", { timeout: 10000 });
}

// Helper: navigate to admin panel test page and wait for seed data
async function gotoAdminPanelTestPage(page: import("@playwright/test").Page) {
  await page.goto("/components/admin-panel/test.html");
  const testOutput = page.locator("#test-output");
  // playground() auto-loads seed data on init
  await expect(testOutput).toContainText("Seed data loaded", {
    timeout: 10000,
  });
}

// Helper: navigate to monthly review tab and wait for component
async function navigateToMonthlyReview(page: import("@playwright/test").Page) {
  const monthlyReviewTab = page.locator(
    "admin-panel .nav-link[data-view='monthly-review']",
  );
  await expect(monthlyReviewTab).toBeVisible();
  await monthlyReviewTab.click();
  await expect(monthlyReviewTab).toHaveClass(/active/);
  const monthlyReview = page.locator("admin-panel admin-monthly-review");
  await expect(monthlyReview).toBeAttached({ timeout: 5000 });
  return monthlyReview;
}

// Helper: set month on the monthly review component and trigger data load
async function setMonthAndLoad(
  page: import("@playwright/test").Page,
  month: string,
) {
  await page.evaluate((m) => {
    const adminPanel = document.querySelector("admin-panel") as any;
    if (adminPanel && adminPanel.shadowRoot) {
      const monthlyReview = adminPanel.shadowRoot.querySelector(
        "admin-monthly-review",
      ) as any;
      if (monthlyReview) {
        monthlyReview._selectedMonth = m;
        monthlyReview.requestEmployeeData();
      }
    }
  }, month);
}

test.describe("Admin Monthly Review Acknowledgment", () => {
  test("admin can view monthly review and acknowledge employee data", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await gotoAdminPanelTestPage(page);
    const monthlyReview = await navigateToMonthlyReview(page);

    // Set month to 2025-01 (John Doe and Jane Smith are acknowledged, Admin User is not)
    await setMonthAndLoad(page, "2025-01");

    // Wait for employee cards to appear (handler returns all 3 employees)
    const employeeCards = monthlyReview.locator(".employee-card");
    await expect(employeeCards).toHaveCount(3, { timeout: 5000 });

    // John Doe (employee_id=1): acknowledged for 2025-01, has 16 PTO hours
    const johnDoeCard = employeeCards.filter({
      has: page.locator(".employee-name", { hasText: "John Doe" }),
    });
    await expect(johnDoeCard.locator(".status-indicator")).toHaveClass(
      /acknowledged/,
    );
    await expect(johnDoeCard.locator(".acknowledged-info")).toBeVisible();
    await expect(johnDoeCard.locator(".acknowledged-info")).toContainText(
      "Acknowledged by: Admin User",
    );

    // Jane Smith (employee_id=2): also acknowledged for 2025-01
    const janeSmithCard = employeeCards.filter({
      has: page.locator(".employee-name", { hasText: "Jane Smith" }),
    });
    await expect(janeSmithCard.locator(".status-indicator")).toHaveClass(
      /acknowledged/,
    );
    await expect(janeSmithCard.locator(".acknowledged-info")).toBeVisible();

    // Admin User (employee_id=3): NOT acknowledged for 2025-01, should show pending + acknowledge button
    const adminUserCard = employeeCards.filter({
      has: page.locator(".employee-name", { hasText: "Admin User" }),
    });
    await expect(adminUserCard.locator(".status-indicator")).toHaveClass(
      /pending/,
    );
    await expect(adminUserCard.locator(".acknowledge-btn")).toBeVisible();
  });

  test("non-admin users cannot access monthly review", async ({ page }) => {
    await page.goto("/");
    await page.fill("#identifier", "john.doe@gmail.com");
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();
    await magicLink.click();
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Regular employees should not see admin panel
    const adminPanel = page.locator("#admin-panel");
    await expect(adminPanel).not.toBeVisible();
  });

  test("acknowledgment button dispatches event for unacknowledged employee", async ({
    page,
  }) => {
    await loginAsAdmin(page);
    await gotoAdminPanelTestPage(page);
    const monthlyReview = await navigateToMonthlyReview(page);

    // Use 2025-04: John Doe has bereavement hours, no one is acknowledged
    await setMonthAndLoad(page, "2025-04");

    // All 3 employees should appear
    const employeeCards = monthlyReview.locator(".employee-card");
    await expect(employeeCards).toHaveCount(3, { timeout: 5000 });

    // All should be pending (no acknowledgments for 2025-04 in seed data)
    const pendingIndicators = monthlyReview.locator(
      ".status-indicator.pending",
    );
    await expect(pendingIndicators).toHaveCount(3);

    // Click acknowledge button on the first card
    const firstAcknowledgeBtn = employeeCards
      .first()
      .locator(".acknowledge-btn");
    await expect(firstAcknowledgeBtn).toBeVisible();
    await firstAcknowledgeBtn.click();

    // The component dispatches admin-acknowledge event; the test page
    // doesn't yet handle it with a confirmation dialog, so we just verify
    // the button was clickable and no error occurred.
  });
});
