import { test, expect } from "@playwright/test";

test("pto-balance-summary component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto("/components/pto-balance-summary/test.html");
  await page.waitForSelector("pto-balance-summary");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  // Test the first balance summary (Employee 1)
  const balanceSummary = page.locator("#balance-emp-1");
  await expect(balanceSummary).toBeVisible();

  // Test that balance badges are rendered
  await test.step("Check balance badges are rendered", async () => {
    const badges = balanceSummary.locator(".balance-badge");
    await expect(badges).toHaveCount(4); // PTO, Sick, Bereavement, Jury Duty
  });

  // Test positive balance (available) - check for any badge with positive value
  await test.step("Check positive balance styling", async () => {
    const availableBadges = balanceSummary.locator(
      ".balance-available .badge-value",
    );
    const count = await availableBadges.count();
    expect(count).toBeGreaterThan(0); // At least one positive balance
  });

  // Test negative balance (exceeded) - check for any badge with negative value
  await test.step("Check negative balance styling", async () => {
    const exceededBadges = balanceSummary.locator(
      ".balance-exceeded .badge-value",
    );
    const count = await exceededBadges.count();
    expect(count).toBeGreaterThan(0); // At least one negative balance
  });

  // Test that values contain 'h' suffix
  await test.step("Check value formatting", async () => {
    const values = balanceSummary.locator(".badge-value");
    const count = await values.count();
    for (let i = 0; i < count; i++) {
      await expect(values.nth(i)).toContainText("h");
    }
  });

  // Test accessibility attributes
  await test.step("Check accessibility attributes", async () => {
    const container = balanceSummary.locator(".balance-row");
    await expect(container).toHaveAttribute("role", "status");

    const badges = balanceSummary.locator(".balance-badge");
    const badgeCount = await badges.count();
    for (let i = 0; i < badgeCount; i++) {
      await expect(badges.nth(i)).toHaveAttribute("aria-label");
    }
  });
});
