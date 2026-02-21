import { test, expect } from "@playwright/test";

test.describe("Employee Admin Page - Add Employee", () => {
  test.setTimeout(30000); // Allow more time for database operations

  test("should add a new employee through admin employees page", async ({
    page,
  }) => {
    // Listen for console messages
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log("PAGE ERROR:", msg.text());
      }
    });

    // Navigate to the admin employees page test page
    await page.goto("/pages/admin-employees-page/test.html");

    // Wait for the component to load
    await page.waitForSelector("admin-employees-page");

    const adminPage = page.locator("admin-employees-page");
    await expect(adminPage).toBeVisible();

    // Verify employee list is visible inside the page
    const employeeList = adminPage.locator("employee-list");
    await expect(employeeList).toBeVisible();

    // Click the Add Employee button
    await adminPage.locator('[data-action="add-employee"]').click();

    // Wait for employee form to appear
    await page.waitForTimeout(500);
    const employeeForm = adminPage.locator("employee-form");
    await expect(employeeForm).toBeVisible();

    // Fill out the form with valid data
    await employeeForm.locator("#name").fill("New Test Employee");
    await employeeForm.locator("#identifier").fill("new.test@example.com");
    await employeeForm.locator("#ptoRate").fill("0.75");
    await employeeForm.locator("#carryoverHours").fill("10");
    await employeeForm.locator("#role").selectOption("Employee");

    // Submit the form
    await employeeForm.locator("#submit-btn").click();
  });

  test("should show validation error for invalid email format", async ({
    page,
  }) => {
    // Navigate to the admin employees page test page
    await page.goto("/pages/admin-employees-page/test.html");

    // Wait for the component to load
    await page.waitForSelector("admin-employees-page");
    const adminPage = page.locator("admin-employees-page");
    await expect(adminPage).toBeVisible();

    // Click the Add Employee button
    await adminPage.locator('[data-action="add-employee"]').click();

    // Wait for employee form to appear
    await page.waitForTimeout(500);
    const employeeForm = adminPage.locator("employee-form");
    await expect(employeeForm).toBeVisible();

    // Fill out the form with invalid email
    await employeeForm.locator("#name").fill("Jane Smith");
    await employeeForm.locator("#identifier").fill("invalid-email");
    await employeeForm.locator("#ptoRate").fill("0.75");
    await employeeForm.locator("#carryoverHours").fill("10");
    await employeeForm.locator("#role").selectOption("Employee");

    // Submit the form
    await employeeForm.locator("#submit-btn").click();

    // Wait a moment for validation
    await page.waitForTimeout(500);

    // Verify form is still visible (validation failed)
    await expect(employeeForm).toBeVisible();
  });
});
