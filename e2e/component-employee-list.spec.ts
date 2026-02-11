import { test, expect } from "@playwright/test";

test("employee-list component test", async ({ page }) => {
  // Listen for console messages
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Navigate to the test page
  await page.goto("/components/employee-list/test.html");

  // Wait for the page to load and component to initialize
  await page.waitForSelector("#test-output");

  // Check that no console errors occurred during loading
  const errors = consoleMessages.filter((msg) => msg.type === "error");
  expect(errors).toHaveLength(0);

  // Check that expected log messages are present
  const logs = consoleMessages.filter((msg) => msg.type === "log");
  expect(
    logs.some((log) =>
      log.text.includes("Starting Employee List playground test"),
    ),
  ).toBe(true);

  // Check that employee list is visible
  const employeeList = page.locator("employee-list");
  await expect(employeeList).toBeVisible();

  // Check toolbar elements
  const searchInput = employeeList.locator(".search-input");
  await expect(searchInput).toBeVisible();

  // Check initial state (should show sample data from test.ts)
  const employeeCards = employeeList.locator(".employee-card");
  const initialCount = await employeeCards.count();
  expect(initialCount).toBeGreaterThan(0); // Should have sample data

  // Test search functionality
  await searchInput.fill("John");
  await page.waitForTimeout(100); // Allow for filtering
  const filteredCount = await employeeCards.count();
  expect(filteredCount).toBeLessThanOrEqual(initialCount);

  // Clear search
  await searchInput.clear();
  await page.waitForTimeout(100);
  const clearedCount = await employeeCards.count();
  expect(clearedCount).toBe(initialCount);

  // Test acknowledge button presence
  const firstCard = employeeCards.first();
  const acknowledgeButton = firstCard.locator(".action-btn.acknowledge");
  await expect(acknowledgeButton).toBeVisible();
  await expect(acknowledgeButton).toContainText("Acknowledge");

  // Ensure no console errors throughout the test
  const finalErrors = consoleMessages.filter((msg) => msg.type === "error");
  expect(finalErrors).toHaveLength(0);
});
