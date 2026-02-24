import { test, expect } from "@playwright/test";

test.describe("Auto-Provision New Users", () => {
  test("should auto-provision a new user with an allowed email domain", async ({
    page,
    request,
  }) => {
    test.setTimeout(15000);

    const newEmail = `auto-test-${Date.now()}@example.com`;

    // Step 1: Request a magic link for the new (unknown) email
    const linkResponse = await request.post("/api/auth/request-link", {
      data: { identifier: newEmail },
      headers: { "x-test-mode": "true" },
    });
    expect(linkResponse.ok()).toBe(true);

    const linkBody = await linkResponse.json();
    expect(linkBody.magicLink).toBeTruthy();
    // Should NOT contain "missing-user" — a real token should have been issued
    expect(linkBody.magicLink).not.toContain("missing-user");

    // Step 2: Extract token and validate it
    const url = new URL(linkBody.magicLink);
    const token = url.searchParams.get("token");
    expect(token).toBeTruthy();

    const validateResponse = await request.get(
      `/api/auth/validate?token=${token}`,
    );
    expect(validateResponse.ok()).toBe(true);

    const session = await validateResponse.json();
    expect(session.authToken).toBeTruthy();
    expect(session.employee).toBeTruthy();
    expect(session.employee.name).toBe(newEmail);
    expect(session.employee.role).toBe("Employee");
  });

  test("should reject login for a disallowed email domain", async ({
    request,
  }) => {
    test.setTimeout(10000);

    const badEmail = `hacker-${Date.now()}@evil.org`;

    const linkResponse = await request.post("/api/auth/request-link", {
      data: { identifier: badEmail },
      headers: { "x-test-mode": "true" },
    });
    expect(linkResponse.ok()).toBe(true);

    const linkBody = await linkResponse.json();
    // Should get the missing-user token (not a real provisioned user)
    expect(linkBody.magicLink).toContain("missing-user");
  });
});
