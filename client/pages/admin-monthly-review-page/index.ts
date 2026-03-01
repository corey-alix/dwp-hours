import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { styles } from "./css.js";
import {
  SUCCESS_MESSAGES,
  NOTIFICATION_MESSAGES,
} from "../../../shared/businessRules.js";

/**
 * Admin Monthly Review page.
 * Wraps `<admin-monthly-review>` and handles acknowledgment dialog.
 */
export class AdminMonthlyReviewPage
  extends BaseComponent
  implements PageComponent
{
  private api = new APIClient();

  async onRouteEnter(
    _params: Record<string, string>,
    _search: URLSearchParams,
    _loaderData?: unknown,
  ): Promise<void> {
    this.requestUpdate();
  }

  protected render(): string {
    return `
      ${styles}
      <p class="capitalize center">Review and acknowledge employee hours and PTO usage for the selected month.</p>
      <admin-monthly-review></admin-monthly-review>
    `;
  }

  private _customEventsSetup = false;

  protected setupEventDelegation(): void {
    super.setupEventDelegation();
    if (this._customEventsSetup) return;
    this._customEventsSetup = true;

    this.shadowRoot.addEventListener("admin-acknowledge", ((e: CustomEvent) => {
      e.stopPropagation();
      this.handleAdminAcknowledgeReview(
        e.detail.employeeId,
        e.detail.employeeName,
        e.detail.month,
      );
    }) as EventListener);

    this.shadowRoot.addEventListener("send-lock-reminder", ((
      e: CustomEvent,
    ) => {
      e.stopPropagation();
      this.handleSendLockReminder(e.detail.employeeId, e.detail.month);
    }) as EventListener);

    // Handle data requests from the `admin-monthly-review` child component
    this.shadowRoot.addEventListener(
      "admin-monthly-review-request",
      (evt: Event) => {
        const e = evt as CustomEvent;
        e.stopPropagation();
        (async () => {
          const month: string = e.detail?.month;
          try {
            const [employeeData, ptoEntries, employees] = await Promise.all([
              this.api.getAdminMonthlyReview(month),
              this.api.getAdminPTOEntries(),
              this.api.getEmployees(),
            ]);

            const adminComp = this.shadowRoot?.querySelector(
              "admin-monthly-review",
            ) as any;
            if (!adminComp)
              throw new Error("admin-monthly-review element not found");

            // Normalize PTO entries shape expected by businessRules (employee_id, type, hours, date)
            const normalized = (ptoEntries || []).map((p: any) => ({
              employee_id: p.employeeId,
              type: p.type,
              hours: p.hours,
              date: p.date,
              approved_by: p.approved_by ?? null,
              notes: p.notes ?? null,
            }));
            adminComp.setPtoEntries(normalized);

            // Inject employee details for accurate PTO allowance computation
            const empList = Array.isArray(employees)
              ? employees
              : ((employees as any)?.employees ?? []);
            adminComp.setEmployeeDetails(
              empList.map((emp: any) => ({
                id: emp.id,
                hireDate: emp.hireDate,
                carryoverHours: emp.carryoverHours ?? 0,
              })),
            );

            // Inject employee data — balance summaries are now rendered
            // declaratively inside admin-monthly-review's template
            adminComp.setEmployeeData(employeeData);
          } catch (error: any) {
            console.error("Failed to load admin monthly review data:", error);
            notifications.error(
              "Failed to load monthly review data: " + (error?.message || ""),
            );
          }
        })().catch((err) => console.error(err));
      },
    );

    // Handle calendar month navigation data requests from inline calendars
    this.shadowRoot.addEventListener(
      "calendar-month-data-request",
      (evt: Event) => {
        const e = evt as CustomEvent;
        e.stopPropagation();
        (async () => {
          const month: string = e.detail?.month;
          if (!month) return;
          try {
            // Fetch PTO entries scoped to the requested month
            const startDate = `${month}-01`;
            // Compute end of month: parse year/month, get last day
            const [y, m] = month.split("-").map(Number);
            const lastDay = new Date(y, m, 0).getDate();
            const endDate = `${month}-${String(lastDay).padStart(2, "0")}`;

            // Fetch PTO entries and monthly review data in parallel
            const [ptoEntries, monthlyReview] = await Promise.all([
              this.api.getAdminPTOEntries({ startDate, endDate }),
              this.api.getAdminMonthlyReview(month),
            ]);

            const adminComp = this.shadowRoot?.querySelector(
              "admin-monthly-review",
            ) as any;
            if (!adminComp) return;

            const normalized = (ptoEntries || []).map((p: any) => ({
              employee_id: p.employeeId,
              type: p.type,
              hours: p.hours,
              date: p.date,
              approved_by: p.approved_by ?? null,
              notes: p.notes ?? null,
            }));
            adminComp.setMonthPtoEntries(month, normalized);

            // Pass acknowledgement data so the card warning/note updates
            const ackData = (monthlyReview || []).map((item: any) => ({
              employeeId: item.employeeId,
              status: item.employeeAckStatus ?? null,
              note: item.employeeAckNote ?? null,
            }));
            adminComp.setMonthAckData(month, ackData);
          } catch (error: any) {
            console.error(`Failed to load PTO data for month ${month}:`, error);
          }
        })().catch((err) => console.error(err));
      },
    );
  }

  /**
   * Handle acknowledge event from the admin-monthly-review component.
   * The inline confirmation has already happened inside the component.
   * Optimistic dismiss: animate the card out immediately, then call the API.
   * If the API fails, reverse the animation so the admin can retry.
   */
  private async handleAdminAcknowledgeReview(
    employeeId: number,
    _employeeName: string,
    month: string,
  ): Promise<void> {
    const adminComp = this.shadowRoot?.querySelector(
      "admin-monthly-review",
    ) as any;

    // Optimistic dismiss — animate card out immediately
    if (adminComp?.dismissCard) {
      await adminComp.dismissCard(employeeId);
    }

    try {
      await this.submitAcknowledgment(employeeId, month);
    } catch {
      // API failed — roll back the dismiss animation
      if (adminComp?.undismissCard) {
        await adminComp.undismissCard(employeeId);
      }
    }
  }

  /**
   * Send a lock-reminder notification to an employee.
   * Single click — no confirmation dialog.
   */
  private async handleSendLockReminder(
    employeeId: number,
    month: string,
  ): Promise<void> {
    try {
      const message = NOTIFICATION_MESSAGES["calendar_lock_reminder"].replace(
        "{month}",
        month,
      );
      await this.api.createNotification(
        employeeId,
        "calendar_lock_reminder",
        message,
      );
      notifications.success(
        SUCCESS_MESSAGES["notification.calendar_lock_sent"],
      );

      // Optimistic UI update: swap the lock indicator to "notified" state
      const adminComp = this.shadowRoot?.querySelector(
        "admin-monthly-review",
      ) as any;
      if (adminComp?.updateLockIndicator) {
        adminComp.updateLockIndicator(employeeId, "notified");
      }
    } catch (error: any) {
      console.error("Failed to send lock reminder:", error);
      notifications.error(
        "Failed to send reminder: " + (error.message || "Unknown error"),
      );
    }
  }

  private async submitAcknowledgment(
    employeeId: number,
    month: string,
  ): Promise<void> {
    try {
      const response = await this.api.submitAdminAcknowledgement(
        employeeId,
        month,
      );
      notifications.success(
        response.message || "Acknowledgment submitted successfully.",
      );

      // Re-fetch data so the card re-renders with the acknowledged state
      const adminComp = this.shadowRoot?.querySelector(
        "admin-monthly-review",
      ) as any;
      if (adminComp) {
        const [employeeData, ptoEntries, employees] = await Promise.all([
          this.api.getAdminMonthlyReview(month),
          this.api.getAdminPTOEntries(),
          this.api.getEmployees(),
        ]);
        const normalized = (ptoEntries || []).map((p: any) => ({
          employee_id: p.employeeId,
          type: p.type,
          hours: p.hours,
          date: p.date,
          approved_by: p.approved_by ?? null,
        }));
        adminComp.setPtoEntries(normalized);

        const empList = Array.isArray(employees)
          ? employees
          : ((employees as any)?.employees ?? []);
        adminComp.setEmployeeDetails(
          empList.map((emp: any) => ({
            id: emp.id,
            hireDate: emp.hireDate,
            carryoverHours: emp.carryoverHours ?? 0,
          })),
        );

        adminComp.setEmployeeData(employeeData);
      }
    } catch (error: any) {
      console.error("Failed to submit admin acknowledgment:", error);
      notifications.error(
        "Failed to submit acknowledgment: " +
          (error.message || "Unknown error"),
      );
      // Re-throw so the caller can detect failure and rollback the dismiss
      throw error;
    }
  }
}

customElements.define("admin-monthly-review-page", AdminMonthlyReviewPage);
