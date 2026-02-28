/*
---
 client/APIClient.d.ts 156
 client/UIManager.d.ts 217
 client/app.d.ts 268
 client/auth/auth-service.d.ts 293
 client/auth/index.d.ts 347
 client/components/admin-monthly-review/css.d.ts 360
 client/components/admin-monthly-review/index.d.ts 372
 client/components/admin-monthly-review/test.d.ts 512
 client/components/balance-table/css.d.ts 525
 client/components/balance-table/index.d.ts 537
 client/components/base-component.d.ts 587
 client/components/confirmation-dialog/index.d.ts 618
 client/components/confirmation-dialog/test.d.ts 647
 client/components/dashboard-navigation-menu/css.d.ts 659
 client/components/dashboard-navigation-menu/index.d.ts 674
 client/components/dashboard-navigation-menu/test.d.ts 731
 client/components/data-table/index.d.ts 743
 client/components/data-table/test.d.ts 794
 client/components/debug-console/index.d.ts 806
 client/components/employee-form/css.d.ts 836
 client/components/employee-form/index.d.ts 848
 client/components/employee-form/test.d.ts 902
 client/components/employee-list/css.d.ts 914
 client/components/employee-list/index.d.ts 926
 client/components/employee-list/test.d.ts 997
 client/components/index.d.ts 1009
 client/components/month-summary/css.d.ts 1039
 client/components/month-summary/index.d.ts 1051
 client/components/month-summary/test.d.ts 1099
 client/components/prior-year-review/css.d.ts 1111
 client/components/prior-year-review/index.d.ts 1129
 client/components/prior-year-review/test.d.ts 1151
 client/components/pto-balance-summary/index.d.ts 1163
 client/components/pto-balance-summary/test.d.ts 1182
 client/components/pto-calendar/css.d.ts 1194
 client/components/pto-calendar/index.d.ts 1207
 client/components/pto-calendar/test.d.ts 1295
 client/components/pto-dashboard/index.d.ts 1307
 client/components/pto-dashboard/test.d.ts 1321
 client/components/pto-employee-info-card/index.d.ts 1333
 client/components/pto-employee-info-card/test.d.ts 1362
 client/components/pto-entry-form/css.d.ts 1374
 client/components/pto-entry-form/index.d.ts 1386
 client/components/pto-entry-form/test.d.ts 1546
 client/components/pto-notification/index.d.ts 1558
 client/components/pto-pto-card/index.d.ts 1591
 client/components/pto-pto-card/test.d.ts 1634
 client/components/pto-request-queue/css.d.ts 1646
 client/components/pto-request-queue/index.d.ts 1658
 client/components/pto-request-queue/test.d.ts 1696
 client/components/pto-summary-card/index.d.ts 1708
 client/components/pto-summary-card/test.d.ts 1737
 client/components/test-utils.d.ts 1749
 client/components/test.d.ts 1802
 client/components/utils/compute-selection-deltas.d.ts 1830
 client/components/utils/pto-card-base.d.ts 1861
 client/components/utils/pto-card-css.d.ts 1882
 client/components/utils/pto-card-helpers.d.ts 1898
 client/controller/DebugConsoleController.d.ts 1946
 client/controller/PtoNotificationController.d.ts 1985
 client/controller/TraceListener.d.ts 2009
 client/css-extensions/animations/animations.d.ts 2065
 client/css-extensions/animations/index.d.ts 2082
 client/css-extensions/animations/types.d.ts 2188
 client/css-extensions/index.d.ts 2237
 client/css-extensions/navigation/index.d.ts 2273
 client/css-extensions/navigation/navigation.d.ts 2302
 client/css-extensions/pto-day-colors/index.d.ts 2326
 client/css-extensions/pto-day-colors/pto-day-colors.d.ts 2354
 client/css-extensions/toolbar/index.d.ts 2374
 client/css-extensions/toolbar/toolbar.d.ts 2402
 client/import/excelImportClient.d.ts 2418
 client/pages/admin-employees-page/css.d.ts 2466
 client/pages/admin-employees-page/index.d.ts 2478
 client/pages/admin-employees-page/test.d.ts 2524
 client/pages/admin-monthly-review-page/css.d.ts 2536
 client/pages/admin-monthly-review-page/index.d.ts 2548
 client/pages/admin-monthly-review-page/test.d.ts 2585
 client/pages/admin-pto-requests-page/css.d.ts 2597
 client/pages/admin-pto-requests-page/index.d.ts 2609
 client/pages/admin-pto-requests-page/test.d.ts 2662
 client/pages/admin-settings-page/css.d.ts 2674
 client/pages/admin-settings-page/index.d.ts 2686
 client/pages/admin-settings-page/test.d.ts 2723
 client/pages/current-year-summary-page/css.d.ts 2735
 client/pages/current-year-summary-page/index.d.ts 2747
 client/pages/current-year-summary-page/test.d.ts 2774
 client/pages/index.d.ts 2786
 client/pages/login-page/css.d.ts 2806
 client/pages/login-page/index.d.ts 2818
 client/pages/login-page/test.d.ts 2848
 client/pages/not-found-page/index.d.ts 2860
 client/pages/prior-year-summary-page/css.d.ts 2878
 client/pages/prior-year-summary-page/index.d.ts 2890
 client/pages/prior-year-summary-page/test.d.ts 2914
 client/pages/submit-time-off-page/css.d.ts 2926
 client/pages/submit-time-off-page/index.d.ts 2938
 client/pages/submit-time-off-page/test.d.ts 3011
 client/pages/test.d.ts 3023
 client/router/index.d.ts 3043
 client/router/router.d.ts 3057
 client/router/routes.d.ts 3108
 client/router/types.d.ts 3121
 client/shared/activityTracker.d.ts 3172
 client/shared/aggregate-pto-requests.d.ts 3195
 client/shared/atomic-css.d.ts 3252
 client/shared/notificationService.d.ts 3269
 client/shared/pto-types.d.ts 3305
 client/test.d.ts 3340
 server/entities/Acknowledgement.d.ts 3376
 server/entities/AdminAcknowledgement.d.ts 3397
 server/entities/Employee.d.ts 3418
 server/entities/MonthlyHours.d.ts 3449
 server/entities/PtoEntry.d.ts 3469
 shared/SHEET_TEMPLATE.d.ts 3493
 shared/backupConfig.d.ts 6426
 shared/businessRules.d.ts 6483
 shared/calendar-symbols.d.ts 6875
 shared/conversionUtils.d.ts 6894
 shared/dateUtils.d.ts 6953
 shared/dateUtils.test.d.ts 7231
 shared/entity-transforms.d.ts 7243
 shared/excel/acknowledgements.d.ts 7265
 shared/excel/calendarParsing.d.ts 7293
 shared/excel/cellUtils.d.ts 7317
 shared/excel/colorUtils.d.ts 7347
 shared/excel/employeeParsing.d.ts 7376
 shared/excel/index.d.ts 7417
 shared/excel/legendParsing.d.ts 7446
 shared/excel/parseEmployeeSheet.d.ts 7478
 shared/excel/ptoCalcParsing.d.ts 7507
 shared/excel/reconciliation.d.ts 7538
 shared/excel/types.d.ts 7649
 shared/excelParsing.d.ts 7795
 shared/logger.d.ts 7818
 shared/seedData.d.ts 7867
 shared/testDataGenerators.d.ts 7903
---
*/
/*
---
project: "DWP Hours Tracker"
generated: "2026-02-28T21:17:09.572Z"
totalFiles: 137
directories: {"client":4,"client/auth":2,"client/components/admin-monthly-review":3,"client/components/balance-table":2,"client/components":4,"client/components/confirmation-dialog":2,"client/components/dashboard-navigation-menu":3,"client/components/data-table":2,"client/components/debug-console":1,"client/components/employee-form":3,"client/components/employee-list":3,"client/components/month-summary":3,"client/components/prior-year-review":3,"client/components/pto-balance-summary":2,"client/components/pto-calendar":3,"client/components/pto-dashboard":2,"client/components/pto-employee-info-card":2,"client/components/pto-entry-form":3,"client/components/pto-notification":1,"client/components/pto-pto-card":2,"client/components/pto-request-queue":3,"client/components/pto-summary-card":2,"client/components/utils":4,"client/controller":3,"client/css-extensions/animations":3,"client/css-extensions":1,"client/css-extensions/navigation":2,"client/css-extensions/pto-day-colors":2,"client/css-extensions/toolbar":2,"client/import":1,"client/pages/admin-employees-page":3,"client/pages/admin-monthly-review-page":3,"client/pages/admin-pto-requests-page":3,"client/pages/admin-settings-page":3,"client/pages/current-year-summary-page":3,"client/pages":2,"client/pages/login-page":3,"client/pages/not-found-page":1,"client/pages/prior-year-summary-page":3,"client/pages/submit-time-off-page":3,"client/router":4,"client/shared":5,"server/entities":5,"shared":12,"shared/excel":11}
fileTypes: {"ts":137}
---
*/

// ===== TYPE DEFINITIONS =====

/*
---
file: "client/APIClient.d.ts"
dependencies: ["../shared/api-models.js"]
lineCount: 51
exports: ["APIClient"]
---
*/
// ===== client/APIClient.d.ts =====
import type * as ApiTypes from "../shared/api-models.js";
export declare class APIClient {
  private baseURL;
  /**
   * Returns query-string parameters for time-travel override,
   * or an empty string when inactive.
   */
  private timeTravelQuery;
  get(endpoint: string): Promise<any>;
  post(endpoint: string, data: any): Promise<any>;
  put(endpoint: string, data: any): Promise<any>;
  delete(endpoint: string): Promise<any>;
  patch(endpoint: string, data?: any): Promise<any>;
  requestAuthLink(
    identifier: string,
  ): Promise<ApiTypes.AuthRequestLinkResponse>;
  validateAuth(token: string): Promise<ApiTypes.AuthValidateResponse>;
  validateSession(): Promise<ApiTypes.AuthValidateSessionResponse>;
  getPTOStatus(): Promise<ApiTypes.PTOStatusResponse>;
  getPTOEntries(): Promise<ApiTypes.PTOEntry[]>;
  getPTOYearReview(year: number): Promise<ApiTypes.PTOYearReviewResponse>;
  createPTOEntry(
    request: ApiTypes.PTOCreateRequest | ApiTypes.PTOBulkCreateRequest,
  ): Promise<{
    message: string;
    ptoEntry: ApiTypes.PTOEntry;
    ptoEntries: ApiTypes.PTOEntry[];
    warnings?: string[];
  }>;
  updatePTOEntry(
    id: number,
    updates: ApiTypes.PTOUpdateRequest,
  ): Promise<ApiTypes.PTOUpdateResponse>;
  approvePTOEntry(
    id: number,
    adminId: number,
  ): Promise<ApiTypes.PTOUpdateResponse>;
  rejectPTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse>;
  deletePTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse>;
  submitHours(
    month: string,
    hoursWorked: number,
  ): Promise<ApiTypes.HoursSubmitResponse>;
  getHours(): Promise<ApiTypes.HoursResponse>;
  submitAcknowledgement(
    month: string,
  ): Promise<ApiTypes.AcknowledgementSubmitResponse>;
  getAcknowledgements(): Promise<ApiTypes.AcknowledgementResponse>;
  deleteAcknowledgement(id: number): Promise<ApiTypes.GenericMessageResponse>;
  getMonthlySummary(month: string): Promise<ApiTypes.MonthlySummaryResponse>;
  submitAdminAcknowledgement(
    employeeId: number,
    month: string,
  ): Promise<ApiTypes.AdminAcknowledgementSubmitResponse>;
  getAdminMonthlyReview(
    month: string,
  ): Promise<ApiTypes.AdminMonthlyReviewResponse>;
  getAdminPTOEntries(): Promise<ApiTypes.PTOEntry[]>;
  getEmployees(): Promise<ApiTypes.EmployeesResponse>;
  createEmployee(
    employee: ApiTypes.EmployeeCreateRequest,
  ): Promise<ApiTypes.EmployeeCreateResponse>;
  getEmployee(id: number): Promise<ApiTypes.EmployeeResponse>;
  updateEmployee(
    id: number,
    updates: ApiTypes.EmployeeUpdateRequest,
  ): Promise<ApiTypes.EmployeeUpdateResponse>;
  deleteEmployee(id: number): Promise<ApiTypes.GenericMessageResponse>;
  health(): Promise<ApiTypes.HealthResponse>;
  getNotifications(): Promise<ApiTypes.NotificationsResponse>;
  markNotificationRead(id: number): Promise<ApiTypes.NotificationReadResponse>;
  createNotification(
    employeeId: number,
    type: ApiTypes.NotificationType,
    message: string,
  ): Promise<ApiTypes.NotificationCreateResponse>;
  importExcel(file: File): Promise<any>;
  importBulk(
    payload: ApiTypes.BulkImportPayload,
  ): Promise<ApiTypes.BulkImportResponse>;
}
//# sourceMappingURL=APIClient.d.ts.map

/*
---
file: "client/UIManager.d.ts"
dependencies: []
lineCount: 41
exports: ["UIManager"]
---
*/
// ===== client/UIManager.d.ts =====
import "./pages/index";
/**
 * Thin application shell.
 * Bootstraps AuthService + Router, wires the navigation menu, and delegates
 * all page rendering to the router.
 */
export declare class UIManager {
  private authService;
  private router;
  private api;
  private notificationService;
  constructor();
  private init;
  private setupGlobalListeners;
  /** Map dashboard-navigation-menu page IDs to router paths. */
  private navigateFromPage;
  private showNav;
  private updateNavMenu;
  private static readonly PAGE_LABELS;
  private updateHeading;
  /**
   * On new sessions (8+ hours since last activity), check whether the
   * immediately preceding month has been acknowledged by the employee.
   * If not, navigate to that month on the submit-time-off page and show
   * a notification prompting the user to lock it.
   *
   * @returns `true` if navigation was triggered (caller should skip default nav)
   */
  private checkPriorMonthAcknowledgement;
  /**
   * Fetch and display queued in-app notifications on new sessions.
   * Only called when `isFirstSessionVisit()` detected a new session
   * (the timestamp is already updated by `checkPriorMonthAcknowledgement`).
   *
   * Auto-dismiss: notifications that timeout without user click remain
   * unread and will reappear next session. Only explicit dismissal
   * marks them as read.
   */
  private showQueuedNotifications;
}
//# sourceMappingURL=UIManager.d.ts.map

/*
---
file: "client/app.d.ts"
dependencies: ["./UIManager.js","./controller/TraceListener.js"]
lineCount: 15
exports: ["notifications","App"]
---
*/
// ===== client/app.d.ts =====
import "./components/index.js";
export { TestWorkflow, initTestPage } from "./test.js";
export * from "./components/test.js";
export * from "./pages/test.js";
import { TraceListener } from "./controller/TraceListener.js";
import { UIManager } from "./UIManager.js";
export declare const notifications: TraceListener;
/**
 * Application entry point.
 * Call `App.run()` after the DOM is fully parsed to bootstrap the UI.
 */
export declare class App {
  static run(): UIManager;
}
//# sourceMappingURL=app.d.ts.map

/*
---
file: "client/auth/auth-service.d.ts"
dependencies: ["../APIClient.js"]
lineCount: 44
exports: ["AuthUser","AuthService"]
---
*/
// ===== client/auth/auth-service.d.ts =====
import { APIClient } from "../APIClient.js";
export interface AuthUser {
  id: number;
  name: string;
  role: string;
}
/**
 * Centralized authentication service.
 * Manages cookie-based sessions, magic-link validation, and user state.
 * Dispatches `auth-state-changed` on the global `window` when the user logs in/out.
 */
export declare class AuthService {
  private currentUser;
  private api;
  constructor(api?: APIClient);
  setAuthCookie(hash: string): void;
  getAuthCookie(): string | null;
  private clearAuthCookie;
  /**
   * Check URL for magic-link token, then fall back to cookie-based session.
   * Returns the authenticated user or null.
   */
  initialize(): Promise<AuthUser | null>;
  /** Request a magic link for the given email/identifier. */
  requestMagicLink(identifier: string): Promise<{
    message: string;
    magicLink?: string;
  }>;
  /** Validate a magic-link token and establish a session. */
  validateToken(token: string): Promise<AuthUser>;
  /** Validate an existing cookie-based session. */
  validateSession(): Promise<AuthUser | null>;
  /** Log the user out: clear cookie, clear state. */
  logout(): void;
  /** Current authenticated user (or null). */
  getUser(): AuthUser | null;
  /** Whether a user is currently authenticated. */
  isAuthenticated(): boolean;
  /** Whether the current user has a given role. */
  hasRole(role: string): boolean;
  private setUser;
  private emitAuthStateChanged;
}
//# sourceMappingURL=auth-service.d.ts.map

/*
---
file: "client/auth/index.d.ts"
dependencies: []
lineCount: 3
exports: []
---
*/
// ===== client/auth/index.d.ts =====
export { AuthService } from "./auth-service.js";
export type { AuthUser } from "./auth-service.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/admin-monthly-review/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/admin-monthly-review/css.d.ts =====
export declare const styles =
  "\n<style>\n  :host {\n    display: block;\n  }\n\n  .header {\n    margin-bottom: 20px;\n  }\n\n  .review-heading {\n    font-size: 18px;\n    font-weight: 600;\n    color: var(--color-text);\n    margin-bottom: 20px;\n    text-align: center;\n  }\n\n  .loading {\n    text-align: center;\n    padding: 40px;\n    color: var(--color-text-secondary);\n  }\n\n  .employee-grid {\n    display: grid;\n    grid-template-columns: repeat(auto-fill, minmax(min(40ch, 100%), 1fr));\n    gap: var(--space-md);\n  }\n\n  .employee-card {\n    border: 1px solid var(--color-border);\n    border-radius: 8px;\n    padding: 20px;\n    background: var(--color-background);\n    box-shadow: 0 2px 4px var(--color-shadow);\n    overflow: hidden;\n  }\n\n  .employee-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-start;\n    margin-bottom: 16px;\n  }\n\n  .employee-name {\n    font-size: 18px;\n    font-weight: 600;\n    color: var(--color-text);\n    margin: 0;\n    white-space: nowrap;\n    overflow: hidden;\n    text-overflow: ellipsis;\n  }\n\n  .acknowledge-btn {\n    padding: 10px 16px;\n    background: var(--color-primary);\n    color: white;\n    border: none;\n    border-radius: 6px;\n    font-size: 14px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background-color 0.3s ease;\n    white-space: normal;\n  }\n\n  .acknowledge-btn:hover {\n    background: var(--color-primary-hover);\n  }\n\n  .acknowledge-btn:disabled {\n    background: var(--color-disabled);\n    cursor: not-allowed;\n  }\n\n  .acknowledge-btn.confirming {\n    background: var(--color-warning);\n    color: var(--color-on-warning, #000);\n    outline: 2px solid var(--color-warning);\n    outline-offset: 1px;\n  }\n\n  .acknowledged-info {\n    text-align: center;\n  }\n\n  .acknowledged-info p {\n    margin: 0;\n    font-size: var(--font-size-sm);\n    color: var(--color-success-dark);\n  }\n\n  .empty-state {\n    text-align: center;\n    padding: 40px;\n    color: var(--color-text-secondary);\n  }\n\n  .view-calendar-btn {\n    padding: 10px 16px;\n    background: transparent;\n    color: var(--color-secondary, #6c757d);\n    border: 1px solid var(--color-secondary, #6c757d);\n    border-radius: 6px;\n    font-size: 14px;\n    font-weight: 500;\n    cursor: pointer;\n    transition: background-color 0.3s ease;\n    white-space: normal;\n  }\n\n  .view-calendar-btn:hover {\n    background: var(--color-secondary, #6c757d);\n    color: white;\n  }\n\n  .toolbar {\n    margin-top: var(--space-md, 16px);\n  }\n\n  .employee-card.has-activity {\n    border-left: 3px solid var(--color-primary);\n  }\n\n  .employee-card.no-activity {\n    opacity: 0.7;\n  }\n\n  .activity-indicator {\n    display: flex;\n    align-items: center;\n    gap: 6px;\n    font-size: 12px;\n  }\n\n  .activity-dot {\n    width: 10px;\n    height: 10px;\n    border-radius: 50%;\n  }\n\n  .activity-dot.active {\n    background: var(--color-primary);\n  }\n\n  .activity-dot.inactive {\n    background: var(--color-text-secondary);\n    opacity: 0.4;\n  }\n\n  /* Lock status pill badges \u2014 cross-platform safe, no emoji. */\n  .lock-indicator {\n    display: inline-flex;\n    align-items: center;\n    gap: 4px;\n    padding: 2px 8px;\n    border-radius: 999px;\n    font-size: 11px;\n    font-weight: 600;\n    user-select: none;\n    flex-shrink: 0;\n    white-space: nowrap;\n    transition: transform 0.2s ease;\n  }\n\n  .lock-indicator.locked {\n    background: rgb(34 197 94 / 12%);\n    color: var(--color-success-dark, #166534);\n  }\n\n  .lock-indicator.unlocked {\n    background: rgb(245 158 11 / 15%);\n    color: var(--color-warning-dark, #92400e);\n    cursor: pointer;\n  }\n\n  .lock-indicator.unlocked:hover {\n    transform: scale(1.05);\n  }\n\n  .lock-indicator.notified {\n    background: rgb(59 130 246 / 12%);\n    color: var(--color-info-dark, #1e40af);\n    cursor: default;\n  }\n\n  .lock-indicator.notified-read {\n    background: rgb(107 114 128 / 12%);\n    color: var(--color-text-secondary);\n    cursor: pointer;\n  }\n\n  .lock-indicator.notified-read:hover {\n    transform: scale(1.05);\n  }\n\n  .lock-indicator.warning {\n    background: rgb(245 158 11 / 15%);\n    color: var(--color-warning-dark, #92400e);\n  }\n\n  .lock-indicator.resolved {\n    background: rgb(34 197 94 / 12%);\n    color: var(--color-success-dark, #166534);\n  }\n\n  .ack-note {\n    margin-top: var(--space-sm, 8px);\n    padding: var(--space-sm, 8px) var(--space-md, 12px);\n    background: rgb(245 158 11 / 8%);\n    border-left: 3px solid var(--color-warning-dark, #92400e);\n    border-radius: 4px;\n    font-size: var(--font-size-sm, 13px);\n    color: var(--color-text);\n    line-height: 1.4;\n    white-space: pre-wrap;\n    word-break: break-word;\n  }\n\n  .progress-bar {\n    font-size: var(--font-size-sm, 14px);\n    color: var(--color-text-secondary);\n    margin-bottom: var(--space-md, 16px);\n    text-align: center;\n  }\n\n  .inline-calendar-container {\n    margin-top: var(--space-sm, 8px);\n    overflow: hidden;\n    border-top: 1px solid var(--color-border);\n    padding-top: var(--space-sm, 8px);\n    --slide-offset: 16px;\n    --duration-normal: 200ms;\n    /* Allow native vertical scroll; horizontal swipe is handled by JS */\n    touch-action: pan-y;\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .view-calendar-btn,\n    .acknowledge-btn {\n      transition: none;\n    }\n\n    .lock-indicator {\n      transition: none;\n    }\n  }\n\n</style>\n";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/admin-monthly-review/index.d.ts"
dependencies: ["../../../shared/api-models.js","../../../shared/businessRules.js","../base-component.js"]
lineCount: 130
exports: ["AdminMonthlyReview"]
---
*/
// ===== client/components/admin-monthly-review/index.d.ts =====
import { BaseComponent } from "../base-component.js";
import type { AdminMonthlyReviewItem } from "../../../shared/api-models.js";
import { type PTOType } from "../../../shared/businessRules.js";
import "../month-summary/index.js";
import "../pto-calendar/index.js";
export declare class AdminMonthlyReview extends BaseComponent {
  private _employeeData;
  private _selectedMonth;
  private _isLoading;
  private _acknowledgmentData;
  private _ptoEntries;
  /** Track buttons awaiting confirmation. Maps button element to reset timer. */
  private _pendingConfirmations;
  /** Track which employee IDs have their inline calendar expanded */
  private _expandedCalendars;
  /** Per-card navigated month (employee ID → YYYY-MM). Reset on collapse. */
  private _calendarMonths;
  /** Per-card swipe navigation handles for memory-safe cleanup */
  private _swipeHandles;
  /** Track which calendar containers already have swipe listeners attached */
  private _swipeListenerCards;
  /** Employee details (hire date, carryover) for computing accurate PTO allowances */
  private _employeeDetails;
  /** Cache of PTO entries fetched for non-review months, keyed by YYYY-MM */
  private _monthPtoCache;
  /** Cache of acknowledgement data for non-review months, keyed by YYYY-MM → employeeId */
  private _monthAckCache;
  static get observedAttributes(): string[];
  connectedCallback(): void;
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employeeData(value: AdminMonthlyReviewItem[]);
  get employeeData(): AdminMonthlyReviewItem[];
  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set acknowledgmentData(value: any[]);
  get acknowledgmentData(): any[];
  set selectedMonth(value: string);
  get selectedMonth(): string;
  private requestEmployeeData;
  setEmployeeData(data: AdminMonthlyReviewItem[]): void;
  /** Inject employee details (hire date, carryover) for accurate PTO allowance computation. */
  setEmployeeDetails(
    data: Array<{
      id: number;
      hireDate: string;
      carryoverHours: number;
    }>,
  ): void;
  setPtoEntries(
    data: Array<{
      employee_id: number;
      type: PTOType;
      hours: number;
      date: string;
      approved_by?: number | null;
      notes?: string | null;
    }>,
  ): void;
  /** Inject PTO entries for a specific month (used for non-review month fetches). */
  setMonthPtoEntries(
    month: string,
    data: Array<{
      employee_id: number;
      type: PTOType;
      hours: number;
      date: string;
      approved_by?: number | null;
      notes?: string | null;
    }>,
  ): void;
  /** Inject acknowledgement data for a specific non-review month.
   *  Used so the warning indicator and ack-note update when the inline
   *  calendar navigates away from the review month. */
  setMonthAckData(
    month: string,
    data: Array<{
      employeeId: number;
      status: string | null;
      note: string | null;
    }>,
  ): void;
  private isAcknowledged;
  private getAcknowledgmentDate;
  private getAcknowledgmentAdmin;
  setAcknowledgmentData(data: any[]): void;
  private computeEmployeeBalanceData;
  /** Map PTO category name to the scheduled hours from AdminMonthlyReviewItem. */
  private getScheduledHours;
  /** After render, set complex `balances` property on each <month-summary>
   *  and inject PTO entries into expanded inline calendars. */
  protected update(): void;
  private dispatchAcknowledgeEvent;
  private resetConfirmation;
  private clearConfirmation;
  /**
   * Animate a card scaling down and fading out (dismiss effect).
   * Called by the parent page after the inline confirmation completes.
   * Returns a promise that resolves when the animation completes
   * (or immediately under reduced-motion).
   */
  dismissCard(employeeId: number): Promise<void>;
  /**
   * Reverse a dismiss animation — restore the card to its original state.
   * Used when the API call fails after an optimistic dismiss so the admin
   * can retry without a full page reload.
   */
  undismissCard(employeeId: number): Promise<void>;
  /**
   * Send a lock-reminder notification to the employee.
   * Dispatches an event for the parent page to handle the API call.
   */
  private handleSendLockReminder;
  /**
   * Optimistically update the lock indicator to "notified" state after a
   * successful notification send. Updates both the DOM element in-place and
   * the backing data so a re-render preserves the state.
   */
  updateLockIndicator(employeeId: number, state: "notified"): void;
  protected handleDelegatedClick(e: Event): void;
  /** Toggle the inline calendar for a given employee card.
   *  Always resets to the review month when re-opening. */
  private toggleCalendar;
  /**
   * Register swipe gesture detection on an `.inline-calendar-container`.
   * Delegates to the shared setupSwipeNavigation() helper which handles
   * touch detection, animation guards, and animateCarousel.
   */
  private setupSwipeForCard;
  /**
   * Carousel-style month navigation for arrow button clicks.
   * Delegates to animateCarousel directly (swipe uses setupSwipeNavigation).
   */
  private navigateMonthWithAnimation;
  /** Navigate the inline calendar for an employee to a different month.
   *  Dispatches an event so the parent can fetch data if needed. */
  private navigateCalendarMonth;
  protected render(): string;
  private renderEmployeeCard;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/admin-monthly-review/test.d.ts"
dependencies: []
lineCount: 3
exports: []
---
*/
// ===== client/components/admin-monthly-review/test.d.ts =====
declare function playground(): void;
export { playground };
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/balance-table/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/balance-table/css.d.ts =====
export declare const styles =
  "\n:host {\n    display: block;\n}\n\n.balance-grid {\n    display: grid;\n    grid-template-columns: auto repeat(3, 1fr);\n    gap: 0;\n    font-size: var(--font-size-sm);\n    border: var(--border-width) var(--border-style-solid) var(--color-border);\n    border-radius: var(--border-radius-md);\n    overflow: hidden;\n}\n\n.cell {\n    padding: var(--space-xs) var(--space-sm);\n    text-align: right;\n    border-bottom: var(--border-width) var(--border-style-solid) var(--color-border-light);\n}\n\n.cell:not(:last-child) {\n    border-right: var(--border-width) var(--border-style-solid) var(--color-border-light);\n}\n\n/* Header row */\n\n.cell.header {\n    font-size: var(--font-size-xs);\n    font-weight: var(--font-weight-semibold);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    color: var(--color-text-secondary);\n    background: var(--color-surface);\n    text-align: center;\n}\n\n/* Row label column */\n\n.cell.row-label {\n    text-align: left;\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text-secondary);\n    font-size: var(--font-size-xs);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    background: var(--color-surface);\n}\n\n/* Last row has no bottom border */\n\n.balance-grid .cell:nth-last-child(-n+4) {\n    border-bottom: none;\n}\n\n/* Negative balance styling */\n\n.cell.negative {\n    color: var(--color-warning);\n    font-weight: var(--font-weight-semibold);\n}\n\n/* Column type colors for header text */\n\n.cell.col-pto {\n    color: var(--color-pto-vacation);\n}\n\n.cell.col-sick {\n    color: var(--color-pto-sick);\n}\n\n.cell.col-other {\n    color: var(--color-text-secondary);\n}\n\n/* Avail row emphasis */\n\n.cell.row-avail {\n    font-weight: var(--font-weight-semibold);\n}\n";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/balance-table/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 40
exports: ["BalanceColumn","BalanceTableData","BalanceTable"]
---
*/
// ===== client/components/balance-table/index.d.ts =====
import { BaseComponent } from "../base-component.js";
/**
 * Data for a single PTO type column in the balance table.
 */
export interface BalanceColumn {
  issued: number;
  used: number;
}
/**
 * Input data for the balance table: issued and used hours per PTO type.
 * Bereavement and Jury Duty are consolidated into "Other".
 */
export interface BalanceTableData {
  pto: BalanceColumn;
  sick: BalanceColumn;
  bereavement: BalanceColumn;
  juryDuty: BalanceColumn;
}
/**
 * <balance-table> — Compact grid showing Issued / Used / Available per PTO type.
 *
 * Consolidates Bereavement + Jury Duty into "Other" for mobile-friendly layout.
 *
 * Layout:
 *   |        | PTO | Sick | Other |
 *   | Issued | x   | x    | x     |
 *   | Used   | y   | y    | y     |
 *   | Avail  | z   | z    | z     |
 *
 * Properties (complex):
 *   data — BalanceTableData
 */
export declare class BalanceTable extends BaseComponent {
  private _data;
  set data(value: BalanceTableData);
  get data(): BalanceTableData | null;
  private renderCell;
  protected render(): string;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/base-component.d.ts"
dependencies: []
lineCount: 21
exports: []
---
*/
// ===== client/components/base-component.d.ts =====
export declare abstract class BaseComponent extends HTMLElement {
  shadowRoot: ShadowRoot;
  private eventListeners;
  private isEventDelegationSetup;
  private _isConnected;
  constructor();
  connectedCallback(): void;
  disconnectedCallback(): void;
  protected update(): void;
  protected setupEventDelegation(): void;
  protected handleDelegatedClick(e: Event): void;
  protected handleDelegatedSubmit(e: Event): void;
  protected handleDelegatedKeydown(e: KeyboardEvent): void;
  protected addListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
  ): void;
  protected removeAllListeners(): void;
  protected cleanupEventListeners(): void;
  protected abstract render(): string | undefined;
  protected renderTemplate(template: string): void;
  protected requestUpdate(): void;
}
//# sourceMappingURL=base-component.d.ts.map

/*
---
file: "client/components/confirmation-dialog/index.d.ts"
dependencies: []
lineCount: 19
exports: ["ConfirmationDialog"]
---
*/
// ===== client/components/confirmation-dialog/index.d.ts =====
export declare class ConfirmationDialog extends HTMLElement {
  private shadow;
  private _message;
  private _confirmText;
  private _cancelText;
  constructor();
  static get observedAttributes(): string[];
  connectedCallback(): void;
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void;
  set message(value: string);
  get message(): string;
  set confirmText(value: string);
  get confirmText(): string;
  set cancelText(value: string);
  get cancelText(): string;
  private render;
  private setupEventListeners;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/confirmation-dialog/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/confirmation-dialog/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/dashboard-navigation-menu/css.d.ts"
dependencies: []
lineCount: 5
exports: ["DASHBOARD_NAVIGATION_MENU_CSS"]
---
*/
// ===== client/components/dashboard-navigation-menu/css.d.ts =====
/**
 * CSS styles for the dashboard navigation menu component.
 */
export declare const DASHBOARD_NAVIGATION_MENU_CSS =
  "\n  \n/* Width utilities */\n.w-8 {\n  width: 32px;\n}\n\n.w-10 {\n  width: 40px;\n}\n\n.w-12 {\n  width: 48px;\n}\n\n.w-14 {\n  width: 56px;\n}\n\n.w-16 {\n  width: 64px;\n}\n\n/* Height utilities */\n.h-8 {\n  height: 32px;\n}\n\n.h-10 {\n  height: 40px;\n}\n\n.h-12 {\n  height: 48px;\n}\n\n.h-14 {\n  height: 56px;\n}\n\n.h-16 {\n  height: 64px;\n}\n\n\n  :host {\n    display: block;\n  }\n\n  .text-nowrap {\n    white-space: nowrap;\n  }\n\n  .dashboard-navigation-menu {\n    position: relative;\n  }\n\n  .menu-toggle {\n    /* Size set by atomic CSS classes w-12 h-12 */\n  }\n\n  .menu-items.closed {\n    display: none;\n  }\n\n  .menu-items.open {\n    position: absolute;\n    top: 100%;\n    right: 0;\n    background: var(--color-surface);\n    border: var(--border-width) var(--border-style-solid) var(--color-border);\n    border-radius: var(--border-radius-lg) 0 var(--border-radius-lg) var(--border-radius-lg);\n    box-shadow: var(--shadow-md);\n    z-index: 1000;\n    padding: var(--space-sm);\n    min-width: 200px;\n  }\n\n  .menu-item {\n    display: block;\n    width: 100%;\n    padding: var(--space-md) var(--space-lg);\n    background: none;\n    border: none;\n    border-radius: var(--border-radius-md);\n    color: var(--color-text);\n    text-align: left;\n    cursor: pointer;\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-normal);\n    transition: background-color var(--duration-fast) var(--easing-standard);\n  }\n\n  .menu-item:hover {\n    background: var(--color-surface-hover);\n  }\n\n  .menu-item.active {\n    background: var(--color-primary-light);\n    color: var(--color-primary);\n    font-weight: var(--font-weight-semibold);\n  }\n\n  .menu-item.logout {\n    color: var(--color-error);\n  }\n\n  .menu-item.logout:hover {\n    background: var(--color-error-light);\n  }\n\n  /* Accessibility: disable transitions for users who prefer reduced motion */\n\n  @media (prefers-reduced-motion: reduce) {\n\n    .menu-item {\n      transition: none;\n    }\n  }\n";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/dashboard-navigation-menu/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 47
exports: ["DashboardNavigationMenu"]
---
*/
// ===== client/components/dashboard-navigation-menu/index.d.ts =====
import { BaseComponent } from "../base-component.js";
type Page =
  | "current-year-summary"
  | "prior-year-summary"
  | "submit-time-off"
  | "admin/employees"
  | "admin/pto-requests"
  | "admin/monthly-review"
  | "admin/settings";
export declare class DashboardNavigationMenu extends BaseComponent {
  private isMenuOpen;
  private isAnimating;
  private currentAnimation;
  private boundHandleDocumentClick;
  private boundHandleDocumentKeydown;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  get userRole(): string;
  set userRole(value: string);
  get currentPage(): Page;
  set currentPage(value: Page);
  set currentPageValue(value: Page);
  protected render(): string;
  protected handleDelegatedClick(e: Event): void;
  protected handleDelegatedKeydown(e: KeyboardEvent): void;
  protected toggleMenu(): void;
  /** Cancel pending animation and clean up inline styles */
  private finalizeAnimation;
  /**
   * Animate menu open with slide-down motion.
   * Delegates to the shared animation library's animateSlide helper.
   */
  private openMenuAnimated;
  /**
   * Animate menu close with slide-up motion.
   * Delegates to the shared animation library's animateSlide helper.
   */
  private closeMenuAnimated;
  /** Add document-level listeners for auto-close on outside click or Escape */
  private addAutoCloseListeners;
  /** Remove document-level auto-close listeners */
  private removeAutoCloseListeners;
  /** Close menu when clicking outside the component */
  private handleDocumentClick;
  /** Close menu on Escape key press */
  private handleDocumentKeydown;
  private selectPage;
  private handleDownloadReport;
  private handleLogout;
}
export {};
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/dashboard-navigation-menu/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/dashboard-navigation-menu/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/data-table/index.d.ts"
dependencies: []
lineCount: 41
exports: ["DataTable"]
---
*/
// ===== client/components/data-table/index.d.ts =====
interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}
interface TableData {
  [key: string]: any;
}
export declare class DataTable extends HTMLElement {
  private shadow;
  private _data;
  private _columns;
  private _sortKey;
  private _sortDirection;
  private _currentPage;
  private _pageSize;
  private _totalItems;
  constructor();
  static get observedAttributes(): string[];
  connectedCallback(): void;
  attributeChangedCallback(
    name: string,
    oldValue: string,
    newValue: string,
  ): void;
  set data(value: TableData[]);
  get data(): TableData[];
  set columns(value: TableColumn[]);
  get columns(): TableColumn[];
  set pageSize(value: number);
  get pageSize(): number;
  private get sortedData();
  private get paginatedData();
  private get totalPages();
  private render;
  private renderColumnHeader;
  private renderTableRow;
  private formatCellValue;
  private renderPagination;
  private setupEventListeners;
  private handleSort;
}
export {};
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/data-table/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/data-table/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/debug-console/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 20
exports: ["LogLevel","DebugConsole"]
---
*/
// ===== client/components/debug-console/index.d.ts =====
import { BaseComponent } from "../base-component.js";
export type LogLevel =
  | "log"
  | "info"
  | "warn"
  | "error"
  | "success"
  | "warning";
/**
 * Pure display component for debug logging.
 * No side effects — does not intercept console.* or install global handlers.
 * The controller (DebugConsoleController) feeds messages via the `log()` method.
 */
export declare class DebugConsole extends BaseComponent {
  private _entries;
  private maxMessages;
  /** Append a log entry and re-render. */
  log(level: LogLevel, message: string): void;
  /** Clear all log entries. */
  clear(): void;
  protected handleDelegatedClick(e: Event): void;
  protected render(): string;
  private levelColor;
  private escapeHtml;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/employee-form/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/employee-form/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    background: var(--color-surface);\n    border-radius: var(--border-radius-lg);\n    box-shadow: var(--shadow-md);\n    max-width: 500px;\n    margin: 0 auto;\n  }\n\n  .form-container {\n    padding: var(--space-lg);\n  }\n\n  .form-header {\n    margin-bottom: var(--space-lg);\n    text-align: center;\n  }\n\n  .form-header h2 {\n    margin: 0;\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text);\n  }\n\n  .form-group {\n    margin-bottom: var(--space-md);\n  }\n\n  .form-label {\n    display: block;\n    margin-bottom: var(--space-xs);\n    font-weight: var(--font-weight-medium);\n    color: var(--color-text);\n    font-size: var(--font-size-sm);\n  }\n\n  .form-input {\n    width: 100%;\n    padding: var(--space-sm) var(--space-md);\n    border: var(--border-width) solid var(--color-border);\n    border-radius: var(--border-radius);\n    font-size: var(--font-size-sm);\n    transition: border-color 0.3s ease;\n    box-sizing: border-box;\n    background: var(--color-surface);\n    color: var(--color-text);\n  }\n\n  .form-input:focus {\n    outline: none;\n    border-color: var(--color-primary);\n    box-shadow: 0 0 0 2px var(--color-primary-light);\n  }\n\n  .form-input.error {\n    border-color: var(--color-error);\n  }\n\n  .form-select {\n    width: 100%;\n    padding: var(--space-sm) var(--space-md);\n    border: var(--border-width) solid var(--color-border);\n    border-radius: var(--border-radius);\n    font-size: var(--font-size-sm);\n    background: var(--color-surface);\n    color: var(--color-text);\n    cursor: pointer;\n    box-sizing: border-box;\n  }\n\n  .form-select:focus {\n    outline: none;\n    border-color: var(--color-primary);\n    box-shadow: 0 0 0 2px var(--color-primary-light);\n  }\n\n  .error-message {\n    color: var(--color-error);\n    font-size: var(--font-size-xs);\n    margin-top: var(--space-xs);\n    display: block;\n  }\n\n  .form-row {\n    display: grid;\n    grid-template-columns: 1fr 1fr;\n    gap: var(--space-md);\n  }\n\n  .form-actions {\n    display: flex;\n    gap: var(--space-sm);\n    justify-content: flex-end;\n    margin-top: var(--space-xl);\n    padding-top: var(--space-md);\n    border-top: var(--border-width) solid var(--color-border);\n  }\n\n  .btn {\n    padding: var(--space-sm) var(--space-lg);\n    border: none;\n    border-radius: var(--border-radius);\n    cursor: pointer;\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-medium);\n    transition: all 0.3s ease;\n  }\n\n  .btn-primary {\n    background: var(--color-primary);\n    color: white;\n  }\n\n  .btn-primary:hover {\n    background: var(--color-primary-hover);\n  }\n\n  .btn-secondary {\n    background: var(--color-secondary);\n    color: white;\n  }\n\n  .btn-secondary:hover {\n    background: var(--color-secondary-hover);\n  }\n\n  .required {\n    color: var(--color-error);\n  }\n\n  .sr-only {\n    position: absolute;\n    width: 1px;\n    height: 1px;\n    padding: 0;\n    margin: -1px;\n    overflow: hidden;\n    clip: rect(0, 0, 0, 0);\n    white-space: nowrap;\n    border: 0;\n  }\n\n  .btn:disabled {\n    opacity: 0.6;\n    cursor: not-allowed;\n  }\n\n  .btn:disabled:hover {\n    background: inherit;\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/employee-form/index.d.ts"
dependencies: ["../base-component"]
lineCount: 44
exports: ["EmployeeForm"]
---
*/
// ===== client/components/employee-form/index.d.ts =====
interface Employee {
  id?: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate?: string;
  role: string;
  hash?: string;
}
import { BaseComponent } from "../base-component";
export declare class EmployeeForm extends BaseComponent {
  private _employee;
  private _isEdit;
  private _isSubmitting;
  private _errors;
  private _stagedFormValues;
  connectedCallback(): void;
  private focusFirstField;
  private focusFirstError;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employee(value: Employee | null);
  get employee(): Employee | null;
  set isEdit(value: boolean);
  get isEdit(): boolean;
  protected render(): string;
  private renderFormHeader;
  private renderFormFields;
  private renderFormActions;
  protected handleDelegatedClick(e: Event): void;
  private validateAndCollectData;
  private collectFormData;
  protected handleDelegatedKeydown(e: KeyboardEvent): void;
  private validateForm;
  private hasError;
  private validateField;
  private isValidEmail;
  private validatePtoRate;
  private validateCarryoverHours;
}
export {};
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/employee-form/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/employee-form/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/employee-list/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/employee-list/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    height: 100%;\n  }\n\n  pto-balance-summary {\n    margin: 0 0 var(--space-md) 0;\n  }\n\n  pto-balance-summary .balance-row {\n    justify-content: center;\n  }\n\n  .employee-list {\n    height: 100%;\n    display: flex;\n    flex-direction: column;\n  }\n\n  .toolbar {\n    display: flex;\n    gap: var(--space-md);\n  }\n\n  .search-container {\n    display: grid;\n    gap: var(--space-sm);\n    grid-template-columns: 3fr 1fr;\n    align-items: center;\n  }\n\n  .search-input {\n    padding: var(--space-sm) var(--space-md);\n    border: var(--border-width) solid var(--color-border);\n    border-radius: var(--border-radius-md);\n    font-size: var(--font-size-md);\n    background: var(--color-background);\n    color: var(--color-text);\n  }\n\n  .search-input:focus {\n    outline: none;\n    border-color: var(--color-primary);\n    box-shadow: 0 0 0 2px var(--color-primary-light);\n  }\n\n  .search-container span {\n    font-size: var(--font-size-sm);\n    color: var(--color-text-secondary);\n  }\n\n  .employee-grid {\n    flex: 1;\n    overflow-y: auto;\n    padding: var(--space-md);\n    display: grid;\n    grid-template-columns: 1fr;\n    gap: var(--space-md);\n  }\n\n  @media (min-width: 768px) {\n    .employee-grid {\n      grid-template-columns: repeat(auto-fill, minmax(18em, 1fr));\n    }\n  }\n\n  .employee-card {\n    background: var(--color-background);\n    border-radius: var(--border-radius-lg);\n    padding: var(--space-md);\n    box-shadow: var(--shadow-md);\n    border: var(--border-width) solid var(--color-border);\n    transition: box-shadow 0.3s ease;\n  }\n\n  .employee-card:hover {\n    box-shadow: var(--shadow-lg);\n  }\n\n  .employee-identifier {\n    color: var(--color-text-secondary);\n    font-size: var(--font-size-sm);\n    margin: 0;\n  }\n\n  .card-header {\n    display: flex;\n    justify-content: flex-end;\n    margin-bottom: var(--space-sm);\n  }\n\n  .employee-role {\n    padding: var(--space-xs) var(--space-sm);\n    border-radius: var(--border-radius-xl);\n    font-size: var(--font-size-xs);\n    font-weight: var(--font-weight-medium);\n  }\n\n  .employee-role.role-admin {\n    background: var(--color-primary);\n    color: var(--color-on-primary);\n  }\n\n  .employee-role.role-employee {\n    background: var(--color-surface);\n    color: var(--color-text-secondary);\n    border: var(--border-width) solid var(--color-border);\n  }\n\n  .employee-details {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));\n    gap: var(--space-sm);\n    margin-bottom: var(--space-sm);\n  }\n\n  .detail-item {\n    display: flex;\n    flex-direction: column;\n  }\n\n  .detail-label {\n    font-size: var(--font-size-xs);\n    color: var(--color-text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.025em;\n    margin-bottom: var(--space-xs);\n  }\n\n  .detail-value {\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-medium);\n    color: var(--color-text);\n  }\n\n  .employee-actions {\n    display: flex;\n    gap: var(--space-xs);\n    justify-content: flex-end;\n  }\n\n  .action-btn {\n    padding: var(--space-sm) var(--space-md);\n    min-height: 44px;\n    min-width: 44px;\n    border: var(--border-width) solid var(--color-border);\n    background: var(--color-surface);\n    color: var(--color-text-secondary);\n    border-radius: var(--border-radius);\n    cursor: pointer;\n    font-size: var(--font-size-sm);\n    transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;\n  }\n\n  .action-btn:hover {\n    background: var(--color-surface-hover);\n    border-color: var(--color-border-hover);\n  }\n\n  .action-btn.delete {\n    border-color: var(--color-error);\n    color: var(--color-error);\n  }\n\n  .action-btn.delete:hover {\n    background: var(--color-error);\n    color: var(--color-on-error);\n  }\n\n  .action-btn.delete {\n    position: relative;\n    overflow: hidden;\n    -webkit-user-select: none;\n    user-select: none;\n    touch-action: none;\n  }\n\n  .action-btn.delete::after {\n    content: '';\n    position: absolute;\n    inset: 0;\n    background: var(--color-error);\n    transform: scaleX(0);\n    transform-origin: left;\n    pointer-events: none;\n    z-index: 0;\n  }\n\n  .action-btn.delete.pressing::after {\n    animation: delete-fill 1.5s linear forwards;\n  }\n\n  .action-btn.delete.pressing {\n    color: var(--color-on-error);\n  }\n\n  @keyframes delete-fill {\n    from { transform: scaleX(0); }\n    to   { transform: scaleX(1); }\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .action-btn,\n    .employee-card {\n      transition: none;\n    }\n\n    .action-btn.delete.pressing::after {\n      animation: none;\n      transform: scaleX(1);\n      opacity: 0;\n      animation: delete-fill-reduced 1.5s linear forwards;\n    }\n  }\n\n  @keyframes delete-fill-reduced {\n    from { opacity: 0; }\n    to   { opacity: 1; transform: scaleX(1); }\n  }\n\n  .empty-state {\n    text-align: center;\n    padding: var(--space-2xl);\n    color: var(--color-text-secondary);\n    grid-column: 1 / -1;\n  }\n\n  .empty-state h3 {\n    margin: 0 0 var(--space-sm) 0;\n    font-size: var(--font-size-lg);\n    color: var(--color-text);\n  }\n\n  .inline-editor {\n    background: var(--color-surface);\n    border-radius: var(--border-radius-lg);\n    box-shadow: var(--shadow-md);\n    border: var(--border-width) solid var(--color-border);\n    grid-column: 1 / -1;\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/employee-list/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 61
exports: ["Employee","EmployeeList"]
---
*/
// ===== client/components/employee-list/index.d.ts =====
export interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: "Employee" | "Admin";
  hash: string;
}
import { BaseComponent } from "../base-component.js";
export declare class EmployeeList extends BaseComponent {
  private _employees;
  private _searchTerm;
  private _editingEmployeeId;
  connectedCallback(): void;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  /** Complex value — private field + requestUpdate(), no attribute serialization. */
  set employees(value: Employee[]);
  get employees(): Employee[];
  set editingEmployeeId(value: number | null);
  get editingEmployeeId(): number | null;
  private getFilteredEmployees;
  protected render(): string;
  private renderEmployeeCard;
  private renderInlineEditor;
  private _inputListenerSetup;
  private _deleteTimer;
  private _deleteTarget;
  private static readonly DELETE_HOLD_MS;
  /** Duration for card fade-out before editor appears (matches --duration-normal). */
  private static readonly TRANSITION_MS;
  /**
   * Animate the card fading out, then re-render with the editor fading in.
   * Preserves `.employee-grid` scroll position across the innerHTML rebuild.
   * Follows CSS Animation Assistant rules: inline styles for sequenced phases,
   * transitionend filtered by propertyName, setTimeout fallback, reduced-motion
   * check, and deduped completion logic.
   */
  private transitionCardToEditor;
  /**
   * Re-render and adjust window scroll so the new `.inline-editor` appears
   * at the same screen position the card occupied.
   *
   * The `.employee-grid` is NOT a scroll container (it grows freely with
   * content — scrollHeight === clientHeight). The actual scroll container
   * is the document/window. We use `window.scrollBy()` with the difference
   * between the editor's screen position and the card's original screen
   * position to eliminate any visible jump.
   *
   * @param cardScreenTop - card's `getBoundingClientRect().top` before
   *   re-render, or null to skip scroll adjustment.
   */
  private renderEditorInPlace;
  protected setupEventDelegation(): void;
  private startDeletePress;
  private cancelDeletePress;
  protected handleDelegatedClick(e: Event): void;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/employee-list/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/employee-list/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/index.d.ts"
dependencies: []
lineCount: 20
exports: []
---
*/
// ===== client/components/index.d.ts =====
export { BaseComponent } from "./base-component.js";
export { ConfirmationDialog } from "./confirmation-dialog/index.js";
export { AdminMonthlyReview } from "./admin-monthly-review/index.js";
export { EmployeeList } from "./employee-list/index.js";
export { EmployeeForm } from "./employee-form/index.js";
export { PtoEntryForm } from "./pto-entry-form/index.js";
export { PtoRequestQueue } from "./pto-request-queue/index.js";
export { DataTable } from "./data-table/index.js";
export { PtoCalendar } from "./pto-calendar/index.js";
export { PtoSummaryCard } from "./pto-summary-card/index.js";
export { PtoPtoCard } from "./pto-pto-card/index.js";
export { PtoEmployeeInfoCard } from "./pto-employee-info-card/index.js";
export { PriorYearReview } from "./prior-year-review/index.js";
export { PtoBalanceSummary } from "./pto-balance-summary/index.js";
export { DebugConsole } from "./debug-console/index.js";
export { PtoNotification } from "./pto-notification/index.js";
export { DashboardNavigationMenu } from "./dashboard-navigation-menu/index.js";
export { MonthSummary } from "./month-summary/index.js";
export { BalanceTable } from "./balance-table/index.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/month-summary/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/month-summary/css.d.ts =====
export declare const styles =
  '\n:host {\n    display: flex;\n    justify-content: space-around;\n    gap: var(--space-sm);\n}\n\n.summary-item {\n    text-align: center;\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n}\n\n.summary-label {\n    font-size: var(--font-size-xs);\n    margin-bottom: var(--space-xs);\n    border-bottom: var(--border-width) solid var(--color-border);\n    text-transform: uppercase;\n}\n\n.summary-value {\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-normal);\n}\n\n/* Color consistency: summary values match calendar day colors */\n\n.summary-pto { color: var(--color-pto-vacation); }\n\n.summary-sick { color: var(--color-pto-sick); }\n\n.summary-bereavement { color: var(--color-pto-bereavement); }\n\n.summary-jury-duty { color: var(--color-pto-jury-duty); }\n\n/* Visual hierarchy: larger font for non-zero values */\n\n.summary-pto,\n.summary-sick,\n.summary-bereavement,\n.summary-jury-duty {\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-semibold);\n}\n\n.summary-pending {\n    font-size: var(--font-size-xs);\n    opacity: 0.8;\n    margin-left: var(--space-xs);\n}\n\n\n\n/* Interactive mode: clickable labels for PTO type selection */\n\n.summary-item.interactive {\n    cursor: pointer;\n    user-select: none;\n    transition: opacity var(--duration-fast, 150ms) var(--easing-standard);\n}\n\n.summary-item.interactive:hover {\n    opacity: 0.7;\n}\n\n/* Active PTO type indicator: green checkmark + bolder label */\n\n.summary-item.active .summary-label {\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-bold, 700);\n    border-bottom-color: currentColor;\n}\n\n.summary-item.active .summary-label::after {\n    content: "\u2713";\n    color: var(--color-success);\n    margin-left: var(--space-xs);\n    font-weight: var(--font-weight-bold, 700);\n}\n\n/* Balance mode: override type color with remaining-status color */\n\n.summary-value.balance-positive {\n    color: var(--color-success);\n}\n\n.summary-value.balance-negative {\n    color: var(--color-warning);\n}\n\n@media (prefers-reduced-motion: reduce) {\n\n    .summary-item.interactive {\n        transition: none;\n    }\n}\n';
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/month-summary/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 38
exports: ["MonthSummary"]
---
*/
// ===== client/components/month-summary/index.d.ts =====
import { BaseComponent } from "../base-component.js";
/**
 * <month-summary> — displays PTO hour totals grouped by type (PTO, Sick,
 * Bereavement, Jury Duty) with optional pending-delta indicators.
 *
 * Attributes (primitives):
 *   pto-hours, sick-hours, bereavement-hours, jury-duty-hours
 *
 * Properties (complex):
 *   deltas — Record<string, number> keyed by PTO type name
 */
export declare class MonthSummary extends BaseComponent {
  static get observedAttributes(): string[];
  get ptoHours(): number;
  set ptoHours(value: number);
  get sickHours(): number;
  set sickHours(value: number);
  get bereavementHours(): number;
  set bereavementHours(value: number);
  get juryDutyHours(): number;
  set juryDutyHours(value: number);
  get interactive(): boolean;
  set interactive(value: boolean);
  get activeType(): string | null;
  set activeType(value: string | null);
  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  private _deltas;
  get deltas(): Record<string, number>;
  set deltas(value: Record<string, number>);
  private _balances;
  get balances(): Record<string, number>;
  set balances(value: Record<string, number>);
  protected handleDelegatedClick(e: Event): void;
  private getHoursForAttr;
  private renderItem;
  protected render(): string;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/month-summary/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/month-summary/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/prior-year-review/css.d.ts"
dependencies: []
lineCount: 8
exports: ["styles"]
---
*/
// ===== client/components/prior-year-review/css.d.ts =====
/**
 * Styles for <prior-year-review> component.
 * Uses design tokens from tokens.css.
 * Mobile-first: single column by default, multi-column at 768px+.
 * PTO type colors are adopted via the pto-day-colors CSS extension.
 */
export declare const styles =
  "<style>\n  .container {\n    padding: var(--space-md, 16px);\n  }\n\n  .no-data {\n    text-align: center;\n    padding: var(--space-xl, 32px);\n    color: var(--color-text-secondary);\n  }\n\n  .legend {\n    display: flex;\n    flex-wrap: wrap;\n    gap: var(--space-sm, 8px) var(--space-md, 16px);\n    margin-bottom: var(--space-md, 16px);\n  }\n\n  .legend-item {\n    display: flex;\n    align-items: center;\n    gap: var(--space-xs, 4px);\n    font-size: var(--font-size-sm, 0.875rem);\n    color: var(--color-text-secondary);\n  }\n\n  .legend-swatch {\n    display: inline-block;\n    width: var(--space-md, 16px);\n    height: var(--space-md, 16px);\n    border-radius: var(--border-radius-sm, 2px);\n  }\n\n  .months-grid {\n    display: grid;\n    grid-template-columns: 1fr;\n    gap: var(--space-md, 16px);\n    max-width: 1540px;\n    margin: 0 auto;\n  }\n\n  .month-card {\n    border: 1px solid var(--color-border);\n    border-radius: var(--border-radius-lg, 8px);\n    background: var(--color-surface);\n    overflow: hidden;\n  }\n\n  .month-header {\n    font-weight: var(--font-weight-semibold, 600);\n    padding: var(--space-sm, 8px) var(--space-md, 16px);\n    background: var(--color-surface-hover);\n    border-bottom: 1px solid var(--color-border);\n    text-align: center;\n  }\n\n  .month-calendar {\n    padding: var(--space-sm, 8px);\n  }\n\n  .calendar-header {\n    display: grid;\n    grid-template-columns: repeat(7, 1fr);\n    gap: 2px;\n    margin-bottom: var(--space-xs, 4px);\n  }\n\n  .weekday {\n    font-size: var(--font-size-xs, 0.75rem);\n    font-weight: var(--font-weight-semibold, 600);\n    color: var(--color-text-secondary);\n    text-align: center;\n  }\n\n  .calendar-grid {\n    display: grid;\n    grid-template-columns: repeat(7, 1fr);\n    gap: 2px;\n  }\n\n  .day {\n    position: relative;\n    aspect-ratio: 1;\n    border-radius: var(--border-radius-md, 4px);\n    background: var(--color-surface);\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n    justify-content: center;\n    font-size: var(--font-size-xs, 0.75rem);\n    min-height: 24px;\n  }\n\n  .day.empty {\n    opacity: 0;\n    border: none;\n  }\n\n  .day .date {\n    font-weight: var(--font-weight-semibold, 600);\n    color: var(--color-text);\n  }\n\n  .day .hours {\n    position: absolute;\n    bottom: 1px;\n    right: 2px;\n    font-size: 0.5rem;\n    color: var(--color-text-secondary);\n    font-weight: var(--font-weight-semibold, 600);\n  }\n\n  @media (min-width: 768px) {\n    .months-grid {\n      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));\n    }\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/prior-year-review/index.d.ts"
dependencies: ["../../../shared/api-models.js","../base-component.js"]
lineCount: 12
exports: ["PriorYearReview"]
---
*/
// ===== client/components/prior-year-review/index.d.ts =====
import type { PTOYearReviewResponse } from "../../../shared/api-models.js";
import { BaseComponent } from "../base-component.js";
export declare class PriorYearReview extends BaseComponent {
  private _data;
  get data(): PTOYearReviewResponse | null;
  set data(value: PTOYearReviewResponse | null);
  connectedCallback(): void;
  private renderMonth;
  private renderLegend;
  protected render(): string;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/prior-year-review/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/prior-year-review/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-balance-summary/index.d.ts"
dependencies: ["../../../shared/api-models.js","../base-component.js"]
lineCount: 9
exports: ["PtoBalanceSummary"]
---
*/
// ===== client/components/pto-balance-summary/index.d.ts =====
import { BaseComponent } from "../base-component.js";
import type { PtoBalanceData } from "../../../shared/api-models.js";
export declare class PtoBalanceSummary extends BaseComponent {
  private _data;
  setBalanceData(data: PtoBalanceData): void;
  protected render(): string;
  private renderCategory;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-balance-summary/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-balance-summary/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-calendar/css.d.ts"
dependencies: []
lineCount: 3
exports: ["PTO_TYPE_COLORS","styles"]
---
*/
// ===== client/components/pto-calendar/css.d.ts =====
export declare const PTO_TYPE_COLORS: Record<string, string>;
export declare const styles: string;
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/pto-calendar/index.d.ts"
dependencies: ["../../../shared/businessRules.js","../base-component.js"]
lineCount: 78
exports: ["monthNames","CalendarEntry","PTOEntry","PtoCalendar"]
---
*/
// ===== client/components/pto-calendar/index.d.ts =====
import { type PTOType } from "../../../shared/businessRules.js";
import { BaseComponent } from "../base-component.js";
/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export declare const monthNames: readonly [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export interface CalendarEntry {
  date: string;
  hours: number;
  type: PTOType;
  id?: number;
}
export interface PTOEntry {
  id: number;
  employeeId: number;
  date: string;
  type: PTOType;
  hours: number;
  createdAt: string;
  approved_by?: number | null;
  notes?: string | null;
}
export declare class PtoCalendar extends BaseComponent {
  private _ptoEntries;
  private _selectedCells;
  private _selectedPtoType;
  private _focusedDate;
  private _focusedLegendIndex;
  private _lastFocusArea;
  static get observedAttributes(): string[];
  get month(): number;
  set month(value: number);
  get year(): number;
  set year(value: number);
  get selectedMonth(): number | null;
  set selectedMonth(value: number | null);
  get isReadonly(): boolean;
  set isReadonly(value: boolean);
  get hideLegend(): boolean;
  set hideLegend(value: boolean);
  get hideHeader(): boolean;
  set hideHeader(value: boolean);
  get ptoEntries(): PTOEntry[];
  set ptoEntries(value: PTOEntry[]);
  get selectedCells(): Map<string, number>;
  set selectedCells(value: Map<string, number>);
  get selectedPtoType(): PTOType | null;
  set selectedPtoType(value: string | null);
  setMonth(month: number): void;
  setYear(year: number): void;
  setPtoEntries(ptoEntries: PTOEntry[]): void;
  setSelectedMonth(selectedMonth: number | null): void;
  setReadonly(readonly: boolean): void;
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  getSelectedRequests(): CalendarEntry[];
  clearSelection(): void;
  submitRequest(): void;
  protected update(): void;
  protected render(): string;
  protected handleDelegatedClick(e: Event): void;
  protected handleDelegatedKeydown(e: KeyboardEvent): void;
  private renderCalendar;
  private renderDayCell;
  private updateDay;
  private handleLegendKeyDown;
  private handleGridKeyDown;
  private cycleHours;
  private toggleDaySelection;
  private notifySelectionChanged;
  private isNavigable;
  /** Escape text for use in HTML attributes (title, data-*) */
  private escapeAttribute;
  private getFirstNavigableDate;
  private findNextNavigableDate;
  private findNavigableDateAt;
  private focusDate;
  private focusLegendItem;
  private restoreFocusFromViewModel;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-calendar/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-calendar/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-dashboard/index.d.ts"
dependencies: []
lineCount: 4
exports: []
---
*/
// ===== client/components/pto-dashboard/index.d.ts =====
export { PtoPtoCard } from "../pto-pto-card/index.js";
export { PtoSummaryCard } from "../pto-summary-card/index.js";
export { PtoEmployeeInfoCard } from "../pto-employee-info-card/index.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-dashboard/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-dashboard/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-employee-info-card/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 19
exports: ["PtoEmployeeInfoCard"]
---
*/
// ===== client/components/pto-employee-info-card/index.d.ts =====
import { BaseComponent } from "../base-component.js";
type EmployeeInfoData = {
  employeeName?: string;
  hireDate: string;
  nextRolloverDate: string;
  carryoverHours?: number;
  ptoRatePerDay?: number;
  accrualToDate?: number;
  annualAllocation?: number;
};
export declare class PtoEmployeeInfoCard extends BaseComponent {
  private data;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ): void;
  set info(value: EmployeeInfoData);
  protected render(): string;
}
export {};
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-employee-info-card/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-employee-info-card/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-entry-form/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/pto-entry-form/css.d.ts =====
export declare const styles =
  "\n                :host {\n                    display: block;\n                }\n\n                .hidden {\n                    display: none;\n                }\n\n                .calendar-header-nav {\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                    margin-bottom: var(--space-md);\n                }\n\n                .calendar-month-label {\n                    font-weight: var(--font-weight-semibold);\n                    text-transform: uppercase;\n                    color: var(--color-text);\n                }\n\n                .calendar-view {\n                    overflow: hidden;\n                }\n\n                .calendar-container {\n                    /* Animation is driven by the shared animation library (animateCarousel) */\n                }\n\n                .nav-arrow {\n                    background: none;\n                    border: none;\n                    cursor: pointer;\n                    font-size: var(--font-size-xl);\n                    color: var(--color-text);\n                    padding: var(--space-xs);\n                    border-radius: var(--border-radius-sm);\n                    transition: background-color var(--duration-fast) var(--easing-standard);\n                    width: 32px;\n                    height: 32px;\n                    display: flex;\n                    align-items: center;\n                    justify-content: center;\n                }\n\n                .nav-arrow:hover {\n                    background: var(--color-surface-hover);\n                }\n\n                .nav-arrow:disabled {\n                    opacity: 0.5;\n                    cursor: not-allowed;\n                }\n\n                .required {\n                    color: var(--color-error);\n                }\n\n                /* Responsive design */\n                @media screen {\n                  .form-actions {\n                    display: flex;\n                  }\n                }\n\n                @media (max-width: 768px) {\n                    .form-actions {\n                        flex-wrap: wrap;\n                        gap: var(--space-sm);\n                    }\n\n                    .btn {\n                        flex: 1;\n                        min-width: 120px;\n                    }\n                }\n\n                /* \u2500\u2500 Multi-calendar grid (all 12 months visible) \u2500\u2500 */\n\n                :host(.multi-calendar) {\n                    max-width: none;\n                }\n\n                :host(.multi-calendar) .calendar-header-nav {\n                    display: none;\n                }\n\n                :host(.multi-calendar) .balance-summary-section {\n                    position: sticky;\n                    top: 0;                    \n                }\n\n                :host(.multi-calendar) .calendar-container {\n                    display: grid;\n                    grid-template-columns: repeat(3, 1fr);\n                    gap: var(--space-sm);\n                }\n\n                :host(.multi-calendar) .month-card {\n                    border: var(--border-width) var(--border-style-solid) var(--color-border);\n                    border-radius: var(--border-radius-md);\n                    background: var(--color-surface);\n                    overflow: hidden;\n                    display: grid;\n                    grid-template-rows: 1fr auto;\n                }\n\n                @media (min-width: 1200px) {\n                    :host(.multi-calendar) .calendar-container {\n                        grid-template-columns: repeat(4, 1fr);\n                    }\n                }\n\n                @media (min-width: 1600px) {\n                    :host(.multi-calendar) .calendar-container {\n                        grid-template-columns: repeat(6, 1fr);\n                    }\n                }\n\n                :host(.multi-calendar) .month-card.locked {\n                    opacity: 0.5;\n                    pointer-events: none;\n                }\n\n                :host(.multi-calendar) .month-card.highlight {\n                    animation: highlightPulse 1.2s ease-out;\n                }\n\n                @keyframes highlightPulse {\n                    0% { box-shadow: 0 0 0 3px var(--color-primary); }\n                    100% { box-shadow: none; }\n                }\n\n                @media (prefers-reduced-motion: reduce) {\n                    :host(.multi-calendar) .month-card.highlight {\n                        animation: none;\n                    }\n                }\n\n                ::slotted(month-summary) {\n                    margin-bottom: var(--space-lg);\n                }\n";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/pto-entry-form/index.d.ts"
dependencies: ["../base-component.js","../pto-calendar/index.js"]
lineCount: 150
exports: ["PtoEntryForm"]
---
*/
// ===== client/components/pto-entry-form/index.d.ts =====
import { type CalendarEntry } from "../pto-calendar/index.js";
import { BaseComponent } from "../base-component.js";
export declare class PtoEntryForm extends BaseComponent {
  /** MediaQueryList used to detect multi-calendar mode */
  private multiCalendarMql;
  /** Bound handler for matchMedia changes */
  private handleMqlChange;
  /** Currently active PTO type, persisted across calendar rebuilds */
  private _activePtoType;
  /** Swipe navigation handle for the calendar container */
  private _swipeHandle;
  static get observedAttributes(): string[];
  get availablePtoBalance(): number;
  set availablePtoBalance(v: number);
  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  connectedCallback(): void;
  disconnectedCallback(): void;
  /** Start listening for viewport changes to toggle multi-calendar mode. */
  private setupMultiCalendarDetection;
  /** Whether the component is currently in multi-calendar (12-month grid) mode */
  get isMultiCalendar(): boolean;
  /**
   * Toggle between single-calendar and multi-calendar modes.
   * In multi-calendar mode all 12 months are shown in a CSS grid.
   * In single-calendar mode the existing carousel navigation is used.
   */
  private setMultiCalendarMode;
  /**
   * Rebuild the calendar container contents for the current mode.
   * - Single-calendar: one `<pto-calendar>` set to the current month.
   * - Multi-calendar: twelve `<pto-calendar>` instances inside `.month-card` wrappers.
   *
   * IMPERATIVE CONSTRUCTION JUSTIFICATION:
   * The number of child pto-calendar instances varies by responsive mode
   * (1 in single-calendar, 12 in multi-calendar). This dynamic child count
   * cannot be expressed in a static render() template, so imperative
   * createElement/appendChild is used here. This method is only called from
   * lifecycle-adjacent code (setupMultiCalendarDetection, setMultiCalendarMode)
   * and the public reset() method — never from render().
   *
   * render() returns the static shell only (#calendar-container is empty).
   * requestUpdate() does NOT destroy imperative content because the
   * attributeChangedCallback intentionally skips requestUpdate() — the template
   * has no attribute-dependent rendering.
   */
  private rebuildCalendars;
  /**
   * Compute per-PTO-type hour totals from a list of entries and apply them
   * to a month-summary element via its hour attributes.
   */
  private updateSummaryHours;
  /**
   * Update the single-calendar mode month-summary with the committed hours
   * for the calendar's currently displayed month.
   */
  private updateSingleCalendarSummaryHours;
  /**
   * Collect PTO entries from all currently rendered calendars.
   * Used to preserve data when switching between single/multi-calendar modes.
   */
  private collectPtoEntries;
  /**
   * Collect pending (uncommitted) selected cells from all currently rendered
   * calendars. Used to preserve selections when switching view modes.
   */
  private collectSelectedCells;
  /**
   * Handle selection-changed events from any calendar in multi-calendar mode.
   * Updates the corresponding month-summary deltas.
   */
  private handleMultiCalendarSelectionChanged;
  /**
   * Handle selection-changed events from the calendar in single-calendar mode.
   * Updates the month-summary deltas for the single summary in the container.
   */
  private handleSingleCalendarSelectionChanged;
  /**
   * Handle PTO type change from an interactive month-summary.
   * Updates all calendars' selectedPtoType and syncs all month-summaries,
   * then recalculates deltas so the summary values reflect the new type.
   */
  private handlePtoTypeChanged;
  /**
   * Public API: set the active PTO type from external callers
   * (e.g. submit-time-off-page balance summary).
   */
  setActivePtoType(type: string): void;
  protected render(): string;
  private _customEventsSetup;
  protected setupEventDelegation(): void;
  protected handleDelegatedClick(e: Event): void;
  /**
   * Register swipe gesture detection on #calendar-container.
   * Delegates to the shared setupSwipeNavigation() helper which
   * handles touch detection, animation guards, and animateCarousel.
   */
  private setupSwipeListeners;
  /**
   * Navigate the calendar to the next/previous month with carousel animation.
   * Used by arrow button clicks. Swipe gestures go through _swipeHandle.
   */
  private navigateMonth;
  /** Check if user prefers reduced motion */
  private prefersReducedMotion;
  /** Update the calendar to the next/previous month with fiscal-year wrap-around */
  private updateCalendarMonth;
  /** Update the month label text displayed in the custom navigation header. */
  private updateMonthLabel;
  private handleCalendarSubmit;
  private handleUnifiedSubmit;
  private validateCalendarRequests;
  /** Return all pto-calendar instances currently in the container. */
  private getAllCalendars;
  /** Return the single-mode calendar (first pto-calendar in the container). */
  private getCalendar;
  private emitValidationErrors;
  reset(): void;
  focus(): void;
  /** Return the selected requests from all pto-calendar instance(s). */
  getSelectedRequests(): CalendarEntry[];
  /** Return the existing PTO entries loaded into all pto-calendar instance(s). */
  getPtoEntries(): ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }>;
  setPtoData(ptoEntries: any[]): void;
  setPtoStatus(status: any): void;
  /**
   * Navigate the internal calendar to the specified month and year.
   * Called when the user clicks a date in a PTO detail card on the summary page.
   */
  navigateToMonth(month: number, year: number): void;
  /**
   * Persist the selected month to localStorage so it survives
   * submissions and page reloads in single-calendar mode.
   */
  private persistSelectedMonth;
  /**
   * Retrieve the persisted month from localStorage, falling back
   * to the current month if nothing is stored or storage is unavailable.
   */
  private getPersistedMonth;
  /**
   * Clear the persisted month. Call when switching employees or
   * when the stored value is no longer valid.
   */
  clearPersistedMonth(): void;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-entry-form/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-entry-form/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-notification/index.d.ts"
dependencies: ["../base-component.js"]
lineCount: 23
exports: ["NotificationLevel","PtoNotification"]
---
*/
// ===== client/components/pto-notification/index.d.ts =====
import { BaseComponent } from "../base-component.js";
export type NotificationLevel = "success" | "error" | "info" | "warning";
/**
 * `<pto-notification>` — toast notification component.
 *
 * Pure shadow DOM display component extending BaseComponent.
 * The PtoNotificationController feeds messages via the `show()` method.
 */
export declare class PtoNotification extends BaseComponent {
  private _toasts;
  private _nextId;
  /**
   * Show a toast notification.
   * Mirrors the old NotificationManager.show() signature.
   */
  show(
    message: string,
    level?: NotificationLevel,
    title?: string,
    duration?: number,
    onDismiss?: () => void,
  ): void;
  /** Dismiss a toast by id (with fade-out animation). */
  dismiss(id: number): void;
  protected handleDelegatedClick(e: Event): void;
  protected render(): string;
  private escapeHtml;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-pto-card/index.d.ts"
dependencies: ["../../../shared/api-models.js","../base-component.js"]
lineCount: 33
exports: ["PtoPtoCard"]
---
*/
// ===== client/components/pto-pto-card/index.d.ts =====
import { BaseComponent } from "../base-component.js";
import type { PTOEntry } from "../../../shared/api-models.js";
/**
 * <pto-pto-card> — Unified Scheduled Time Off detail card.
 *
 * Shows a reverse-chronological table of all PTO entries (PTO, Sick,
 * Bereavement, Jury Duty) with color-coded hours and approval indicators.
 *
 * Properties (complex):
 *   fullPtoEntries — PTOEntry[] for all types
 *
 * Attributes (primitive):
 *   expanded — "true" | "false"
 */
export declare class PtoPtoCard extends BaseComponent {
  private fullEntries;
  private expanded;
  private _expandedRestored;
  private static readonly STORAGE_KEY;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    oldValue: string | null,
    newValue: string | null,
  ): void;
  set isExpanded(value: boolean);
  /** Restore expanded state from localStorage if available (once). */
  private restoreExpandedState;
  set fullPtoEntries(value: PTOEntry[]);
  get fullPtoEntries(): PTOEntry[];
  private renderToggle;
  private renderTable;
  protected render(): string;
  protected handleDelegatedClick(e: Event): void;
  protected handleDelegatedKeydown(e: KeyboardEvent): void;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-pto-card/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-pto-card/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-request-queue/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/components/pto-request-queue/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    height: 100%;\n  }\n\n  .queue-container {\n    height: 100%;\n    display: flex;\n    flex-direction: column;\n  }\n\n  .queue-header {\n    display: flex;\n    justify-content: space-between;\n    gap: var(--space-header);\n    align-items: center;\n    padding: var(--space-lg);\n    border-bottom: 1px solid var(--color-border);\n    background: var(--color-surface);\n  }\n\n  .queue-title {\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-bold);\n    color: var(--color-text);\n    margin: 0;\n  }\n\n  .queue-stats {\n    display: flex;\n    gap: var(--space-lg);\n    align-items: center;\n  }\n\n  .stat-item {\n    display: flex;\n    flex-direction: column;\n    align-items: center;\n  }\n\n  .stat-value {\n    font-size: var(--font-size-2xl);\n    font-weight: var(--font-weight-bold);\n    color: var(--color-primary);\n  }\n\n  .stat-label {\n    font-size: var(--font-size-xs);\n    color: var(--color-text-muted);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n  }\n\n  .queue-content {\n    gap: var(--space-header);\n    display: grid;\n    grid-template-columns: 1fr;\n    overflow-y: auto;\n  }\n\n  @media (min-width: 768px) {\n\n    .queue-content {\n      grid-template-columns: repeat(auto-fit, minmax(24em, 1fr));\n    }\n  }\n\n  .employee-group {\n    grid-column: 1 / -1;\n    border: 1px solid var(--color-border);\n    border-radius: var(--border-radius-lg);\n    padding: var(--space-md);\n    background: var(--color-surface);\n  }\n\n  .employee-group-header {\n    display: flex;\n    flex-wrap: wrap;\n    align-items: center;\n    gap: var(--space-md);\n    margin-bottom: var(--space-md);\n    padding-bottom: var(--space-sm);\n    border-bottom: 1px solid var(--color-border);\n  }\n\n  .employee-group-name {\n    font-size: var(--font-size-lg);\n    font-weight: var(--font-weight-bold);\n    color: var(--color-text);\n    margin: 0;\n    flex: 1 1 auto;\n  }\n\n  .employee-group-cards {\n    display: grid;\n    grid-template-columns: 1fr;\n    gap: var(--space-md);\n  }\n\n  @media (min-width: 768px) {\n\n    .employee-group-cards {\n      grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));\n    }\n  }\n\n  .request-card {\n    background: var(--color-background);\n    border-radius: var(--border-radius-lg);\n    padding: var(--space-lg);\n    margin-bottom: var(--space-md);\n    box-shadow: var(--shadow-md);\n    border: 1px solid var(--color-border);\n    transition: box-shadow 0.3s ease;\n  }\n\n  .request-card:hover {\n    box-shadow: var(--shadow-lg);\n  }\n\n  .request-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: flex-start;\n    margin-bottom: var(--space-md);\n  }\n\n  .employee-info {\n    display: flex;\n    flex-direction: column;\n  }\n\n  .employee-name {\n    font-size: var(--font-size-lg);\n    font-weight: var(--font-weight-bold);\n    color: var(--color-text);\n    margin: 0;\n  }\n\n  .request-type {\n    background: var(--color-primary);\n    color: var(--color-on-primary);\n    padding: var(--space-xs) var(--space-sm);\n    border-radius: var(--border-radius-xl);\n    font-size: var(--font-size-xs);\n    font-weight: var(--font-weight-medium);\n    margin-top: var(--space-xs);\n    display: inline-block;\n  }\n\n  .request-type.Sick { background: var(--color-pto-sick); }\n\n  .request-type.PTO { background: var(--color-pto-vacation); }\n\n  .request-type.Bereavement { background: var(--color-pto-bereavement); }\n\n  .request-type.Jury-Duty { background: var(--color-pto-jury-duty); }\n\n  .request-details {\n    display: grid;\n    grid-template-columns: 1fr;\n    gap: var(--space-md);\n    margin-bottom: var(--space-md);\n  }\n\n  @media (min-width: 480px) {\n\n    .request-details {\n      grid-template-columns: 1fr 1fr;\n    }\n  }\n\n  @media (min-width: 768px) {\n\n    .request-details {\n      grid-template-columns: repeat(4, 1fr);\n    }\n  }\n\n  .detail-item {\n    display: flex;\n    flex-direction: column;\n  }\n\n  .detail-label {\n    font-size: var(--font-size-xs);\n    color: var(--color-text-muted);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n    margin-bottom: var(--space-xs);\n  }\n\n  .detail-value {\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-medium);\n    color: var(--color-text);\n  }\n\n  .request-dates {\n    display: flex;\n    align-items: center;\n    gap: var(--space-sm);\n  }\n\n  .date-range {\n    background: var(--color-surface);\n    padding: var(--space-xs) var(--space-sm);\n    border-radius: var(--border-radius);\n    font-size: var(--font-size-xs);\n    color: var(--color-text-secondary);\n  }\n\n  .request-actions {\n    display: flex;\n    gap: var(--space-md);\n    justify-content: flex-end;\n  }\n\n  .action-btn {\n    padding: var(--space-sm) var(--space-lg);\n    border: none;\n    border-radius: var(--border-radius);\n    cursor: pointer;\n    font-size: var(--font-size-sm);\n    font-weight: var(--font-weight-medium);\n    transition: opacity 0.3s ease, background-color 0.3s ease;\n  }\n\n  .action-btn.approve {\n    background: var(--color-success);\n    color: var(--color-on-success);\n  }\n\n  .action-btn.approve:hover {\n    background: var(--color-success);\n    opacity: 0.8;\n  }\n\n  .action-btn.reject {\n    background: var(--color-error);\n    color: var(--color-on-error);\n  }\n\n  .action-btn.reject:hover {\n    background: var(--color-error);\n    opacity: 0.8;\n  }\n\n  .action-btn.confirming {\n    outline: 2px solid var(--color-warning);\n    outline-offset: 1px;\n  }\n\n  .action-btn.approve.confirming {\n    background: var(--color-warning);\n    color: var(--color-on-warning, #000);\n  }\n\n  .action-btn.reject.confirming {\n    background: var(--color-warning);\n    color: var(--color-on-warning, #000);\n  }\n\n  .empty-state {\n    text-align: center;\n    padding: calc(var(--space-2xl) * 1.5) var(--space-xl);\n    color: var(--color-text-muted);\n  }\n\n  .empty-state h3 {\n    margin: 0 0 var(--space-sm);\n    font-size: var(--font-size-xl);\n    color: var(--color-text);\n  }\n\n  .empty-state p {\n    margin: 0;\n    font-size: var(--font-size-base);\n  }\n\n  .status-badge {\n    padding: var(--space-xs) var(--space-sm);\n    border-radius: var(--border-radius-xl);\n    font-size: var(--font-size-xs);\n    font-weight: var(--font-weight-bold);\n    text-transform: uppercase;\n    letter-spacing: 0.5px;\n  }\n\n  .status-badge.pending {\n    background: var(--color-warning-light);\n    color: var(--color-warning);\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n\n    .request-card {\n      transition: none;\n    }\n\n    .action-btn {\n      transition: none;\n    }\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/components/pto-request-queue/index.d.ts"
dependencies: ["../../shared/aggregate-pto-requests.js","../base-component.js"]
lineCount: 28
exports: ["PtoRequestQueue"]
---
*/
// ===== client/components/pto-request-queue/index.d.ts =====
import { BaseComponent } from "../base-component.js";
import {
  type AggregatedPTORequest,
  type PTORequest,
} from "../../shared/aggregate-pto-requests.js";
export type { PTORequest };
export { type AggregatedPTORequest };
export declare class PtoRequestQueue extends BaseComponent {
  private _requests;
  /** Employee IDs that have at least one negative balance category. */
  private _negativeBalanceEmployeeIds;
  /** Track buttons awaiting confirmation. Maps button element to reset timer. */
  private _pendingConfirmations;
  get requests(): PTORequest[];
  set requests(value: PTORequest[]);
  /** Set the IDs of employees with negative balance (triggers confirm flow). */
  set negativeBalanceEmployees(ids: Set<number>);
  protected render(): string;
  private renderRequestCard;
  /**
   * Animate a card scaling down and fading out (dismiss effect).
   * Called by the parent page after approve/reject. Returns a promise
   * that resolves when the animation completes (or immediately under
   * reduced-motion).
   */
  dismissCard(requestId: number): Promise<void>;
  protected handleDelegatedClick(e: Event): void;
  private resetConfirmation;
  private clearConfirmation;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-request-queue/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-request-queue/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/pto-summary-card/index.d.ts"
dependencies: ["../../../shared/api-models.js","../base-component.js"]
lineCount: 19
exports: ["PtoSummaryCard"]
---
*/
// ===== client/components/pto-summary-card/index.d.ts =====
import { BaseComponent } from "../base-component.js";
import type { PTOEntry } from "../../../shared/api-models.js";
type SummaryData = {
  annualAllocation: number;
  availablePTO: number;
  usedPTO: number;
  carryoverFromPreviousYear: number;
};
export declare class PtoSummaryCard extends BaseComponent {
  private data;
  private fullEntries;
  static get observedAttributes(): string[];
  attributeChangedCallback(
    name: string,
    _oldValue: string,
    newValue: string,
  ): void;
  set summary(value: SummaryData | null);
  set fullPtoEntries(value: PTOEntry[]);
  protected render(): string;
}
export {};
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/components/pto-summary-card/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/components/pto-summary-card/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/test-utils.d.ts"
dependencies: []
lineCount: 43
exports: ["querySingle","queryMultiple","getElementById","addEventListener","createElement"]
---
*/
// ===== client/components/test-utils.d.ts =====
/**
 * Lightweight DOM utility library for robust element queries with enhanced error logging.
 * Provides type-safe DOM manipulation with consistent error handling and debugging support.
 */
/**
 * Finds a single element by selector with error logging.
 * @param selector - CSS selector string
 * @param scope - Optional scope element to search within (defaults to document)
 * @returns The found element
 * @throws Error if element is not found
 */
export declare function querySingle<T extends HTMLElement>(
  selector: string,
  scope?: Element | ShadowRoot,
): T;
/**
 * Finds multiple elements by selector with error logging.
 * @param selector - CSS selector string
 * @param scope - Optional scope element to search within (defaults to document)
 * @returns Array of found elements
 * @throws Error if no elements are found
 */
export declare function queryMultiple<T extends HTMLElement>(
  selector: string,
  scope?: Element,
): T[];
/**
 * Finds an element by ID with error logging.
 * @param id - Element ID (without # prefix)
 * @returns The found element
 * @throws Error if element is not found
 */
export declare function getElementById<T extends HTMLElement>(id: string): T;
/**
 * Safely adds an event listener to an element with error handling.
 * @param element - The element to attach the listener to
 * @param event - Event type
 * @param handler - Event handler function
 * @param options - Event listener options
 */
export declare function addEventListener<T extends Event = Event>(
  element: EventTarget,
  event: string,
  handler: (event: T) => void,
  options?: boolean | AddEventListenerOptions,
): void;
/**
 * Creates an element with optional attributes and error logging.
 * @param tagName - HTML tag name
 * @param attributes - Optional attributes object
 * @returns The created element
 */
export declare function createElement<T extends HTMLElement>(
  tagName: string,
  attributes?: Record<string, string>,
): T;
//# sourceMappingURL=test-utils.d.ts.map

/*
---
file: "client/components/test.d.ts"
dependencies: ["./admin-monthly-review/test.js","./confirmation-dialog/test.js","./dashboard-navigation-menu/test.js","./data-table/test.js","./employee-form/test.js","./employee-list/test.js","./month-summary/test.js","./prior-year-review/test.js","./pto-balance-summary/test.js","./pto-calendar/test.js","./pto-dashboard/test.js","./pto-employee-info-card/test.js","./pto-entry-form/test.js","./pto-pto-card/test.js","./pto-request-queue/test.js","./pto-summary-card/test.js"]
lineCount: 18
exports: []
---
*/
// ===== client/components/test.d.ts =====
import { playground as confirmationDialog } from "./confirmation-dialog/test.js";
import { playground as adminMonthlyReview } from "./admin-monthly-review/test.js";
import { playground as employeeList } from "./employee-list/test.js";
import { playground as employeeForm } from "./employee-form/test.js";
import { playground as ptoEntryForm } from "./pto-entry-form/test.js";
import { playground as ptoRequestQueue } from "./pto-request-queue/test.js";
import { playground as dataTable } from "./data-table/test.js";
import { playground as ptoDashboard } from "./pto-dashboard/test.js";
import { playground as ptoCalendar } from "./pto-calendar/test.js";
import { playground as ptoSummaryCard } from "./pto-summary-card/test.js";
import { playground as ptoPtoCard } from "./pto-pto-card/test.js";
import { playground as ptoEmployeeInfoCard } from "./pto-employee-info-card/test.js";
import { playground as priorYearReview } from "./prior-year-review/test.js";
import { playground as ptoBalanceSummary } from "./pto-balance-summary/test.js";
import { playground as dashboardNavigationMenu } from "./dashboard-navigation-menu/test.js";
import { playground as monthSummary } from "./month-summary/test.js";
export {
  confirmationDialog,
  adminMonthlyReview,
  employeeList,
  employeeForm,
  ptoEntryForm,
  ptoRequestQueue,
  dataTable,
  ptoDashboard,
  ptoCalendar,
  ptoSummaryCard,
  ptoPtoCard,
  ptoEmployeeInfoCard,
  priorYearReview,
  ptoBalanceSummary,
  dashboardNavigationMenu,
  monthSummary,
};
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/components/utils/compute-selection-deltas.d.ts"
dependencies: []
lineCount: 21
exports: ["computeSelectionDeltas"]
---
*/
// ===== client/components/utils/compute-selection-deltas.d.ts =====
/**
 * Compute per-PTO-type hour deltas between selected calendar requests
 * and the existing PTO entries for the same dates.
 *
 * Used by both `CurrentYearPtoScheduler` (month-level delta display)
 * and the PTO entry form (remaining-balance delta display).
 *
 * @param selectedRequests  Requests currently selected on the calendar
 * @param existingEntries   Existing PTO entries to compare against
 * @returns Record keyed by PTO type (e.g. "PTO", "Sick") with net hour deltas
 */
export declare function computeSelectionDeltas(
  selectedRequests: ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }>,
  existingEntries: ReadonlyArray<{
    date: string;
    type: string;
    hours: number;
  }>,
): Record<string, number>;
//# sourceMappingURL=compute-selection-deltas.d.ts.map

/*
---
file: "client/components/utils/pto-card-base.d.ts"
dependencies: []
lineCount: 11
exports: []
---
*/
// ===== client/components/utils/pto-card-base.d.ts =====
/**
 * @deprecated This file is retained for reference only.
 * All PTO card components have been migrated to BaseComponent.
 *
 * Shared CSS → utils/pto-card-css.ts (CARD_CSS)
 * Shared helpers → utils/pto-card-helpers.ts (monthNames, renderCardShell, etc.)
 * Base class → base-component.ts (BaseComponent)
 */
/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export { monthNames } from "./pto-card-helpers.js";
//# sourceMappingURL=pto-card-base.d.ts.map

/*
---
file: "client/components/utils/pto-card-css.d.ts"
dependencies: []
lineCount: 6
exports: ["CARD_CSS"]
---
*/
// ===== client/components/utils/pto-card-css.d.ts =====
/**
 * Shared CSS for all PTO card components.
 * Single source of truth — replaces both PTO_CARD_CSS and renderCard() inline styles.
 */
export declare const CARD_CSS =
  '\n    :host {\n        display: block;\n    }\n\n    @media all {\n    .card {\n        padding: var(--space-lg);\n        }\n    }\n\n    @media (min-width: 360px) {\n    .card {\n        padding: var(--space-sm);\n        }\n    }\n\n    .card {\n        background: var(--color-background);\n        border: var(--border-width) var(--border-style-solid) var(--color-border);\n        border-radius: var(--border-radius-lg);\n        box-shadow: var(--shadow-md);\n    }\n\n    .card h4 {\n        text-align: center;\n        background: var(--color-surface);\n        padding: var(--space-sm);\n        margin: 0 0 var(--space-md) 0;\n        font-size: var(--font-size-xl);\n        border-bottom: 1px solid var(--color-border);\n        color: var(--color-text);\n        font-weight: var(--font-weight-semibold);\n    }\n\n    .card .row {\n        display: flex;\n        justify-content: space-between;\n        gap: var(--space-lg);\n        margin: var(--space-xs) 0;\n        font-size: var(--font-size-sm);\n        color: var(--color-text-secondary);\n    }\n\n    .card .row:last-child {\n        margin-bottom: var(--space-md);\n    }\n\n    .card .label {\n        font-weight: var(--font-weight-semibold);\n        color: var(--color-text);\n    }\n\n    .card .label.approved::after {\n        content: " \u2713";\n        color: var(--color-success);\n        font-weight: var(--font-weight-semibold);\n    }\n\n    .card .usage-date.approved::after {\n        content: " \u2713";\n        color: var(--color-success);\n        font-weight: var(--font-weight-semibold);\n    }\n\n    .card .negative-balance {\n        color: var(--color-error);\n        font-weight: var(--font-weight-semibold);\n    }\n\n    .toggle-button {\n        background: var(--color-primary);\n        color: var(--color-on-primary);\n        border: none;\n        border-radius: var(--border-radius-md);\n        padding: var(--space-sm) var(--space-md);\n        font-size: var(--font-size-sm);\n        cursor: pointer;\n        display: flex;\n        align-items: center;\n        gap: var(--space-xs);\n        transition: background-color var(--duration-fast);\n        margin: var(--space-md) 0;\n        width: 100%;\n        justify-content: center;\n    }\n\n    .toggle-button:hover {\n        background: var(--color-primary-hover);\n    }\n\n    .toggle-button:focus {\n        outline: 2px solid var(--color-focus);\n        outline-offset: 2px;\n    }\n\n    .chevron {\n        transition: transform var(--duration-fast);\n    }\n\n    .chevron.expanded {\n        transform: rotate(180deg);\n    }\n\n    .usage-section {\n        margin-top: var(--space-md);\n        padding-top: var(--space-md);\n        border-top: 1px solid var(--color-border);\n    }\n\n    .usage-title {\n        font-size: var(--font-size-sm);\n        font-weight: var(--font-weight-medium);\n        color: var(--color-text-secondary);\n        margin-bottom: var(--space-sm);\n    }\n\n    .usage-help {\n        font-size: var(--font-size-xs);\n        font-weight: var(--font-weight-normal);\n        color: var(--color-text-muted);\n        font-style: italic;\n    }\n\n    .usage-list {\n        list-style: none;\n        padding: 0;\n        margin: 0;\n    }\n\n    .usage-list li {\n        display: flex;\n        justify-content: space-between;\n        padding: var(--space-xs) 0;\n        font-size: var(--font-size-sm);\n        border-bottom: var(--border-width) solid var(--color-border-light);\n    }\n\n    .usage-list li:last-child {\n        border-bottom: none;\n    }\n\n    .usage-date {\n        cursor: pointer;\n        text-decoration: underline;\n        color: var(--color-primary);\n        transition: background-color var(--duration-fast);\n        padding: var(--space-xs);\n        border-radius: var(--border-radius-sm);\n        margin: calc(var(--space-xs) * -1);\n    }\n\n    .usage-date:hover {\n        background: var(--color-surface-hover);\n    }\n\n    .usage-date:focus {\n        outline: 2px solid var(--color-primary);\n        outline-offset: 2px;\n    }\n\n    .empty {\n        font-size: var(--font-size-sm);\n        color: var(--color-text-secondary);\n        font-style: italic;\n    }\n\n    @media (max-width: 280px) {\n        .usage-list li {\n            flex-direction: column;\n            align-items: flex-start;\n            gap: var(--space-xs);\n        }\n\n        .usage-list li span:first-child {\n            font-weight: var(--font-weight-medium);\n        }\n    }\n';
//# sourceMappingURL=pto-card-css.d.ts.map

/*
---
file: "client/components/utils/pto-card-helpers.d.ts"
dependencies: ["../../../shared/api-models.js"]
lineCount: 38
exports: ["monthNames","renderCardShell","renderRow","renderToggleButton","UsageEntry","renderUsageList","renderBucketBody"]
---
*/
// ===== client/components/utils/pto-card-helpers.d.ts =====
import type { PTOEntry } from "../../../shared/api-models.js";
/** @deprecated Use `MONTH_NAMES` from `shared/businessRules.js` instead. */
export declare const monthNames: readonly [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
/** Wraps body content in the standard card shell markup. */
export declare function renderCardShell(title: string, body: string): string;
/** Renders a single label/value data row. */
export declare function renderRow(
  label: string,
  value: string,
  cssClass?: string,
): string;
/** Renders the expand/collapse toggle button. */
export declare function renderToggleButton(
  expanded: boolean,
  hasEntries: boolean,
): string;
export type UsageEntry = {
  date: string;
  hours: number;
};
/**
 * Renders the usage-list section with clickable dates.
 * @param entries    - Usage entries to display (date + hours)
 * @param expanded   - Whether the section is visible
 * @param entryType  - PTO entry type string used for approval matching (e.g. "PTO", "Sick")
 * @param fullEntries - Full PTOEntry[] for per-entry approval checks
 */
export declare function renderUsageList(
  entries: UsageEntry[],
  expanded: boolean,
  entryType: string,
  fullEntries?: PTOEntry[],
): string;
/**
 * Renders the standard bucket card body (Allowed / Used / Remaining + toggle + usage).
 * @param options.showNegativeFormatting - If false, remaining never gets negative-balance class (Jury Duty card)
 */
export declare function renderBucketBody(options: {
  data: {
    allowed: number;
    used: number;
    remaining: number;
  };
  entries: UsageEntry[];
  expanded: boolean;
  entryType: string;
  fullEntries: PTOEntry[];
  showNegativeFormatting?: boolean;
}): string;
//# sourceMappingURL=pto-card-helpers.d.ts.map

/*
---
file: "client/controller/DebugConsoleController.d.ts"
dependencies: ["./TraceListener.js"]
lineCount: 29
exports: ["DebugConsoleController"]
---
*/
// ===== client/controller/DebugConsoleController.d.ts =====
import type { TraceListenerHandler, TraceMessage } from "./TraceListener.js";
/**
 * Bridges TraceListener messages to `<debug-console>`.
 *
 * All debug-mode hooks are gated on `?debug=1` query string:
 * - Console interception (console.log / warn / error)
 * - Global error and unhandled-rejection handlers
 * - Auto-injection of `<debug-console>` if absent from the DOM
 *
 * If `debug != 1`, this controller still forwards TraceListener
 * messages to `<debug-console>` if the element happens to be present
 * (e.g., test pages that include it declaratively), but no console
 * interception or error hooking occurs.
 */
export declare class DebugConsoleController implements TraceListenerHandler {
  private element;
  private originalConsoleLog;
  private originalConsoleWarn;
  private originalConsoleError;
  constructor();
  /** Forward TraceListener messages to the debug console. */
  onTrace(msg: TraceMessage): void;
  /** Tear down hooks (useful for tests). */
  destroy(): void;
  private setupConsoleInterception;
  private setupExceptionHandlers;
  private formatArgs;
}
//# sourceMappingURL=DebugConsoleController.d.ts.map

/*
---
file: "client/controller/PtoNotificationController.d.ts"
dependencies: ["./TraceListener.js"]
lineCount: 14
exports: ["PtoNotificationController"]
---
*/
// ===== client/controller/PtoNotificationController.d.ts =====
import type { TraceListenerHandler, TraceMessage } from "./TraceListener.js";
/**
 * Bridges TraceListener messages to the `<pto-notification>` component.
 *
 * If the element is present in the DOM the controller forwards every
 * trace message as a visible toast.  If absent, messages are silently
 * dropped (no errors).
 */
export declare class PtoNotificationController implements TraceListenerHandler {
  private element;
  constructor();
  onTrace(msg: TraceMessage): void;
}
//# sourceMappingURL=PtoNotificationController.d.ts.map

/*
---
file: "client/controller/TraceListener.d.ts"
dependencies: []
lineCount: 46
exports: ["TraceLevel","TraceMessage","TraceOptions","TraceListenerHandler","TraceListener"]
---
*/
// ===== client/controller/TraceListener.d.ts =====
/**
 * TraceListener — central message fan-out.
 *
 * Replaces NotificationManager.  Call sites keep calling
 * `notifications.success(...)` etc. — the variable now holds
 * a TraceListener instead.
 *
 * Controllers register as listeners and receive every message:
 *   traceListener.addListener(new PtoNotificationController());
 *   traceListener.addListener(new DebugConsoleController());
 */
export type TraceLevel = "success" | "error" | "info" | "warning";
export interface TraceMessage {
  level: TraceLevel;
  message: string;
  title?: string;
  duration?: number;
  /** Called when the user explicitly dismisses the notification (click). */
  onDismiss?: () => void;
}
/** Optional second argument for convenience methods (`info`, `success`, etc.). */
export interface TraceOptions {
  title?: string;
  /** Auto-dismiss timeout in milliseconds (overrides default duration). */
  autoDismissMs?: number;
  /** Called when the user explicitly clicks dismiss (not on auto-dismiss). */
  onDismiss?: () => void;
}
export interface TraceListenerHandler {
  onTrace(msg: TraceMessage): void;
}
export declare class TraceListener {
  private listeners;
  addListener(handler: TraceListenerHandler): void;
  removeListener(handler: TraceListenerHandler): void;
  success(message: string, options?: TraceOptions): void;
  success(message: string, title?: string, duration?: number): void;
  error(message: string, options?: TraceOptions): void;
  error(message: string, title?: string, duration?: number): void;
  info(message: string, options?: TraceOptions): void;
  info(message: string, title?: string, duration?: number): void;
  warning(message: string, options?: TraceOptions): void;
  warning(message: string, title?: string, duration?: number): void;
  private emit;
}
//# sourceMappingURL=TraceListener.d.ts.map

/*
---
file: "client/css-extensions/animations/animations.d.ts"
dependencies: []
lineCount: 7
exports: ["animationCSS"]
---
*/
// ===== client/css-extensions/animations/animations.d.ts =====
/**
 * Animation CSS source — single source of truth for keyframes and utility
 * classes. All durations, easings, and distances reference tokens defined in
 * tokens.css via var(). No :root redefinitions here.
 */
export declare const animationCSS =
  "\n  /* \u2500\u2500 Keyframes \u2500\u2500 */\n\n  @keyframes fade-in {\n    from { opacity: 0; }\n    to   { opacity: 1; }\n  }\n\n  @keyframes fade-out {\n    from { opacity: 1; }\n    to   { opacity: 0; }\n  }\n\n  @keyframes slide-in-right {\n    from { transform: translateX(var(--slide-distance)); opacity: 0; }\n    to   { transform: translateX(0); opacity: 1; }\n  }\n\n  @keyframes slide-in-left {\n    from { transform: translateX(calc(-1 * var(--slide-distance))); opacity: 0; }\n    to   { transform: translateX(0); opacity: 1; }\n  }\n\n  @keyframes slide-out-left {\n    from { transform: translateX(0); opacity: 1; }\n    to   { transform: translateX(calc(-1 * var(--slide-distance))); opacity: 0; }\n  }\n\n  @keyframes slide-out-right {\n    from { transform: translateX(0); opacity: 1; }\n    to   { transform: translateX(var(--slide-distance)); opacity: 0; }\n  }\n\n  @keyframes slide-down-in {\n    from { transform: translateY(calc(-1 * var(--slide-offset))); opacity: 0; }\n    to   { transform: translateY(0); opacity: 1; }\n  }\n\n  @keyframes slide-up-out {\n    from { transform: translateY(0); opacity: 1; }\n    to   { transform: translateY(calc(-1 * var(--slide-offset))); opacity: 0; }\n  }\n\n  @keyframes pop {\n    0%   { transform: scale(0.92); opacity: 0; }\n    60%  { transform: scale(1.08); }\n    100% { transform: scale(1); opacity: 1; }\n  }\n\n  @keyframes scale-down {\n    from { transform: scale(1); opacity: 1; }\n    to   { transform: scale(0.25); opacity: 0; }\n  }\n\n  /* \u2500\u2500 Utility classes \u2500\u2500 */\n\n  .anim-fade-in {\n    animation: fade-in var(--duration-normal) var(--easing-decelerate) backwards;\n  }\n\n  .anim-slide-in-right {\n    animation: slide-in-right var(--duration-normal) var(--easing-decelerate) backwards;\n  }\n\n  .anim-slide-in-left {\n    animation: slide-in-left var(--duration-normal) var(--easing-decelerate) backwards;\n  }\n\n  .anim-slide-out-left {\n    animation: slide-out-left var(--duration-normal) var(--easing-accelerate) forwards;\n  }\n\n  .anim-slide-out-right {\n    animation: slide-out-right var(--duration-normal) var(--easing-accelerate) forwards;\n  }\n\n  .anim-slide-down-in {\n    animation: slide-down-in var(--duration-normal) var(--easing-decelerate) backwards;\n  }\n\n  .anim-slide-up-out {\n    animation: slide-up-out var(--duration-normal) var(--easing-accelerate) forwards;\n  }\n\n  .anim-pop {\n    animation: pop var(--duration-fast) var(--easing-standard) backwards;\n  }\n\n  .anim-scale-down {\n    animation: scale-down var(--duration-normal) var(--easing-accelerate) forwards;\n  }\n\n  /* \u2500\u2500 Accessibility: disable all animations for reduced-motion preference \u2500\u2500 */\n\n  @media (prefers-reduced-motion: reduce) {\n\n    .anim-fade-in,\n    .anim-slide-in-right,\n    .anim-slide-in-left,\n    .anim-slide-out-left,\n    .anim-slide-out-right,\n    .anim-slide-down-in,\n    .anim-slide-up-out,\n    .anim-pop,\n    .anim-scale-down {\n      animation: none;\n    }\n  }\n";
//# sourceMappingURL=animations.d.ts.map

/*
---
file: "client/css-extensions/animations/index.d.ts"
dependencies: ["./types.js"]
lineCount: 96
exports: ["getAnimationSheet","adoptAnimations","animateSlide","animateCarousel","animateDismiss","ListenerHost","setupSwipeNavigation"]
---
*/
// ===== client/css-extensions/animations/index.d.ts =====
/**
 * Shared animation library for web components.
 *
 * Provides a constructable stylesheet singleton for CSS keyframes/utility
 * classes, plus JavaScript helpers for complex multi-phase animations that
 * cannot be expressed in pure CSS.
 *
 * All durations, easings, and distances are read from tokens.css custom
 * properties at animation time — no hardcoded values.
 */
import type {
  AnimationHandle,
  SwipeNavigationHandle,
  SwipeNavigationOptions,
} from "./types.js";
export type {
  AnimationHandle,
  SwipeNavigationHandle,
  SwipeNavigationOptions,
} from "./types.js";
/**
 * Return the shared CSSStyleSheet containing all animation keyframes and
 * utility classes. The sheet is created lazily on first call.
 */
export declare function getAnimationSheet(): CSSStyleSheet;
/**
 * Adopt the shared animation stylesheet into a shadow root (or document).
 * Safe to call multiple times — the sheet is added only once.
 */
export declare function adoptAnimations(root: ShadowRoot | Document): void;
/**
 * Animate an element sliding in (show) or out (hide) along the Y axis.
 *
 * - **show = true**: Element slides down from `--slide-offset` above, fading
 *   in with `--easing-decelerate`.
 * - **show = false**: Element slides up by `--slide-offset`, fading out with
 *   `--easing-accelerate`.
 *
 * The caller is responsible for DOM visibility (e.g. toggling a `closed`
 * class) — this helper only drives the visual transition.
 *
 * @returns An {@link AnimationHandle} with a `promise` and a `cancel` method.
 */
export declare function animateSlide(
  element: HTMLElement,
  show: boolean,
): AnimationHandle;
/**
 * Carousel-style animation for swapping content horizontally.
 *
 * 1. **Phase 1**: Current content slides out in the swipe direction, fading
 *    to transparent.
 * 2. **onUpdate()**: Caller swaps content while the container is off-screen.
 * 3. **Phase 2**: Container instantly jumps to the opposite side.
 * 4. **Phase 3**: New content slides in from the opposite side to center.
 *
 * Uses `--duration-normal` and `--easing-standard` from tokens.css.
 *
 * @param container  The element whose transform/opacity are animated.
 * @param direction  Positive = next (exits left, enters from right).
 *                   Negative = prev (exits right, enters from left).
 * @param onUpdate   Callback invoked while the container is off-screen,
 *                   typically to swap month/page content.
 * @returns An {@link AnimationHandle} with a `promise` and a `cancel` method.
 */
export declare function animateCarousel(
  container: HTMLElement,
  direction: number,
  onUpdate: () => void,
): AnimationHandle;
/**
 * Dismiss animation that scales an element down and fades it out.
 *
 * The element transitions from `scale(1)` to `scale(0.25)` while fading
 * to transparent, using `--duration-normal` and `--easing-accelerate`.
 * The caller is responsible for removing the element from the DOM after
 * the animation completes (await the returned handle's promise).
 *
 * @returns An {@link AnimationHandle} with a `promise` and a `cancel` method.
 */
export declare function animateDismiss(element: HTMLElement): AnimationHandle;
/**
 * Narrow interface for the listener-tracking capability needed by
 * `setupSwipeNavigation`. Matches {@link BaseComponent.addListener}.
 */
export interface ListenerHost {
  addListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
  ): void;
}
/**
 * Attach swipe gesture detection and animated carousel navigation to a
 * container element.
 *
 * Touch listeners are registered via the host's `addListener()` for
 * memory-safe automatic cleanup. Animation state (guard flag and
 * current handle) is encapsulated in the returned closure — callers
 * do **not** need their own `isAnimating` / `currentAnimation` fields.
 *
 * @param host       Object with an `addListener` method (typically a
 *                   `BaseComponent` instance) used to register touch
 *                   handlers for automatic lifecycle cleanup.
 * @param container  The DOM element to listen for touch events on and
 *                   to animate with `animateCarousel()`.
 * @param onNavigate Callback invoked with `-1` (prev) or `1` (next)
 *                   while the container is off-screen during the
 *                   carousel animation — swap content here.
 * @param options    Optional {@link SwipeNavigationOptions}.
 * @returns A {@link SwipeNavigationHandle} with `cancel()` and
 *          `destroy()` methods.
 */
export declare function setupSwipeNavigation(
  host: ListenerHost,
  container: HTMLElement,
  onNavigate: (direction: -1 | 1) => void,
  options?: SwipeNavigationOptions,
): SwipeNavigationHandle;
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/css-extensions/animations/types.d.ts"
dependencies: []
lineCount: 39
exports: ["AnimationHandle","SwipeNavigationHandle","SwipeNavigationOptions"]
---
*/
// ===== client/css-extensions/animations/types.d.ts =====
/**
 * Handle returned by animation helpers, allowing the caller to await
 * completion or cancel the animation immediately.
 */
export interface AnimationHandle {
  /** Resolves when the animation completes or is cancelled. */
  promise: Promise<void>;
  /** Cancel the animation immediately, cleaning up all inline styles. */
  cancel: () => void;
}
/**
 * Handle returned by {@link setupSwipeNavigation}, allowing the caller
 * to cancel in-flight animations or tear down touch listeners.
 */
export interface SwipeNavigationHandle {
  /** Cancel any in-flight carousel animation. */
  cancel(): void;
  /** Remove touch listeners and release resources. */
  destroy(): void;
}
/**
 * Options for {@link setupSwipeNavigation}.
 */
export interface SwipeNavigationOptions {
  /**
   * When `true`, registers a non-passive `touchmove` handler that calls
   * `preventDefault()` during horizontal swipes to stop the page from
   * scrolling. This blocks **all** native touch scrolling (including
   * vertical) until gesture direction is determined.
   *
   * When `false` (default), only `touchstart`/`touchend` are observed.
   * Rely on CSS `touch-action: pan-y` on the container to isolate
   * horizontal swipes without blocking vertical page scroll.
   *
   * @default false
   */
  preventPageScroll?: boolean;
}
//# sourceMappingURL=types.d.ts.map

/*
---
file: "client/css-extensions/index.d.ts"
dependencies: []
lineCount: 26
exports: []
---
*/
// ===== client/css-extensions/index.d.ts =====
/**
 * CSS Extensions facade — single entry point for all shared CSS extension
 * libraries (animations, toolbar, etc.).
 *
 * Each extension provides a constructable stylesheet singleton and an
 * `adopt*()` helper that safely adds it to a shadow root's
 * `adoptedStyleSheets`. Import from this facade for convenience, or from
 * the individual sub-module for tree-shaking.
 *
 * @example
 * ```ts
 * import { adoptAnimations, adoptToolbar } from "../../css-extensions/index.js";
 *
 * connectedCallback() {
 *   super.connectedCallback();
 *   adoptAnimations(this.shadowRoot);
 *   adoptToolbar(this.shadowRoot);
 * }
 * ```
 */
export {
  getAnimationSheet,
  adoptAnimations,
  animateSlide,
  animateCarousel,
  animateDismiss,
  setupSwipeNavigation,
} from "./animations/index.js";
export type {
  AnimationHandle,
  SwipeNavigationHandle,
  SwipeNavigationOptions,
  ListenerHost,
} from "./animations/index.js";
export { getToolbarSheet, adoptToolbar } from "./toolbar/index.js";
export {
  getNavigationSheet,
  adoptNavigation,
  NAV_SYMBOLS,
} from "./navigation/index.js";
export {
  getPtoDayColorsSheet,
  adoptPtoDayColors,
} from "./pto-day-colors/index.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/css-extensions/navigation/index.d.ts"
dependencies: []
lineCount: 19
exports: ["getNavigationSheet","adoptNavigation"]
---
*/
// ===== client/css-extensions/navigation/index.d.ts =====
/**
 * Shared navigation arrow library for web components.
 *
 * Provides a constructable stylesheet singleton for navigation arrow
 * button styles and exported symbol constants.
 * Import `adoptNavigation` to add styles, and `NAV_SYMBOLS` for arrow text.
 */
export { NAV_SYMBOLS } from "./navigation.js";
/**
 * Return the shared CSSStyleSheet containing navigation layout classes.
 * The sheet is created lazily on first call.
 */
export declare function getNavigationSheet(): CSSStyleSheet;
/**
 * Safely add the navigation stylesheet to a shadow root's adoptedStyleSheets.
 * No-ops if the sheet is already adopted.
 */
export declare function adoptNavigation(root: ShadowRoot | null): void;
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/css-extensions/navigation/navigation.d.ts"
dependencies: []
lineCount: 14
exports: ["NAV_SYMBOLS","navigationCSS"]
---
*/
// ===== client/css-extensions/navigation/navigation.d.ts =====
/**
 * Navigation CSS source — single source of truth for navigation arrow
 * button styles and shared navigation symbols.
 *
 * Components importing these resources ensure consistent navigation UX
 * across the application, avoiding hard-coded arrow characters.
 */
/** Unicode arrow symbols for navigation buttons */
export declare const NAV_SYMBOLS: {
  readonly PREV: "←";
  readonly NEXT: "→";
};
export declare const navigationCSS =
  "\n  /* \u2500\u2500 Navigation arrow buttons \u2500\u2500 */\n\n  .nav-arrow {\n    background: none;\n    border: none;\n    cursor: pointer;\n    font-size: var(--font-size-xl, 1.25rem);\n    color: var(--color-text);\n    padding: var(--space-xs, 4px);\n    border-radius: var(--border-radius-sm, 4px);\n    transition: background-color var(--duration-fast, 0.15s) var(--easing-standard, ease);\n    width: 32px;\n    height: 32px;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n  }\n\n  .nav-arrow:hover {\n    background: var(--color-surface-hover, rgb(0 0 0 / 5%));\n  }\n\n  .nav-arrow:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n  }\n\n  /* \u2500\u2500 Navigation header (arrows + label) \u2500\u2500 */\n\n  .nav-header {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    padding: var(--space-xs, 4px) 0;\n  }\n\n  .nav-header .nav-label {\n    font-weight: 600;\n    font-size: var(--font-size-md, 1rem);\n    color: var(--color-text);\n    text-align: center;\n    flex: 1;\n  }\n\n  /* \u2500\u2500 Accessibility: respect reduced-motion \u2500\u2500 */\n\n  @media (prefers-reduced-motion: reduce) {\n    .nav-arrow {\n      transition: none;\n    }\n  }\n";
//# sourceMappingURL=navigation.d.ts.map

/*
---
file: "client/css-extensions/pto-day-colors/index.d.ts"
dependencies: []
lineCount: 18
exports: ["getPtoDayColorsSheet","adoptPtoDayColors"]
---
*/
// ===== client/css-extensions/pto-day-colors/index.d.ts =====
/**
 * Shared PTO day-cell colour library for web components.
 *
 * Provides a constructable stylesheet singleton for day-cell background
 * colour classes (`.type-PTO`, `.type-Sick`, etc.) with inverse text.
 * Import `adoptPtoDayColors` to add the styles to a shadow root.
 */
/**
 * Return the shared CSSStyleSheet containing PTO day-cell colour classes.
 * The sheet is created lazily on first call.
 */
export declare function getPtoDayColorsSheet(): CSSStyleSheet;
/**
 * Safely add the PTO day-cell colour stylesheet to a shadow root.
 * No-ops if the sheet is already adopted.
 */
export declare function adoptPtoDayColors(root: ShadowRoot | null): void;
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/css-extensions/pto-day-colors/pto-day-colors.d.ts"
dependencies: []
lineCount: 10
exports: ["ptoDayColorsCSS"]
---
*/
// ===== client/css-extensions/pto-day-colors/pto-day-colors.d.ts =====
/**
 * PTO day-cell color CSS source — single source of truth for calendar day
 * background colors by PTO type. Used by `prior-year-review` and any future
 * calendar component that colour-codes days.
 *
 * Class naming follows the pattern `.type-{TypeName}` where spaces are
 * replaced with hyphens (e.g., "Jury Duty" → `.type-Jury-Duty`).
 */
export declare const ptoDayColorsCSS =
  "\n  /* \u2500\u2500 PTO type background colors \u2500\u2500 */\n\n  .type-PTO { background: var(--color-pto-vacation); }\n\n  .type-Sick { background: var(--color-pto-sick); }\n\n  .type-Bereavement { background: var(--color-pto-bereavement); }\n\n  .type-Jury-Duty { background: var(--color-pto-jury-duty); }\n\n  /* \u2500\u2500 Inverse text on coloured backgrounds for contrast \u2500\u2500 */\n\n  .type-PTO .date,\n  .type-PTO .hours,\n  .type-Sick .date,\n  .type-Sick .hours,\n  .type-Bereavement .date,\n  .type-Bereavement .hours,\n  .type-Jury-Duty .date,\n  .type-Jury-Duty .hours {\n    color: var(--color-text-inverse, #fff);\n  }\n";
//# sourceMappingURL=pto-day-colors.d.ts.map

/*
---
file: "client/css-extensions/toolbar/index.d.ts"
dependencies: []
lineCount: 18
exports: ["getToolbarSheet","adoptToolbar"]
---
*/
// ===== client/css-extensions/toolbar/index.d.ts =====
/**
 * Shared toolbar layout library for web components.
 *
 * Provides a constructable stylesheet singleton for toolbar utility classes.
 * Toolbar uses flexbox with space-around justification for even button
 * distribution.
 */
/**
 * Return the shared CSSStyleSheet containing toolbar layout classes.
 * The sheet is created lazily on first call.
 */
export declare function getToolbarSheet(): CSSStyleSheet;
/**
 * Adopt the shared toolbar stylesheet into a shadow root (or document).
 * Safe to call multiple times — the sheet is added only once.
 */
export declare function adoptToolbar(root: ShadowRoot | Document): void;
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/css-extensions/toolbar/toolbar.d.ts"
dependencies: []
lineCount: 6
exports: ["toolbarCSS"]
---
*/
// ===== client/css-extensions/toolbar/toolbar.d.ts =====
/**
 * Toolbar CSS source — single source of truth for toolbar layout utility
 * classes. All spacing references tokens defined in tokens.css via var().
 */
export declare const toolbarCSS =
  "\n  /* \u2500\u2500 Toolbar layout \u2500\u2500 */\n\n  .toolbar {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(0, 1fr));\n    align-items: stretch;\n    padding: var(--space-sm, 8px) var(--space-md, 16px);\n    gap: var(--space-sm, 8px);\n  }\n\n  .toolbar > * {\n    min-width: 0;\n    white-space: normal;\n    word-wrap: break-word;\n    text-align: center;\n  }\n\n  @media (min-width: 768px) {\n    .toolbar {\n      grid-template-columns: repeat(auto-fit, minmax(120px, auto));\n      justify-content: end;\n    }\n  }\n\n  /* \u2500\u2500 Accessibility: respect reduced-motion for any toolbar transitions \u2500\u2500 */\n\n  @media (prefers-reduced-motion: reduce) {\n    .toolbar {\n      transition: none;\n    }\n  }\n";
//# sourceMappingURL=toolbar.d.ts.map

/*
---
file: "client/import/excelImportClient.d.ts"
dependencies: ["../../shared/api-models.js"]
lineCount: 38
exports: ["ParseProgress","ProgressCallback","parseExcelInBrowser"]
---
*/
// ===== client/import/excelImportClient.d.ts =====
/**
 * Browser-Side Excel Import Client
 *
 * This module is loaded on-demand (lazy) only when the admin triggers a
 * browser-side import.  It bundles ExcelJS + the shared parsing functions
 * into a separate JS chunk so the main app.js stays small.
 *
 * Flow:
 *  1. Read the File as ArrayBuffer
 *  2. Load into ExcelJS workbook
 *  3. Extract theme colors
 *  4. Iterate employee sheets, calling parseEmployeeSheet()
 *  5. Convert results to BulkImportPayload
 *  6. Return the payload (caller submits it to the bulk API)
 */
import type { BulkImportPayload } from "../../shared/api-models.js";
export interface ParseProgress {
  phase: "loading" | "parsing" | "complete" | "error";
  current: number;
  total: number;
  sheetName?: string;
  message?: string;
}
export type ProgressCallback = (progress: ParseProgress) => void;
/**
 * Parse an Excel file in the browser and return a BulkImportPayload.
 *
 * @param file       The File object from the file input
 * @param onProgress Optional callback for progress reporting
 * @returns          The payload ready to POST to /api/admin/import-bulk
 */
export declare function parseExcelInBrowser(
  file: File,
  onProgress?: ProgressCallback,
): Promise<{
  payload: BulkImportPayload;
  warnings: string[];
  errors: string[];
  resolved: string[];
}>;
//# sourceMappingURL=excelImportClient.d.ts.map

/*
---
file: "client/pages/admin-employees-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/admin-employees-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding: var(--space-md);\n  }\n\n  .toolbar {\n    position: sticky;\n    bottom: 0;\n  }\n\n  .page-heading {\n    text-align: center;\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text);\n    margin: var(--space-md) 0 var(--space-sm) 0;\n  }\n\n  .balance-heading {\n    font-size: var(--font-size-xs);\n    color: var(--color-text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    text-align: center;\n    margin-bottom: var(--space-xs);\n  }\n\n  month-summary {\n    margin-bottom: var(--space-md);\n    justify-content: space-between;\n  }\n\n  .add-btn {\n    background: var(--color-primary);\n    color: white;\n    border: none;\n    padding: var(--space-sm) var(--space-md);\n    border-radius: var(--border-radius);\n    cursor: pointer;\n    font-size: var(--font-size-md);\n  }\n\n  .add-btn:hover {\n    opacity: 0.9;\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/admin-employees-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 36
exports: ["AdminEmployeesPage"]
---
*/
// ===== client/pages/admin-employees-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Admin Employees page.
 * Contains `<employee-list>` and `<employee-form>` for managing employees.
 * Handles add, edit, and delete employee operations.
 */
export declare class AdminEmployeesPage
  extends BaseComponent
  implements PageComponent
{
  private api;
  private _employees;
  private _ptoEntries;
  private _currentYear;
  private _showForm;
  private _editEmployee;
  connectedCallback(): void;
  onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void>;
  protected render(): string;
  private populateList;
  /**
   * Set balance data on each <month-summary> element rendered in light DOM.
   * Computes used hours per PTO category from fetched PTO entries, then sets
   * hours attributes (used) and `balances` property (annual limits) so
   * month-summary displays "available−used".
   */
  private hydrateBalanceSummaries;
  /** Get used hours for an employee in a specific PTO category. */
  private getUsedHours;
  private _customEventsSetup;
  protected setupEventDelegation(): void;
  private handleEditEmployee;
  private handleDeleteEmployee;
  private handleEmployeeSubmit;
  private refreshEmployees;
  protected handleDelegatedClick(e: Event): void;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/admin-employees-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/admin-employees-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/admin-monthly-review-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/admin-monthly-review-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding: var(--space-md, 16px);\n  }\n\n  .capitalize {\n    text-transform: capitalize;\n  }\n\n  .center {\n    text-align: center;\n  }\n\n\n  h2 {\n    color: var(--color-text, #333);\n    margin-bottom: var(--space-md, 16px);\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/admin-monthly-review-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 27
exports: ["AdminMonthlyReviewPage"]
---
*/
// ===== client/pages/admin-monthly-review-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Admin Monthly Review page.
 * Wraps `<admin-monthly-review>` and handles acknowledgment dialog.
 */
export declare class AdminMonthlyReviewPage
  extends BaseComponent
  implements PageComponent
{
  private api;
  onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    _loaderData?: unknown,
  ): Promise<void>;
  protected render(): string;
  private _customEventsSetup;
  protected setupEventDelegation(): void;
  /**
   * Handle acknowledge event from the admin-monthly-review component.
   * The inline confirmation has already happened inside the component.
   * Optimistic dismiss: animate the card out immediately, then call the API.
   * If the API fails, reverse the animation so the admin can retry.
   */
  private handleAdminAcknowledgeReview;
  /**
   * Send a lock-reminder notification to an employee.
   * Single click — no confirmation dialog.
   */
  private handleSendLockReminder;
  private submitAcknowledgment;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/admin-monthly-review-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/admin-monthly-review-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/admin-pto-requests-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/admin-pto-requests-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding: var(--space-md);\n  }\n\n  month-summary {\n    margin-bottom: var(--space-md);\n    justify-content: space-between;\n  }\n\n  .page-heading {\n    text-align: center;\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text);\n    margin: var(--space-md) 0 var(--space-sm) 0;\n  }\n\n  .balance-heading {\n    font-size: var(--font-size-xs, 12px);\n    color: var(--color-text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    text-align: center;\n    margin-bottom: var(--space-xs, 4px);\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/admin-pto-requests-page/index.d.ts"
dependencies: ["../../auth/auth-service.js","../../components/base-component.js","../../router/types.js"]
lineCount: 43
exports: ["AdminPtoRequestsPage"]
---
*/
// ===== client/pages/admin-pto-requests-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
/**
 * Admin PTO Requests page.
 * Wraps `<pto-request-queue>`.
 * Handles approve/reject events from the queue component.
 */
export declare class AdminPtoRequestsPage
  extends BaseComponent
  implements PageComponent
{
  private api;
  private _requests;
  private _ptoEntries;
  private _authService;
  set authService(svc: AuthService);
  onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void>;
  protected render(): string;
  private populateQueue;
  /**
   * Set balance data on each <month-summary> element rendered in light DOM.
   * Computes used hours per PTO category from fetched PTO entries, then sets
   * hours attributes (used) and `balances` property (annual limits) so
   * month-summary displays "available−used".
   * Also computes which employees have negative balances and notifies the queue.
   */
  private hydrateBalanceSummaries;
  /** Get used hours for an employee in a specific PTO category. */
  private getUsedHours;
  private _customEventsSetup;
  protected setupEventDelegation(): void;
  private dismissQueueCard;
  /**
   * Approve all request IDs in an aggregated card.
   * Dismisses the card (keyed by the first ID), then sends approve
   * calls for every underlying request.
   */
  private handleApproveAll;
  /**
   * Reject all request IDs in an aggregated card.
   */
  private handleRejectAll;
  private refreshQueue;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/admin-pto-requests-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/admin-pto-requests-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/admin-settings-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/admin-settings-page/css.d.ts =====
export declare const styles =
  '<style>\n  :host {\n    display: block;\n    padding: var(--space-md, 16px);\n  }\n\n  h2 {\n    color: var(--color-text, #333);\n    margin-bottom: var(--space-md, 16px);\n  }\n\n  h3 {\n    color: var(--color-text, #333);\n    margin-bottom: var(--space-sm, 8px);\n  }\n\n  .settings-section {\n    background: var(--color-surface, #fff);\n    border: 1px solid var(--color-border, #ddd);\n    border-radius: var(--radius-md, 8px);\n    padding: var(--space-md, 16px);\n    margin-bottom: var(--space-md, 16px);\n  }\n\n  .description {\n    color: var(--color-text-secondary, #666);\n    margin-bottom: var(--space-sm, 8px);\n    font-size: 0.9rem;\n  }\n\n  #import-form {\n    display: flex;\n    align-items: center;\n    gap: var(--space-sm, 8px);\n    flex-wrap: wrap;\n  }\n\n  #excel-file {\n    display: none;\n  }\n\n  .file-label {\n    display: inline-flex;\n    align-items: center;\n    gap: var(--space-xs, 4px);\n    padding: var(--space-xs, 4px) var(--space-sm, 8px);\n    background: var(--color-surface-alt, #f5f5f5);\n    border: 1px solid var(--color-border, #ddd);\n    border-radius: var(--radius-sm, 4px);\n    cursor: pointer;\n    font-size: 0.9rem;\n    transition: background 0.15s;\n  }\n\n  .file-label:hover {\n    background: var(--color-hover, #eee);\n  }\n\n  .file-name {\n    color: var(--color-text-secondary, #666);\n    font-size: 0.85rem;\n    font-style: italic;\n  }\n\n  button[type="submit"] {\n    padding: var(--space-xs, 4px) var(--space-md, 16px);\n    background: var(--color-primary, #1a5276);\n    color: #fff;\n    border: none;\n    border-radius: var(--radius-sm, 4px);\n    cursor: pointer;\n    font-size: 0.9rem;\n    transition: opacity 0.15s;\n  }\n\n  button[type="submit"]:hover:not([disabled]) {\n    opacity: 0.9;\n  }\n\n  button[type="submit"][disabled] {\n    opacity: 0.6;\n    cursor: not-allowed;\n  }\n\n  .import-status {\n    margin-top: var(--space-sm, 8px);\n  }\n\n  .success {\n    color: var(--color-success, #27ae60);\n    font-weight: bold;\n  }\n\n  .error {\n    color: var(--color-error, #e74c3c);\n    font-weight: bold;\n  }\n\n  .warning {\n    color: var(--color-warning, #f39c12);\n    font-size: 0.85rem;\n  }\n\n  .warnings-details {\n    margin-top: var(--space-xs, 4px);\n  }\n\n  .warnings-list {\n    max-height: 200px;\n    overflow-y: auto;\n    padding-left: var(--space-md, 16px);\n    font-size: 0.8rem;\n    color: var(--color-warning, #f39c12);\n  }\n\n  .warnings-list li {\n    color: var(--color-warning, #f39c12);\n    margin-bottom: 2px;\n  }\n\n  .errors-details {\n    margin-top: var(--space-xs, 4px);\n  }\n\n  .errors-list {\n    max-height: 200px;\n    overflow-y: auto;\n    padding-left: var(--space-md, 16px);\n    font-size: 0.8rem;\n    color: var(--color-error, #e74c3c);\n  }\n\n  .errors-list li {\n    color: var(--color-error, #e74c3c);\n    margin-bottom: 2px;\n  }\n\n  .resolved {\n    color: var(--color-success, #27ae60);\n    font-size: 0.85rem;\n  }\n\n  .resolved-details {\n    margin-top: var(--space-xs, 4px);\n  }\n\n  .resolved-list {\n    max-height: 200px;\n    overflow-y: auto;\n    padding-left: var(--space-md, 16px);\n    font-size: 0.8rem;\n    color: var(--color-success, #27ae60);\n  }\n\n  .resolved-list li {\n    color: var(--color-success, #27ae60);\n    margin-bottom: 2px;\n  }\n\n  .severity-summary {\n    font-size: 0.9rem;\n    margin-top: var(--space-xs, 4px);\n    margin-bottom: var(--space-xs, 4px);\n  }\n\n  details {\n    margin-top: var(--space-xs, 4px);\n  }\n\n  summary {\n    cursor: pointer;\n    color: var(--color-text-secondary, #666);\n    font-size: 0.9rem;\n  }\n\n  ul {\n    padding-left: var(--space-md, 16px);\n  }\n\n  li {\n    margin-bottom: var(--space-xs, 4px);\n    color: var(--color-text-secondary, #666);\n  }\n\n  .import-progress {\n    margin-top: var(--space-sm, 8px);\n    color: var(--color-primary, #1a5276);\n    font-size: 0.85rem;\n    font-style: italic;\n  }\n\n  .import-mode {\n    color: var(--color-primary, #1a5276);\n    font-style: italic;\n  }\n</style>';
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/admin-settings-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 27
exports: ["AdminSettingsPage"]
---
*/
// ===== client/pages/admin-settings-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Admin Settings page.
 * Settings UI including Excel PTO spreadsheet import.
 *
 * When ENABLE_BROWSER_IMPORT is true, the Excel file is parsed entirely
 * in the browser (via ExcelJS loaded on demand) and only the resulting
 * JSON payload is sent to the server. This avoids OOM on the 512 MB
 * production droplet.
 */
export declare class AdminSettingsPage
  extends BaseComponent
  implements PageComponent
{
  private importStatus;
  private isImporting;
  private importProgress;
  onRouteEnter(): Promise<void>;
  protected render(): string;
  protected setupEventDelegation(): void;
  protected handleDelegatedSubmit(e: Event): void;
  /** Server-side import: upload .xlsx file as multipart form data. */
  private handleImport;
  /** Browser-side import: parse .xlsx locally, send JSON to bulk API. */
  private handleBrowserImport;
  /** Render the import result into the status area. */
  private renderImportResult;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/admin-settings-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/admin-settings-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/current-year-summary-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/current-year-summary-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding-bottom: var(--space-lg);\n  }\n\n  .page-heading {\n    text-align: center;\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text);\n    margin: var(--space-md) 0 var(--space-sm) 0;\n  }\n\n  .sticky-balance {\n    position: sticky;\n    top: 56px;\n    z-index: 1;\n    background: var(--color-background);\n    margin-bottom: var(--space-sm);\n  }\n\n  .pto-summary {\n    display: flex;\n    flex-direction: column;\n    gap: var(--space-md);\n  }\n\n  @media (min-width: 768px) {\n    .pto-summary {\n      display: grid;\n      grid-template-columns: minmax(18em, 1fr) minmax(24em, 2fr);\n      gap: var(--space-md);\n    }\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/current-year-summary-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 17
exports: ["CurrentYearSummaryPage"]
---
*/
// ===== client/pages/current-year-summary-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Current Year Summary page.
 * Displays PTO summary cards, employee info, bucket details.
 * `navigate-to-month` events navigate to the Submit Time Off page.
 */
export declare class CurrentYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  private _loaderData;
  onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void>;
  protected render(): string;
  private populateCards;
  private _cardListenersSetup;
  private setupCardListeners;
  private computeAccrualFields;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/current-year-summary-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/current-year-summary-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/index.d.ts"
dependencies: []
lineCount: 10
exports: []
---
*/
// ===== client/pages/index.d.ts =====
export { LoginPage } from "./login-page/index.js";
export { SubmitTimeOffPage } from "./submit-time-off-page/index.js";
export { CurrentYearSummaryPage } from "./current-year-summary-page/index.js";
export { PriorYearSummaryPage } from "./prior-year-summary-page/index.js";
export { NotFoundPage } from "./not-found-page/index.js";
export { AdminEmployeesPage } from "./admin-employees-page/index.js";
export { AdminPtoRequestsPage } from "./admin-pto-requests-page/index.js";
export { AdminMonthlyReviewPage } from "./admin-monthly-review-page/index.js";
export { AdminSettingsPage } from "./admin-settings-page/index.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/login-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/login-page/css.d.ts =====
export declare const styles =
  '<style>\n  :host {\n    display: block;\n    max-width: 400px;\n    margin: 0 auto;\n    padding: var(--space-lg, 24px);\n  }\n\n  h2 {\n    text-align: center;\n    color: var(--color-text, #333);\n    margin-bottom: var(--space-md, 16px);\n  }\n\n  form {\n    display: flex;\n    flex-direction: column;\n    gap: var(--space-sm, 8px);\n  }\n\n  label {\n    font-weight: var(--font-weight-semibold, 600);\n    color: var(--color-text, #333);\n  }\n\n  input[type="email"] {\n    padding: var(--space-sm, 8px);\n    border: 1px solid var(--color-border, #ccc);\n    border-radius: var(--border-radius, 4px);\n    font-size: var(--font-size-md, 1rem);\n  }\n\n  button[type="submit"] {\n    padding: var(--space-sm, 8px) var(--space-md, 16px);\n    background: var(--color-primary, #007bff);\n    color: white;\n    border: none;\n    border-radius: var(--border-radius, 4px);\n    cursor: pointer;\n    font-size: var(--font-size-md, 1rem);\n    margin-top: var(--space-sm, 8px);\n  }\n\n  button[type="submit"]:hover {\n    opacity: 0.9;\n  }\n\n  .message {\n    margin-top: var(--space-md, 16px);\n    padding: var(--space-sm, 8px);\n    border: 1px solid var(--color-border, #ccc);\n    border-radius: var(--border-radius, 4px);\n    background: var(--color-surface, #f9f9f9);\n  }\n\n  .message a {\n    word-break: break-all;\n    color: var(--color-primary, #007bff);\n  }\n\n  .hidden {\n    display: none;\n  }\n\n  .policy-link {\n    margin-top: var(--space-lg, 24px);\n    text-align: center;\n  }\n\n  .policy-link a {\n    color: var(--color-primary, #007bff);\n    text-decoration: none;\n    font-size: var(--font-size-sm, 0.875rem);\n  }\n\n  .policy-link a:hover {\n    text-decoration: underline;\n  }\n</style>';
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/login-page/index.d.ts"
dependencies: ["../../auth/auth-service.js","../../components/base-component.js","../../router/types.js"]
lineCount: 20
exports: ["LoginPage"]
---
*/
// ===== client/pages/login-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { AuthService } from "../../auth/auth-service.js";
/**
 * Login page component.
 * Displays a magic-link login form that delegates authentication to AuthService.
 * Fires `login-success` (bubbles, composed) with user data on successful auth.
 */
export declare class LoginPage extends BaseComponent implements PageComponent {
  private _message;
  private _magicLink;
  private _authService;
  set authService(svc: AuthService);
  onRouteEnter(): void;
  protected render(): string;
  private renderMessage;
  protected handleDelegatedSubmit(e: Event): void;
  private handleLogin;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/login-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/login-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/not-found-page/index.d.ts"
dependencies: ["../../components/base-component.js"]
lineCount: 8
exports: ["NotFoundPage"]
---
*/
// ===== client/pages/not-found-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
/**
 * 404 Not Found page.
 */
export declare class NotFoundPage extends BaseComponent {
  protected render(): string;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/prior-year-summary-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/prior-year-summary-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding: var(--space-md, 16px);\n    padding-bottom: var(--space-lg);\n  }\n\n  .page-heading {\n    text-align: center;\n    font-size: var(--font-size-xl);\n    font-weight: var(--font-weight-semibold);\n    color: var(--color-text);\n    margin: var(--space-md) 0 var(--space-sm) 0;\n  }\n\n  .sticky-balance {\n    position: sticky;\n    top: 56px;\n    z-index: 1;\n    background: var(--color-background);\n    margin-bottom: var(--space-sm);\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/prior-year-summary-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 14
exports: ["PriorYearSummaryPage"]
---
*/
// ===== client/pages/prior-year-summary-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Prior Year Summary page.
 * Wraps `<prior-year-review>` and injects loader data.
 * Displays a page heading and sticky annual summary bar.
 */
export declare class PriorYearSummaryPage
  extends BaseComponent
  implements PageComponent
{
  private _loaderData;
  onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void>;
  private getAnnualTotals;
  protected render(): string;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/prior-year-summary-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/prior-year-summary-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/submit-time-off-page/css.d.ts"
dependencies: []
lineCount: 2
exports: ["styles"]
---
*/
// ===== client/pages/submit-time-off-page/css.d.ts =====
export declare const styles =
  "<style>\n  :host {\n    display: block;\n    padding: var(--space-md, 16px);\n    /* Reserve space for the sticky toolbar at the bottom */\n    padding-bottom: 72px;\n  }\n\n  month-summary {\n    position: sticky;\n    top: 80px;\n    z-index: 1;\n    background: var(--color-surface);\n  }\n\n  pto-entry-form {\n    margin-top: 40px;\n  }\n\n  /* \u2500\u2500 Stage 4: Dim calendar when locked \u2500\u2500 */\n\n  pto-entry-form.locked {\n    opacity: 0.5;\n  }\n\n  /* \u2500\u2500 Stage 1: Sticky toolbar at bottom of viewport \u2500\u2500 */\n\n  .toolbar {\n    position: fixed;\n    bottom: 0;\n    left: 0;\n    right: 0;\n    z-index: 10;\n    background: var(--color-surface);\n    border-top: 1px solid var(--color-border);\n    box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);\n  }\n\n  /* \u2500\u2500 Buttons \u2500\u2500 */\n\n  .btn {\n    padding: var(--space-sm, 8px) var(--space-md, 16px);\n    border: none;\n    border-radius: var(--border-radius, 4px);\n    cursor: pointer;\n    font-size: var(--font-size-md, 1rem);\n    transition: opacity 0.2s ease, background-color 0.2s ease;\n  }\n\n  /* Stage 2: Submit is the most prominent */\n\n  .btn-primary {\n    background: var(--color-primary, #007bff);\n    color: white;\n    font-weight: 600;\n  }\n\n  .btn-primary:hover {\n    opacity: 0.9;\n  }\n\n  /* Stage 2: Cancel is ghost/outlined */\n\n  .btn-secondary {\n    background: transparent;\n    color: var(--color-secondary, #6c757d);\n    border: 1px solid var(--color-secondary, #6c757d);\n  }\n\n  .btn-secondary:hover {\n    background: var(--color-secondary, #6c757d);\n    color: white;\n  }\n\n  .btn:disabled {\n    opacity: 0.5;\n    cursor: not-allowed;\n  }\n\n  /* Stage 2: Lock button toned down \u2014 neutral surface color */\n\n  .btn-lock {\n    background: var(--color-surface-hover, #e5e7eb);\n    color: var(--color-text, #333);\n    border: 1px solid var(--color-border);\n  }\n\n  .btn-lock:hover {\n    background: var(--color-warning, #ffc107);\n    color: var(--color-on-warning, #000);\n  }\n\n  .btn-unlock {\n    background: var(--color-info, #17a2b8);\n    color: white;\n  }\n\n  .btn-unlock:hover {\n    opacity: 0.9;\n  }\n\n  /* \u2500\u2500 Lock banner \u2500\u2500 */\n\n  .lock-banner {\n    padding: var(--space-sm, 8px) var(--space-md, 16px);\n    border-radius: var(--border-radius, 4px);\n    margin-bottom: var(--space-md, 16px);\n    font-weight: 500;\n  }\n\n  .lock-banner.hidden {\n    display: none;\n  }\n\n  .banner-employee {\n    background: rgb(255 193 7 / 15%);\n    border: 1px solid var(--color-warning, #ffc107);\n    color: var(--color-text, #333);\n  }\n\n  .banner-admin {\n    background: rgb(220 53 69 / 10%);\n    border: 1px solid var(--color-error, #dc3545);\n    color: var(--color-error, #dc3545);\n  }\n\n  /* \u2500\u2500 Balance summary heading \u2500\u2500 */\n\n  .balance-heading {\n    font-size: var(--font-size-xs, 12px);\n    color: var(--color-text-secondary);\n    text-transform: uppercase;\n    letter-spacing: 0.05em;\n    text-align: center;\n    margin-bottom: var(--space-xs, 4px);\n  }\n\n  @media (prefers-reduced-motion: reduce) {\n    .btn {\n      transition: none;\n    }\n  }\n</style>";
//# sourceMappingURL=css.d.ts.map

/*
---
file: "client/pages/submit-time-off-page/index.d.ts"
dependencies: ["../../components/base-component.js","../../router/types.js"]
lineCount: 63
exports: ["SubmitTimeOffPage"]
---
*/
// ===== client/pages/submit-time-off-page/index.d.ts =====
import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
/**
 * Submit Time Off page.
 * Wraps `<pto-entry-form>` and `<month-summary>` with submit/cancel actions.
 * Receives PTO status + entries from the route loader.
 */
export declare class SubmitTimeOffPage
  extends BaseComponent
  implements PageComponent
{
  private api;
  private _loaderData;
  private _lockState;
  private _currentAckId;
  private _adminLockInfo;
  private _acknowledgements;
  connectedCallback(): void;
  onRouteEnter(
    _params: Record<string, string>,
    search: URLSearchParams,
    loaderData?: unknown,
  ): Promise<void>;
  onRouteLeave(): boolean;
  protected render(): string;
  private _customEventsSetup;
  protected setupEventDelegation(): void;
  protected handleDelegatedClick(e: Event): void;
  private getPtoForm;
  private getBalanceSummary;
  private updateBalanceSummary;
  private handleCancel;
  private handleSubmit;
  private clearDeltas;
  private handleSelectionChanged;
  private handlePtoDataRequest;
  private handlePtoRequestSubmit;
  /**
   * Returns the YYYY-MM string for the month the calendar is currently showing.
   */
  private getDisplayedMonth;
  /**
   * Fetch acknowledgements + admin lock state for the displayed month
   * and apply the corresponding UI state.
   */
  private refreshLockState;
  /**
   * Try to determine if the admin has locked this month.
   * We attempt a lightweight check: if PTO submission would return
   * month_locked, we know the admin has locked it. We leverage
   * the monthly-summary endpoint which is available to employees.
   * For now, we try to detect via the existing acknowledgements data flow.
   */
  private checkAdminLock;
  /**
   * Apply visual state based on current _lockState.
   * In multi-calendar mode, applies per-card locking based on acknowledgements
   * so only months the employee actually locked are dimmed/disabled.
   */
  private applyLockStateUI;
  /**
   * Apply toolbar button and banner state based on current _lockState.
   */
  private applyToolbarState;
  /**
   * Toggle lock/unlock for the displayed month.
   */
  private handleToggleLock;
}
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/pages/submit-time-off-page/test.d.ts"
dependencies: []
lineCount: 2
exports: ["playground"]
---
*/
// ===== client/pages/submit-time-off-page/test.d.ts =====
export declare function playground(): void;
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/pages/test.d.ts"
dependencies: ["./admin-employees-page/test.js","./admin-monthly-review-page/test.js","./admin-pto-requests-page/test.js","./admin-settings-page/test.js","./current-year-summary-page/test.js","./login-page/test.js","./prior-year-summary-page/test.js","./submit-time-off-page/test.js"]
lineCount: 10
exports: []
---
*/
// ===== client/pages/test.d.ts =====
import { playground as loginPage } from "./login-page/test.js";
import { playground as submitTimeOffPage } from "./submit-time-off-page/test.js";
import { playground as currentYearSummaryPage } from "./current-year-summary-page/test.js";
import { playground as priorYearSummaryPage } from "./prior-year-summary-page/test.js";
import { playground as adminEmployeesPage } from "./admin-employees-page/test.js";
import { playground as adminPtoRequestsPage } from "./admin-pto-requests-page/test.js";
import { playground as adminMonthlyReviewPage } from "./admin-monthly-review-page/test.js";
import { playground as adminSettingsPage } from "./admin-settings-page/test.js";
export {
  loginPage,
  submitTimeOffPage,
  currentYearSummaryPage,
  priorYearSummaryPage,
  adminEmployeesPage,
  adminPtoRequestsPage,
  adminMonthlyReviewPage,
  adminSettingsPage,
};
//# sourceMappingURL=test.d.ts.map

/*
---
file: "client/router/index.d.ts"
dependencies: []
lineCount: 4
exports: []
---
*/
// ===== client/router/index.d.ts =====
export { Router } from "./router.js";
export { appRoutes } from "./routes.js";
export type { Route, AppRoutes, PageComponent, RouteMeta } from "./types.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "client/router/router.d.ts"
dependencies: ["../auth/auth-service.js","./types.js"]
lineCount: 41
exports: ["Router"]
---
*/
// ===== client/router/router.d.ts =====
import type { AuthService } from "../auth/auth-service.js";
import type { AppRoutes, Route } from "./types.js";
interface MatchResult {
  route: Route;
  params: Record<string, string>;
}
/**
 * Lightweight client-side router using the History API.
 *
 * - Matches paths with `:param` segments and a `*` wildcard catch-all.
 * - Enforces auth gates via `meta.requiresAuth` / `meta.roles`.
 * - Calls optional route `loader` before rendering.
 * - Manages a single outlet element, calling `onRouteEnter` / `onRouteLeave`
 *   lifecycle hooks on page components.
 */
export declare class Router {
  private routes;
  private outlet;
  private currentComponent;
  private authService;
  private started;
  constructor(routes: AppRoutes, outlet: HTMLElement, authService: AuthService);
  /** Start listening for navigation. Renders the current URL. */
  start(): void;
  /** Navigate to a path. Updates History API and renders. */
  navigate(path: string): Promise<void>;
  /** Get the current path from the URL. */
  getCurrentPath(): string;
  /** Match a path against the route table. */
  matchRoute(urlPath: string): MatchResult | null;
  private flattenRoutes;
  /**
   * Match a route path pattern against a URL path.
   * Returns extracted params or null on mismatch.
   */
  private matchPath;
  private renderCurrentUrl;
  private renderComponent;
}
export {};
//# sourceMappingURL=router.d.ts.map

/*
---
file: "client/router/routes.d.ts"
dependencies: ["./types.js"]
lineCount: 3
exports: ["appRoutes"]
---
*/
// ===== client/router/routes.d.ts =====
import type { AppRoutes } from "./types.js";
export declare const appRoutes: AppRoutes;
//# sourceMappingURL=routes.d.ts.map

/*
---
file: "client/router/types.d.ts"
dependencies: []
lineCount: 41
exports: ["PageComponent","RouteMeta","Route","AppRoutes"]
---
*/
// ===== client/router/types.d.ts =====
/** Utility: extract ':param' segments from a path string. */
type PathParam<T extends string> = T extends `${infer _}:${infer P}/${infer R}`
  ? P | PathParam<R>
  : T extends `${infer _}:${infer P}`
    ? P
    : never;
type ParamsFromPath<TPath extends string> = Record<PathParam<TPath>, string>;
/** Lifecycle hooks a page component can implement. */
export interface PageComponent extends HTMLElement {
  /**
   * Called by the router after the element is placed in the DOM.
   * Receives route params and the result of the route's loader (if any).
   */
  onRouteEnter?(
    params: Record<string, string>,
    search: URLSearchParams,
    loaderData?: unknown,
  ): void | Promise<void>;
  /**
   * Called by the router when navigating away.
   * Return `false` to block navigation (unsaved changes).
   */
  onRouteLeave?(): boolean | Promise<boolean>;
}
export interface RouteMeta {
  title?: string;
  requiresAuth?: boolean;
  roles?: string[];
  icon?: string;
  [key: string]: unknown;
}
export interface Route<TPath extends string = string> {
  path: TPath;
  /** Tag name of the page web component to render (e.g. "login-page"). */
  component: string;
  /** Human-readable label for navigation menus. */
  name?: string;
  meta?: RouteMeta;
  /** Async data loader invoked before the component is rendered. */
  loader?: (
    params: ParamsFromPath<TPath>,
    search: URLSearchParams,
  ) => Promise<unknown> | unknown;
  /** Component tag to render on loader/render error. */
  errorComponent?: string;
  /** Component tag to show while loader is pending. */
  pendingComponent?: string;
  children?: Route<string>[];
}
export type AppRoutes = Route<string>[];
export {};
//# sourceMappingURL=types.d.ts.map

/*
---
file: "client/shared/activityTracker.d.ts"
dependencies: []
lineCount: 13
exports: ["isFirstSessionVisit","updateActivityTimestamp"]
---
*/
// ===== client/shared/activityTracker.d.ts =====
/**
 * Checks whether the current visit qualifies as a new session.
 * A new session is detected when 8+ hours have elapsed since the
 * last recorded activity timestamp (or no timestamp exists).
 */
export declare function isFirstSessionVisit(): boolean;
/**
 * Updates the activity timestamp to the current time.
 * Call after the session-start check (regardless of result)
 * to keep the rolling window accurate.
 */
export declare function updateActivityTimestamp(): void;
//# sourceMappingURL=activityTracker.d.ts.map

/*
---
file: "client/shared/aggregate-pto-requests.d.ts"
dependencies: []
lineCount: 47
exports: ["PTORequest","AggregatedPTORequest","aggregatePTORequests"]
---
*/
// ===== client/shared/aggregate-pto-requests.d.ts =====
/**
 * Aggregates PTO requests with the same employee, same PTO type, and
 * consecutive work days into single grouped entries.
 *
 * Consecutive work days = Monday–Friday with no calendar gaps (weekends
 * are skipped but considered consecutive; holidays are NOT considered).
 */
export interface PTORequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}
/** A group of consecutive-workday requests collapsed into one card. */
export interface AggregatedPTORequest {
  /** All original request IDs in this group. */
  requestIds: number[];
  employeeId: number;
  employeeName: string;
  /** Earliest date among grouped requests. */
  startDate: string;
  /** Latest date among grouped requests. */
  endDate: string;
  type: PTORequest["type"];
  /** Sum of hours across all grouped requests. */
  hours: number;
  status: PTORequest["status"];
  /** Earliest createdAt from grouped requests. */
  createdAt: string;
}
/**
 * Aggregate an array of PTO requests.
 *
 * Requests with the same `employeeId` + `type` + consecutive work days
 * are merged into a single `AggregatedPTORequest`. Non-consecutive or
 * different-type requests remain as separate entries.
 *
 * Input order is preserved per employee — groups appear in the order of
 * the earliest request date within each group.
 */
export declare function aggregatePTORequests(
  requests: PTORequest[],
): AggregatedPTORequest[];
//# sourceMappingURL=aggregate-pto-requests.d.ts.map

/*
---
file: "client/shared/atomic-css.d.ts"
dependencies: []
lineCount: 7
exports: ["ATOMIC_CSS"]
---
*/
// ===== client/shared/atomic-css.d.ts =====
/**
 * Shared atomic CSS utilities for web components.
 * These utilities provide common sizing, spacing, and layout classes
 * that can be included in component stylesheets.
 */
export declare const ATOMIC_CSS =
  "\n/* Width utilities */\n.w-8 {\n  width: 32px;\n}\n\n.w-10 {\n  width: 40px;\n}\n\n.w-12 {\n  width: 48px;\n}\n\n.w-14 {\n  width: 56px;\n}\n\n.w-16 {\n  width: 64px;\n}\n\n/* Height utilities */\n.h-8 {\n  height: 32px;\n}\n\n.h-10 {\n  height: 40px;\n}\n\n.h-12 {\n  height: 48px;\n}\n\n.h-14 {\n  height: 56px;\n}\n\n.h-16 {\n  height: 64px;\n}\n";
//# sourceMappingURL=atomic-css.d.ts.map

/*
---
file: "client/shared/notificationService.d.ts"
dependencies: ["../../shared/api-models.js","../APIClient.js"]
lineCount: 26
exports: ["NotificationService"]
---
*/
// ===== client/shared/notificationService.d.ts =====
import { APIClient } from "../APIClient.js";
import type { NotificationItem } from "../../shared/api-models.js";
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
export declare class NotificationService {
  private api;
  private _unread;
  constructor(api: APIClient);
  /** Fetch unread notifications from the server. */
  fetchUnread(): Promise<NotificationItem[]>;
  /** Mark a single notification as read (user explicitly dismissed it). */
  markRead(id: number): Promise<void>;
  /** Get the current unread notifications (from last fetch). */
  get unread(): ReadonlyArray<NotificationItem>;
  /** Auto-dismiss timeout in milliseconds. */
  get autoDismissMs(): number;
}
//# sourceMappingURL=notificationService.d.ts.map

/*
---
file: "client/shared/pto-types.d.ts"
dependencies: []
lineCount: 25
exports: ["PTO_TYPES"]
---
*/
// ===== client/shared/pto-types.d.ts =====
/**
 * PTO type configuration constants used across components and tests.
 */
export declare const PTO_TYPES: readonly [
  {
    readonly label: "PTO";
    readonly attr: "pto-hours";
    readonly cssClass: "summary-pto";
    readonly deltaKey: "PTO";
  },
  {
    readonly label: "Sick";
    readonly attr: "sick-hours";
    readonly cssClass: "summary-sick";
    readonly deltaKey: "Sick";
  },
  {
    readonly label: "Bereavement";
    readonly attr: "bereavement-hours";
    readonly cssClass: "summary-bereavement";
    readonly deltaKey: "Bereavement";
  },
  {
    readonly label: "Jury Duty";
    readonly attr: "jury-duty-hours";
    readonly cssClass: "summary-jury-duty";
    readonly deltaKey: "Jury Duty";
  },
];
//# sourceMappingURL=pto-types.d.ts.map

/*
---
file: "client/test.d.ts"
dependencies: []
lineCount: 26
exports: ["TestApi","initTestPage","TestWorkflow"]
---
*/
// ===== client/test.d.ts =====
/**
 * Test workflow class for test.html - handles automated testing of the employee workflow.
 * All logic lives here; test.html is declarative HTML only.
 */
export interface TestApi {
  post(endpoint: string, data: any): Promise<any>;
  get(endpoint: string): Promise<any>;
}
/**
 * Entry point for test.html — call from a minimal inline script.
 * Creates the mock API, starts the workflow test, and initialises the theme tester.
 */
export declare function initTestPage(): void;
export declare class TestWorkflow {
  private api;
  private currentStep;
  private testSteps;
  constructor(api: TestApi);
  private updateProgress;
  private markStepCompleted;
  private setupEventHandlers;
  private setupPTOCalendarIntegration;
  private initializeProgressDisplay;
  private runWorkflowTest;
}
//# sourceMappingURL=test.d.ts.map

/*
---
file: "server/entities/Acknowledgement.d.ts"
dependencies: ["./Employee.js"]
lineCount: 11
exports: ["Acknowledgement"]
---
*/
// ===== server/entities/Acknowledgement.d.ts =====
import { Employee } from "./Employee.js";
export declare class Acknowledgement {
  id: number;
  employee_id: number;
  month: string;
  acknowledged_at: Date;
  note: string | null;
  status: string | null;
  employee: Employee;
}
//# sourceMappingURL=Acknowledgement.d.ts.map

/*
---
file: "server/entities/AdminAcknowledgement.d.ts"
dependencies: ["./Employee.js"]
lineCount: 11
exports: ["AdminAcknowledgement"]
---
*/
// ===== server/entities/AdminAcknowledgement.d.ts =====
import { Employee } from "./Employee.js";
export declare class AdminAcknowledgement {
  id: number;
  employee_id: number;
  month: string;
  admin_id: number;
  acknowledged_at: Date;
  employee: Employee;
  admin: Employee;
}
//# sourceMappingURL=AdminAcknowledgement.d.ts.map

/*
---
file: "server/entities/Employee.d.ts"
dependencies: ["./Acknowledgement.js","./AdminAcknowledgement.js","./MonthlyHours.js","./PtoEntry.js"]
lineCount: 21
exports: ["Employee"]
---
*/
// ===== server/entities/Employee.d.ts =====
import { PtoEntry } from "./PtoEntry.js";
import { MonthlyHours } from "./MonthlyHours.js";
import { Acknowledgement } from "./Acknowledgement.js";
import { AdminAcknowledgement } from "./AdminAcknowledgement.js";
export declare class Employee {
  id: number;
  name: string;
  identifier: string;
  pto_rate: number;
  carryover_hours: number;
  hire_date: Date;
  role: string;
  hash: string;
  ptoEntries: PtoEntry[];
  approvedPtoEntries: PtoEntry[];
  monthlyHours: MonthlyHours[];
  acknowledgements: Acknowledgement[];
  acknowledgedByAdmins: AdminAcknowledgement[];
  adminAcknowledgements: AdminAcknowledgement[];
}
//# sourceMappingURL=Employee.d.ts.map

/*
---
file: "server/entities/MonthlyHours.d.ts"
dependencies: ["./Employee.js"]
lineCount: 10
exports: ["MonthlyHours"]
---
*/
// ===== server/entities/MonthlyHours.d.ts =====
import { Employee } from "./Employee.js";
export declare class MonthlyHours {
  id: number;
  employee_id: number;
  month: string;
  hours_worked: number;
  submitted_at: Date;
  employee: Employee;
}
//# sourceMappingURL=MonthlyHours.d.ts.map

/*
---
file: "server/entities/PtoEntry.d.ts"
dependencies: ["./Employee.js"]
lineCount: 14
exports: ["PtoEntry"]
---
*/
// ===== server/entities/PtoEntry.d.ts =====
import { Employee } from "./Employee.js";
export declare class PtoEntry {
  id: number;
  employee_id: number;
  date: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  approved_by: number | null;
  notes: string | null;
  created_at: Date;
  employee: Employee;
  approvedBy: Employee | null;
}
//# sourceMappingURL=PtoEntry.d.ts.map

/*
---
file: "shared/SHEET_TEMPLATE.d.ts"
dependencies: []
lineCount: 2923
exports: ["SHEET_TEMPLATE"]
---
*/
// ===== shared/SHEET_TEMPLATE.d.ts =====
export declare const SHEET_TEMPLATE: {
  sheets: {
    "Corey Alix": {
      cells: {
        B2: {
          value: number;
        };
        C2: {
          value: number;
        };
        D2: {
          value: string;
        };
        J2: {
          value: string;
        };
        K2: {
          value: string;
        };
        L2: {
          value: string;
        };
        M2: {
          value: string;
        };
        N2: {
          value: string;
        };
        O2: {
          value: string;
        };
        P2: {
          value: string;
        };
        R2: {
          value: string;
        };
        S2: {
          value: string;
        };
        T2: {
          value: string;
        };
        U2: {
          value: string;
        };
        V2: {
          value: string;
        };
        W2: {
          value: string;
        };
        X2: {
          value: string;
        };
        C3: {
          value: number;
        };
        D4: {
          value: string;
        };
        E4: {
          value: string;
        };
        F4: {
          value: string;
        };
        L4: {
          value: string;
        };
        M4: {
          value: string;
        };
        N4: {
          value: string;
        };
        T4: {
          value: string;
        };
        U4: {
          value: string;
        };
        V4: {
          value: string;
        };
        B5: {
          value: string;
        };
        C5: {
          value: string;
        };
        D5: {
          value: string;
        };
        E5: {
          value: string;
        };
        F5: {
          value: string;
        };
        G5: {
          value: string;
        };
        H5: {
          value: string;
        };
        J5: {
          value: string;
        };
        K5: {
          value: string;
        };
        L5: {
          value: string;
        };
        M5: {
          value: string;
        };
        N5: {
          value: string;
        };
        O5: {
          value: string;
        };
        P5: {
          value: string;
        };
        R5: {
          value: string;
        };
        S5: {
          value: string;
        };
        T5: {
          value: string;
        };
        U5: {
          value: string;
        };
        V5: {
          value: string;
        };
        W5: {
          value: string;
        };
        X5: {
          value: string;
        };
        B6: {
          formula: string;
        };
        E6: {
          value: number;
        };
        F6: {
          value: number;
        };
        G6: {
          value: number;
        };
        H6: {
          value: number;
        };
        J6: {
          formula: string;
        };
        N6: {
          value: number;
        };
        O6: {
          value: number;
        };
        P6: {
          value: number;
        };
        R6: {
          formula: string;
        };
        S6: {
          value: number;
          color: string;
        };
        T6: {
          value: number;
        };
        U6: {
          value: number;
        };
        V6: {
          value: number;
        };
        W6: {
          value: number;
        };
        X6: {
          value: number;
        };
        B7: {
          value: number;
        };
        C7: {
          value: number;
        };
        D7: {
          value: number;
        };
        E7: {
          value: number;
        };
        F7: {
          value: number;
        };
        G7: {
          value: number;
        };
        H7: {
          value: number;
        };
        J7: {
          value: number;
        };
        K7: {
          value: number;
        };
        L7: {
          value: number;
        };
        M7: {
          value: number;
        };
        N7: {
          value: number;
        };
        O7: {
          value: number;
        };
        P7: {
          value: number;
        };
        R7: {
          value: number;
        };
        S7: {
          value: number;
        };
        T7: {
          value: number;
        };
        U7: {
          value: number;
        };
        V7: {
          value: number;
        };
        W7: {
          value: number;
        };
        X7: {
          value: number;
        };
        B8: {
          value: number;
        };
        C8: {
          value: number;
        };
        D8: {
          value: number;
        };
        E8: {
          value: number;
        };
        F8: {
          value: number;
        };
        G8: {
          value: number;
        };
        H8: {
          value: number;
        };
        J8: {
          value: number;
        };
        K8: {
          value: number;
        };
        L8: {
          value: number;
        };
        M8: {
          value: number;
        };
        N8: {
          value: number;
        };
        O8: {
          value: number;
        };
        P8: {
          value: number;
        };
        R8: {
          value: number;
        };
        S8: {
          value: number;
        };
        T8: {
          value: number;
        };
        U8: {
          value: number;
        };
        V8: {
          value: number;
        };
        W8: {
          value: number;
        };
        X8: {
          value: number;
        };
        Z8: {
          value: string;
        };
        AA8: {
          value: string;
        };
        B9: {
          value: number;
        };
        C9: {
          value: number;
        };
        D9: {
          value: number;
        };
        E9: {
          value: number;
        };
        F9: {
          value: number;
        };
        G9: {
          value: number;
        };
        H9: {
          value: number;
        };
        J9: {
          value: number;
        };
        K9: {
          value: number;
        };
        L9: {
          value: number;
        };
        M9: {
          value: number;
        };
        N9: {
          value: number;
        };
        O9: {
          value: number;
        };
        P9: {
          value: number;
        };
        R9: {
          value: number;
        };
        S9: {
          value: number;
          color: string;
        };
        T9: {
          value: number;
          color: string;
        };
        U9: {
          value: number;
          color: string;
        };
        V9: {
          value: number;
          color: string;
        };
        W9: {
          value: number;
          color: string;
        };
        X9: {
          value: number;
        };
        Z9: {
          value: string;
          color: string;
        };
        AA9: {
          value: string;
          color: string;
        };
        B10: {
          value: number;
        };
        C10: {
          value: number;
        };
        D10: {
          value: number;
        };
        E10: {
          value: number;
        };
        F10: {
          value: number;
        };
        G10: {
          value: number;
        };
        J10: {
          value: number;
        };
        K10: {
          value: number;
          color: string;
        };
        L10: {
          value: number;
        };
        M10: {
          value: number;
        };
        N10: {
          value: number;
        };
        O10: {
          value: number;
        };
        P10: {
          value: number;
        };
        R10: {
          value: number;
        };
        S10: {
          value: number;
          color: string;
        };
        T10: {
          value: number;
        };
        Z10: {
          value: string;
          color: string;
        };
        AA10: {
          value: string;
          color: string;
        };
        Z11: {
          value: string;
          color: string;
        };
        AA11: {
          value: string;
          color: string;
        };
        Z12: {
          value: string;
          color: string;
        };
        AA12: {
          value: string;
          color: string;
        };
        D13: {
          value: string;
        };
        E13: {
          value: string;
        };
        F13: {
          value: string;
        };
        L13: {
          value: string;
        };
        M13: {
          value: string;
        };
        N13: {
          value: string;
        };
        T13: {
          value: string;
        };
        U13: {
          value: string;
        };
        V13: {
          value: string;
        };
        Z13: {
          value: string;
          color: string;
        };
        AA13: {
          value: string;
          color: string;
        };
        B14: {
          value: string;
        };
        C14: {
          value: string;
        };
        D14: {
          value: string;
        };
        E14: {
          value: string;
        };
        F14: {
          value: string;
        };
        G14: {
          value: string;
        };
        H14: {
          value: string;
        };
        J14: {
          value: string;
        };
        K14: {
          value: string;
        };
        L14: {
          value: string;
        };
        M14: {
          value: string;
        };
        N14: {
          value: string;
        };
        O14: {
          value: string;
        };
        P14: {
          value: string;
        };
        R14: {
          value: string;
        };
        S14: {
          value: string;
        };
        T14: {
          value: string;
        };
        U14: {
          value: string;
        };
        V14: {
          value: string;
        };
        W14: {
          value: string;
        };
        X14: {
          value: string;
        };
        Z14: {
          value: string;
          color: string;
        };
        AA14: {
          value: string;
          color: string;
        };
        B15: {
          formula: string;
        };
        H15: {
          value: number;
        };
        J15: {
          formula: string;
        };
        K15: {
          value: number;
        };
        L15: {
          value: number;
        };
        M15: {
          value: number;
        };
        N15: {
          value: number;
        };
        O15: {
          value: number;
        };
        P15: {
          value: number;
        };
        R15: {
          formula: string;
        };
        U15: {
          value: number;
        };
        V15: {
          value: number;
        };
        W15: {
          value: number;
        };
        X15: {
          value: number;
        };
        B16: {
          value: number;
        };
        C16: {
          value: number;
        };
        D16: {
          value: number;
        };
        E16: {
          value: number;
        };
        F16: {
          value: number;
        };
        G16: {
          value: number;
        };
        H16: {
          value: number;
        };
        J16: {
          value: number;
        };
        K16: {
          value: number;
        };
        L16: {
          value: number;
        };
        M16: {
          value: number;
        };
        N16: {
          value: number;
        };
        O16: {
          value: number;
        };
        P16: {
          value: number;
        };
        R16: {
          value: number;
        };
        S16: {
          value: number;
        };
        T16: {
          value: number;
        };
        U16: {
          value: number;
        };
        V16: {
          value: number;
        };
        W16: {
          value: number;
        };
        X16: {
          value: number;
        };
        B17: {
          value: number;
        };
        C17: {
          value: number;
        };
        D17: {
          value: number;
        };
        E17: {
          value: number;
        };
        F17: {
          value: number;
        };
        G17: {
          value: number;
        };
        H17: {
          value: number;
        };
        J17: {
          value: number;
        };
        K17: {
          value: number;
        };
        L17: {
          value: number;
        };
        M17: {
          value: number;
        };
        N17: {
          value: number;
        };
        O17: {
          value: number;
        };
        P17: {
          value: number;
        };
        R17: {
          value: number;
        };
        S17: {
          value: number;
        };
        T17: {
          value: number;
        };
        U17: {
          value: number;
        };
        V17: {
          value: number;
        };
        W17: {
          value: number;
        };
        X17: {
          value: number;
        };
        B18: {
          value: number;
        };
        C18: {
          value: number;
        };
        D18: {
          value: number;
        };
        E18: {
          value: number;
        };
        F18: {
          value: number;
        };
        G18: {
          value: number;
        };
        H18: {
          value: number;
        };
        J18: {
          value: number;
        };
        K18: {
          value: number;
        };
        L18: {
          value: number;
        };
        M18: {
          value: number;
        };
        N18: {
          value: number;
        };
        O18: {
          value: number;
        };
        P18: {
          value: number;
        };
        R18: {
          value: number;
        };
        S18: {
          value: number;
        };
        T18: {
          value: number;
        };
        U18: {
          value: number;
        };
        V18: {
          value: number;
        };
        W18: {
          value: number;
        };
        X18: {
          value: number;
        };
        B19: {
          value: number;
        };
        C19: {
          value: number;
        };
        D19: {
          value: number;
        };
        E19: {
          value: number;
        };
        F19: {
          value: number;
        };
        G19: {
          value: number;
        };
        J19: {
          value: number;
        };
        K19: {
          value: number;
        };
        R19: {
          value: number;
        };
        S19: {
          value: number;
        };
        T19: {
          value: number;
        };
        U19: {
          value: number;
        };
        V19: {
          value: number;
        };
        W19: {
          value: number;
        };
        D22: {
          value: string;
        };
        E22: {
          value: string;
        };
        F22: {
          value: string;
        };
        L22: {
          value: string;
        };
        M22: {
          value: string;
        };
        N22: {
          value: string;
        };
        T22: {
          value: string;
        };
        U22: {
          value: string;
        };
        V22: {
          value: string;
        };
        B23: {
          value: string;
        };
        C23: {
          value: string;
        };
        D23: {
          value: string;
        };
        E23: {
          value: string;
        };
        F23: {
          value: string;
        };
        G23: {
          value: string;
        };
        H23: {
          value: string;
        };
        J23: {
          value: string;
        };
        K23: {
          value: string;
        };
        L23: {
          value: string;
        };
        M23: {
          value: string;
        };
        N23: {
          value: string;
        };
        O23: {
          value: string;
        };
        P23: {
          value: string;
        };
        R23: {
          value: string;
        };
        S23: {
          value: string;
        };
        T23: {
          value: string;
        };
        U23: {
          value: string;
        };
        V23: {
          value: string;
        };
        W23: {
          value: string;
        };
        X23: {
          value: string;
        };
        B24: {
          formula: string;
        };
        H24: {
          value: number;
        };
        J24: {
          formula: string;
        };
        L24: {
          value: number;
        };
        M24: {
          value: number;
        };
        N24: {
          value: number;
          color: string;
        };
        O24: {
          value: number;
          color: string;
        };
        P24: {
          value: number;
        };
        R24: {
          formula: string;
        };
        X24: {
          value: number;
        };
        B25: {
          value: number;
        };
        C25: {
          value: number;
        };
        D25: {
          value: number;
        };
        E25: {
          value: number;
        };
        F25: {
          value: number;
        };
        G25: {
          value: number;
        };
        H25: {
          value: number;
        };
        J25: {
          value: number;
        };
        K25: {
          value: number;
        };
        L25: {
          value: number;
        };
        M25: {
          value: number;
        };
        N25: {
          value: number;
        };
        O25: {
          value: number;
        };
        P25: {
          value: number;
        };
        R25: {
          value: number;
        };
        S25: {
          value: number;
        };
        T25: {
          value: number;
        };
        U25: {
          value: number;
        };
        V25: {
          value: number;
        };
        W25: {
          value: number;
        };
        X25: {
          value: number;
        };
        B26: {
          value: number;
        };
        C26: {
          value: number;
        };
        D26: {
          value: number;
        };
        E26: {
          value: number;
        };
        F26: {
          value: number;
        };
        G26: {
          value: number;
        };
        H26: {
          value: number;
        };
        J26: {
          value: number;
        };
        K26: {
          value: number;
        };
        L26: {
          value: number;
        };
        M26: {
          value: number;
        };
        N26: {
          value: number;
        };
        O26: {
          value: number;
        };
        P26: {
          value: number;
        };
        R26: {
          value: number;
        };
        S26: {
          value: number;
        };
        T26: {
          value: number;
        };
        U26: {
          value: number;
        };
        V26: {
          value: number;
        };
        W26: {
          value: number;
        };
        X26: {
          value: number;
        };
        B27: {
          value: number;
        };
        C27: {
          value: number;
        };
        D27: {
          value: number;
        };
        E27: {
          value: number;
        };
        F27: {
          value: number;
        };
        G27: {
          value: number;
        };
        H27: {
          value: number;
        };
        J27: {
          value: number;
        };
        K27: {
          value: number;
          color: string;
        };
        L27: {
          value: number;
          color: string;
        };
        M27: {
          value: number;
          color: string;
        };
        N27: {
          value: number;
          color: string;
        };
        O27: {
          value: number;
          color: string;
        };
        P27: {
          value: number;
        };
        R27: {
          value: number;
        };
        S27: {
          value: number;
        };
        T27: {
          value: number;
        };
        U27: {
          value: number;
        };
        V27: {
          value: number;
        };
        W27: {
          value: number;
          color: string;
        };
        X27: {
          value: number;
        };
        B28: {
          value: number;
        };
        C28: {
          value: number;
        };
        D28: {
          value: number;
        };
        E28: {
          value: number;
        };
        F28: {
          value: number;
        };
        G28: {
          value: number;
          color: string;
        };
        H28: {
          value: number;
        };
        J28: {
          value: number;
        };
        K28: {
          value: number;
        };
        L28: {
          value: number;
        };
        M28: {
          value: number;
        };
        N28: {
          value: number;
        };
        R28: {
          value: number;
        };
        S28: {
          value: number;
        };
        T28: {
          value: number;
        };
        U28: {
          value: number;
        };
        V28: {
          value: number;
        };
        W28: {
          value: number;
        };
        X28: {
          value: number;
        };
        B29: {
          value: number;
        };
        C29: {
          value: number;
          color: string;
        };
        R29: {
          value: number;
        };
        D31: {
          value: string;
        };
        E31: {
          value: string;
        };
        F31: {
          value: string;
        };
        L31: {
          value: string;
        };
        M31: {
          value: string;
        };
        N31: {
          value: string;
        };
        T31: {
          value: string;
        };
        U31: {
          value: string;
        };
        V31: {
          value: string;
        };
        B32: {
          value: string;
        };
        C32: {
          value: string;
        };
        D32: {
          value: string;
        };
        E32: {
          value: string;
        };
        F32: {
          value: string;
        };
        G32: {
          value: string;
        };
        H32: {
          value: string;
        };
        J32: {
          value: string;
        };
        K32: {
          value: string;
        };
        L32: {
          value: string;
        };
        M32: {
          value: string;
        };
        N32: {
          value: string;
        };
        O32: {
          value: string;
        };
        P32: {
          value: string;
        };
        R32: {
          value: string;
        };
        S32: {
          value: string;
        };
        T32: {
          value: string;
        };
        U32: {
          value: string;
        };
        V32: {
          value: string;
        };
        W32: {
          value: string;
        };
        X32: {
          value: string;
        };
        Y32: {
          value: string;
        };
        Z32: {
          value: string;
        };
        AA32: {
          value: string;
        };
        AB32: {
          value: number;
        };
        B33: {
          formula: string;
        };
        D33: {
          value: number;
          color: string;
        };
        E33: {
          value: number;
        };
        F33: {
          value: number;
        };
        G33: {
          value: number;
        };
        H33: {
          value: number;
        };
        J33: {
          formula: string;
        };
        O33: {
          value: number;
        };
        P33: {
          value: number;
        };
        R33: {
          formula: string;
        };
        S33: {
          value: number;
        };
        T33: {
          value: number;
        };
        U33: {
          value: number;
        };
        V33: {
          value: number;
        };
        W33: {
          value: number;
        };
        X33: {
          value: number;
        };
        Y33: {
          value: string;
        };
        Z33: {
          value: string;
        };
        AA33: {
          value: string;
        };
        B34: {
          value: number;
        };
        C34: {
          value: number;
        };
        D34: {
          value: number;
        };
        E34: {
          value: number;
        };
        F34: {
          value: number;
        };
        G34: {
          value: number;
          color: string;
        };
        H34: {
          value: number;
        };
        J34: {
          value: number;
        };
        K34: {
          value: number;
        };
        L34: {
          value: number;
        };
        M34: {
          value: number;
        };
        N34: {
          value: number;
        };
        O34: {
          value: number;
        };
        P34: {
          value: number;
        };
        R34: {
          value: number;
        };
        S34: {
          value: number;
        };
        T34: {
          value: number;
        };
        U34: {
          value: number;
        };
        V34: {
          value: number;
        };
        W34: {
          value: number;
        };
        X34: {
          value: number;
        };
        Y34: {
          value: string;
        };
        Z34: {
          value: string;
        };
        AA34: {
          value: string;
        };
        AB34: {
          formula: string;
        };
        B35: {
          value: number;
        };
        C35: {
          value: number;
        };
        D35: {
          value: number;
        };
        E35: {
          value: number;
        };
        F35: {
          value: number;
        };
        G35: {
          value: number;
          color: string;
        };
        H35: {
          value: number;
        };
        J35: {
          value: number;
        };
        K35: {
          value: number;
        };
        L35: {
          value: number;
        };
        M35: {
          value: number;
        };
        N35: {
          value: number;
        };
        O35: {
          value: number;
        };
        P35: {
          value: number;
        };
        R35: {
          value: number;
        };
        S35: {
          value: number;
        };
        T35: {
          value: number;
        };
        U35: {
          value: number;
        };
        V35: {
          value: number;
        };
        W35: {
          value: number;
        };
        X35: {
          value: number;
        };
        B36: {
          value: number;
        };
        C36: {
          value: number;
        };
        D36: {
          value: number;
        };
        E36: {
          value: number;
        };
        F36: {
          value: number;
        };
        G36: {
          value: number;
          color: string;
        };
        H36: {
          value: number;
        };
        J36: {
          value: number;
        };
        K36: {
          value: number;
        };
        L36: {
          value: number;
        };
        M36: {
          value: number;
        };
        N36: {
          value: number;
        };
        O36: {
          value: number;
        };
        P36: {
          value: number;
        };
        R36: {
          value: number;
        };
        S36: {
          value: number;
        };
        T36: {
          value: number;
        };
        U36: {
          value: number;
        };
        V36: {
          value: number;
          color: string;
        };
        W36: {
          value: number;
          color: string;
        };
        X36: {
          value: number;
        };
        B37: {
          value: number;
        };
        C37: {
          value: number;
        };
        D37: {
          value: number;
        };
        E37: {
          value: number;
        };
        J37: {
          value: number;
        };
        K37: {
          value: number;
        };
        L37: {
          value: number;
        };
        M37: {
          value: number;
        };
        N37: {
          value: number;
        };
        O37: {
          value: number;
        };
        P37: {
          value: number;
        };
        R37: {
          value: number;
        };
        S37: {
          value: number;
        };
        T37: {
          value: number;
        };
        U37: {
          value: number;
        };
        J38: {
          value: number;
        };
        B39: {
          value: string;
        };
        C39: {
          value: string;
        };
        D39: {
          value: string;
        };
        E39: {
          value: string;
        };
        F39: {
          value: string;
        };
        G39: {
          value: string;
        };
        H39: {
          value: string;
        };
        I39: {
          value: string;
        };
        J39: {
          value: string;
        };
        K39: {
          value: string;
        };
        L39: {
          value: string;
        };
        M39: {
          value: string;
        };
        N39: {
          value: string;
        };
        O39: {
          value: string;
        };
        P39: {
          value: string;
        };
        Q39: {
          value: string;
        };
        R39: {
          value: string;
        };
        S39: {
          value: string;
        };
        T39: {
          value: string;
        };
        U39: {
          value: string;
        };
        V39: {
          value: string;
        };
        W39: {
          value: string;
        };
        X39: {
          value: string;
        };
        D40: {
          value: string;
        };
        E40: {
          value: string;
        };
        F40: {
          value: string;
        };
        G40: {
          value: string;
        };
        J40: {
          value: string;
        };
        L40: {
          value: string;
        };
        M40: {
          value: string;
        };
        O40: {
          value: string;
        };
        P40: {
          value: string;
        };
        S40: {
          value: string;
          color: string;
        };
        T40: {
          value: string;
          color: string;
        };
        V40: {
          value: string;
        };
        W40: {
          value: string;
        };
        X40: {
          value: string;
        };
        D41: {
          value: string;
        };
        E41: {
          value: string;
        };
        F41: {
          value: string;
        };
        G41: {
          value: string;
        };
        J41: {
          value: string;
        };
        L41: {
          value: string;
        };
        M41: {
          value: string;
        };
        O41: {
          value: string;
        };
        P41: {
          value: string;
        };
        S41: {
          value: string;
          color: string;
        };
        T41: {
          value: string;
          color: string;
        };
        V41: {
          value: string;
        };
        W41: {
          value: string;
        };
        X41: {
          value: string;
        };
        Y41: {
          value: string;
        };
        B42: {
          value: string;
        };
        D42: {
          formula: string;
        };
        E42: {
          formula: string;
        };
        F42: {
          value: number;
        };
        G42: {
          value: number;
        };
        H42: {
          value: string;
        };
        J42: {
          formula: string;
        };
        K42: {
          value: string;
        };
        N42: {
          value: string;
        };
        O42: {
          formula: string;
        };
        P42: {
          formula: string;
        };
        R42: {
          value: string;
        };
        S42: {
          value: number;
          color: string;
        };
        T42: {
          value: number;
          color: string;
        };
        U42: {
          value: string;
        };
        V42: {
          value: number;
        };
        W42: {
          value: number;
        };
        X42: {
          value: string;
        };
        Y42: {
          value: string;
        };
        B43: {
          value: string;
        };
        D43: {
          formula: string;
        };
        E43: {
          formula: string;
        };
        F43: {
          value: number;
        };
        G43: {
          value: number;
        };
        H43: {
          value: string;
        };
        J43: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K43: {
          value: string;
        };
        L43: {
          formula: string;
        };
        M43: {
          formula: string;
        };
        N43: {
          value: string;
        };
        O43: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P43: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R43: {
          value: string;
        };
        U43: {
          value: string;
        };
        V43: {
          formula: string;
        };
        W43: {
          formula: string;
        };
        X43: {
          value: string;
        };
        Y43: {
          value: string;
        };
        B44: {
          value: string;
        };
        D44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F44: {
          value: number;
        };
        G44: {
          value: number;
        };
        H44: {
          value: string;
        };
        J44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K44: {
          value: string;
        };
        L44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N44: {
          value: string;
        };
        O44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R44: {
          value: string;
        };
        S44: {
          value: number;
          color: string;
        };
        T44: {
          value: number;
          color: string;
        };
        U44: {
          value: string;
        };
        V44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W44: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X44: {
          value: string;
        };
        Y44: {
          value: string;
        };
        B45: {
          value: string;
        };
        C45: {
          value: string;
        };
        D45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F45: {
          value: number;
        };
        G45: {
          value: number;
        };
        H45: {
          value: string;
        };
        J45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K45: {
          value: string;
        };
        L45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N45: {
          value: string;
        };
        O45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R45: {
          value: string;
        };
        S45: {
          value: number;
          color: string;
        };
        T45: {
          value: number;
          color: string;
        };
        U45: {
          value: string;
        };
        V45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W45: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X45: {
          value: string;
        };
        Y45: {
          value: string;
        };
        B46: {
          value: string;
        };
        C46: {
          value: string;
        };
        D46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F46: {
          value: number;
        };
        G46: {
          value: number;
        };
        H46: {
          value: string;
        };
        J46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K46: {
          value: string;
        };
        L46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N46: {
          value: string;
        };
        O46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P46: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R46: {
          value: string;
        };
        S46: {
          value: number;
          color: string;
        };
        T46: {
          value: number;
          color: string;
        };
        U46: {
          value: string;
        };
        V46: {
          formula: string;
        };
        W46: {
          formula: string;
        };
        X46: {
          value: string;
        };
        Y46: {
          value: string;
        };
        B47: {
          value: string;
        };
        C47: {
          value: string;
        };
        D47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F47: {
          value: number;
        };
        G47: {
          value: number;
        };
        H47: {
          value: string;
        };
        J47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K47: {
          value: string;
        };
        L47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N47: {
          value: string;
        };
        O47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P47: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R47: {
          value: string;
        };
        S47: {
          value: number;
          color: string;
        };
        T47: {
          value: number;
          color: string;
        };
        U47: {
          value: string;
        };
        V47: {
          value: number;
        };
        W47: {
          value: number;
        };
        X47: {
          value: string;
        };
        Y47: {
          value: string;
        };
        B48: {
          value: string;
        };
        C48: {
          value: string;
        };
        D48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F48: {
          value: number;
        };
        G48: {
          value: number;
        };
        H48: {
          value: string;
        };
        J48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K48: {
          value: string;
        };
        L48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N48: {
          value: string;
        };
        O48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R48: {
          value: string;
        };
        S48: {
          value: number;
          color: string;
        };
        T48: {
          value: number;
          color: string;
        };
        U48: {
          value: string;
        };
        V48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W48: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X48: {
          value: string;
        };
        Y48: {
          value: string;
        };
        B49: {
          value: string;
        };
        D49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F49: {
          value: number;
        };
        G49: {
          value: number;
        };
        H49: {
          value: string;
        };
        J49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K49: {
          value: string;
        };
        L49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N49: {
          value: string;
        };
        O49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R49: {
          value: string;
        };
        S49: {
          value: number;
          color: string;
        };
        T49: {
          value: number;
          color: string;
        };
        U49: {
          value: string;
        };
        V49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W49: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X49: {
          value: string;
        };
        Y49: {
          value: string;
        };
        B50: {
          value: string;
        };
        D50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F50: {
          value: number;
        };
        G50: {
          value: number;
        };
        H50: {
          value: string;
        };
        J50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K50: {
          value: string;
        };
        L50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N50: {
          value: string;
        };
        O50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R50: {
          value: string;
        };
        S50: {
          value: number;
          color: string;
        };
        T50: {
          value: number;
          color: string;
        };
        U50: {
          value: string;
        };
        V50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W50: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X50: {
          value: string;
        };
        Y50: {
          value: string;
        };
        B51: {
          value: string;
        };
        D51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F51: {
          value: number;
        };
        G51: {
          value: number;
        };
        H51: {
          value: string;
        };
        J51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K51: {
          value: string;
        };
        L51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N51: {
          value: string;
        };
        O51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R51: {
          value: string;
        };
        U51: {
          value: string;
        };
        V51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W51: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X51: {
          value: string;
        };
        Y51: {
          value: string;
        };
        B52: {
          value: string;
        };
        D52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F52: {
          value: number;
        };
        G52: {
          value: number;
        };
        H52: {
          value: string;
        };
        J52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K52: {
          value: string;
        };
        L52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N52: {
          value: string;
        };
        O52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R52: {
          value: string;
        };
        S52: {
          value: number;
          color: string;
        };
        T52: {
          value: number;
          color: string;
        };
        U52: {
          value: string;
        };
        V52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W52: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X52: {
          value: string;
        };
        Y52: {
          value: string;
        };
        B53: {
          value: string;
        };
        D53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        E53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        F53: {
          value: number;
        };
        G53: {
          value: number;
        };
        H53: {
          value: string;
        };
        J53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        K53: {
          value: string;
        };
        L53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        M53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        N53: {
          value: string;
        };
        O53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        P53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        R53: {
          value: string;
        };
        S53: {
          value: number;
          color: string;
        };
        T53: {
          value: number;
          color: string;
        };
        U53: {
          value: string;
        };
        V53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        W53: {
          value: {
            result: number;
            sharedFormula: string;
          };
        };
        X53: {
          value: string;
        };
        Y53: {
          value: string;
        };
        B55: {
          value: string;
        };
        F57: {
          value: string;
        };
        G57: {
          value: string;
        };
        H57: {
          value: string;
        };
        I57: {
          value: string;
        };
        J57: {
          value: string;
        };
        K57: {
          value: string;
        };
        L57: {
          value: string;
        };
        M57: {
          value: string;
        };
        N57: {
          value: string;
        };
        O57: {
          value: string;
        };
        P57: {
          value: string;
        };
        Q57: {
          value: string;
        };
        R57: {
          value: string;
        };
        S57: {
          value: string;
        };
        T57: {
          value: string;
        };
        U57: {
          value: string;
        };
        V57: {
          value: string;
        };
        W57: {
          value: string;
        };
        X57: {
          value: string;
        };
        Y57: {
          value: string;
        };
      };
      mergedRanges: string[];
    };
  };
};
//# sourceMappingURL=SHEET_TEMPLATE.d.ts.map

/*
---
file: "shared/backupConfig.d.ts"
dependencies: []
lineCount: 47
exports: ["BACKUP_CONFIG"]
---
*/
// ===== shared/backupConfig.d.ts =====
/**
 * Backup system configuration
 *
 * Backups are request-driven — no timers, no setInterval, no cron.
 * After each response is sent, the middleware checks whether
 * MIN_CHECK_INTERVAL_MS has elapsed since the last check.  If so it
 * evaluates the schedule to decide whether a new backup is needed and
 * cleans up old backups using a nearest-slot retention algorithm.
 *
 * The last-check timestamp is persisted to disk ("sticky state") so the
 * server remembers when work was last done even after a restart.
 */
export declare const BACKUP_CONFIG: {
  /**
   * Minimum elapsed time (ms) between backup-check cycles.
   * This throttles how often the middleware evaluates the schedule.
   */
  readonly MIN_CHECK_INTERVAL_MS: number;
  /**
   * Backup schedule expressed in minutes-of-age.
   *
   * Each entry is a desired backup "age slot".  The system:
   *   • Creates a new backup when the newest existing backup is older
   *     than the smallest entry (1 minute).
   *   • Keeps the single backup whose age is closest to each slot.
   *   • Deletes everything that isn't the closest match to any slot.
   *
   * Sub-hour:  1m, 15m, 30m
   * Hours:     1h, 3h, 5h, 7h, 9h, 11h
   * Days 1–7:  daily
   * Day 14:    bridges daily → biweekly
   * Weeks 3–11: biweekly
   * Year 1:    ~quarterly (days 121, 241, 365)
   * Year 2:    ~quarterly (days 486, 606, 730)
   * Year 3:    ~quarterly (days 851, 971, 1095)
   *
   * Steady state: at most (entries + 1) backup files.
   */
  readonly BACKUP_SCHEDULE_MINUTES: readonly number[];
  readonly FILENAME_PREFIX: "backup-";
  readonly FILENAME_SUFFIX: ".db";
  /** Filename for the sticky last-check timestamp */
  readonly LAST_CHECK_FILENAME: ".last-check";
  readonly BACKUP_DIR: "db/backups";
  readonly DB_PATH: "db/dwp-hours.db";
};
//# sourceMappingURL=backupConfig.d.ts.map

/*
---
file: "shared/businessRules.d.ts"
dependencies: ["./api-models.d.ts"]
lineCount: 382
exports: ["PTOType","MONTH_NAMES","ValidationError","MonthLockValidationError","MonthLockInfo","SYS_ADMIN_EMPLOYEE_ID","ENABLE_IMPORT_AUTO_APPROVE","ENABLE_BROWSER_IMPORT","ALLOWED_EMAIL_DOMAINS","isAllowedEmailDomain","PtoRateTier","PTO_EARNING_SCHEDULE","MAX_DAILY_RATE","MAX_ANNUAL_PTO","CARRYOVER_LIMIT","SICK_HOURS_BEFORE_PTO","BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO","BUSINESS_RULES_CONSTANTS","VALIDATION_MESSAGES","SUCCESS_MESSAGES","NOTIFICATION_MESSAGES","UI_ERROR_MESSAGES","MessageKey","validateHours","validateWeekday","validatePTOType","normalizePTOType","validateDateString","validateAnnualLimits","validatePTOBalance","validateDateFutureLimit","validateMonthEditable","formatLockedMessage","validateAdminCanLockMonth","formatMonthNotEndedMessage","getEarliestAdminLockDate","getPriorMonth","computeAccrualToDate","computeEmployeeBalanceData","getYearsOfService","getPtoRateTier","getEffectivePtoRate","computeAccrualWithHireDate","computeAnnualAllocation","computeCarryover","checkSickDayThreshold","checkBereavementThreshold","computeTerminationPayout","ImportEntryForAutoApprove","AutoApproveEmployeeLimits","AutoApprovePolicyContext","AutoApproveResult","AutoApproveImportContext","shouldAutoApproveImportEntry"]
---
*/
// ===== shared/businessRules.d.ts =====
import type { PtoBalanceData } from "./api-models.d.ts";
export type PTOType = "Sick" | "PTO" | "Bereavement" | "Jury Duty";
/** Canonical month name list (1-indexed via `MONTH_NAMES[monthNumber - 1]`). */
export declare const MONTH_NAMES: readonly [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export interface ValidationError {
  field: string;
  messageKey: string;
}
/**
 * Extended validation error that includes month-lock metadata.
 * Returned by `validateMonthEditable` when a month is locked.
 */
export interface MonthLockValidationError extends ValidationError {
  lockedBy: string;
  lockedAt: string;
}
/** Information about an admin month lock. */
export interface MonthLockInfo {
  adminName: string;
  acknowledgedAt: string;
}
/**
 * Reserved employee ID for the internal sys-admin account.
 * Used as `approved_by` for auto-approved import entries, keeping them
 * distinct from manual approvals by human administrators.
 */
export declare const SYS_ADMIN_EMPLOYEE_ID = 0;
/**
 * When `true`, PTO entries imported via the Excel import flow
 * (`POST /api/admin/import-bulk`) that pass all validation checks and
 * fall within annual PTO limits are automatically approved
 * (`approved_by` set to `SYS_ADMIN_EMPLOYEE_ID`).
 *
 * Entries that have warnings — such as exceeding annual sick/bereavement/
 * jury-duty limits, belonging to a "warning" acknowledgement month, or
 * causing PTO borrowing after the first year of service — remain
 * unapproved and appear in the admin PTO Request Queue for manual review.
 *
 * This flag applies **only** to the Excel import path, not to
 * employee-initiated PTO requests submitted via the app/API.
 */
export declare const ENABLE_IMPORT_AUTO_APPROVE = true;
/**
 * When `true`, the admin Excel import runs entirely in the browser
 * (ExcelJS parses the `.xlsx` client-side, then submits structured JSON
 * to a lightweight bulk-upsert API). When `false`, the `.xlsx` is
 * uploaded to the server for processing (original behaviour).
 *
 * Motivation: the server-side import causes OOM on the 512 MB production
 * droplet after cell-note parsing increased ExcelJS memory usage.
 */
export declare const ENABLE_BROWSER_IMPORT = true;
/** Email domains allowed for automatic user provisioning on first login. */
export declare const ALLOWED_EMAIL_DOMAINS: readonly string[];
/**
 * Checks whether an email address belongs to an allowed domain.
 * Comparison is case-insensitive.
 *
 * @param email - The full email address to check
 * @returns `true` if the domain is in `ALLOWED_EMAIL_DOMAINS`
 */
export declare function isAllowedEmailDomain(email: string): boolean;
export interface PtoRateTier {
  /** Minimum completed years of service (inclusive). */
  minYears: number;
  /** Maximum completed years of service (exclusive). Use Infinity for the final tier. */
  maxYears: number;
  /** Total eligible PTO hours per service year. */
  annualHours: number;
  /** Hours accrued per work day. */
  dailyRate: number;
}
/**
 * Official PTO earning schedule.
 * Rate increases on July 1 — see `getEffectivePtoRate` for timing rules.
 */
export declare const PTO_EARNING_SCHEDULE: readonly PtoRateTier[];
/** Maximum daily accrual rate (9+ years of service). */
export declare const MAX_DAILY_RATE = 0.92;
/** Maximum annual PTO entitlement in hours. */
export declare const MAX_ANNUAL_PTO = 240;
/** Maximum hours that may carry over from the prior year without admin approval. */
export declare const CARRYOVER_LIMIT = 80;
/** Number of sick days (at 8 hrs/day = 24 hrs) before PTO must be used. */
export declare const SICK_HOURS_BEFORE_PTO = 24;
/** Number of consecutive bereavement days before PTO must be used. */
export declare const BEREAVEMENT_CONSECUTIVE_DAYS_BEFORE_PTO = 2;
export declare const BUSINESS_RULES_CONSTANTS: {
  readonly HOUR_INCREMENT: 4;
  readonly WEEKEND_DAYS: number[];
  readonly ANNUAL_LIMITS: {
    readonly PTO: 80;
    readonly SICK: 24;
    /** @deprecated Use BEREAVEMENT or JURY_DUTY instead */
    readonly OTHER: 16;
    /** 2 consecutive days × 8 hrs per policy bereavement rule */
    readonly BEREAVEMENT: 16;
    /** 3 days × 8 hrs per policy jury-duty rule (same as sick) */
    readonly JURY_DUTY: 24;
  };
  readonly FUTURE_LIMIT: {
    readonly YEARS_AHEAD: 1;
    readonly END_OF_YEAR_MONTH: 11;
    readonly END_OF_YEAR_DAY: 31;
  };
  /** Inactivity threshold (ms) before the app treats a visit as a new session. */
  readonly SESSION_INACTIVITY_THRESHOLD_MS: number;
  /** Auto-dismiss timeout (ms) for toast notifications before they are considered "not seen". */
  readonly NOTIFICATION_AUTO_DISMISS_MS: number;
  /** Number of days after which unread notifications expire and are no longer shown. */
  readonly NOTIFICATION_EXPIRY_DAYS: 30;
};
export declare const VALIDATION_MESSAGES: {
  readonly "hours.invalid": "Hours must be in 4-hour increments";
  readonly "hours.not_integer": "Hours must be a whole number";
  readonly "date.weekday": "Date must be a weekday (Monday to Friday)";
  readonly "pto.duplicate": "A PTO entry of this type already exists for this employee on this date";
  readonly "type.invalid": "Invalid PTO type";
  readonly "date.invalid": "Invalid date format";
  readonly "employee.not_found": "Employee not found";
  readonly "entry.not_found": "PTO entry not found";
  readonly "hours.exceed_annual_sick": "Sick time cannot exceed 24 hours annually";
  readonly "hours.exceed_annual_bereavement": "Bereavement cannot exceed 16 hours (2 days) annually";
  readonly "hours.exceed_annual_jury_duty": "Jury Duty cannot exceed 24 hours (3 days) annually";
  /** @deprecated Use hours.exceed_annual_bereavement or hours.exceed_annual_jury_duty */
  readonly "hours.exceed_annual_other": "Bereavement/Jury Duty cannot exceed allowed hours annually";
  readonly "hours.exceed_pto_balance": "PTO request exceeds available PTO balance";
  readonly "date.future_limit": "Entries cannot be made into the next year";
  readonly "month.acknowledged": "This month has been acknowledged by the administrator and is no longer editable";
  readonly "month.locked": "This month was locked by {lockedBy} on {lockedAt} and is no longer editable";
  readonly "employee.not_acknowledged": "Employee must acknowledge this month before admin can lock it";
  readonly "month.not_ended": "This month has not ended yet. Admin can lock starting {earliestDate}";
  readonly "month.admin_locked_cannot_unlock": "This month has been locked by the administrator and cannot be unlocked";
  readonly "hours.exceed_carryover": "Carryover cannot exceed 80 hours from the prior year";
  readonly "pto.rate_not_found": "Unable to determine PTO rate for the given hire date and date";
  readonly "sick.pto_required_after_threshold": "Sick time has exceeded 24 hours (3 days) this year — PTO must be used for additional absences";
  readonly "bereavement.pto_required_after_threshold": "Bereavement has exceeded 2 consecutive days — PTO must be used for additional absences";
};
export declare const SUCCESS_MESSAGES: {
  readonly "pto.created": "PTO request processed successfully";
  readonly "auth.link_sent": "If the email exists, a magic link has been sent.";
  readonly "notification.calendar_lock_sent": "Notification sent — employee will be reminded to lock their calendar.";
};
export declare const NOTIFICATION_MESSAGES: {
  readonly calendar_lock_reminder: "Please review and lock your calendar for {month}.";
};
export declare const UI_ERROR_MESSAGES: {
  readonly failed_to_refresh_pto_data: "Failed to refresh PTO data";
  readonly failed_to_load_pto_status: "Failed to load PTO status";
};
export type MessageKey = keyof typeof VALIDATION_MESSAGES;
/**
 * Validates that hours are positive and in 4-hour increments
 */
export declare function validateHours(hours: number): ValidationError | null;
/**
 * Validates that date is a weekday (Monday to Friday)
 */
export declare function validateWeekday(
  dateStr: string,
): ValidationError | null;
/**
 * Validates PTO type
 */
export declare function validatePTOType(type: string): ValidationError | null;
/**
 * Normalizes PTO type (handles legacy 'Full PTO', 'Partial PTO')
 */
export declare function normalizePTOType(type: string): PTOType;
/**
 * Checks if date string is valid
 */
export declare function validateDateString(
  dateStr: string,
): ValidationError | null;
/**
 * Validates annual hour limits (requires total hours for the year)
 * For PTO type, validates against available balance if provided
 */
export declare function validateAnnualLimits(
  type: PTOType,
  hours: number,
  totalAnnualHours: number,
  availableBalance?: number,
): ValidationError | null;
/**
 * Validates that PTO request does not exceed available PTO balance
 */
export declare function validatePTOBalance(
  requestedHours: number,
  availableBalance: number,
): ValidationError | null;
/**
 * Validates that the date is not into the next year
 */
export declare function validateDateFutureLimit(
  date: Date,
): ValidationError | null;
/**
 * Validates that the month is not acknowledged (editable).
 * When `lockInfo` is provided the returned error carries the admin name
 * and timestamp so the caller can surface a descriptive message.
 */
export declare function validateMonthEditable(
  isAcknowledged: boolean,
  lockInfo?: MonthLockInfo,
): MonthLockValidationError | null;
/**
 * Formats the `month.locked` message by substituting placeholders.
 */
export declare function formatLockedMessage(
  lockedBy: string,
  lockedAt: string,
): string;
/**
 * Validates that an admin can lock a month.
 * The month must have fully ended (current date >= 1st of the following month).
 * @param month - YYYY-MM string
 * @param currentDate - YYYY-MM-DD string (today)
 * @returns ValidationError if the month has not ended, null otherwise
 */
export declare function validateAdminCanLockMonth(
  month: string,
  currentDate: string,
): ValidationError | null;
/**
 * Formats the `month.not_ended` message by substituting the {earliestDate} placeholder.
 */
export declare function formatMonthNotEndedMessage(
  earliestDate: string,
): string;
/**
 * Computes the earliest date an admin can lock a given month.
 * @param month - YYYY-MM string
 * @returns YYYY-MM-DD string for the 1st of the following month
 */
export declare function getEarliestAdminLockDate(month: string): string;
/**
 * Returns the YYYY-MM string for the month immediately before the given date.
 * @param currentDate - YYYY-MM-DD string
 * @returns YYYY-MM string for the prior month
 */
export declare function getPriorMonth(currentDate: string): string;
/**
 * Computes PTO accrued from the start of the fiscal year to the current date.
 * @param ptoRate - hours accrued per work day
 * @param fiscalYearStart - YYYY-MM-DD string for the beginning of the fiscal year
 * @param currentDate - YYYY-MM-DD string (today)
 * @returns total hours accrued = ptoRate × number of workdays between fiscalYearStart and currentDate
 */
export declare function computeAccrualToDate(
  ptoRate: number,
  fiscalYearStart: string,
  currentDate: string,
): number;
/**
 * Computes PTO balance data for an employee based on used hours from PTO entries.
 *
 * @param ptoAllowance - When provided, overrides the default PTO annual limit
 *   (CARRYOVER_LIMIT = 80) with the employee's actual allowance
 *   (annualAllocation + carryover). This gives accurate remaining-balance
 *   values instead of the generic cap.
 */
export declare function computeEmployeeBalanceData(
  employeeId: number,
  employeeName: string,
  ptoEntries: Array<{
    employee_id: number;
    type: PTOType;
    hours: number;
  }>,
  ptoAllowance?: number,
): PtoBalanceData;
/**
 * Computes completed years of service between a hire date and a reference date.
 * Uses string-based date comparison (YYYY-MM-DD) — no Date objects.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param asOfDate - YYYY-MM-DD reference date (typically today)
 * @returns Whole number of completed years (floored)
 */
export declare function getYearsOfService(
  hireDate: string,
  asOfDate: string,
): number;
/**
 * Looks up the PTO rate tier for a given number of completed years of service.
 *
 * @param yearsOfService - Completed whole years of service
 * @returns The matching tier's annual hours and daily rate
 */
export declare function getPtoRateTier(yearsOfService: number): PtoRateTier;
/**
 * Returns the effective PTO rate for an employee on a given date,
 * accounting for the July 1 rate-increase timing rule from POLICY.md.
 *
 * **July 1 Rule**:
 * - Hired Jan 1 – Jun 30: rate increases on July 1 following one full year of service.
 * - Hired Jul 1 – Dec 31: rate increases on July 1 of the following calendar year.
 *
 * In both cases the rate increase coincides with the first July 1 on or after
 * the employee's first anniversary, then every subsequent July 1.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param asOfDate - YYYY-MM-DD reference date (typically today)
 * @returns The effective tier (annualHours + dailyRate)
 */
export declare function getEffectivePtoRate(
  hireDate: string,
  asOfDate: string,
): PtoRateTier;
/**
 * Computes PTO accrued from a fiscal-year start to a reference date,
 * automatically deriving the daily rate from the employee's hire date
 * and handling the mid-year rate change on July 1.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param fiscalYearStart - YYYY-MM-DD start of the accrual period
 * @param currentDate - YYYY-MM-DD reference date (typically today)
 * @returns total hours accrued, accounting for rate changes on July 1
 */
export declare function computeAccrualWithHireDate(
  hireDate: string,
  fiscalYearStart: string,
  currentDate: string,
): number;
/**
 * Computes the annual PTO allocation for an employee in a given year.
 * - First year (hire year): pro-rated as dailyRate × workdays(hireDate, Dec 31).
 * - Subsequent years: full annual entitlement from the earning schedule.
 *
 * @param hireDate - YYYY-MM-DD hire date
 * @param year - Calendar year to compute for
 * @returns Total PTO hours allocated for the year
 */
export declare function computeAnnualAllocation(
  hireDate: string,
  year: number,
): number;
/**
 * Caps prior-year balance at the carryover limit.
 *
 * @param priorYearBalance - Remaining PTO hours from the prior year
 * @returns Capped carryover amount (max CARRYOVER_LIMIT)
 */
export declare function computeCarryover(priorYearBalance: number): number;
/**
 * Checks whether a sick-time request would push total sick hours past
 * the 24-hour (3-day) threshold. Returns a warning message string
 * if so, or null if within threshold.
 *
 * @param totalSickHoursUsed - Sick hours already used this year
 * @param requestedHours - Hours being requested
 * @returns Warning message string, or null
 */
export declare function checkSickDayThreshold(
  totalSickHoursUsed: number,
  requestedHours: number,
): string | null;
/**
 * Checks whether bereavement days have exceeded the 2-consecutive-day
 * threshold. Returns a warning message string if so, or null.
 *
 * @param consecutiveDays - Number of consecutive bereavement days
 * @returns Warning message string, or null
 */
export declare function checkBereavementThreshold(
  consecutiveDays: number,
): string | null;
/**
 * Computes the PTO payout for a terminated employee.
 * Prior-year carryover is capped at 80 hours per policy.
 *
 * @param carryoverHours - Remaining hours carried over from the prior year
 * @param currentYearAccrued - Hours accrued so far in the current year
 * @param currentYearUsed - Hours used so far in the current year
 * @returns Payout amount in hours (minimum 0)
 */
export declare function computeTerminationPayout(
  carryoverHours: number,
  currentYearAccrued: number,
  currentYearUsed: number,
): number;
/** A single PTO entry to evaluate for auto-approval during import. */
export interface ImportEntryForAutoApprove {
  date: string;
  type: PTOType;
  hours: number;
}
/** Running annual usage totals and available PTO balance for an employee. */
export interface AutoApproveEmployeeLimits {
  /** Running annual usage totals by PTO type (updated as entries are processed). */
  annualUsage: Record<PTOType, number>;
  /** Available PTO balance before this entry (carryover + annual allocation − used PTO hours). */
  availablePtoBalance: number;
}
/** Policy context needed for auto-approve decisions. */
export interface AutoApprovePolicyContext {
  /** Completed years of service (0 = first year). */
  yearsOfService: number;
}
/** Result of an auto-approve evaluation for a single import entry. */
export interface AutoApproveResult {
  approved: boolean;
  violations: string[];
}
/** Context needed to perform auto-approve evaluation during Excel import. */
export interface AutoApproveImportContext {
  /** Employee's hire date (YYYY-MM-DD). */
  hireDate: string;
  /** Hours carried over from the prior year. */
  carryoverHours: number;
}
/**
 * Pure function that determines whether a single imported PTO entry should
 * be auto-approved based on annual limits and POLICY.md rules.
 *
 * Checks performed:
 * 1. **Sick annual limit** — sick hours cannot exceed 24 hours annually.
 * 2. **Bereavement annual limit** — bereavement hours cannot exceed 16 hours annually.
 * 3. **Jury Duty annual limit** — jury duty hours cannot exceed 24 hours annually.
 * 4. **PTO balance** — PTO hours cannot exceed the available balance
 *    (carryover + annual allocation − used-to-date).
 * 5. **PTO borrowing** — after the first year of service, PTO that would
 *    cause a negative balance is not permitted.
 *
 * Note: Month-level reconciliation warnings (e.g., calendar/column-S hour
 * mismatches) are handled separately at the acknowledgement layer.
 * Individual entries are evaluated solely on their own merits.
 *
 * @param entry - The PTO entry to evaluate
 * @param employeeLimits - Running annual usage totals and available PTO balance
 * @param policyContext - Years of service information
 * @returns `{ approved, violations }` — if `approved` is false, `violations`
 *   contains human-readable descriptions of each failed check
 */
export declare function shouldAutoApproveImportEntry(
  entry: ImportEntryForAutoApprove,
  employeeLimits: AutoApproveEmployeeLimits,
  policyContext: AutoApprovePolicyContext,
): AutoApproveResult;
//# sourceMappingURL=businessRules.d.ts.map

/*
---
file: "shared/calendar-symbols.d.ts"
dependencies: []
lineCount: 9
exports: ["CALENDAR_SYMBOLS"]
---
*/
// ===== shared/calendar-symbols.d.ts =====
/**
 * Display symbols and constants for calendar components
 */
export declare const CALENDAR_SYMBOLS: {
  readonly HOURS_FULL: "●";
  readonly HOURS_PARTIAL: "½";
  readonly HOURS_CLEARING: "✕";
};
//# sourceMappingURL=calendar-symbols.d.ts.map

/*
---
file: "shared/conversionUtils.d.ts"
dependencies: ["exceljs"]
lineCount: 49
exports: ["CellData","SheetData","ExcelData","validateExcelData","jsonToWorkbook","workbookToJson"]
---
*/
// ===== shared/conversionUtils.d.ts =====
/**
 * Conversion Utilities
 * Utilities for converting between Excel, JSON, and database formats
 */
import ExcelJS from "exceljs";
/**
 * Cell data structure for JSON representation
 */
export interface CellData {
  /** Cell value (string, number, boolean, or Date) */
  value?: any;
  /** Excel formula (without =) */
  formula?: string;
  /** Background color as hex string (e.g., 'FFFF0000' for red) */
  color?: string;
}
/**
 * Sheet data structure for JSON representation
 */
export interface SheetData {
  /** Cell data keyed by address (e.g., 'A1', 'B2') */
  cells: {
    [address: string]: CellData;
  };
  /** Merged cell ranges (e.g., ['A1:B2', 'C3:D4']) */
  mergedRanges?: string[];
}
/**
 * Excel workbook data structure for JSON representation
 */
export interface ExcelData {
  /** Sheet data keyed by sheet name */
  sheets: {
    [sheetName: string]: SheetData;
  };
}
/**
 * Validates if the provided data has the correct ExcelData structure
 */
export declare function validateExcelData(data: any): data is ExcelData;
/**
 * Converts ExcelData JSON structure to ExcelJS Workbook
 */
export declare function jsonToWorkbook(data: ExcelData): ExcelJS.Workbook;
/**
 * Converts ExcelJS Workbook to ExcelData JSON structure
 */
export declare function workbookToJson(workbook: ExcelJS.Workbook): ExcelData;
//# sourceMappingURL=conversionUtils.d.ts.map

/*
---
file: "shared/dateUtils.d.ts"
dependencies: []
lineCount: 268
exports: ["isValidDateString","parseDate","formatDate","parseMMDDYY","smartParseDate","getDaysInMonth","addDays","addMonths","compareDates","getDateComponents","isBefore","isAfter","getDaysBetween","setTimeTravelYear","getTimeTravelYear","setTimeTravelDay","getTimeTravelDay","today","getDayOfWeek","isWeekend","startOfMonth","endOfMonth","dateToString","dateTimeToISOString","getWeekdaysBetween","getCurrentYear","getCurrentMonth","formatDateForDisplay","getWorkdaysBetween","getFirstDayOfMonth","getLastDayOfMonth","getCalendarStartDate","getCalendarEndDate","getCalendarDates","getWeeksInMonth","isInMonth","calculateEndDateFromHours","startOfYear","endOfYear","getDayName","getNextBusinessDay","formatTimestampForDisplay"]
---
*/
// ===== shared/dateUtils.d.ts =====
/**
 * Date Management Utilities
 * Lightweight bespoke date management using YYYY-MM-DD strings exclusively
 * Avoids timezone issues and provides consistent date handling
 *
 * ## Date Handling Guidelines
 *
 * ### Core Principles
 * - Use YYYY-MM-DD strings exclusively for all date operations
 * - Never use `new Date()` with date strings in client code
 * - Always use `dateUtils.ts` functions for date manipulation
 * - Store dates as TEXT columns in SQLite (YYYY-MM-DD format)
 *
 * ### Common Pitfalls to Avoid
 * ❌ `new Date(dateString)` - Creates timezone-dependent Date objects
 * ❌ `new Date().toISOString().split('T')[0]` - Causes timezone shifts
 * ❌ `Date.UTC()` mixed with local time operations
 * ❌ Storing Date objects in database (use strings)
 *
 * ### Correct Usage Patterns
 * ✅ `today()` - Get current date as YYYY-MM-DD string
 * ✅ `addDays(dateStr, days)` - Add/subtract days safely
 * ✅ `isWeekend(dateStr)` - Check if date is weekend
 * ✅ `calculateEndDateFromHours(startDate, hours)` - Business day calculations
 *
 * ### Timezone Safety
 * - All functions work consistently regardless of server timezone
 * - Client and server use identical date logic
 * - No timezone conversions or assumptions
 * - Dates represent calendar dates, not moments in time
 */
declare const SUNDAY = 0;
declare const MONDAY = 1;
declare const TUESDAY = 2;
declare const WEDNESDAY = 3;
declare const THURSDAY = 4;
declare const FRIDAY = 5;
declare const SATURDAY = 6;
export { SUNDAY, MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY };
/**
 * Validates if a string is a valid YYYY-MM-DD date format
 */
export declare function isValidDateString(dateStr: string): boolean;
/**
 * Parses a YYYY-MM-DD string into components
 */
export declare function parseDate(dateStr: string): {
  year: number;
  month: number;
  day: number;
};
/**
 * Formats year, month, day into YYYY-MM-DD string
 */
export declare function formatDate(
  year: number,
  month: number,
  day: number,
): string;
/**
 * Parses MM/DD/YY string into YYYY-MM-DD format
 */
export declare function parseMMDDYY(dateStr: string): string;
/**
 * Smart date parser that accepts multiple common formats and returns YYYY-MM-DD.
 * Supported formats:
 * - YYYY-MM-DD (ISO)
 * - M/D/YY or MM/DD/YY (US short year)
 * - M/D/YYYY or MM/DD/YYYY (US full year)
 * Returns null if no format matches.
 */
export declare function smartParseDate(dateStr: string): string | null;
/**
 * Gets the number of days in a month
 */
export declare function getDaysInMonth(year: number, month: number): number;
/**
 * Adds days to a date string
 */
export declare function addDays(dateStr: string, days: number): string;
/**
 * Adds months to a date string
 */
export declare function addMonths(dateStr: string, months: number): string;
/**
 * Compares two date strings
 * Returns: -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export declare function compareDates(
  dateStr1: string,
  dateStr2: string,
): number;
/**
 * Gets date components from a date string
 */
export declare function getDateComponents(dateStr: string): {
  year: number;
  month: number;
  day: number;
};
/**
 * Checks if date1 is before date2
 */
export declare function isBefore(dateStr1: string, dateStr2: string): boolean;
/**
 * Checks if date1 is after date2
 */
export declare function isAfter(dateStr1: string, dateStr2: string): boolean;
/**
 * Gets the number of days between two dates (date1 - date2)
 */
export declare function getDaysBetween(
  dateStr1: string,
  dateStr2: string,
): number;
/**
 * Set a time-travel year override.
 * When set, `today()`, `getCurrentYear()`, and `getCurrentMonth()` will
 * return values as if the current year were the override year (month and day
 * are kept from the real clock).
 *
 * Pass `null` to disable.
 *
 * Note: `setTimeTravelDay()` takes precedence. Setting a year clears any
 * active day override.
 */
export declare function setTimeTravelYear(year: number | null): void;
/**
 * Returns the active time-travel year, or `null` if time-travel is inactive.
 * When a full day override is active, returns its year component.
 */
export declare function getTimeTravelYear(): number | null;
/**
 * Set a time-travel day override (YYYY-MM-DD).
 * When set, `today()` returns this exact date, and `getCurrentYear()` /
 * `getCurrentMonth()` derive their values from it.
 *
 * Takes precedence over `setTimeTravelYear()`. Setting a day clears any
 * active year-only override.
 *
 * Pass `null` to disable.
 */
export declare function setTimeTravelDay(dateStr: string | null): void;
/**
 * Returns the active time-travel day, or `null` if no day override is active.
 */
export declare function getTimeTravelDay(): string | null;
/**
 * Gets the current date as YYYY-MM-DD string.
 * - When a day override is active (`setTimeTravelDay`), returns that exact date.
 * - When a year override is active (`setTimeTravelYear`), the year is replaced;
 *   month/day come from the real clock (day clamped if invalid).
 * - Otherwise returns the real current date.
 */
export declare function today(): string;
/**
 * Gets the day of the week (0 = Sunday, 6 = Saturday)
 */
export declare function getDayOfWeek(dateStr: string): number;
/**
 * Checks if a date is a weekend
 */
export declare function isWeekend(dateStr: string): boolean;
/**
 * Gets the start of month for a given date
 */
export declare function startOfMonth(dateStr: string): string;
/**
 * Gets the end of month for a given date
 */
export declare function endOfMonth(dateStr: string): string;
/**
 * Converts a Date object to YYYY-MM-DD string format
 */
export declare function dateToString(date: Date): string;
/**
 * Converts a Date object to ISO timestamp string format
 */
export declare function dateTimeToISOString(date: Date): string;
/**
 * Calculate the number of weekdays (Monday-Friday) between two dates, inclusive
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Number of weekdays between the dates
 */
export declare function getWeekdaysBetween(
  startDateStr: string,
  endDateStr: string,
): number;
/**
 * Gets the current year.
 * Returns the time-travel year (from day or year override) when active.
 */
export declare function getCurrentYear(): number;
/**
 * Gets the current month in YYYY-MM format.
 * - When a day override is active, derives year and month from that date.
 * - When a year override is active, uses overridden year with real month.
 * - Otherwise returns the real current year-month.
 */
export declare function getCurrentMonth(): string;
/**
 * Formats a date string for display using locale formatting
 */
export declare function formatDateForDisplay(
  dateStr: string,
  options?: Intl.DateTimeFormatOptions,
): string;
/**
 * Gets all workdays (weekdays) between two dates as an array of date strings
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param endDateStr - End date in YYYY-MM-DD format
 * @returns Array of YYYY-MM-DD strings representing workdays
 */
export declare function getWorkdaysBetween(
  startDateStr: string,
  endDateStr: string,
): string[];
/**
 * Gets the first day of the month for a given year and month
 */
export declare function getFirstDayOfMonth(year: number, month: number): string;
/**
 * Gets the last day of the month for a given year and month
 */
export declare function getLastDayOfMonth(year: number, month: number): string;
/**
 * Gets the calendar start date (first day of the week containing the first day of the month)
 */
export declare function getCalendarStartDate(
  year: number,
  month: number,
): string;
/**
 * Gets the calendar end date (last day of the week containing the last day of the month)
 */
export declare function getCalendarEndDate(year: number, month: number): string;
/**
 * Gets all dates in a calendar month (including days from previous/next months to fill the grid)
 */
export declare function getCalendarDates(year: number, month: number): string[];
/**
 * Gets the number of weeks in a month (including partial weeks)
 * @param year - The year
 * @param month - The month (1-12)
 * @returns Number of weeks needed to display the month in a calendar
 */
export declare function getWeeksInMonth(year: number, month: number): number;
/**
 * Checks if a date is in the current month
 */
export declare function isInMonth(
  dateStr: string,
  year: number,
  month: number,
): boolean;
/**
 * Calculate end date by adding hours with spillover logic (skip weekends)
 * Assumes 8 hours per workday, spills over to next business day when exceeding 8 hours
 * @param startDateStr - Start date in YYYY-MM-DD format
 * @param hours - Total hours to add
 * @returns End date in YYYY-MM-DD format
 */
export declare function calculateEndDateFromHours(
  startDateStr: string,
  hours: number,
): string;
/**
 * Gets the start of the current year (January 1st)
 */
export declare function startOfYear(): string;
/**
 * Gets the end of the current year (December 31st)
 */
export declare function endOfYear(): string;
/**
 * Gets the name of the day of the week for a given date
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Name of the day (e.g., "Monday", "Tuesday", etc.)
 */
export declare function getDayName(dateStr: string): string;
/**
 * Gets the next business day (skips weekends)
 * If the input date is a weekday (Mon-Fri), returns the same date
 * If the input date is Saturday or Sunday, returns the following Monday
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Next business day in YYYY-MM-DD format
 */
export declare function getNextBusinessDay(dateStr: string): string;
/**
 * Formats an ISO timestamp string for display
 * @param isoTimestamp - ISO timestamp string (e.g., "2026-02-11T14:16:34.352Z")
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string for display
 */
export declare function formatTimestampForDisplay(
  isoTimestamp: string,
  options?: Intl.DateTimeFormatOptions,
): string;
//# sourceMappingURL=dateUtils.d.ts.map

/*
---
file: "shared/dateUtils.test.d.ts"
dependencies: []
lineCount: 2
exports: []
---
*/
// ===== shared/dateUtils.test.d.ts =====
export {};
//# sourceMappingURL=dateUtils.test.d.ts.map

/*
---
file: "shared/entity-transforms.d.ts"
dependencies: ["../server/entities/Acknowledgement.js","../server/entities/AdminAcknowledgement.js","../server/entities/Employee.js","../server/entities/MonthlyHours.js","../server/entities/PtoEntry.js","./api-models.js"]
lineCount: 12
exports: ["serializeEmployee","serializePTOEntry","serializeMonthlyHours","serializeAcknowledgement","serializeAdminAcknowledgement"]
---
*/
// ===== shared/entity-transforms.d.ts =====
import { Employee as EntityEmployee } from "../server/entities/Employee.js";
import { PtoEntry as EntityPtoEntry } from "../server/entities/PtoEntry.js";
import { MonthlyHours as EntityMonthlyHours } from "../server/entities/MonthlyHours.js";
import { Acknowledgement as EntityAcknowledgement } from "../server/entities/Acknowledgement.js";
import { AdminAcknowledgement as EntityAdminAcknowledgement } from "../server/entities/AdminAcknowledgement.js";
import {
  Employee,
  PTOEntry,
  MonthlyHours,
  Acknowledgement,
  AdminAcknowledgement,
} from "./api-models.js";
export declare function serializeEmployee(entity: EntityEmployee): Employee;
export declare function serializePTOEntry(entity: EntityPtoEntry): PTOEntry;
export declare function serializeMonthlyHours(
  entity: EntityMonthlyHours,
): MonthlyHours;
export declare function serializeAcknowledgement(
  entity: EntityAcknowledgement,
): Acknowledgement;
export declare function serializeAdminAcknowledgement(
  entity: EntityAdminAcknowledgement,
): AdminAcknowledgement;
//# sourceMappingURL=entity-transforms.d.ts.map

/*
---
file: "shared/excel/acknowledgements.d.ts"
dependencies: ["./types.js","exceljs"]
lineCount: 18
exports: ["parseAcknowledgements","generateImportAcknowledgements"]
---
*/
// ===== shared/excel/acknowledgements.d.ts =====
/**
 * Excel Parsing — Acknowledgement Parsing & Generation
 *
 * Functions for reading acknowledgement marks from worksheets and
 * generating import acknowledgement records based on reconciliation results.
 */
import type ExcelJS from "exceljs";
import type {
  ImportedAcknowledgement,
  ImportedPtoEntry,
  PtoCalcRow,
} from "./types.js";
/**
 * Parse acknowledgement marks from the worksheet.
 */
export declare function parseAcknowledgements(
  ws: ExcelJS.Worksheet,
  year: number,
): ImportedAcknowledgement[];
/**
 * Generate import acknowledgement records by comparing final calendar
 * totals against declared PTO Calc totals.
 */
export declare function generateImportAcknowledgements(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  year: number,
  sheetName: string,
): ImportedAcknowledgement[];
//# sourceMappingURL=acknowledgements.d.ts.map

/*
---
file: "shared/excel/calendarParsing.d.ts"
dependencies: ["../businessRules.js","./types.js","exceljs"]
lineCount: 14
exports: ["parseCalendarGrid"]
---
*/
// ===== shared/excel/calendarParsing.d.ts =====
/**
 * Excel Parsing — Calendar Grid Parsing
 *
 * Parses the 12-month calendar grid from a worksheet, matching cell
 * fill colors against the legend to identify PTO entries.
 */
import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";
import type { CalendarParseResult } from "./types.js";
/**
 * Parse the 12-month calendar grid from a worksheet.
 */
export declare function parseCalendarGrid(
  ws: ExcelJS.Worksheet,
  year: number,
  legend: Map<string, PTOType>,
  themeColors?: Map<number, string>,
  partialPtoColors?: Set<string>,
): CalendarParseResult;
//# sourceMappingURL=calendarParsing.d.ts.map

/*
---
file: "shared/excel/cellUtils.d.ts"
dependencies: ["exceljs"]
lineCount: 20
exports: ["extractCellNoteText","parseHoursFromNote","isStrictHoursMatch"]
---
*/
// ===== shared/excel/cellUtils.d.ts =====
/**
 * Excel Parsing — Cell Note Utilities
 *
 * Functions for extracting text from cell notes/comments and
 * parsing hours from note content.
 */
import type ExcelJS from "exceljs";
/**
 * Extract the plain-text content of a cell's note/comment.
 */
export declare function extractCellNoteText(cell: ExcelJS.Cell): string;
/**
 * Try to parse hours from a note string.
 */
export declare function parseHoursFromNote(note: string): number | undefined;
/**
 * Check if a note contains a clear, unambiguous hours specification.
 */
export declare function isStrictHoursMatch(note: string): boolean;
//# sourceMappingURL=cellUtils.d.ts.map

/*
---
file: "shared/excel/colorUtils.d.ts"
dependencies: ["../businessRules.js"]
lineCount: 19
exports: ["parseThemeColors","resolveColorToARGB","colorDistance","findClosestLegendColor"]
---
*/
// ===== shared/excel/colorUtils.d.ts =====
/**
 * Excel Parsing — Theme Color Resolution
 *
 * Functions for parsing workbook theme XML, resolving cell colors to ARGB,
 * and computing color distances for approximate matching.
 */
import type { PTOType } from "../businessRules.js";
/**
 * Parse theme colors from the workbook's theme1 XML.
 */
export declare function parseThemeColors(themeXml: string): Map<number, string>;
export declare function resolveColorToARGB(
  color:
    | {
        argb?: string;
        theme?: number;
        tint?: number;
      }
    | undefined,
  themeColors?: Map<number, string>,
): string | undefined;
export declare function colorDistance(argb1: string, argb2: string): number;
export declare function findClosestLegendColor(
  cellArgb: string,
  legend: Map<string, PTOType>,
): PTOType | undefined;
//# sourceMappingURL=colorUtils.d.ts.map

/*
---
file: "shared/excel/employeeParsing.d.ts"
dependencies: ["./types.js","exceljs"]
lineCount: 31
exports: ["isEmployeeSheet","parseEmployeeInfo","generateIdentifier","computePtoRate"]
---
*/
// ===== shared/excel/employeeParsing.d.ts =====
/**
 * Excel Parsing — Employee Info Parsing
 *
 * Functions for detecting employee sheets, extracting employee metadata,
 * generating identifiers, and computing PTO rates.
 */
import type ExcelJS from "exceljs";
import type { EmployeeImportInfo } from "./types.js";
/**
 * Detect whether a worksheet is an employee sheet.
 */
export declare function isEmployeeSheet(ws: ExcelJS.Worksheet): boolean;
/**
 * Parse employee metadata from a worksheet.
 */
export declare function parseEmployeeInfo(ws: ExcelJS.Worksheet): {
  info: EmployeeImportInfo;
  resolved: string[];
};
/**
 * Generate an email identifier from an employee name.
 */
export declare function generateIdentifier(name: string): string;
/**
 * Compute the correct PTO rate from the hire date and year.
 */
export declare function computePtoRate(info: EmployeeImportInfo): {
  rate: number;
  warning: string | null;
};
//# sourceMappingURL=employeeParsing.d.ts.map

/*
---
file: "shared/excel/index.d.ts"
dependencies: []
lineCount: 19
exports: []
---
*/
// ===== shared/excel/index.d.ts =====
/**
 * Excel Parsing — Barrel Re-export
 *
 * Re-exports all public API from the excel parsing submodules.
 * Import from this file (or from `shared/excelParsing.js` for backward
 * compatibility) to access all parsing functions and types.
 */
export type {
  ImportedPtoEntry,
  ImportedAcknowledgement,
  EmployeeImportInfo,
  SheetImportResult,
  ImportResult,
  PtoCalcRow,
  UnmatchedNotedCell,
  WorkedCell,
  UnmatchedColoredCell,
  CalendarParseResult,
} from "./types.js";
export {
  SUPERSCRIPT_TO_DIGIT,
  DEFAULT_OFFICE_THEME,
  COLUMN_S_TRACKED_TYPES,
  pad2,
  getCellNumericValue,
} from "./types.js";
export {
  parseThemeColors,
  resolveColorToARGB,
  colorDistance,
  findClosestLegendColor,
} from "./colorUtils.js";
export {
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,
} from "./cellUtils.js";
export {
  findLegendHeaderRow,
  parseLegend,
  parsePartialPtoColors,
} from "./legendParsing.js";
export { parseCalendarGrid } from "./calendarParsing.js";
export {
  findPtoCalcStartRow,
  parsePtoCalcUsedHours,
  parseCarryoverHours,
} from "./ptoCalcParsing.js";
export {
  adjustPartialDays,
  reconcilePartialPto,
  parseWorkedHoursFromNote,
  processWorkedCells,
  inferWeekendPartialHours,
  overrideTypeFromNote,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reclassifyBereavementByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,
} from "./reconciliation.js";
export {
  isEmployeeSheet,
  parseEmployeeInfo,
  generateIdentifier,
  computePtoRate,
} from "./employeeParsing.js";
export {
  parseAcknowledgements,
  generateImportAcknowledgements,
} from "./acknowledgements.js";
export {
  parseEmployeeSheet,
  extractThemeColors,
} from "./parseEmployeeSheet.js";
//# sourceMappingURL=index.d.ts.map

/*
---
file: "shared/excel/legendParsing.d.ts"
dependencies: ["../businessRules.js","exceljs"]
lineCount: 22
exports: ["findLegendHeaderRow","parseLegend","parsePartialPtoColors"]
---
*/
// ===== shared/excel/legendParsing.d.ts =====
/**
 * Excel Parsing — Legend & Color Parsing
 *
 * Functions for finding and parsing the legend section of a worksheet
 * (column Z), mapping cell fill colors to PTO types.
 */
import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";
/**
 * Find the row containing the "Legend" header in column Z.
 */
export declare function findLegendHeaderRow(ws: ExcelJS.Worksheet): number;
/**
 * Parse the legend section from column Z to build a color→PTOType map.
 */
export declare function parseLegend(
  ws: ExcelJS.Worksheet,
  themeColors?: Map<number, string>,
): Map<string, PTOType>;
/**
 * Scan the legend section and return the set of ARGB color strings
 * whose label is "Partial PTO".
 */
export declare function parsePartialPtoColors(
  ws: ExcelJS.Worksheet,
  themeColors?: Map<number, string>,
): Set<string>;
//# sourceMappingURL=legendParsing.d.ts.map

/*
---
file: "shared/excel/parseEmployeeSheet.d.ts"
dependencies: ["./types.js","exceljs"]
lineCount: 19
exports: ["parseEmployeeSheet","extractThemeColors"]
---
*/
// ===== shared/excel/parseEmployeeSheet.d.ts =====
/**
 * Excel Parsing — Sheet Orchestrator
 *
 * The top-level `parseEmployeeSheet` function that coordinates all parsing
 * phases for a single employee worksheet, and `extractThemeColors` for
 * reading workbook-level theme data.
 */
import type ExcelJS from "exceljs";
import type { SheetImportResult } from "./types.js";
/**
 * Parse a single employee worksheet and return all extracted data (no DB interaction).
 */
export declare function parseEmployeeSheet(
  ws: ExcelJS.Worksheet,
  themeColors?: Map<number, string>,
): SheetImportResult;
/**
 * Extract theme colors from an ExcelJS workbook object.
 * Works with both Node.js and browser builds of ExcelJS.
 */
export declare function extractThemeColors(
  workbook: ExcelJS.Workbook,
): Map<number, string>;
//# sourceMappingURL=parseEmployeeSheet.d.ts.map

/*
---
file: "shared/excel/ptoCalcParsing.d.ts"
dependencies: ["./types.js","exceljs"]
lineCount: 21
exports: ["findPtoCalcStartRow","parsePtoCalcUsedHours","parseCarryoverHours"]
---
*/
// ===== shared/excel/ptoCalcParsing.d.ts =====
/**
 * Excel Parsing — PTO Calculation Section Parsing
 *
 * Functions for locating and parsing the PTO Calculation section
 * of the worksheet, including used hours per month and carryover.
 */
import type ExcelJS from "exceljs";
import type { PtoCalcRow } from "./types.js";
/**
 * Find the PTO Calculation data start row.
 */
export declare function findPtoCalcStartRow(ws: ExcelJS.Worksheet): number;
/**
 * Parse the used-hours column (S = 19) from the PTO Calculation section.
 */
export declare function parsePtoCalcUsedHours(
  ws: ExcelJS.Worksheet,
): PtoCalcRow[];
/**
 * Parse the carryover hours from cell L42 (or dynamically found start row).
 */
export declare function parseCarryoverHours(ws: ExcelJS.Worksheet): number;
//# sourceMappingURL=ptoCalcParsing.d.ts.map

/*
---
file: "shared/excel/reconciliation.d.ts"
dependencies: ["./types.js"]
lineCount: 101
exports: ["adjustPartialDays","reconcilePartialPto","parseWorkedHoursFromNote","processWorkedCells","inferWeekendPartialHours","overrideTypeFromNote","reclassifySickAsPto","reclassifySickByColumnS","reclassifyBereavementByColumnS","reconcileUnmatchedColoredCells","detectOverColoring"]
---
*/
// ===== shared/excel/reconciliation.d.ts =====
/**
 * Excel Parsing — Reconciliation Phases
 *
 * All reconciliation and reclassification functions that adjust PTO entries
 * based on column S declarations, cell notes, color matching, sick allowance
 * limits, weekend work, and other business rules.
 */
import type {
  ImportedPtoEntry,
  PtoCalcRow,
  UnmatchedColoredCell,
  UnmatchedNotedCell,
  WorkedCell,
} from "./types.js";
/**
 * Adjust partial PTO entry hours to reconcile against column S totals.
 */
export declare function adjustPartialDays(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName?: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Reconcile partial PTO entries that were missed by calendar color matching.
 */
export declare function reconcilePartialPto(
  entries: ImportedPtoEntry[],
  unmatchedNotedCells: UnmatchedNotedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Try to parse hours from a "worked" note.
 */
export declare function parseWorkedHoursFromNote(
  note: string,
): number | undefined;
/**
 * Process "worked" weekend/off-day cells to create negative PTO credit entries.
 */
export declare function processWorkedCells(
  workedCells: WorkedCell[],
  existingEntries: ImportedPtoEntry[],
  ptoCalcRows: {
    month: number;
    usedHours: number;
  }[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Joint inference for months with both Partial PTO and unprocessed weekend work.
 */
export declare function inferWeekendPartialHours(
  entries: ImportedPtoEntry[],
  workedCells: WorkedCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  newWorkedEntries: ImportedPtoEntry[];
  handledWorkedDates: Set<string>;
  warnings: string[];
  resolved: string[];
};
/**
 * Override the PTO type for approximate-color-matched entries when the cell
 * note contains an explicit type keyword.
 */
export declare function overrideTypeFromNote(
  entries: ImportedPtoEntry[],
  sheetName?: string,
): {
  entries: ImportedPtoEntry[];
  workedCells: WorkedCell[];
  warnings: string[];
  resolved: string[];
};
/**
 * Reclassify Sick-colored entries as PTO when the employee has exhausted
 * their annual sick-time allowance (24h).
 */
export declare function reclassifySickAsPto(
  entries: ImportedPtoEntry[],
  sheetName?: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * After all reconciliation phases, reclassify Sick entries as PTO based
 * on column S gap.
 */
export declare function reclassifySickByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName?: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Reclassify approximate-matched Bereavement entries as PTO when column S
 * declares more PTO than detected.
 */
export declare function reclassifyBereavementByColumnS(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName?: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Reconcile unmatched colored cells as PTO when column S declares more.
 */
export declare function reconcileUnmatchedColoredCells(
  existingEntries: ImportedPtoEntry[],
  unmatchedColoredCells: UnmatchedColoredCell[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  entries: ImportedPtoEntry[];
  warnings: string[];
  resolved: string[];
};
/**
 * Detect months where calendar-detected PTO exceeds the declared column S total.
 */
export declare function detectOverColoring(
  entries: ImportedPtoEntry[],
  ptoCalcRows: PtoCalcRow[],
  sheetName: string,
): {
  warnings: string[];
};
//# sourceMappingURL=reconciliation.d.ts.map

/*
---
file: "shared/excel/types.d.ts"
dependencies: ["../businessRules.js","exceljs"]
lineCount: 136
exports: ["COL_STARTS","ROW_GROUP_STARTS","LEGEND_COL","LEGEND_SCAN_MAX_ROW","PTO_CALC_DATA_START_ROW","EMP_ACK_COL","ADMIN_ACK_COL","SUPERSCRIPT_TO_DIGIT","LEGEND_LABEL_TO_PTO_TYPE","MAX_COLOR_DISTANCE","DEFAULT_OFFICE_THEME","COLUMN_S_TRACKED_TYPES","ANNUAL_SICK_ALLOWANCE","MAX_SINGLE_ENTRY_HOURS","MIN_CHROMA_FOR_APPROX","DAY1_SCAN_RANGE","OVERCOLOR_NOTE_KEYWORDS","ImportedPtoEntry","ImportedAcknowledgement","EmployeeImportInfo","SheetImportResult","ImportResult","PtoCalcRow","UnmatchedNotedCell","WorkedCell","UnmatchedColoredCell","CalendarParseResult","pad2","getCellNumericValue"]
---
*/
// ===== shared/excel/types.d.ts =====
/**
 * Excel Parsing — Shared Types and Constants
 *
 * All interfaces, type exports, and shared constants used across
 * the excel parsing modules.
 */
import type ExcelJS from "exceljs";
import type { PTOType } from "../businessRules.js";
/** Calendar grid column-group start columns (1-indexed). */
export declare const COL_STARTS: number[];
/** Calendar grid row-group header rows. */
export declare const ROW_GROUP_STARTS: number[];
/** Legend column (Z = 26). */
export declare const LEGEND_COL = 26;
/** Max rows to scan when searching for dynamic positions. */
export declare const LEGEND_SCAN_MAX_ROW = 30;
/** PTO Calculation section: assumed data start row (January). */
export declare const PTO_CALC_DATA_START_ROW = 42;
/** Acknowledgement columns. */
export declare const EMP_ACK_COL = 24;
export declare const ADMIN_ACK_COL = 25;
/** Superscript Unicode map for decoding partial-day decorations. */
export declare const SUPERSCRIPT_TO_DIGIT: Record<string, number>;
/** Legend label → canonical PTOType mapping. */
export declare const LEGEND_LABEL_TO_PTO_TYPE: Record<string, PTOType>;
/** Maximum Euclidean RGB distance for approximate color matching. */
export declare const MAX_COLOR_DISTANCE = 100;
/**
 * Standard Office 2010 theme palette.
 * Used as fallback when workbook theme XML is unavailable.
 */
export declare const DEFAULT_OFFICE_THEME: Map<number, string>;
/**
 * PTO types tracked in the spreadsheet's "PTO hours per Month" column (S).
 */
export declare const COLUMN_S_TRACKED_TYPES: Set<string>;
/** Annual sick-time allowance in hours. */
export declare const ANNUAL_SICK_ALLOWANCE = 24;
/** Maximum hours a single PTO entry can represent (sanity cap). */
export declare const MAX_SINGLE_ENTRY_HOURS = 24;
/** Minimum chroma for approximate color matching. */
export declare const MIN_CHROMA_FOR_APPROX = 40;
/** Maximum rows to scan above/below expected position when searching for day 1. */
export declare const DAY1_SCAN_RANGE = 3;
/** Keywords in cell notes indicating weekend-makeup work. */
export declare const OVERCOLOR_NOTE_KEYWORDS: RegExp;
export interface ImportedPtoEntry {
  date: string;
  type: PTOType;
  hours: number;
  notes?: string;
  /** True when the calendar cell matched a "Partial PTO" legend color. */
  isPartialPtoColor?: boolean;
  /** True when hours were extracted from a cell note (authoritative). */
  isNoteDerived?: boolean;
}
export interface ImportedAcknowledgement {
  month: string;
  type: "employee" | "admin";
  note?: string;
  status?: "warning" | null;
}
export interface EmployeeImportInfo {
  name: string;
  hireDate: string;
  year: number;
  carryoverHours: number;
  /** PTO daily rate read from the spreadsheet (column F, December row). */
  spreadsheetPtoRate: number;
}
export interface SheetImportResult {
  employee: EmployeeImportInfo;
  ptoEntries: ImportedPtoEntry[];
  acknowledgements: ImportedAcknowledgement[];
  warnings: string[];
  /** Fatal or blocking issues that prevented full processing. */
  errors: string[];
  /** Auto-corrected issues that were resolved during parsing. */
  resolved: string[];
}
export interface ImportResult {
  employeesProcessed: number;
  employeesCreated: number;
  ptoEntriesUpserted: number;
  ptoEntriesAutoApproved: number;
  acknowledgementsSynced: number;
  warnings: string[];
  /** Fatal or blocking issues that prevented full processing. */
  errors: string[];
  /** Auto-corrected issues that were resolved during parsing. */
  resolved: string[];
  perEmployee: {
    name: string;
    employeeId: number;
    ptoEntries: number;
    ptoEntriesAutoApproved: number;
    acknowledgements: number;
    created: boolean;
  }[];
}
export interface PtoCalcRow {
  month: number;
  usedHours: number;
}
/** Info about a calendar cell that has a note but no legend color match. */
export interface UnmatchedNotedCell {
  date: string;
  note: string;
}
/** Info about a calendar cell with a "worked" note and no legend color match. */
export interface WorkedCell {
  date: string;
  note: string;
}
/** Info about a calendar cell with a non-legend fill color and no note. */
export interface UnmatchedColoredCell {
  date: string;
  color: string;
  note: string;
}
/** Result of parsing the calendar grid. */
export interface CalendarParseResult {
  entries: ImportedPtoEntry[];
  unmatchedNotedCells: UnmatchedNotedCell[];
  workedCells: WorkedCell[];
  unmatchedColoredCells: UnmatchedColoredCell[];
  warnings: string[];
  resolved: string[];
}
export declare function pad2(n: number): string;
/**
 * Extract the numeric value from a cell, handling plain numbers,
 * formula results, and string representations.
 */
export declare function getCellNumericValue(
  cell: ExcelJS.Cell,
): number | undefined;
//# sourceMappingURL=types.d.ts.map

/*
---
file: "shared/excelParsing.d.ts"
dependencies: []
lineCount: 13
exports: []
---
*/
// ===== shared/excelParsing.d.ts =====
/**
 * Excel PTO Spreadsheet Parsing — Backward-Compatibility Barrel
 *
 * This file re-exports the entire public API from the refactored
 * `shared/excel/` submodules so that existing imports from
 * `shared/excelParsing.js` continue to work unchanged.
 *
 * For new code, prefer importing directly from `shared/excel/index.js`
 * or from the specific submodule (e.g. `shared/excel/reconciliation.js`).
 */
export {
  SUPERSCRIPT_TO_DIGIT,
  DEFAULT_OFFICE_THEME,
  COLUMN_S_TRACKED_TYPES,
  pad2,
  getCellNumericValue,
  parseThemeColors,
  resolveColorToARGB,
  colorDistance,
  findClosestLegendColor,
  extractCellNoteText,
  parseHoursFromNote,
  isStrictHoursMatch,
  findLegendHeaderRow,
  parseLegend,
  parsePartialPtoColors,
  parseCalendarGrid,
  findPtoCalcStartRow,
  parsePtoCalcUsedHours,
  parseCarryoverHours,
  adjustPartialDays,
  reconcilePartialPto,
  parseWorkedHoursFromNote,
  processWorkedCells,
  inferWeekendPartialHours,
  overrideTypeFromNote,
  reclassifySickAsPto,
  reclassifySickByColumnS,
  reclassifyBereavementByColumnS,
  reconcileUnmatchedColoredCells,
  detectOverColoring,
  isEmployeeSheet,
  parseEmployeeInfo,
  generateIdentifier,
  computePtoRate,
  parseAcknowledgements,
  generateImportAcknowledgements,
  parseEmployeeSheet,
  extractThemeColors,
} from "./excel/index.js";
export type {
  ImportedPtoEntry,
  ImportedAcknowledgement,
  EmployeeImportInfo,
  SheetImportResult,
  ImportResult,
  PtoCalcRow,
  UnmatchedNotedCell,
  WorkedCell,
  UnmatchedColoredCell,
  CalendarParseResult,
} from "./excel/index.js";
//# sourceMappingURL=excelParsing.d.ts.map

/*
---
file: "shared/logger.d.ts"
dependencies: []
lineCount: 39
exports: ["LogLevel","LogEntry","Logger","logger","log","getLogPath"]
---
*/
// ===== shared/logger.d.ts =====
export declare enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
}
export declare class Logger {
  private static instance;
  private currentLogLevel;
  private logsDir;
  private logFormat;
  private constructor();
  static getInstance(): Logger;
  private parseLogLevel;
  private ensureLogsDirectory;
  getLogPath(date?: string): string;
  private formatLogEntry;
  private writeLog;
  private shouldLog;
  error(message: string, context?: Record<string, any>): void;
  warn(message: string, context?: Record<string, any>): void;
  info(message: string, context?: Record<string, any>): void;
  debug(message: string, context?: Record<string, any>): void;
  log(message: string): void;
  getLogLevel(): LogLevel;
  setLogLevel(level: LogLevel): void;
  getLogFiles(startDate: string, endDate: string): string[];
  cleanupOldLogs(retentionDays?: number): void;
}
export declare const logger: Logger;
export declare function log(message: string): void;
export declare function getLogPath(): string;
//# sourceMappingURL=logger.d.ts.map

/*
---
file: "shared/seedData.d.ts"
dependencies: []
lineCount: 26
exports: ["SeedPtoEntry","SeedAdminAcknowledgment","SeedEmployee","seedPTOEntries","seedAdminAcknowledgments","seedEmployees"]
---
*/
// ===== shared/seedData.d.ts =====
export type SeedPtoEntry = {
  employee_id: number;
  date: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  approved_by?: number | null;
};
export type SeedAdminAcknowledgment = {
  employee_id: number;
  month: string;
  admin_id: number;
  acknowledged_at: string;
};
export type SeedEmployee = {
  name: string;
  identifier: string;
  pto_rate: number;
  carryover_hours: number;
  hire_date: string;
  role: "Employee" | "Admin";
  hash: string | null;
};
export declare const seedPTOEntries: SeedPtoEntry[];
export declare const seedAdminAcknowledgments: SeedAdminAcknowledgment[];
export declare const seedEmployees: SeedEmployee[];
//# sourceMappingURL=seedData.d.ts.map

/*
---
file: "shared/testDataGenerators.d.ts"
dependencies: []
lineCount: 72
exports: ["extractMonthlyPTOHours","extractMonthlyWorkDays","extractHireDate","extractYear","extractEmployeeName","extractPreviousYearsCarryOverPTO","extractEmployeeSignoffs","extractAdminSignoffs","SickHoursStatus","LegendEntry","extractSickHoursStatus","extractLegend","extractDailyRates","generateImportTestData","extractMonthCellRange"]
---
*/
// ===== shared/testDataGenerators.d.ts =====
/**
 * This file contains utilities for extracting data from the DWP Hours Tracker spreadsheet template.
 * The spreadsheet is used for managing employee PTO and hours tracking, containing monthly PTO hours,
 * work days, sick time status, employee information, and various calculated fields.
 *
 * Data Location Map:
 *
 * Employee Information:
 * - Employee Name: Cell J2
 * - Hire Date: Cell R2 (formatted as "Hire Date: MM/DD/YY")
 * - Year: Cell B2
 *
 * Monthly Data (Rows 42-53):
 * - Work Days: Column D (D42-D53)
 * - Daily Rates: Column F (F42-F53)
 * - Previous Years Carry Over PTO: Cell L42 (or computed as V42 - J42 if L42 is blank)
 * - PTO Hours: Column S (S42-S53)
 * - Employee Signoffs: Column X (X42-X53)
 * - Admin Signoffs: Column Y (Y42-Y53)
 *
 * Sick Time Status:
 * - Allowed Hours: Cell AB32
 * - Used Hours: Cell AB33
 * - Remaining Hours: Cell AB34
 *
 * Legend:
 * - Legend Entries: Column Z, rows 9-14 (Z9-Z14)
 *   - Each entry includes a name and color
 *
 * Monthly Sections:
 * - Month Headers: Located dynamically by searching for month names (January-December)
 * - Month Data Ranges: Calculated as starting 2 rows below month header, spanning 7 columns
 *   (typically days of week), with height equal to number of weeks in the month
 */
interface JsonSheet {
  cells: {
    [key: string]: {
      value?:
        | number
        | string
        | {
            result: number;
            sharedFormula: string;
          };
      formula?: string;
      color?: string;
    };
  };
}
type JsonSheets = Record<string, JsonSheet>;
type JsonSheetsTemplate = Record<string, JsonSheets>;
export declare function extractMonthlyPTOHours(sheetData: JsonSheet): number[];
export declare function extractMonthlyWorkDays(sheetData: JsonSheet): number[];
export declare function extractHireDate(sheetData: JsonSheet): string | null;
export declare function extractYear(sheetData: JsonSheet): number | null;
export declare function extractEmployeeName(
  sheetData: JsonSheet,
): string | null;
export declare function extractPreviousYearsCarryOverPTO(
  sheetData: JsonSheet,
): number;
export declare function extractEmployeeSignoffs(sheetData: JsonSheet): string[];
export declare function extractAdminSignoffs(sheetData: JsonSheet): string[];
export interface SickHoursStatus {
  allowed: number;
  used: number;
  remaining: number;
}
export interface LegendEntry {
  name: string;
  color: string;
}
export declare function extractSickHoursStatus(
  sheetData: JsonSheet,
): SickHoursStatus | null;
export declare function extractLegend(sheetData: JsonSheet): LegendEntry[];
export declare function extractDailyRates(sheetData: JsonSheet): number[];
export declare function generateImportTestData(): JsonSheetsTemplate;
export declare function extractMonthCellRange(
  sheetData: JsonSheet,
  monthName: string,
): string | null;
export {};
//# sourceMappingURL=testDataGenerators.d.ts.map

/*
---
Questions and Concerns:
1. Should the generator be integrated into the build process?
2. How frequently should the types file be regenerated?
3. Are there any sensitive types that should be excluded?
4. Should the output format be customizable?
5. How to handle circular dependencies in the dependency analysis?
---
*/
