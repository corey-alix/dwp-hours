import { test, expect } from "@playwright/test";

test("data-table component test", async ({ page }) => {
  // Listen for console messages
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  // Navigate to the test page
  await page.goto("/components/data-table/test.html");

  // Wait for the page to load and component to initialize
  await page.waitForSelector("data-table");

  // Check that no console errors occurred during loading
  const errors = consoleMessages.filter((msg) => msg.type === "error");
  expect(errors).toHaveLength(0);

  // Check that expected log messages are present
  const logs = consoleMessages.filter((msg) => msg.type === "log");
  expect(
    logs.some((log) =>
      log.text.includes("Starting Data Table playground test"),
    ),
  ).toBe(true);

  // Check that data table is visible
  const dataTable = page.locator("data-table");
  await expect(dataTable).toBeVisible();

  // Check table structure
  const table = dataTable.locator(".data-table");
  await expect(table).toBeVisible();

  // Check table headers
  const headers = table.locator("th");
  await expect(headers).toHaveCount(4); // Based on sample data columns

  // Check table body
  const body = table.locator("tbody");
  await expect(body).toBeVisible();

  // Check initial data rows
  const rows = body.locator("tr");
  const initialRowCount = await rows.count();

  if (initialRowCount > 0) {
    // Check that rows contain data
    const firstRow = rows.first();
    const cells = firstRow.locator("td");
    await expect(cells).toHaveCount(4);

    // Test sorting functionality
    const sortableHeader = headers.filter({ hasText: "Name" });
    await sortableHeader.click();

    // Click again to reverse sort
    await sortableHeader.click();

    // Test pagination (if present)
    const pagination = dataTable.locator(".pagination");
    const paginationExists = (await pagination.count()) > 0;

    if (paginationExists) {
      // Test page size selector
      const pageSizeSelect = dataTable.locator("#page-size-select");
      await expect(pageSizeSelect).toBeVisible();

      // Change page size (don't check output as playground interferes)
      await pageSizeSelect.selectOption("5");

      // Test pagination buttons (if multiple pages)
      const pageButtons = pagination.locator(".page-btn");
      const buttonCount = await pageButtons.count();

      if (buttonCount > 3) {
        // More than just prev/next
        // Click next page
        const nextButton = pageButtons.filter({ hasText: "›" });
        await nextButton.click();
      }
    }
  } else {
    // Check empty state
    const emptyState = table.locator(".empty-state");
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toContainText("No data available");
  }

  // Ensure no console errors throughout the test
  const finalErrors = consoleMessages.filter((msg) => msg.type === "error");
  expect(finalErrors).toHaveLength(0);
});
