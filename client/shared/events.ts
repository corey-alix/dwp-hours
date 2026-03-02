/**
 * Typed Custom Event Catalog — single source of truth for all
 * custom events dispatched across the DWP Hours Tracker UI.
 *
 * ## Naming Conventions
 *
 * | Pattern              | Usage                                      | Example                  |
 * |----------------------|--------------------------------------------|--------------------------|
 * | `noun-verb`          | Component action completed                 | `employee-submit`        |
 * | `noun-data-request`  | Component needs data from parent            | `pto-data-request`       |
 * | `noun-verb-noun`     | Component requests a state change           | `navigate-to-month`      |
 * | `noun-changed`       | Component notifies of state change          | `selection-changed`      |
 *
 * ## Rules
 *
 * 1. All event names use **kebab-case** (lowercase, hyphen-separated).
 * 2. Events that request data use the `-request` suffix.
 * 3. Events that notify of changes use the `-changed` suffix.
 * 4. Events always include `bubbles: true` and `composed: true` so
 *    they escape shadow DOM boundaries (unless purely internal).
 * 5. Detail payloads are defined here as interfaces so consumers
 *    get full type safety.
 *
 * ## Usage
 *
 * ```ts
 * import { dispatchTypedEvent, AppEvents } from "../../shared/events.js";
 *
 * // Dispatching
 * dispatchTypedEvent(this, "employee-submit", { employee: { name: "Jane" } });
 *
 * // Listening (type-safe detail)
 * el.addEventListener("employee-submit", (e) => {
 *   const { employee } = (e as CustomEvent<AppEvents["employee-submit"]>).detail;
 * });
 * ```
 */

// ── Detail Payload Interfaces ────────────────────────────────────

export interface EmployeeSubmitDetail {
  employee: { name: string; identifier?: string; [key: string]: unknown };
}

export interface EmployeeActionDetail {
  employeeId: number;
}

export interface CalendarDataRequestDetail {
  employeeId: number;
  month: string;
}

export interface MonthChangedDetail {
  month: number;
}

export interface PtoSubmitDetail {
  entries: ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
    note?: string;
  }>;
}

export interface PtoRequestActionDetail {
  requestId: number;
  requestIds: number[];
}

export interface SelectionChangedDetail {
  selectedDates: string[];
}

export interface PtoValidationErrorDetail {
  message: string;
}

export interface AdminAcknowledgeDetail {
  employeeId: number;
}

export interface AdminMonthlyReviewRequestDetail {
  month: string;
}

export interface SendLockReminderDetail {
  employeeId: number;
}

export interface NavigateToMonthDetail {
  month: number;
  year?: number;
}

export interface RouterNavigateDetail {
  path: string;
}

export interface DayNoteSaveDetail {
  date: string;
  note: string;
}

export interface DayNoteCancelDetail {
  date: string;
}

export interface PageChangeDetail {
  page: number;
}

export interface PageSizeChangeDetail {
  pageSize: number;
}

export interface SortChangeDetail {
  sortKey: string;
  sortDirection: "asc" | "desc";
}

export interface PtoTypeChangedDetail {
  type: string;
}

// ── Event Map ────────────────────────────────────────────────────

/**
 * Master map of event name → detail payload.
 * Use `AppEvents[EventName]` for exhaustive type checking.
 */
export interface AppEvents {
  // Employee management
  "employee-submit": EmployeeSubmitDetail;
  "employee-edit": EmployeeActionDetail;
  "employee-delete": EmployeeActionDetail;
  "employee-view-calendar": EmployeeActionDetail;
  "employee-view-summary": EmployeeActionDetail;
  "form-cancel": Record<string, never>;

  // PTO entry / calendar
  "pto-data-request": Record<string, never>;
  "pto-submit": PtoSubmitDetail;
  "pto-request-submit": PtoSubmitDetail;
  "pto-validation-error": PtoValidationErrorDetail;
  "pto-type-changed": PtoTypeChangedDetail;
  "selection-changed": SelectionChangedDetail;
  "month-changed": MonthChangedDetail;
  "navigate-to-month": NavigateToMonthDetail;

  // Day notes
  "day-note-save": DayNoteSaveDetail;
  "day-note-cancel": DayNoteCancelDetail;

  // PTO request queue
  "request-approve": PtoRequestActionDetail;
  "request-reject": PtoRequestActionDetail;
  "calendar-data-request": CalendarDataRequestDetail;

  // Admin monthly review
  "admin-acknowledge": AdminAcknowledgeDetail;
  "admin-monthly-review-request": AdminMonthlyReviewRequestDetail;
  "calendar-month-data-request": CalendarDataRequestDetail;
  "send-lock-reminder": SendLockReminderDetail;

  // Navigation / routing
  "router-navigate": RouterNavigateDetail;
  logout: Record<string, never>;

  // Auth
  "login-success": { token: string };
  "auth-state-changed": { user: unknown };

  // Data table
  "page-change": PageChangeDetail;
  "page-size-change": PageSizeChangeDetail;
  "sort-change": SortChangeDetail;
}

// ── Typed Dispatch Helper ────────────────────────────────────────

/**
 * Dispatch a typed custom event that escapes shadow DOM.
 *
 * @param target      The element dispatching the event.
 * @param eventName   One of the well-known event names from `AppEvents`.
 * @param detail      Payload matching the event's detail interface.
 * @param options     Additional CustomEventInit overrides (e.g. `composed: false`).
 */
export function dispatchTypedEvent<K extends keyof AppEvents>(
  target: EventTarget,
  eventName: K,
  detail: AppEvents[K],
  options?: Partial<Pick<CustomEventInit, "bubbles" | "composed">>,
): boolean {
  return target.dispatchEvent(
    new CustomEvent<AppEvents[K]>(eventName, {
      bubbles: true,
      composed: true,
      ...options,
      detail,
    }),
  );
}
