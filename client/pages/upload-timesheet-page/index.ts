import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { TimesheetUploadForm } from "../../components/timesheet-upload-form/index.js";
import { getServices } from "../../services/index.js";
import { consumeContext, CONTEXT_KEYS } from "../../shared/context.js";
import type { TraceListener } from "../../controller/TraceListener.js";
import { styles } from "./css.js";

const svc = getServices();

/**
 * Upload Timesheet page.
 * Hosts `<timesheet-upload-form>` and injects the authenticated user's profile
 * (name + hireDate) for client-side identity verification.
 */
export class UploadTimesheetPage
  extends BaseComponent
  implements PageComponent
{
  private _notifications: TraceListener | null = null;

  connectedCallback() {
    super.connectedCallback();
    consumeContext<TraceListener>(this, CONTEXT_KEYS.NOTIFICATIONS, (svc) => {
      this._notifications = svc;
    });
  }

  async onRouteEnter(): Promise<void> {
    this.requestUpdate();

    // Wait a tick for the DOM to initialise
    await new Promise((r) => setTimeout(r, 0));

    const form = this.shadowRoot.querySelector<TimesheetUploadForm>(
      "timesheet-upload-form",
    );
    if (!form) return;

    try {
      // Fetch the authenticated employee's profile via the session endpoint
      const session = await svc.auth.validateSession();
      if (!session?.valid || !session.employee) {
        this._notifications?.error(
          "Unable to load your profile. Please log in again.",
        );
        return;
      }

      form.profile = {
        name: session.employee.name,
        hireDate: session.employee.hireDate || "",
      };
    } catch (err) {
      this._notifications?.error(
        "Failed to load your profile. Please try again later.",
      );
    }
  }

  protected render(): string {
    return `
      ${styles}
      <h2 class="page-heading">Upload Timesheet</h2>
      <timesheet-upload-form></timesheet-upload-form>
    `;
  }
}

customElements.define("upload-timesheet-page", UploadTimesheetPage);
