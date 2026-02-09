import { test, expect } from "@playwright/test";

test("pto-jury-duty-card component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto("/components/pto-jury-duty-card/test.html");
  await page.waitForSelector("#test-output");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  await expect(page.locator("pto-jury-duty-card")).toBeVisible();
  await expect(page.locator("#test-output")).toContainText(
    "Jury duty data set.",
  );

  // Wait for the async tests to complete
  await expect(page.locator("#test-output")).toContainText(
    "Toggle and date click tests completed",
    { timeout: 5000 },
  );

  // Test expandable functionality - the playground function may have already expanded it
  const card = page.locator("pto-jury-duty-card");

  // Check that toggle button exists
  const toggleButton = card.locator(".toggle-button");
  await expect(toggleButton).toBeVisible();

  // Check current state - might be expanded or collapsed
  const isExpanded =
    (await toggleButton.getAttribute("aria-expanded")) === "true";

  if (isExpanded) {
    await expect(toggleButton).toContainText("Hide Details");
  } else {
    await expect(toggleButton).toContainText("Show Details");
  }

  // If collapsed, expand it
  if (!isExpanded) {
    await toggleButton.click();
    await expect(toggleButton).toContainText("Hide Details");
  }

  // Check that detailed listings are visible
  const usageSection = card.locator(".usage-section");
  await expect(usageSection).toBeVisible();

  // Check that dates are displayed
  const dateElements = card.locator(".usage-date");
  await expect(dateElements).toHaveCount(2); // We have 2 test entries

  // Test clickable date functionality
  const firstDate = dateElements.first();
  await expect(firstDate).toHaveCSS("cursor", "pointer");
  await expect(firstDate).toHaveCSS("text-decoration", "underline");

  // Click on date and check for event
  const initialConsoleCount = consoleMessages.length;
  await firstDate.click();

  // Wait a bit for event handling
  await page.waitForTimeout(100);

  // Check that navigate-to-month event was fired
  const eventLogs = consoleMessages
    .slice(initialConsoleCount)
    .filter((msg) => msg.text.includes("navigate-to-month event fired!"));
  expect(eventLogs.length).toBeGreaterThan(0);

  // Click toggle to collapse
  await toggleButton.click();
  await expect(toggleButton).toContainText("Show Details");
  await expect(usageSection).not.toBeVisible();
});
