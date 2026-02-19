import type * as ApiTypes from "../shared/api-models";
import { UI_ERROR_MESSAGES } from "../shared/businessRules";
import {
  getCurrentYear,
  formatDateForDisplay,
  parseDate,
  getWorkdaysBetween,
  isWeekend,
  addDays,
} from "../shared/dateUtils";
import { APIClient } from "./APIClient";
import { notifications } from "./app";
import {
  PtoEntryForm,
  AdminPanel,
  PtoAccrualCard,
  PtoSickCard,
  PtoBereavementCard,
  PtoJuryDutyCard,
  PtoPtoCard,
  PtoCalendar,
  PtoSummaryCard,
  PtoEmployeeInfoCard,
  PriorYearReview,
  CurrentYearPtoScheduler,
  ConfirmationDialog,
  DashboardNavigationMenu,
} from "./components";
import type { CalendarEntry } from "./components/pto-calendar";
import {
  querySingle,
  addEventListener,
  createElement,
} from "./components/test-utils";

// UI Manager
export class UIManager {
  private currentUser: { id: number; name: string; role: string } | null = null;
  private availablePtoBalance: number = 0;
  private api: APIClient;

  constructor() {
    this.api = new APIClient();
    this.init();
  }

  private init(): void {
    this.checkAuth();
    this.setupEventListeners();
  }

  private async checkAuth(): Promise<void> {
    // Check URL params for magic link
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    const ts = urlParams.get("ts");
    if (token && ts) {
      try {
        const response = (await this.api.validateAuth(
          token,
          ts,
        )) as ApiTypes.AuthValidateResponse;
        this.setAuthCookie(response.authToken);
        localStorage.setItem("currentUser", JSON.stringify(response.employee));
        this.currentUser = response.employee as ApiTypes.Employee; // Cast to full Employee if needed, but actually it's partial
        this.showDashboard();
        await this.loadPTOStatus();
        // Clean URL
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
        return;
      } catch (error) {
        console.error("Auth validation failed:", error);
        notifications.error(
          "Invalid or expired magic link. Please request a new one.",
        );
      }
    }

    // Check cookie
    const cookieHash = this.getAuthCookie();
    if (cookieHash) {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
        this.showDashboard();
        await this.loadPTOStatus();
        return;
      }
    }

    this.showLogin();
  }

  private setAuthCookie(hash: string): void {
    document.cookie = `auth_hash=${hash}; path=/; max-age=${10 * 365 * 24 * 60 * 60}`; // 10 years
  }

  private getAuthCookie(): string | null {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "auth_hash") {
        return value;
      }
    }
    return null;
  }

  private setupEventListeners(): void {
    // Login form
    const loginForm = querySingle<HTMLFormElement>("#login-form");
    addEventListener(loginForm, "submit", (e) => this.handleLogin(e));

    // PTO form
    const ptoForm = querySingle<PtoEntryForm>("#pto-entry-form");
    addEventListener(ptoForm, "submit", (e) => this.handlePTO(e));
    addEventListener(ptoForm, "pto-submit", (e: CustomEvent) =>
      this.handlePtoRequestSubmit(e),
    );
    addEventListener(ptoForm, "pto-data-request", () =>
      this.handlePtoDataRequest(ptoForm),
    );
    addEventListener(ptoForm, "pto-validation-error", (e: CustomEvent) => {
      const errors: string[] = e.detail?.errors ?? [];
      notifications.error(errors.join("\n"));
    });

    // Current year PTO scheduler
    try {
      const scheduler = querySingle<CurrentYearPtoScheduler>(
        "current-year-pto-scheduler",
      );
      addEventListener(scheduler, "pto-submit", (e: CustomEvent) =>
        this.handlePtoRequestSubmit(e),
      );
    } catch (error) {
      // Scheduler element doesn't exist in test environment, skip
    }

    // Logout
    const navMenu = querySingle<DashboardNavigationMenu>(
      "dashboard-navigation-menu",
    );
    addEventListener(navMenu, "logout", () => this.handleLogout());

    // Year selector buttons
    try {
      const currentYearBtn =
        querySingle<HTMLButtonElement>("#current-year-btn");
      addEventListener(currentYearBtn, "click", () =>
        this.showCurrentYearView(),
      );
    } catch (error) {
      // Element doesn't exist in test environment, skip
    }

    try {
      const priorYearBtn = querySingle<HTMLButtonElement>("#prior-year-btn");
      addEventListener(priorYearBtn, "click", () => this.showPriorYearView());
    } catch (error) {
      // Element doesn't exist in test environment, skip
    }

    // Dashboard navigation menu
    try {
      const menu = querySingle<DashboardNavigationMenu>(
        "dashboard-navigation-menu",
      );
      addEventListener(menu, "page-change", (e: CustomEvent) =>
        this.handlePageChange(e.detail.page),
      );
      addEventListener(menu, "logout", () => this.handleLogout());
    } catch (error) {
      // Element doesn't exist in test environment, skip
    }

    // Admin buttons (only if they exist - for test.html compatibility)
    try {
      const manageBtn = querySingle<HTMLButtonElement>("#manage-employees-btn");
      addEventListener(manageBtn, "click", () => this.showEmployeeManagement());
    } catch (error) {
      // Element doesn't exist in test environment, skip
    }

    try {
      const reportsBtn = querySingle<HTMLButtonElement>("#view-reports-btn");
      addEventListener(reportsBtn, "click", () => this.showReports());
    } catch (error) {
      // Element doesn't exist in test environment, skip
    }

    // Admin panel events (only if it exists)
    try {
      const adminPanel = querySingle<AdminPanel>("admin-panel");
      if (adminPanel) {
        addEventListener(adminPanel, "add-employee", () =>
          this.handleAddEmployee(),
        );
        addEventListener(adminPanel, "employee-edit", (e: CustomEvent) =>
          this.handleEditEmployee(e.detail.employeeId),
        );
        addEventListener(adminPanel, "employee-delete", (e: CustomEvent) =>
          this.handleDeleteEmployee(e.detail.employeeId),
        );
        addEventListener(adminPanel, "admin-acknowledge", (e: CustomEvent) =>
          this.handleAdminAcknowledgeReview(
            e.detail.employeeId,
            e.detail.employeeName,
            e.detail.month,
          ),
        );
      }
    } catch (error) {
      // admin-panel element doesn't exist in test environment, skip
    }
  }

  private setupPTOCardEventListeners(): void {
    try {
      const accrualCard = querySingle<PtoAccrualCard>("pto-accrual-card");
      const sickCard = querySingle<PtoSickCard>("pto-sick-card");
      const bereavementCard = querySingle<PtoBereavementCard>(
        "pto-bereavement-card",
      );
      const juryDutyCard = querySingle<PtoJuryDutyCard>("pto-jury-duty-card");
      const ptoCard = querySingle<PtoPtoCard>("pto-pto-card");

      // Handle PTO request submission
      addEventListener(accrualCard, "pto-request-submit", (e: CustomEvent) => {
        e.stopPropagation();
        this.handlePtoRequestSubmit(e);
      });

      // Handle month-selected from accrual card — compose slotted calendar
      addEventListener(accrualCard, "month-selected", (e: CustomEvent) => {
        const { month, year, entries, requestMode } = e.detail;
        // Find or create the slotted pto-calendar
        let calendar = accrualCard.querySelector("pto-calendar") as PtoCalendar;
        if (!calendar) {
          calendar = createElement("pto-calendar") as PtoCalendar;
          calendar.setAttribute("slot", "calendar");
          accrualCard.appendChild(calendar);
        }
        calendar.setAttribute("month", String(month));
        calendar.setAttribute("year", String(year));
        calendar.ptoEntries = entries;
        calendar.setAttribute("selected-month", String(month));
        calendar.setAttribute("readonly", String(!requestMode));
        if (requestMode) {
          // Ensure submit button exists
          let submitBtn = calendar.querySelector('button[slot="submit"]');
          if (!submitBtn) {
            submitBtn = createElement("button") as HTMLButtonElement;
            submitBtn.setAttribute("slot", "submit");
            submitBtn.className = "submit-button";
            submitBtn.textContent = "Submit PTO Request";
            calendar.appendChild(submitBtn);
          }
        } else {
          // Remove submit button if not in request mode
          const submitBtn = calendar.querySelector('button[slot="submit"]');
          if (submitBtn) submitBtn.remove();
        }
        // Scroll into view
        calendar.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      // Handle navigation to month from PTO detail cards
      const handleNavigateToMonth = (e: CustomEvent) => {
        e.stopPropagation();
        const { month, year } = e.detail;
        console.log("App: navigate-to-month event received:", { month, year });
        accrualCard.navigateToMonth(month, year);
        // Scroll to the accrual card
        accrualCard.scrollIntoView({ behavior: "smooth", block: "start" });
      };

      addEventListener(sickCard, "navigate-to-month", handleNavigateToMonth);
      addEventListener(
        bereavementCard,
        "navigate-to-month",
        handleNavigateToMonth,
      );
      addEventListener(
        juryDutyCard,
        "navigate-to-month",
        handleNavigateToMonth,
      );
      addEventListener(ptoCard, "navigate-to-month", handleNavigateToMonth);
    } catch (error) {
      // PTO cards don't exist in test environment, skip
      console.log("PTO cards not available for event listener setup:", error);
    }
  }

  private handleLogout(): void {
    this.currentUser = null;
    document.cookie =
      "auth_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.removeItem("currentUser");
    this.showLogin();
  }

  private async handleLogin(e: Event): Promise<void> {
    e.preventDefault();
    const identifier = querySingle<HTMLInputElement>("#identifier").value;

    try {
      const response = await this.api.requestAuthLink(identifier);
      const messageDiv = querySingle("#login-message")!;
      messageDiv.textContent = response.message;
      messageDiv.innerHTML = "";
      const messageText = createElement("div");
      messageText.textContent = response.message;
      messageDiv.appendChild(messageText);
      messageDiv.classList.remove("hidden");
      if (response.magicLink) {
        const link = createElement("a") as HTMLAnchorElement;
        link.href = response.magicLink;
        link.textContent = response.magicLink;
        link.rel = "noopener noreferrer";
        link.target = "_self";

        const linkWrapper = createElement("div") as HTMLDivElement;
        linkWrapper.style.marginTop = "8px";
        linkWrapper.appendChild(link);
        messageDiv.appendChild(linkWrapper);
      }
    } catch (error) {
      console.error("Failed to send magic link:", error);
      notifications.error("Failed to send magic link. Please try again.");
    }
  }

  private async handlePTO(e: Event): Promise<void> {
    e.preventDefault();
    // Form submission is now handled by pto-submit event
  }

  private showLogin(): void {
    this.hideAllSections();
    querySingle("#login-section").classList.remove("hidden");
  }

  private showDashboard(): void {
    this.hideAllSections();
    querySingle("#dashboard").classList.remove("hidden");
    querySingle("#dashboard-navigation-menu").classList.remove("hidden");
    if (this.currentUser?.role === "Admin") {
      querySingle("#admin-panel").classList.remove("hidden");
    }

    // Set up event listeners for PTO cards (only once)
    this.setupPTOCardEventListeners();

    // Initialize to default page
    this.handlePageChange("submit-time-off");
  }

  private showCurrentYearView(): void {
    // Update button states
    querySingle("#current-year-btn").classList.add("active");
    querySingle("#prior-year-btn").classList.remove("active");

    // Show current year view, hide prior year view
    querySingle("#pto-status").classList.remove("hidden");
    querySingle("#prior-year-view").classList.add("hidden");

    // Reload current year data
    this.loadPTOStatus();
  }

  private async showPriorYearView(): Promise<void> {
    // Update button states
    querySingle("#current-year-btn").classList.remove("active");
    querySingle("#prior-year-btn").classList.add("active");

    // Show prior year view, hide current year view
    querySingle("#pto-status").classList.add("hidden");
    querySingle("#prior-year-view").classList.remove("hidden");

    // Load prior year data
    await this.loadPriorYearReview();
  }

  private handlePageChange(page: string): void {
    // Hide all pages
    const pages = document.querySelectorAll(".page");
    pages.forEach((p) => p.classList.remove("active"));

    // Show selected page
    const pageId = page === "submit-time-off" ? "pto-form" : `${page}-page`;
    const selectedPage = querySingle(`#${pageId}`);
    selectedPage.classList.add("active");

    // Update menu
    const menu = querySingle<DashboardNavigationMenu>(
      "dashboard-navigation-menu",
    );
    menu.currentPageValue = page as any;

    // Load data based on page
    if (page === "default") {
      this.loadPTOStatus();
      this.loadCurrentYearScheduler();
    } else if (page === "current-year-summary") {
      this.loadPTOStatus();
    } else if (page === "prior-year-summary") {
      this.loadEmployeeInfo();
      this.loadPriorYearReview();
    } else if (page === "employee-info") {
      this.loadEmployeeInfo();
    } else if (page === "submit-time-off") {
      this.loadPTOStatus(); // Load PTO balance for form validation
      // Set available PTO balance on the form for validation
      const ptoForm = querySingle<PtoEntryForm>("#pto-entry-form");
      ptoForm.setAttribute(
        "available-pto-balance",
        this.availablePtoBalance.toString(),
      );
      // Load PTO data into the form's calendar
      this.handlePtoDataRequest(ptoForm);
      // Populate the slotted summary card inside the entry form
      this.updateFormSummaryCard();
    }
  }

  private showEmployeeManagement(): void {
    // TODO: Implement employee management UI
    notifications.info("Employee management feature coming soon!");
  }

  private showReports(): void {
    // TODO: Implement reports UI
    notifications.info("Reports feature coming soon!");
  }

  private handleAddEmployee(): void {
    // TODO: Implement add employee dialog
    notifications.info("Add employee feature coming soon!");
  }

  private handleEditEmployee(employeeId: number): void {
    // TODO: Implement edit employee dialog
    notifications.info(`Edit employee ${employeeId} feature coming soon!`);
  }

  private handleDeleteEmployee(employeeId: number): void {
    // TODO: Implement delete employee confirmation
    if (confirm(`Are you sure you want to delete employee ${employeeId}?`)) {
      // TODO: Call API to delete
      notifications.info(`Delete employee ${employeeId} feature coming soon!`);
    }
  }

  private handleAdminAcknowledgeReview(
    employeeId: number,
    employeeName: string,
    month: string,
  ): void {
    // Show confirmation dialog before submitting acknowledgment
    const dialog = createElement<ConfirmationDialog>("confirmation-dialog");
    dialog.message = `Are you sure you want to acknowledge the monthly review for ${employeeName} (${month})? This action confirms that you have reviewed their hours and PTO data for this month.`;
    dialog.confirmText = "Acknowledge";
    dialog.cancelText = "Cancel";

    // Handle confirmation
    const handleConfirm = () => {
      this.submitAdminAcknowledgment(employeeId, month);
      document.body.removeChild(dialog);
    };

    // Handle cancellation
    const handleCancel = () => {
      document.body.removeChild(dialog);
    };

    dialog.addEventListener("confirm", handleConfirm);
    dialog.addEventListener("cancel", handleCancel);

    document.body.appendChild(dialog);
  }

  private async submitAdminAcknowledgment(
    employeeId: number,
    month: string,
  ): Promise<void> {
    try {
      if (!this.currentUser) {
        notifications.error("You must be logged in to perform this action.");
        return;
      }
      const response = await this.api.submitAdminAcknowledgement(
        employeeId,
        month,
      );
      notifications.success(
        response.message || "Acknowledgment submitted successfully.",
      );
    } catch (error: any) {
      console.error("Failed to submit admin acknowledgment:", error);
      notifications.error(
        "Failed to submit acknowledgment: " +
          (error.message || "Unknown error"),
      );
    }
  }

  private hideAllSections(): void {
    const sections = ["login-section", "dashboard", "pto-form", "admin-panel"];
    sections.forEach((id) => {
      querySingle(`#${id}`).classList.add("hidden");
    });
    querySingle("#dashboard-navigation-menu").classList.add("hidden");
  }

  private async loadPTOStatus(): Promise<void> {
    console.log("loadPTOStatus called, currentUser:", this.currentUser);
    if (!this.currentUser) return;

    // Load PTO data
    await this.refreshPTOData();

    // Query existing elements instead of creating them
    const summaryCard = querySingle<PtoSummaryCard>("pto-summary-card");
    summaryCard.summary = null; // Will show loading

    const accrualCard = querySingle<PtoAccrualCard>("pto-accrual-card");
    accrualCard.monthlyAccruals = [];
    accrualCard.ptoEntries = [];
    accrualCard.calendarYear = getCurrentYear();
    accrualCard.monthlyUsage = [];
    // Attributes already set in HTML
    const sickCard = querySingle<PtoSickCard>("pto-sick-card");
    sickCard.bucket = null; // Will show loading
    sickCard.usageEntries = [];

    const bereavementCard = querySingle<PtoBereavementCard>(
      "pto-bereavement-card",
    );
    bereavementCard.bucket = null; // Will show loading
    bereavementCard.usageEntries = [];

    const juryDutyCard = querySingle<PtoJuryDutyCard>("pto-jury-duty-card");
    juryDutyCard.bucket = null; // Will show loading
    juryDutyCard.usageEntries = [];

    const employeeInfoCard = querySingle<PtoEmployeeInfoCard>(
      "pto-employee-info-card",
    );
    employeeInfoCard.info = {
      hireDate: "Loading...",
      nextRolloverDate: "Loading...",
    };

    const ptoCard = querySingle<PtoPtoCard>("pto-pto-card");
    ptoCard.bucket = null; // Will show loading
    ptoCard.usageEntries = [];

    try {
      // Fetch data
      const status = await this.api.getPTOStatus();
      const entries = await this.api.getPTOEntries();

      // Store available PTO balance for form validation
      this.availablePtoBalance = status.availablePTO;

      const realHireDate = formatDateForDisplay(status.hireDate);
      const realNextRolloverDate = formatDateForDisplay(
        status.nextRolloverDate,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        },
      );

      // Update cards with real data
      summaryCard.summary = {
        annualAllocation: status.annualAllocation,
        availablePTO: status.availablePTO,
        usedPTO: status.usedPTO,
        carryoverFromPreviousYear: status.carryoverFromPreviousYear,
      };

      accrualCard.monthlyAccruals = status.monthlyAccruals;
      accrualCard.ptoEntries = entries;
      accrualCard.monthlyUsage = this.buildMonthlyUsage(
        entries,
        getCurrentYear(),
      );
      accrualCard.setAttribute(
        "annual-allocation",
        status.annualAllocation.toString(),
      );

      sickCard.bucket = status.sickTime;
      sickCard.usageEntries = this.buildUsageEntries(
        entries,
        getCurrentYear(),
        "Sick",
      );
      sickCard.fullPtoEntries = entries.filter(
        (e) => e.type === "Sick" && parseDate(e.date).year === getCurrentYear(),
      );

      bereavementCard.bucket = status.bereavementTime;
      bereavementCard.usageEntries = this.buildUsageEntries(
        entries,
        getCurrentYear(),
        "Bereavement",
      );
      bereavementCard.fullPtoEntries = entries.filter(
        (e) =>
          e.type === "Bereavement" &&
          parseDate(e.date).year === getCurrentYear(),
      );

      juryDutyCard.bucket = status.juryDutyTime;
      juryDutyCard.usageEntries = this.buildUsageEntries(
        entries,
        getCurrentYear(),
        "Jury Duty",
      );
      juryDutyCard.fullPtoEntries = entries.filter(
        (e) =>
          e.type === "Jury Duty" && parseDate(e.date).year === getCurrentYear(),
      );

      ptoCard.bucket = status.ptoTime;
      ptoCard.usageEntries = this.buildUsageEntries(
        entries,
        getCurrentYear(),
        "PTO",
      );
      ptoCard.fullPtoEntries = entries.filter(
        (e) => e.type === "PTO" && parseDate(e.date).year === getCurrentYear(),
      );

      employeeInfoCard.info = {
        hireDate: realHireDate,
        nextRolloverDate: realNextRolloverDate,
      };

      // Event listeners are set up once in setupPTOCardEventListeners()
    } catch (error) {
      console.error(UI_ERROR_MESSAGES.failed_to_load_pto_status, error);
      const statusDiv = querySingle("#pto-status");
      statusDiv.innerHTML = `
                <h3>PTO Status</h3>
                <p>Error loading PTO status. Please try again later.</p>
            `;
    }
  }

  private async loadEmployeeInfo(): Promise<void> {
    if (!this.currentUser) return;

    const employeeInfoCard = querySingle<PtoEmployeeInfoCard>(
      "pto-employee-info-card",
    );
    employeeInfoCard.info = {
      hireDate: "Loading...",
      nextRolloverDate: "Loading...",
    };

    try {
      const status = await this.api.getPTOStatus();
      employeeInfoCard.info = {
        hireDate: formatDateForDisplay(status.hireDate),
        nextRolloverDate: formatDateForDisplay(status.nextRolloverDate, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      };
    } catch (error) {
      console.error("Failed to load employee info:", error);
      employeeInfoCard.info = {
        hireDate: "Error loading",
        nextRolloverDate: "Error loading",
      };
    }
  }

  private async loadPriorYearReview(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const priorYear = getCurrentYear() - 1;
      const reviewData = await this.api.getPTOYearReview(priorYear);

      const priorYearReview = querySingle<PriorYearReview>("prior-year-review");
      priorYearReview.data = reviewData;
    } catch (error) {
      console.error("Failed to load prior year review:", error);
      const priorYearReview = querySingle<PriorYearReview>("prior-year-review");
      priorYearReview.data = null;
      notifications.error(
        "Failed to load prior year data. Please try again later.",
      );
    }
  }

  private async loadCurrentYearScheduler(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const currentYear = getCurrentYear();
      const schedulerData = await this.api.getPTOYearReview(currentYear);

      const scheduler = querySingle<CurrentYearPtoScheduler>(
        "current-year-pto-scheduler",
      );
      scheduler.data = schedulerData;

      // Notify user if no PTO entries exist for the current year
      const hasEntries = schedulerData.months.some(
        (m) => m.ptoEntries.length > 0,
      );
      if (!hasEntries) {
        notifications.info(`Nothing scheduled yet for ${currentYear}`);
      }
    } catch (error) {
      console.error("Failed to load current year scheduler data:", error);
      notifications.error("Failed to load PTO scheduling data");
    }
  }

  private buildUsageEntries(
    entries: ApiTypes.PTOEntry[],
    year: number,
    type: string,
  ): { date: string; hours: number }[] {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const hoursByDate = new Map<string, number>();

    for (const entry of safeEntries) {
      if (entry.type !== type) {
        continue;
      }

      const { year: entryYear } = parseDate(entry.date);
      if (entryYear !== year) {
        continue;
      }

      hoursByDate.set(
        entry.date,
        (hoursByDate.get(entry.date) ?? 0) + entry.hours,
      );
    }

    const result = Array.from(hoursByDate.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  private buildAllUsageEntries(
    entries: ApiTypes.PTOEntry[],
    type: string,
  ): { date: string; hours: number }[] {
    const safeEntries = Array.isArray(entries) ? entries : [];
    const hoursByDate = new Map<string, number>();

    for (const entry of safeEntries) {
      if (entry.type !== type) {
        continue;
      }

      hoursByDate.set(
        entry.date,
        (hoursByDate.get(entry.date) ?? 0) + entry.hours,
      );
    }

    const result = Array.from(hoursByDate.entries())
      .map(([date, hours]) => ({ date, hours }))
      .sort((a, b) => a.date.localeCompare(b.date));
    return result;
  }

  private buildMonthlyUsage(
    entries: ApiTypes.PTOEntry[],
    year: number,
  ): { month: number; hours: number }[] {
    const usageByMonth = new Map<number, number>();
    for (let month = 1; month <= 12; month += 1) {
      usageByMonth.set(month, 0);
    }

    const safeEntries = Array.isArray(entries) ? entries : [];
    for (const entry of safeEntries) {
      if (entry.type !== "PTO") {
        continue;
      }

      const { year: entryYear, month: entryMonth } = parseDate(entry.date);
      if (entryYear !== year) {
        continue;
      }

      usageByMonth.set(
        entryMonth,
        (usageByMonth.get(entryMonth) ?? 0) + (entry.hours ?? 0),
      );
    }

    return Array.from(usageByMonth.entries())
      .map(([month, hours]) => ({ month, hours }))
      .sort((a, b) => a.month - b.month);
  }

  private getWorkdaysBetween(
    startDateStr: string,
    endDateStr: string,
  ): string[] {
    return getWorkdaysBetween(startDateStr, endDateStr);
  }

  private async handlePtoRequestSubmit(e: CustomEvent): Promise<void> {
    if (e.detail.requests) {
      // Calendar submission
      await this.handlePtoRequestSubmitOld(e.detail.requests);
    } else if (e.detail.ptoRequest) {
      // Form submission - convert to requests format
      const request = e.detail.ptoRequest;
      const requests: CalendarEntry[] = [];
      let currentDateStr = request.startDate;
      while (currentDateStr <= request.endDate) {
        if (!isWeekend(currentDateStr)) {
          requests.push({
            date: currentDateStr,
            type: request.ptoType === "Full PTO" ? "PTO" : request.ptoType,
            hours: request.hours,
          });
        }
        currentDateStr = addDays(currentDateStr, 1);
      }
      if (requests.length === 0) {
        notifications.error("No valid dates selected (must be weekdays).");
        return;
      }
      await this.handlePtoRequestSubmitOld(requests);
    }
  }

  private async handlePtoRequestSubmitOld(
    requests: CalendarEntry[],
  ): Promise<void> {
    try {
      await this.api.createPTOEntry({ requests });
      notifications.success("PTO request submitted successfully!");
      await this.refreshPTOData();
      await this.loadCurrentYearScheduler();
      // Reset the form and reload PTO data after successful submit
      const ptoForm = querySingle<PtoEntryForm>("#pto-entry-form");
      ptoForm.reset();
      await this.handlePtoDataRequest(ptoForm);
      // Refresh slotted summary card after submission
      await this.updateFormSummaryCard();
    } catch (error: any) {
      console.error("Error submitting PTO request:", error);
      // Check for structured error response
      if (error.responseData?.fieldErrors) {
        const messages = error.responseData.fieldErrors.map(
          (err: any) => `${err.field}: ${err.message}`,
        );
        notifications.error(`PTO request failed: ${messages.join("; ")}`);
      } else {
        notifications.error("Failed to submit PTO request. Please try again.");
      }
    }
  }

  /**
   * Update the slotted pto-summary-card inside pto-entry-form with current PTO status.
   */
  private async updateFormSummaryCard(): Promise<void> {
    if (!this.currentUser) return;

    try {
      const ptoForm = querySingle<PtoEntryForm>("#pto-entry-form");
      const formSummary =
        ptoForm.querySelector<PtoSummaryCard>("pto-summary-card");
      if (!formSummary) return;

      const status = await this.api.getPTOStatus();
      const entries = await this.api.getPTOEntries();

      formSummary.summary = {
        annualAllocation: status.annualAllocation,
        availablePTO: status.availablePTO,
        usedPTO: status.usedPTO,
        carryoverFromPreviousYear: status.carryoverFromPreviousYear,
      };
      formSummary.fullPtoEntries = entries.filter(
        (e) => parseDate(e.date).year === getCurrentYear(),
      );
    } catch (error) {
      console.error("Failed to update form summary card:", error);
    }
  }

  private async handlePtoDataRequest(ptoForm: PtoEntryForm): Promise<void> {
    try {
      const entries = await this.api.getPTOEntries();
      ptoForm.setPtoData(entries);
    } catch (error) {
      console.error("Failed to fetch PTO entries for calendar:", error);
      ptoForm.setPtoData([]);
    }
  }

  private async refreshPTOData(): Promise<void> {
    if (!this.currentUser) return;

    try {
      // Re-query PTO status from server
      const status = await this.api.getPTOStatus();
      const entries = await this.api.getPTOEntries();

      // Update stored available PTO balance
      this.availablePtoBalance = status.availablePTO;

      // Re-render all PTO components with fresh data
      await this.renderPTOStatus(status, entries);
    } catch (error) {
      console.error(UI_ERROR_MESSAGES.failed_to_refresh_pto_data, error);
      notifications.error(
        `${UI_ERROR_MESSAGES.failed_to_refresh_pto_data}. Please refresh the page.`,
      );
    }
  }

  private async renderPTOStatus(
    status: ApiTypes.PTOStatusResponse,
    entries: ApiTypes.PTOEntry[],
  ): Promise<void> {
    // Update existing PTO components with fresh data instead of recreating
    const summaryCard = querySingle<PtoSummaryCard>("pto-summary-card");
    summaryCard.summary = {
      annualAllocation: status.annualAllocation,
      availablePTO: status.availablePTO,
      usedPTO: status.usedPTO,
      carryoverFromPreviousYear: status.carryoverFromPreviousYear,
    };

    const accrualCard = querySingle<PtoAccrualCard>("pto-accrual-card");
    accrualCard.monthlyAccruals = status.monthlyAccruals;
    accrualCard.ptoEntries = entries;
    accrualCard.calendarYear = getCurrentYear();
    accrualCard.monthlyUsage = this.buildMonthlyUsage(
      entries,
      getCurrentYear(),
    );
    accrualCard.setAttribute(
      "annual-allocation",
      status.annualAllocation.toString(),
    );

    const sickCard = querySingle<PtoSickCard>("pto-sick-card");
    sickCard.bucket = status.sickTime;
    sickCard.usageEntries = this.buildUsageEntries(
      entries,
      getCurrentYear(),
      "Sick",
    );
    sickCard.fullPtoEntries = entries.filter(
      (e) => e.type === "Sick" && parseDate(e.date).year === getCurrentYear(),
    );

    const bereavementCard = querySingle<PtoBereavementCard>(
      "pto-bereavement-card",
    );
    bereavementCard.bucket = status.bereavementTime;
    bereavementCard.usageEntries = this.buildUsageEntries(
      entries,
      getCurrentYear(),
      "Bereavement",
    );
    bereavementCard.fullPtoEntries = entries.filter(
      (e) =>
        e.type === "Bereavement" && parseDate(e.date).year === getCurrentYear(),
    );

    const juryDutyCard = querySingle<PtoJuryDutyCard>("pto-jury-duty-card");
    juryDutyCard.bucket = status.juryDutyTime;
    juryDutyCard.usageEntries = this.buildUsageEntries(
      entries,
      getCurrentYear(),
      "Jury Duty",
    );
    juryDutyCard.fullPtoEntries = entries.filter(
      (e) =>
        e.type === "Jury Duty" && parseDate(e.date).year === getCurrentYear(),
    );

    const ptoCard = querySingle<PtoPtoCard>("pto-pto-card");
    ptoCard.bucket = status.ptoTime;
    ptoCard.usageEntries = this.buildUsageEntries(
      entries,
      getCurrentYear(),
      "PTO",
    );
    ptoCard.fullPtoEntries = entries.filter(
      (e) => e.type === "PTO" && parseDate(e.date).year === getCurrentYear(),
    );

    const employeeInfoCard = querySingle<PtoEmployeeInfoCard>(
      "pto-employee-info-card",
    );
    employeeInfoCard.info = {
      hireDate: formatDateForDisplay(status.hireDate),
      nextRolloverDate: formatDateForDisplay(status.nextRolloverDate, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };

    // Event listeners are set up once in setupPTOCardEventListeners()
  }
}
