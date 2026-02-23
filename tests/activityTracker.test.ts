// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isFirstSessionVisit,
  updateActivityTimestamp,
} from "../client/shared/activityTracker.js";

describe("Activity Tracker", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("isFirstSessionVisit", () => {
    it("should return true when no timestamp exists", () => {
      expect(isFirstSessionVisit()).toBe(true);
    });

    it("should return true when stored value is invalid", () => {
      localStorage.setItem("dwp-hours:lastActivityTimestamp", "not-a-date");
      expect(isFirstSessionVisit()).toBe(true);
    });

    it("should return true when 8+ hours have elapsed", () => {
      const eightHoursAgo = Date.now() - 8 * 60 * 60 * 1000;
      localStorage.setItem(
        "dwp-hours:lastActivityTimestamp",
        new Date(eightHoursAgo).toISOString(),
      );
      expect(isFirstSessionVisit()).toBe(true);
    });

    it("should return false when less than 8 hours have elapsed", () => {
      const oneHourAgo = Date.now() - 1 * 60 * 60 * 1000;
      localStorage.setItem(
        "dwp-hours:lastActivityTimestamp",
        new Date(oneHourAgo).toISOString(),
      );
      expect(isFirstSessionVisit()).toBe(false);
    });

    it("should return true when exactly 8 hours have elapsed", () => {
      const exactlyEightHours = Date.now() - 8 * 60 * 60 * 1000;
      localStorage.setItem(
        "dwp-hours:lastActivityTimestamp",
        new Date(exactlyEightHours).toISOString(),
      );
      expect(isFirstSessionVisit()).toBe(true);
    });

    it("should return false when timestamp is very recent", () => {
      localStorage.setItem(
        "dwp-hours:lastActivityTimestamp",
        new Date().toISOString(),
      );
      expect(isFirstSessionVisit()).toBe(false);
    });
  });

  describe("updateActivityTimestamp", () => {
    it("should write current time to localStorage", () => {
      vi.setSystemTime(new Date("2026-02-23T12:00:00.000Z"));
      updateActivityTimestamp();
      const stored = localStorage.getItem("dwp-hours:lastActivityTimestamp");
      expect(stored).toBe("2026-02-23T12:00:00.000Z");
    });

    it("should overwrite previous timestamp", () => {
      localStorage.setItem(
        "dwp-hours:lastActivityTimestamp",
        "2026-01-01T00:00:00.000Z",
      );
      vi.setSystemTime(new Date("2026-02-23T15:00:00.000Z"));
      updateActivityTimestamp();
      const stored = localStorage.getItem("dwp-hours:lastActivityTimestamp");
      expect(stored).toBe("2026-02-23T15:00:00.000Z");
    });
  });
});
