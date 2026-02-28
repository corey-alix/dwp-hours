import { BaseComponent } from "../../components/base-component.js";
import type { PageComponent } from "../../router/types.js";
import type { TimesheetUploadForm } from "../../components/timesheet-upload-form/index.js";
import { APIClient } from "../../APIClient.js";
import { notifications } from "../../app.js";
import { styles } from "./css.js";

const api = new APIClient();

/**
 * Upload Timesheet page.
 * Hosts `<timesheet-upload-form>` and injects the authenticated user's profile
 * (name + hireDate) for client-side identity verification.
 */
export class UploadTimesheetPage
  extends BaseComponent
  implements PageComponent
{
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
      const session = await api.validateSession();
      if (!session?.valid || !session.employee) {
        notifications.error(
          "Unable to load your profile. Please log in again.",
        );
        return;
      }

      form.profile = {
        name: session.employee.name,
        hireDate: session.employee.hireDate || "",
      };
    } catch (err) {
      notifications.error(
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
