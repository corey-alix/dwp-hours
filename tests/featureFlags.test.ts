import { describe, it, expect } from "vitest";
import {
  envBool,
  resolveFeatureFlags,
  featureFlags,
} from "../shared/featureFlags.js";

describe("featureFlags", () => {
  // ── envBool helper ──
  describe("envBool", () => {
    it('returns true for "true"', () => {
      expect(envBool("true", false)).toBe(true);
    });

    it('returns true for "1"', () => {
      expect(envBool("1", false)).toBe(true);
    });

    it('returns false for "false"', () => {
      expect(envBool("false", true)).toBe(false);
    });

    it('returns false for "0"', () => {
      expect(envBool("0", true)).toBe(false);
    });

    it("returns defaultValue for undefined", () => {
      expect(envBool(undefined, true)).toBe(true);
      expect(envBool(undefined, false)).toBe(false);
    });

    it("returns defaultValue for empty string", () => {
      expect(envBool("", true)).toBe(true);
      expect(envBool("", false)).toBe(false);
    });

    it("returns defaultValue for unrecognised value", () => {
      expect(envBool("maybe", true)).toBe(true);
      expect(envBool("yes", false)).toBe(false);
    });

    it("trims and is case-insensitive", () => {
      expect(envBool("  TRUE  ", false)).toBe(true);
      expect(envBool("False", true)).toBe(false);
    });
  });

  // ── resolveFeatureFlags ──
  describe("resolveFeatureFlags", () => {
    it("returns defaults when env is empty", () => {
      const flags = resolveFeatureFlags({});
      expect(flags.enableBrowserImport).toBe(true);
      expect(flags.enableImportAutoApprove).toBe(true);
    });

    it("overrides enableBrowserImport from env", () => {
      const flags = resolveFeatureFlags({
        FF_ENABLE_BROWSER_IMPORT: "false",
      });
      expect(flags.enableBrowserImport).toBe(false);
      // Other flag keeps default
      expect(flags.enableImportAutoApprove).toBe(true);
    });

    it("overrides enableImportAutoApprove from env", () => {
      const flags = resolveFeatureFlags({
        FF_ENABLE_IMPORT_AUTO_APPROVE: "0",
      });
      expect(flags.enableImportAutoApprove).toBe(false);
      expect(flags.enableBrowserImport).toBe(true);
    });

    it("overrides both flags from env", () => {
      const flags = resolveFeatureFlags({
        FF_ENABLE_BROWSER_IMPORT: "0",
        FF_ENABLE_IMPORT_AUTO_APPROVE: "false",
      });
      expect(flags.enableBrowserImport).toBe(false);
      expect(flags.enableImportAutoApprove).toBe(false);
    });
  });

  // ── Singleton ──
  describe("featureFlags singleton", () => {
    it("has expected shape", () => {
      expect(typeof featureFlags.enableBrowserImport).toBe("boolean");
      expect(typeof featureFlags.enableImportAutoApprove).toBe("boolean");
    });
  });
});
