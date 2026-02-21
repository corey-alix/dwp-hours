import { test, expect } from "@playwright/test";

test.describe("Authentication Logout", () => {
  test("should login, verify cookie, logout, and verify cookie removal", async ({
    page,
  }) => {
    test.setTimeout(10000);

    // Step 1: Navigate to login page
    await page.goto("/login");
    const loginPage = page.locator("login-page");
    await expect(loginPage).toBeVisible();

    // Step 2: Login using email address (elements are inside login-page shadow DOM)
    const loginForm = loginPage.locator("#login-form");
    await expect(loginForm).toBeVisible();
    await loginPage.locator("#identifier").fill("john.doe@example.com");
    await loginPage.locator('#login-form button[type="submit"]').click();

    // Step 3: Wait for auto-login (dev mode auto-validates magic link token)
    // After successful login, the router navigates to /submit-time-off
    await page.waitForURL(/\/submit-time-off/);

    // Step 4: Verify cookie has been set
    const cookies = await page.context().cookies();
    const authCookie = cookies.find((cookie) => cookie.name === "auth_hash");
    expect(authCookie).toBeTruthy();
    expect(authCookie?.value).toBeTruthy();
    expect(authCookie?.value).not.toBe("");

    // Step 5: Open the navigation menu and click the logout button
    const navMenu = page.locator("dashboard-navigation-menu");
    const menuToggle = navMenu.locator("button.menu-toggle");
    await expect(menuToggle).toBeVisible();
    await menuToggle.click();

    const logoutBtn = navMenu.locator('button[data-action="logout"]');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Step 6: Verify we're back to login page
    await page.waitForURL(/\/login/);
    await expect(page.locator("login-page")).toBeVisible();

    // Check that auth_hash cookie is no longer present
    const cookiesAfterLogout = await page.context().cookies();
    const authCookieAfterLogout = cookiesAfterLogout.find(
      (cookie) => cookie.name === "auth_hash",
    );
    expect(authCookieAfterLogout).toBeFalsy(); // Cookie should be gone
  });
});
