import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { ConfirmationDialog } from "../../components/confirmation-dialog/index.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { createElement } from "../../components/test-utils.js";
import { styles } from "./css.js";

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

    // Handle data requests from the `admin-monthly-review` child component
    this.shadowRoot.addEventListener(
      "admin-monthly-review-request",
      (evt: Event) => {
        const e = evt as CustomEvent;
        e.stopPropagation();
        (async () => {
          const month: string = e.detail?.month;
          try {
            const [employeeData, ptoEntries] = await Promise.all([
              this.api.getAdminMonthlyReview(month),
              this.api.getAdminPTOEntries(),
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
            }));
            adminComp.setPtoEntries(normalized);

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
  }

  private handleAdminAcknowledgeReview(
    employeeId: number,
    employeeName: string,
    month: string,
  ): void {
    const dialog = createElement<ConfirmationDialog>("confirmation-dialog");
    dialog.message = `Are you sure you want to acknowledge the monthly review for ${employeeName} (${month})? This action confirms that you have reviewed their hours and PTO data for this month.`;
    dialog.confirmText = "Acknowledge";
    dialog.cancelText = "Cancel";

    const handleConfirm = () => {
      this.submitAcknowledgment(employeeId, month);
      document.body.removeChild(dialog);
    };
    const handleCancel = () => {
      document.body.removeChild(dialog);
    };

    dialog.addEventListener("confirm", handleConfirm);
    dialog.addEventListener("cancel", handleCancel);
    document.body.appendChild(dialog);
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
        const [employeeData, ptoEntries] = await Promise.all([
          this.api.getAdminMonthlyReview(month),
          this.api.getAdminPTOEntries(),
        ]);
        const normalized = (ptoEntries || []).map((p: any) => ({
          employee_id: p.employeeId,
          type: p.type,
          hours: p.hours,
          date: p.date,
        }));
        adminComp.setPtoEntries(normalized);
        adminComp.setEmployeeData(employeeData);
      }
    } catch (error: any) {
      console.error("Failed to submit admin acknowledgment:", error);
      notifications.error(
        "Failed to submit acknowledgment: " +
          (error.message || "Unknown error"),
      );
    }
  }
}

customElements.define("admin-monthly-review-page", AdminMonthlyReviewPage);
