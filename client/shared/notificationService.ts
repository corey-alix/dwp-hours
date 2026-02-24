import { APIClient } from "../APIClient.js";
import type { NotificationItem } from "../../shared/api-models.js";
import { BUSINESS_RULES_CONSTANTS } from "../../shared/businessRules.js";

/**
 * Client-side notification service.
 * Fetches unread notifications on session start and manages read state.
 *
 * Integration:
 * - Call `fetchUnread()` on new sessions (8+ hour gap detected by activityTracker)
 * - Display notifications via TraceListener / PtoNotificationController pipeline
 * - Call `markRead(id)` when user explicitly dismisses a notification
 * - Do NOT call `markRead` on auto-dismiss (timeout) — notification reappears next session
 */
export class NotificationService {
  private api: APIClient;
  private _unread: NotificationItem[] = [];

  constructor(api: APIClient) {
    this.api = api;
  }

  /** Fetch unread notifications from the server. */
  async fetchUnread(): Promise<NotificationItem[]> {
    try {
      const response = await this.api.getNotifications();
      this._unread = response.notifications;
      return this._unread;
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      return [];
    }
  }

  /** Mark a single notification as read (user explicitly dismissed it). */
  async markRead(id: number): Promise<void> {
    try {
      await this.api.markNotificationRead(id);
      this._unread = this._unread.filter((n) => n.id !== id);
    } catch (error) {
      console.error(`Failed to mark notification ${id} as read:`, error);
    }
  }

  /** Get the current unread notifications (from last fetch). */
  get unread(): ReadonlyArray<NotificationItem> {
    return this._unread;
  }

  /** Auto-dismiss timeout in milliseconds. */
  get autoDismissMs(): number {
    return BUSINESS_RULES_CONSTANTS.NOTIFICATION_AUTO_DISMISS_MS;
  }
}
