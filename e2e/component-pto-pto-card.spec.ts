import { test, expect } from "@playwright/test";

test("pto-pto-card component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto("/components/pto-pto-card/test.html");
  await page.waitForSelector("pto-pto-card");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  await expect(page.locator("pto-pto-card")).toBeVisible();
  await expect(page.locator("#test-output")).toContainText("PTO data set.");

  // Wait for the async tests to complete
  await expect(page.locator("#test-output")).toContainText(
    "Toggle and date click tests completed",
    { timeout: 5000 },
  );

  // Test expandable functionality - the playground function may have already expanded it
  const card = page.locator("pto-pto-card");

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
  await expect(dateElements).toHaveCount(3); // We have 3 test entries

  // Test clickable date functionality
  const firstDate = dateElements.first();
  await expect(firstDate).toHaveCSS("cursor", "pointer");
  await expect(firstDate).toHaveCSS("text-decoration", "underline");

  // Click on date and check for event (we can't directly test the event, but we can check console logs)
  const initialConsoleCount = consoleMessages.length;
  await firstDate.click();

  // Wait a bit for event handling
  await page.waitForTimeout(100);

  // Check that navigate-to-month event was fired (look for console logs)
  const eventLogs = consoleMessages
    .slice(initialConsoleCount)
    .filter((msg) => msg.text.includes("navigate-to-month event fired!"));
  expect(eventLogs.length).toBeGreaterThan(0);

  // Click toggle to collapse
  await toggleButton.click();
  await expect(toggleButton).toContainText("Show Details");
  await expect(usageSection).not.toBeVisible();

  // Test approval indicators - set up fullPtoEntries with approved entries
  await page.locator("pto-pto-card").evaluate((card: any) => {
    card.fullPtoEntries = [
      {
        id: 1,
        employeeId: 1,
        date: "2026-02-20",
        type: "PTO",
        hours: 8,
        createdAt: "2026-01-01T00:00:00Z",
        approved_by: 3,
      },
      {
        id: 2,
        employeeId: 1,
        date: "2026-02-23",
        type: "PTO",
        hours: 8,
        createdAt: "2026-01-01T00:00:00Z",
        approved_by: 3,
      },
      {
        id: 3,
        employeeId: 1,
        date: "2026-02-25",
        type: "PTO",
        hours: 8,
        createdAt: "2026-01-01T00:00:00Z",
        approved_by: 3,
      },
    ];
  });
  await page.waitForTimeout(100); // Wait for render

  // Check that the "Used" label has the approved class (green checkmark)
  const ptoUsedLabel = await page.evaluate(() => {
    const card = document.querySelector("pto-pto-card");
    if (!card) return null;
    const shadow = card.shadowRoot;
    if (!shadow) return null;
    const rows = shadow.querySelectorAll(".row");
    const usedRow = rows[1]; // Second row is "Used"
    const label = usedRow?.querySelector(".label");
    return label?.className;
  });
  expect(ptoUsedLabel).toBe("label approved");

  // Check individual date approval indicators
  const ptoDateClasses = await page.evaluate(() => {
    const card = document.querySelector("pto-pto-card");
    if (!card) return [];
    const shadow = card.shadowRoot;
    if (!shadow) return [];
    const dateSpans = shadow.querySelectorAll(".usage-date");
    return Array.from(dateSpans).map((span) => span.className);
  });
  // All PTO dates should be approved (show green checkmarks)
  expect(ptoDateClasses).toEqual([
    "usage-date approved",
    "usage-date approved",
    "usage-date approved",
  ]);
});
