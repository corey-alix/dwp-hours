import { test, expect } from "@playwright/test";
import path from "path";
import fs from "fs";

test.describe("File-Based Data Migration API", () => {
  test.setTimeout(60000); // Allow more time for migration operations

  test("should execute full migration from Excel file and verify data integrity", async ({
    page,
  }) => {
    // Check if the required Excel file exists
    const filePath = path.join(
      process.cwd(),
      "private",
      "Corey Alix 2025.xlsx",
    );
    if (!fs.existsSync(filePath)) {
      console.warn(
        'Excel file not found, skipping migration test. Please provide "private/Corey Alix 2025.xlsx"',
      );
      test.skip();
      return;
    }
    // First, reload database to ensure clean state
    await page.request.post("/api/test/reload-database", {
      headers: { "x-test-reload": "true" },
    });

    // Wait for database reload
    await page.waitForTimeout(1000);

    // Log in as admin to get authentication cookie
    await page.goto("/");
    await page.fill("#identifier", "admin@example.com");
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await magicLink.click();
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    // Execute file-based migration
    const response = await page.request.post("/api/migrate/file", {
      data: {
        employeeEmail: "test-coreyalix@gmail.com",
        filePath: filePath,
      },
    });

    // Check response
    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify the response structure
    expect(result).toHaveProperty("message", "Bulk migration completed");
    expect(result).toHaveProperty("employeeId");
    expect(result).toHaveProperty("summary");
    expect(result).toHaveProperty("warnings");

    const { summary, employeeId } = result;

    // Verify summary contains expected fields
    expect(summary).toHaveProperty("monthlyHoursInserted");
    expect(summary).toHaveProperty("monthlyHoursSkipped");
    expect(summary).toHaveProperty("ptoEntriesInserted");
    expect(summary).toHaveProperty("ptoEntriesSkipped");

    // Verify employee was created
    expect(employeeId).toBeGreaterThan(0);

    // Verify data integrity by querying the database
    const employeeResponse = await page.request.get(
      `/api/employees/${employeeId}`,
    );
    expect(employeeResponse.ok()).toBeTruthy();
    const employee = await employeeResponse.json();
    expect(employee.identifier).toBe("test-coreyalix@gmail.com");

    // Check monthly hours were imported
    const monthlyHoursResponse = await page.request.get(
      `/api/employees/${employeeId}/monthly-hours`,
    );
    expect(monthlyHoursResponse.ok()).toBeTruthy();
    const monthlyHours = await monthlyHoursResponse.json();
    expect(Array.isArray(monthlyHours)).toBeTruthy();
    expect(monthlyHours.length).toBeGreaterThan(0);

    // Verify monthly hours data integrity
    monthlyHours.forEach((hour: any) => {
      expect(hour).toHaveProperty("month");
      expect(hour).toHaveProperty("hours_worked");
      expect(hour.hours_worked).toBeGreaterThan(0);
      expect(hour.submitted_at).toBeDefined();
    });

    // Check PTO entries were imported (may be 0 if calendar parsing finds no colored cells)
    const ptoResponse = await page.request.get(
      `/api/employees/${employeeId}/pto-entries`,
    );
    expect(ptoResponse.ok()).toBeTruthy();
    const ptoEntries = await ptoResponse.json();
    expect(Array.isArray(ptoEntries)).toBeTruthy();

    // If PTO entries exist, verify their integrity
    if (ptoEntries.length > 0) {
      ptoEntries.forEach((entry: any) => {
        expect(entry).toHaveProperty("date");
        expect(entry).toHaveProperty("type");
        expect(entry).toHaveProperty("hours");
        expect(["Sick", "PTO", "Bereavement", "Jury Duty"]).toContain(
          entry.type,
        );
        expect(entry.hours).toBeGreaterThan(0);
      });
    }

    // Verify total counts match what was reported in migration summary
    expect(monthlyHours.length).toBe(summary.monthlyHoursInserted);
    expect(ptoEntries.length).toBe(summary.ptoEntriesInserted);

    console.log("Migration completed successfully:", {
      employeeId,
      monthlyHoursCount: monthlyHours.length,
      ptoEntriesCount: ptoEntries.length,
      warnings: result.warnings,
    });
  });

  test("should handle missing Excel file gracefully", async ({ page }) => {
    // Log in as admin first
    await page.goto("/");
    await page.fill("#identifier", "admin@example.com");
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await magicLink.click();
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    const response = await page.request.post("/api/migrate/file", {
      data: {
        employeeEmail: "test@example.com",
        filePath: "/nonexistent/file.xlsx",
      },
    });

    expect(response.status()).toBe(500);
    const error = await response.json();
    expect(error).toHaveProperty("error");
    expect(error.error).toContain("Internal server error");
  });

  test("should validate employee email format", async ({ page }) => {
    // Log in as admin first
    await page.goto("/");
    await page.fill("#identifier", "admin@example.com");
    await page.click('#login-form button[type="submit"]');
    await page.waitForSelector("#login-message", { timeout: 10000 });
    const magicLink = page.locator("#login-message a");
    await magicLink.click();
    await page.waitForSelector("#dashboard", { timeout: 10000 });

    const response = await page.request.post("/api/migrate/file", {
      data: {
        employeeEmail: "invalid-email",
        filePath: path.join(process.cwd(), "private", "Corey Alix 2025.xlsx"),
      },
    });

    expect(response.status()).toBe(400);
    const error = await response.json();
    expect(error).toHaveProperty("error", "Valid employee email is required");
  });
});
