import { test, expect } from "@playwright/test";

test("pto-accrual-card component test", async ({ page }) => {
  const consoleMessages: { type: string; text: string }[] = [];
  page.on("console", (msg) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  await page.goto("/components/pto-accrual-card/test.html");
  await page.waitForSelector("pto-accrual-card");

  // Allow for non-critical errors (like missing favicon)
  const criticalErrors = consoleMessages.filter(
    (msg) =>
      msg.type === "error" &&
      !msg.text.includes("favicon") &&
      !msg.text.includes("manifest"),
  );
  expect(criticalErrors).toHaveLength(0);

  await expect(page.locator("pto-accrual-card")).toBeVisible();
  await expect(page.locator("#test-output")).toContainText(
    "Accrual data set. Click calendar buttons to view details.",
  );

  // Test accrued and used values for all months
  await test.step("Check accrued and used values for all months", async () => {
    const expectedAccrued = [
      14.91, 14.2, 14.91, 15.62, 15.62, 14.91, 17.04, 15.62, 15.62, 16.33,
      14.91, 16.33,
    ];
    const expectedUsed = [0, 48, 8, 8, 0, 48, 80, 0, 0, 0, 0, 0];

    for (let month = 1; month <= 12; month++) {
      const monthRow = page.locator(
        `.accrual-row:has(button[data-month="${month}"])`,
      );
      const accruedText = expectedAccrued[month - 1].toFixed(1);
      await expect(monthRow.locator(".hours")).toContainText(accruedText);
      const usedValue = expectedUsed[month - 1];
      const usedText = usedValue > 0 ? usedValue.toFixed(1) : "—";
      await expect(monthRow.locator(".used")).toContainText(usedText);
    }
  });

  // Test calendar state for key months
  await test.step("Check calendar for February", async () => {
    const februaryButton = page.locator('button[data-month="2"]');
    await februaryButton.click();
    const calendar = page.locator("pto-calendar");
    await expect(calendar).toBeVisible();
    // Check sick entries
    await expect(calendar.locator('[data-date="2026-02-12"]')).toHaveClass(
      /type-Sick/,
    );
    await expect(calendar.locator('[data-date="2026-02-13"]')).toHaveClass(
      /type-Sick/,
    );
    await expect(calendar.locator('[data-date="2026-02-17"]')).toHaveClass(
      /type-Sick/,
    );
    // Check PTO entries
    await expect(calendar.locator('[data-date="2026-02-20"]')).toHaveClass(
      /type-PTO/,
    );
    await expect(calendar.locator('[data-date="2026-02-23"]')).toHaveClass(
      /type-PTO/,
    );
    await expect(calendar.locator('[data-date="2026-02-25"]')).toHaveClass(
      /type-PTO/,
    );
  });

  await test.step("Check calendar for March", async () => {
    const marchButton = page.locator('button[data-month="3"]');
    await marchButton.click();
    const calendar = page.locator("pto-calendar");
    await expect(calendar).toBeVisible();
    // Check PTO entry
    await expect(calendar.locator('[data-date="2026-03-10"]')).toHaveClass(
      /type-PTO/,
    );
  });

  await test.step("Check calendar for June", async () => {
    const juneButton = page.locator('button[data-month="6"]');
    await juneButton.click();
    const calendar = page.locator("pto-calendar");
    await expect(calendar).toBeVisible();
    // Check bereavement entry
    await expect(calendar.locator('[data-date="2026-06-12"]')).toHaveClass(
      /type-Bereavement/,
    );
    // Check jury duty entries
    await expect(calendar.locator('[data-date="2026-06-15"]')).toHaveClass(
      /type-Jury-Duty/,
    );
    await expect(calendar.locator('[data-date="2026-06-16"]')).toHaveClass(
      /type-Jury-Duty/,
    );
    await expect(calendar.locator('[data-date="2026-06-17"]')).toHaveClass(
      /type-Jury-Duty/,
    );
    await expect(calendar.locator('[data-date="2026-06-18"]')).toHaveClass(
      /type-Jury-Duty/,
    );
    await expect(calendar.locator('[data-date="2026-06-19"]')).toHaveClass(
      /type-Jury-Duty/,
    );
  });

  // Test PTO types in legend
  await test.step("Check PTO types in legend", async () => {
    const legend = page.locator(".legend");
    await expect(legend).toContainText("PTO");
    await expect(legend).toContainText("Sick");
    await expect(legend).toContainText("Bereavement");
    await expect(legend).toContainText("Jury Duty");
  });

  // Test calendar button click (existing)
  const januaryButton = page.locator("button.calendar-button").first();
  await januaryButton.click();

  const calendar = page.locator("pto-calendar");
  await expect(calendar).toBeVisible();

  await test.step("Verify calendar scrolls into view", async () => {
    // Use Playwright's built-in toBeInViewport with auto-retry
    // ratio: 0.5 means at least 50% of the element must be visible
    await expect(calendar).toBeInViewport({ ratio: 0.5, timeout: 5000 });
  });
});
