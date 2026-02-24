import { describe, it, expect } from "vitest";
import {
  isAllowedEmailDomain,
  ALLOWED_EMAIL_DOMAINS,
} from "../shared/businessRules.js";

describe("Auto-Provision: isAllowedEmailDomain", () => {
  it("should accept an email with an allowed domain", () => {
    expect(isAllowedEmailDomain("newuser@example.com")).toBe(true);
  });

  it("should be case-insensitive for the domain part", () => {
    expect(isAllowedEmailDomain("user@EXAMPLE.COM")).toBe(true);
    expect(isAllowedEmailDomain("user@Example.Com")).toBe(true);
  });

  it("should reject an email with a disallowed domain", () => {
    expect(isAllowedEmailDomain("user@evil.org")).toBe(false);
    expect(isAllowedEmailDomain("user@notexample.com")).toBe(false);
  });

  it("should reject malformed input (no @ sign)", () => {
    expect(isAllowedEmailDomain("nope")).toBe(false);
  });

  it("should reject empty string", () => {
    expect(isAllowedEmailDomain("")).toBe(false);
  });

  it("should reject non-string input", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(isAllowedEmailDomain(null as any)).toBe(false);
    expect(isAllowedEmailDomain(undefined as any)).toBe(false);
    expect(isAllowedEmailDomain(42 as any)).toBe(false);
  });

  it("ALLOWED_EMAIL_DOMAINS should contain example.com by default", () => {
    expect(ALLOWED_EMAIL_DOMAINS).toContain("example.com");
  });
});
