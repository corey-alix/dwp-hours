import { test, expect } from "@playwright/test";

test.describe("Magic link POC", () => {
  test("posting email returns a magic link", async ({ page }) => {
    test.setTimeout(5000);

    await page.goto("/index.html");
    await expect(page.locator("#login-form")).toBeVisible();

    await page.fill("#identifier", "john.doe@gmail.com");
    await page.click('#login-form button[type="submit"]');

    const magicLink = page.locator("#login-message a");
    await expect(magicLink).toBeVisible();
    await expect(magicLink).toHaveAttribute("href", /token=.+&ts=\d+/);

    await magicLink.click();
    await expect(page.locator("#dashboard")).toBeVisible();
    await expect(page.locator("#pto-status")).toBeVisible();

    await page.click("dashboard-navigation-menu .menu-toggle");
    await page.click(
      'dashboard-navigation-menu .menu-item[data-action="submit-time-off"]',
    );
    await expect(page.locator("#pto-form")).toBeVisible();

    await page.fill("#start-date", "2026-02-05");
    await page.fill("#end-date", "2026-02-05");
    await page.selectOption("#pto-type", "Full PTO");
    await page.fill("#hours", "8");

    const ptoResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/pto") &&
        response.request().method() === "POST" &&
        response.status() === 201,
    );
    await page.click('#pto-entry-form button[type="submit"]');
    await ptoResponsePromise;

    await expect(page.locator("#dashboard")).toBeVisible();
  });
});
