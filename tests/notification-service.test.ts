// @vitest-environment happy-dom

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationService } from "../client/shared/notificationService.js";
import { BUSINESS_RULES_CONSTANTS } from "../shared/businessRules.js";
import type { NotificationItem } from "../shared/api-models.js";

// Minimal mock APIClient
function createMockApi() {
  return {
    getNotifications: vi.fn(),
    markNotificationRead: vi.fn(),
    createNotification: vi.fn(),
  };
}

describe("NotificationService", () => {
  let service: NotificationService;
  let mockApi: ReturnType<typeof createMockApi>;

  const sampleNotifications: NotificationItem[] = [
    {
      id: 1,
      employee_id: 10,
      type: "calendar_lock_reminder",
      message: "Please review and lock your calendar for 2026-01.",
      created_at: "2026-02-01T10:00:00Z",
      read_at: null,
      expires_at: null,
      created_by: null,
    },
    {
      id: 2,
      employee_id: 10,
      type: "calendar_lock_reminder",
      message: "Please review and lock your calendar for 2026-02.",
      created_at: "2026-03-01T10:00:00Z",
      read_at: null,
      expires_at: null,
      created_by: null,
    },
  ];

  beforeEach(() => {
    mockApi = createMockApi();
    service = new NotificationService(mockApi as any);
  });

  describe("fetchUnread", () => {
    it("should fetch and store unread notifications", async () => {
      mockApi.getNotifications.mockResolvedValue({
        notifications: sampleNotifications,
      });

      const result = await service.fetchUnread();

      expect(mockApi.getNotifications).toHaveBeenCalledOnce();
      expect(result).toEqual(sampleNotifications);
      expect(service.unread).toEqual(sampleNotifications);
    });

    it("should return empty array on API error", async () => {
      mockApi.getNotifications.mockRejectedValue(new Error("Network error"));

      const result = await service.fetchUnread();

      expect(result).toEqual([]);
      expect(service.unread).toEqual([]);
    });

    it("should replace previous unread with fresh data", async () => {
      mockApi.getNotifications.mockResolvedValueOnce({
        notifications: sampleNotifications,
      });
      await service.fetchUnread();
      expect(service.unread.length).toBe(2);

      mockApi.getNotifications.mockResolvedValueOnce({
        notifications: [sampleNotifications[0]],
      });
      await service.fetchUnread();
      expect(service.unread.length).toBe(1);
    });
  });

  describe("markRead", () => {
    it("should call API and remove notification from unread list", async () => {
      mockApi.getNotifications.mockResolvedValue({
        notifications: [...sampleNotifications],
      });
      mockApi.markNotificationRead.mockResolvedValue({ success: true });

      await service.fetchUnread();
      expect(service.unread.length).toBe(2);

      await service.markRead(1);

      expect(mockApi.markNotificationRead).toHaveBeenCalledWith(1);
      expect(service.unread.length).toBe(1);
      expect(service.unread[0].id).toBe(2);
    });

    it("should keep notification in unread list if API call fails", async () => {
      mockApi.getNotifications.mockResolvedValue({
        notifications: [...sampleNotifications],
      });
      mockApi.markNotificationRead.mockRejectedValue(new Error("Server error"));

      await service.fetchUnread();
      await service.markRead(1);

      // The notification should still be there since markRead failed
      expect(service.unread.length).toBe(2);
    });
  });

  describe("autoDismissMs", () => {
    it("should return the configured auto-dismiss duration", () => {
      expect(service.autoDismissMs).toBe(
        BUSINESS_RULES_CONSTANTS.NOTIFICATION_AUTO_DISMISS_MS,
      );
    });
  });

  describe("unread", () => {
    it("should return empty array before fetch", () => {
      expect(service.unread).toEqual([]);
    });

    it("should return a readonly array", () => {
      const unread = service.unread;
      expect(Array.isArray(unread)).toBe(true);
    });
  });
});
