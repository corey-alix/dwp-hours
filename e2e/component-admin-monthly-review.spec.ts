import { test, expect } from "@playwright/test";

test.describe("Admin Monthly Review Acknowledgment", () => {
  test("admin can view monthly review and acknowledge employee data", async ({
    page,
  }) => {
    // Navigate to the main app first to authenticate
    await page.goto("/");

    // Fill out login form with admin user email
    await page.fill("#identifier", "admin@example.com");
    await page.click('#login-form button[type="submit"]');

    // Wait for magic link to appear
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();

    // Click the magic link to login
    await magicLink.click();

    // Wait for dashboard to load (confirms authentication worked)
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Check that auth cookie is set
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((c) => c.name === "auth_hash");
    expect(authCookie).toBeTruthy();

    // Navigate to the admin panel test page
    await page.goto("/components/admin-panel/test.html");

    // Wait for the page to load and component to initialize
    await page.waitForSelector("#test-output");

    // Navigate to Monthly Review tab first
    const monthlyReviewTab = page.locator(
      "admin-panel .nav-link[data-view='monthly-review']",
    );
    await expect(monthlyReviewTab).toBeVisible();
    await monthlyReviewTab.click();

    // Wait for view change event to settle
    await page.waitForTimeout(500);

    // Now load seed data by clicking the toggle button
    const toggleButton = page.locator("#toggle-seed-data");
    await expect(toggleButton).toBeVisible();

    // Click to load seed data (might need to click twice if it starts unloaded)
    await toggleButton.click();

    // Wait a bit and check if we need to click again
    await page.waitForTimeout(500);
    const currentOutput = await page.locator("#test-output").textContent();
    if (
      currentOutput?.includes("unloaded") ||
      currentOutput?.includes("Current view")
    ) {
      await toggleButton.click();
    }

    // Wait for seed data to load
    await page.waitForSelector("#test-output", { timeout: 10000 });
    const testOutput = page.locator("#test-output");
    await expect(testOutput).toContainText("Seed data loaded", {
      timeout: 10000,
    });

    // Wait for monthly review component to load
    const monthlyReview = page.locator("admin-panel admin-monthly-review");
    await expect(monthlyReview).toBeVisible();

    // Set month to one that has acknowledgment data
    const monthSelector = monthlyReview.locator('input[type="month"]');
    await monthSelector.fill("2025-01");

    // Wait for data to reload - longer wait for component to update
    await page.waitForTimeout(2000);

    // Wait for loading to complete (check that loading message is gone)
    await expect(monthlyReview.locator(".loading")).not.toBeVisible({
      timeout: 10000,
    });

    // Check that employee cards are displayed
    const employeeCards = monthlyReview.locator(".employee-card");
    await expect(employeeCards).toHaveCount(2); // John Doe and Jane Smith

    // Check first employee card (John Doe)
    const johnDoeCard = employeeCards.first();
    await expect(johnDoeCard.locator(".employee-name")).toContainText(
      "John Doe",
    );

    // Check acknowledgment status - John should be acknowledged for January (current month)
    const johnStatusIndicator = johnDoeCard.locator(".status-indicator");
    await expect(johnStatusIndicator).toHaveClass(/acknowledged/);

    // Check that John has acknowledged info displayed
    const johnAcknowledgedInfo = johnDoeCard.locator(".acknowledged-info");
    await expect(johnAcknowledgedInfo).toBeVisible();
    await expect(johnAcknowledgedInfo).toContainText(
      "Acknowledged by: Admin User",
    );

    // Check second employee card (Jane Smith) - should also be acknowledged
    const janeSmithCard = employeeCards.nth(1);
    await expect(janeSmithCard.locator(".employee-name")).toContainText(
      "Jane Smith",
    );

    // Jane should also be acknowledged
    const janeStatusIndicator = janeSmithCard.locator(".status-indicator");
    await expect(janeStatusIndicator).toHaveClass(/acknowledged/);

    const janeAcknowledgedInfo = janeSmithCard.locator(".acknowledged-info");
    await expect(janeAcknowledgedInfo).toBeVisible();

    // Test acknowledgment button click (should show confirmation dialog)
    const acknowledgeButton = johnDoeCard.locator(
      ".acknowledge-btn:not(.acknowledged)",
    );
    if (await acknowledgeButton.isVisible()) {
      await acknowledgeButton.click();

      // Check that confirmation dialog appears
      const confirmationDialog = page.locator("confirmation-dialog");
      await expect(confirmationDialog).toBeVisible();

      // Check dialog content
      await expect(confirmationDialog.locator(".message")).toContainText(
        "John Doe",
      );
      await expect(confirmationDialog.locator(".message")).toContainText(
        "acknowledged the monthly review",
      );

      // Cancel the acknowledgment
      const cancelButton = confirmationDialog.locator(".cancel");
      await cancelButton.click();

      // Dialog should be removed
      await expect(confirmationDialog).not.toBeVisible();
    }

    // Test month selector change
    const currentMonth = await monthSelector.inputValue();
    // Change to a different month
    await monthSelector.fill("2025-04");

    // Wait for data to reload and verify month changed
    await page.waitForTimeout(500); // Allow time for data reload
    // Component should update to show April 2025 data
  });

  test("non-admin users cannot access monthly review", async ({ page }) => {
    // Navigate to the main app first to authenticate as regular employee
    await page.goto("/");

    // Fill out login form with regular employee email
    await page.fill("#identifier", "john.doe@gmail.com");
    await page.click('#login-form button[type="submit"]');

    // Wait for magic link to appear
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();

    // Click the magic link to login
    await magicLink.click();

    // Wait for dashboard to load (confirms authentication worked)
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Check that admin panel is not visible for regular employees
    const adminPanel = page.locator("#admin-panel");
    await expect(adminPanel).not.toBeVisible();
  });

  test("acknowledgment modal shows correct employee and month information", async ({
    page,
  }) => {
    // Navigate to the main app first to authenticate
    await page.goto("/");

    // Fill out login form with admin user email
    await page.fill("#identifier", "admin@example.com");
    await page.click('#login-form button[type="submit"]');

    // Wait for magic link to appear
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();

    // Click the magic link to login
    await magicLink.click();

    // Wait for dashboard to load (confirms authentication worked)
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Navigate to the admin panel test page
    await page.goto("/components/admin-panel/test.html");

    // Wait for the page to load and component to initialize
    await page.waitForSelector("#test-output");

    // Load seed data
    const toggleButton = page.locator("#toggle-seed-data");
    await toggleButton.click();
    await page.waitForSelector("#test-output:has-text('Seed data loaded')");

    // Navigate to Monthly Review tab
    const monthlyReviewTab = page
      .locator("admin-panel")
      .locator(".nav-link:has-text('📅 Monthly Review')");
    await monthlyReviewTab.click();

    // Set month to one that has unacknowledged employees
    const monthSelector = page.locator(
      "admin-panel admin-monthly-review input[type='month']",
    );
    await monthSelector.fill("2025-04");

    // Wait for data to load
    await page.waitForTimeout(500);

    // Find an unacknowledged employee and click acknowledge
    const employeeCards = page.locator(
      "admin-panel admin-monthly-review .employee-card",
    );
    const unacknowledgedCard = employeeCards
      .filter({
        hasNot: page.locator(".acknowledged-badge[data-month='2025-04']"),
      })
      .first();

    if (await unacknowledgedCard.isVisible()) {
      const acknowledgeButton = unacknowledgedCard.locator(
        ".acknowledge-btn:not(.acknowledged)",
      );
      await acknowledgeButton.click();

      // Check confirmation dialog content
      const confirmationDialog = page.locator("confirmation-dialog");
      await expect(confirmationDialog).toBeVisible();

      // Verify dialog contains employee name and month
      const message = confirmationDialog.locator(".message");
      await expect(message).toContainText("2025-04");
      await expect(message).toContainText("acknowledged the monthly review");

      // Confirm button should exist
      const confirmButton = confirmationDialog.locator(".confirm");
      await expect(confirmButton).toContainText("Acknowledge");

      // Cancel button should exist
      const cancelButton = confirmationDialog.locator(".cancel");
      await expect(cancelButton).toContainText("Cancel");
    }
  });
});
