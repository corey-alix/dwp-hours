import { describe, it, expect } from "vitest";
import {
  ROLE_ADMIN,
  ROLE_MANAGER,
  ROLE_EMPLOYEE,
  AD_ROLE_ADMIN,
  AD_ROLE_MANAGER,
  AD_ROLE_USER,
  AD_ROLE_MAP,
  resolveAdRole,
  isAdmin,
  isManager,
} from "../shared/businessRules.js";

describe("Role Constants", () => {
  it("defines the three internal roles", () => {
    expect(ROLE_ADMIN).toBe("Admin");
    expect(ROLE_MANAGER).toBe("Manager");
    expect(ROLE_EMPLOYEE).toBe("Employee");
  });

  it("defines the three Azure AD app roles", () => {
    expect(AD_ROLE_ADMIN).toBe("dw-time-admin");
    expect(AD_ROLE_MANAGER).toBe("dw-time-manager");
    expect(AD_ROLE_USER).toBe("dw-time-user");
  });
});

describe("AD_ROLE_MAP", () => {
  it("maps dw-time-admin to Admin", () => {
    expect(AD_ROLE_MAP[AD_ROLE_ADMIN]).toBe(ROLE_ADMIN);
  });

  it("maps dw-time-manager to Manager", () => {
    expect(AD_ROLE_MAP[AD_ROLE_MANAGER]).toBe(ROLE_MANAGER);
  });

  it("maps dw-time-user to Employee", () => {
    expect(AD_ROLE_MAP[AD_ROLE_USER]).toBe(ROLE_EMPLOYEE);
  });
});

describe("resolveAdRole", () => {
  it("resolves dw-time-admin to Admin", () => {
    expect(resolveAdRole([AD_ROLE_ADMIN])).toBe(ROLE_ADMIN);
  });

  it("resolves dw-time-manager to Manager", () => {
    expect(resolveAdRole([AD_ROLE_MANAGER])).toBe(ROLE_MANAGER);
  });

  it("resolves dw-time-user to Employee", () => {
    expect(resolveAdRole([AD_ROLE_USER])).toBe(ROLE_EMPLOYEE);
  });

  it("resolves multiple roles to highest precedence (admin > manager)", () => {
    expect(resolveAdRole([AD_ROLE_ADMIN, AD_ROLE_MANAGER])).toBe(ROLE_ADMIN);
  });

  it("resolves multiple roles to highest precedence (manager > user)", () => {
    expect(resolveAdRole([AD_ROLE_USER, AD_ROLE_MANAGER])).toBe(ROLE_MANAGER);
  });

  it("resolves all three roles to Admin", () => {
    expect(resolveAdRole([AD_ROLE_USER, AD_ROLE_ADMIN, AD_ROLE_MANAGER])).toBe(
      ROLE_ADMIN,
    );
  });

  it("returns Employee for empty roles array", () => {
    expect(resolveAdRole([])).toBe(ROLE_EMPLOYEE);
  });

  it("returns Employee for unrecognized roles", () => {
    expect(resolveAdRole(["some-unknown-role"])).toBe(ROLE_EMPLOYEE);
  });

  it("ignores unrecognized roles and picks recognized ones", () => {
    expect(resolveAdRole(["unknown", AD_ROLE_MANAGER, "another"])).toBe(
      ROLE_MANAGER,
    );
  });
});

describe("isAdmin", () => {
  it("returns true for Admin", () => {
    expect(isAdmin(ROLE_ADMIN)).toBe(true);
  });

  it("returns false for Employee", () => {
    expect(isAdmin(ROLE_EMPLOYEE)).toBe(false);
  });

  it("returns false for Manager", () => {
    expect(isAdmin(ROLE_MANAGER)).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isAdmin("")).toBe(false);
  });
});

describe("isManager", () => {
  it("returns true for Manager", () => {
    expect(isManager(ROLE_MANAGER)).toBe(true);
  });

  it("returns false for Admin", () => {
    expect(isManager(ROLE_ADMIN)).toBe(false);
  });

  it("returns false for Employee", () => {
    expect(isManager(ROLE_EMPLOYEE)).toBe(false);
  });
});
