import { test, expect } from "@playwright/test";

test.describe("Magic link POC", () => {
  test("posting email returns a magic link", async ({ page }) => {
    test.setTimeout(5000);

    await page.goto("/login");
    const loginPage = page.locator("login-page");
    await expect(loginPage).toBeVisible();
    await expect(loginPage.locator("#login-form")).toBeVisible();

    await loginPage.locator("#identifier").fill("john.doe@example.com");
    await loginPage.locator('#login-form button[type="submit"]').click();

    // Dev mode auto-validates the magic link token and navigates to /submit-time-off
    await page.waitForURL(/\/submit-time-off/, { timeout: 10000 });

    const timeOffPage = page.locator("submit-time-off-page");
    await expect(timeOffPage).toBeVisible();

    const form = timeOffPage.locator("pto-entry-form");
    await expect(form).toBeVisible();

    await form.locator("#start-date").fill("2026-02-05");
    await form.locator("#end-date").fill("2026-02-05");
    await form.locator("#pto-type").selectOption("Full PTO");
    await form.locator("#hours").fill("8");

    const ptoResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/pto") &&
        response.request().method() === "POST" &&
        response.status() === 201,
    );
    await form.locator('button[type="submit"]').click();
    await ptoResponsePromise;

    // Verify we're still on submit-time-off page after submission
    await expect(timeOffPage).toBeVisible();
  });
});
