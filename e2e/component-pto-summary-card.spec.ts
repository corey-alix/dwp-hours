import { test, expect } from "@playwright/test";

test("pto-summary-card component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto("/components/pto-summary-card/test.html");
  await page.waitForSelector("pto-summary-card");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  await expect(page.locator("pto-summary-card")).toHaveCount(3);
  await expect(page.locator("#pto-summary-card-john")).toBeVisible();
  await expect(page.locator("#pto-summary-card-jane")).toBeVisible();
  await expect(page.locator("#pto-summary-card-admin")).toBeVisible();

  // Wait for attribute update (both cards are set up)
  await page.waitForTimeout(2500);
  await expect(page.locator("#test-output")).toContainText(
    "Data updated via attribute",
  );
});
