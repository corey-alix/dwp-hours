import { test, expect } from "@playwright/test";

test("confirmation-dialog component test", async ({ page }) => {
  // Listen for console messages
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Navigate to the test page
  await page.goto("/components/confirmation-dialog/test.html");

  // Wait for the page to load and component to initialize
  await page.waitForSelector("#show-dialog");

  // Check that no console errors occurred during loading
  const errors = consoleMessages.filter((msg) => msg.type === "error");
  expect(errors).toHaveLength(0);

  // Check that expected log messages are present
  const logs = consoleMessages.filter((msg) => msg.type === "log");
  expect(
    logs.some((log) =>
      log.text.includes("Starting Confirmation Dialog playground test"),
    ),
  ).toBe(true);

  // Click show dialog button
  await page.click("#show-dialog");

  // Wait for the dialog to appear (playground creates it)
  await page.waitForSelector("confirmation-dialog");

  // Check that the dialog is visible
  const dialog = page.locator("confirmation-dialog");
  await expect(dialog).toBeVisible();

  // Check that the message is displayed
  const shadowMessage = dialog.locator(".message");
  await expect(shadowMessage).toContainText(
    "Are you sure you want to delete this item?",
  );

  // Test cancel button
  const cancelButton = dialog.locator(".cancel");
  await cancelButton.click();

  // Check that output shows cancelled
  const output = page.locator("#test-output");
  await expect(output).toContainText("Cancelled: Action aborted");

  // Check that dialog is removed
  await expect(dialog).not.toBeVisible();

  // Show dialog again
  await page.click("#show-dialog");
  await page.waitForSelector("confirmation-dialog");

  // Test confirm button
  const confirmButton = dialog.locator(".confirm");
  await confirmButton.click();

  // Check that output shows confirmed
  await expect(output).toContainText("Confirmed: Item deleted");

  // Check that dialog is removed
  await expect(page.locator("confirmation-dialog")).not.toBeVisible();

  // Ensure no console errors throughout the test
  const finalErrors = consoleMessages.filter((msg) => msg.type === "error");
  expect(finalErrors).toHaveLength(0);
});
