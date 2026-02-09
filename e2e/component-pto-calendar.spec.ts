import { test, expect } from "@playwright/test";

test("pto-calendar component test", async ({ page }) => {
  await page.goto("/components/pto-calendar/test.html");

  // Wait for the component to load
  await page.waitForSelector("pto-calendar");

  // Check that the component exists
  const component = await page.locator("pto-calendar");
  await expect(component).toBeVisible();

  // Check that the calendar grid exists
  const calendarGrid = await page
    .locator("pto-calendar")
    .locator(".calendar-grid");
  await expect(calendarGrid).toBeVisible();

  // Check that legend exists
  const legend = await page.locator("pto-calendar").locator(".legend");
  await expect(legend).toBeVisible();

  // Check legend items count (should be 5: PTO, Sick, Bereavement, Jury Duty, Work Day)
  const legendItems = await page
    .locator("pto-calendar")
    .locator(".legend-item");
  await expect(legendItems).toHaveCount(5);

  // Set calendar to editable mode to test default selection
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    calendar.setReadonly(false);
  });

  // Verify "PTO" is selected by default in editable mode
  const ptoLegendItem = await page
    .locator("pto-calendar")
    .locator('.legend-item[data-type="PTO"]');
  await expect(ptoLegendItem).toHaveClass(/selected/);

  // Wait for the component to be in editable mode (legend items should be clickable)
  await page.waitForFunction(() => {
    const legendItem = document
      .querySelector("pto-calendar")
      ?.shadowRoot?.querySelector(".legend-item");
    return legendItem && legendItem.classList.contains("clickable");
  });

  // Test editable mode - legend items should be clickable
  const legendItem = await page
    .locator("pto-calendar")
    .locator(".legend-item")
    .first();
  await expect(legendItem).toHaveClass(/clickable/);

  // Test readonly mode - set readonly to true
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    calendar.setReadonly(true);
  });

  // Now legend items should not be clickable
  await expect(legendItem).not.toHaveClass(/clickable/);

  // Test editable mode - set readonly back to false
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    calendar.setReadonly(false);
  });

  // Test legend item selection - click on Sick (since PTO is already selected by default)
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const legendItem = calendar.shadowRoot.querySelector(
      '.legend-item[data-type="Sick"]',
    ) as HTMLElement;
    legendItem.click();
  });
  const sickLegendItem = await page
    .locator("pto-calendar")
    .locator(".legend-item")
    .filter({ hasText: "Sick" });
  await expect(sickLegendItem).toHaveClass(/selected/);

  // Test cell selection - click on a weekday cell
  const calendarCells = await page
    .locator("pto-calendar")
    .locator(".day.clickable");
  const firstCell = calendarCells.first();

  // Get the date attribute before clicking
  const cellDate = await firstCell.getAttribute("data-date");

  // Click the cell using page.evaluate
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const cell = calendar.shadowRoot.querySelector(
      ".day.clickable",
    ) as HTMLElement;
    cell.click();
  });

  // Cell should now be selected
  await expect(firstCell).toHaveClass(/selected/);

  // Check that hours input appears for selected cell
  const hoursInput = await page.locator("pto-calendar").locator(".hours-input");
  await expect(hoursInput).toBeVisible();

  // Test hours editing
  await hoursInput.fill("4");
  await hoursInput.press("Tab"); // Trigger change event

  // Verify the value was set
  await expect(hoursInput).toHaveValue("4");

  // Test invalid hours (should show error styling) - value not 0, 4 or 8
  await hoursInput.fill("6"); // Invalid - not 0, 4 or 8
  await hoursInput.press("Tab");

  // Should have invalid class
  await expect(hoursInput).toHaveClass(/invalid/);

  // Test Work Day clear functionality
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const workDayItem = calendar.shadowRoot.querySelector(
      '.legend-item[data-type="Work Day"]',
    ) as HTMLElement;
    workDayItem.click();
  });
  const workDayLegendItem = await page
    .locator("pto-calendar")
    .locator(".legend-item")
    .filter({ hasText: "Work Day" });
  await expect(workDayLegendItem).toHaveClass(/selected/);

  // Click on a cell with existing PTO to clear it
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const cell = calendar.shadowRoot.querySelector(
      ".day.selected",
    ) as HTMLElement;
    if (cell) cell.click();
  });
  // Cell should not be selected (cleared)
  await expect(firstCell).not.toHaveClass(/selected/);

  // Test 0 hours clear functionality
  // First select PTO again
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const legendItem = calendar.shadowRoot.querySelector(
      '.legend-item[data-type="PTO"]',
    ) as HTMLElement;
    legendItem.click();
  });
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    const cell = calendar.shadowRoot.querySelector(
      ".day.clickable",
    ) as HTMLElement;
    cell.click();
  });
  await expect(firstCell).toHaveClass(/selected/);

  // Enter 0 hours to clear
  await hoursInput.fill("0");
  await hoursInput.press("Tab");

  // Cell should no longer be selected (cleared)
  await expect(firstCell).not.toHaveClass(/selected/);

  // Test clear selection
  await page.evaluate(() => {
    const calendar = document.querySelector("pto-calendar") as any;
    calendar.clearSelection();
  });

  // Selected cell should no longer be selected
  await expect(firstCell).not.toHaveClass(/selected/);

  // Legend item should no longer be selected
  await expect(legendItem).not.toHaveClass(/selected/);
});
