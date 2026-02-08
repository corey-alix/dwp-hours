// Import API types
import type * as ApiTypes from './api-types.js';
import { APIClient } from './APIClient.js';

// Import date utilities
import { addDays, isWeekend, getCurrentYear, formatDateForDisplay, getWorkdaysBetween, parseDate, formatDate, getCurrentMonth } from '../shared/dateUtils.js';

// Import components and test utilities
import './components/index.js';
import { AdminPanel, PtoAccrualCard, PtoBereavementCard, PtoEmployeeInfoCard, PtoEntryForm, PtoJuryDutyCard, PtoSickCard, PtoSummaryCard } from './components/index.js';
import type { CalendarEntry } from './components/pto-calendar/index.js';
import { addEventListener, querySingle, createElement } from './components/test-utils.js';

// Import test functions to ensure they're included in the bundle
import * as testFunctions from './components/test.js';

// Re-export playground for testing
export * from './components/test.js';
export { TestWorkflow } from './test.js';

// Ensure AdminPanel is included in bundle
export { AdminPanel };

// Dummy reference to prevent tree-shaking
const _adminPanelRef = AdminPanel;

const api = new APIClient();

// Notification/Toast System
class NotificationManager {
    private container: HTMLElement | null = null;

    constructor() {
        this.createContainer();
    }

    private createContainer(): void {
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        document.body.appendChild(this.container);
    }

    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', title?: string, duration: number = 5000): void {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type}`;

        const content = document.createElement('div');
        content.className = 'notification-content';

        if (title) {
            const titleElement = document.createElement('div');
            titleElement.className = 'notification-title';
            titleElement.textContent = title;
            content.appendChild(titleElement);
        }

        const messageElement = document.createElement('div');
        messageElement.className = 'notification-message';
        messageElement.textContent = message;
        content.appendChild(messageElement);

        const closeButton = document.createElement('button');
        closeButton.className = 'notification-close';
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.removeToast(toast);

        toast.appendChild(content);
        toast.appendChild(closeButton);
        if (this.container) {
            this.container.appendChild(toast);
        }

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }
    }

    success(message: string, title?: string, duration?: number): void {
        this.show(message, 'success', title, duration);
    }

    error(message: string, title?: string, duration?: number): void {
        this.show(message, 'error', title, duration);
    }

    info(message: string, title?: string, duration?: number): void {
        this.show(message, 'info', title, duration);
    }

    warning(message: string, title?: string, duration?: number): void {
        this.show(message, 'warning', title, duration);
    }

    private removeToast(toast: HTMLElement): void {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
}

const notifications = new NotificationManager();

// UI Manager
class UIManager {
    private currentUser: { id: number; name: string; role: string } | null = null;
    private availablePtoBalance: number = 0;

    constructor() {
        this.init();
    }

    private init(): void {
        this.checkAuth();
        this.setupEventListeners();
    }

    private async checkAuth(): Promise<void> {
        // Check URL params for magic link
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const ts = urlParams.get('ts');
        if (token && ts) {
            try {
                const response = await api.validateAuth(token, ts) as ApiTypes.AuthValidateResponse;
                this.setAuthCookie(response.authToken);
                localStorage.setItem('currentUser', JSON.stringify(response.employee));
                this.currentUser = response.employee as ApiTypes.Employee; // Cast to full Employee if needed, but actually it's partial
                this.showDashboard();
                await this.loadPTOStatus();
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            } catch (error) {
                console.error('Auth validation failed:', error);
                notifications.error('Invalid or expired magic link. Please request a new one.');
            }
        }

        // Check cookie
        const cookieHash = this.getAuthCookie();
        if (cookieHash) {
            const storedUser = localStorage.getItem('currentUser');
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
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'auth_hash') {
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
        addEventListener(ptoForm, "pto-submit", (e: CustomEvent) => this.handlePtoRequestSubmit(e));

        // Logout
        const logoutBtn = querySingle<HTMLButtonElement>("#logout-btn");
        addEventListener(logoutBtn, "click", () => this.handleLogout());

        // Navigation
        const newPTOBtn = querySingle<HTMLButtonElement>("#new-pto-btn");
        addEventListener(newPTOBtn, "click", () => this.showPTOForm());

        // PTO Request Mode Toggle (only if it exists - for test.html compatibility)
        try {
            const toggleRequestModeBtn = querySingle<HTMLButtonElement>("#toggle-pto-request-mode");
            addEventListener(toggleRequestModeBtn, "click", () => this.togglePTORequestMode());
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
            const adminPanel = querySingle('admin-panel') as AdminPanel;
            if (adminPanel) {
                addEventListener(adminPanel, 'add-employee', () => this.handleAddEmployee());
                addEventListener(adminPanel, 'employee-edit', (e: CustomEvent) => this.handleEditEmployee(e.detail.employeeId));
                addEventListener(adminPanel, 'employee-delete', (e: CustomEvent) => this.handleDeleteEmployee(e.detail.employeeId));
                addEventListener(adminPanel, 'employee-acknowledge', (e: CustomEvent) => this.handleAcknowledgeEmployee(e.detail.employeeId));
            }
        } catch (error) {
            // admin-panel element doesn't exist in test environment, skip
        }
    }

    private handleLogout(): void {
        this.currentUser = null;
        document.cookie = 'auth_hash=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        localStorage.removeItem('currentUser');
        this.showLogin();
    }

    private async handleLogin(e: Event): Promise<void> {
        e.preventDefault();
        const identifier = (
            querySingle<HTMLInputElement>("#identifier")
        ).value;

        try {
            const response = await api.requestAuthLink(identifier);
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
            console.error('Failed to send magic link:', error);
            notifications.error('Failed to send magic link. Please try again.');
        }
    }

    private async handlePTO(e: Event): Promise<void> {
        e.preventDefault();
        // Form submission is now handled by pto-submit event
    }

    private showLogin(): void {
        this.hideAllSections();
        querySingle("#login-section").classList.remove("hidden");
        querySingle("#logout-btn").classList.add("hidden");
    }

    private showDashboard(): void {
        this.hideAllSections();
        querySingle("#dashboard").classList.remove("hidden");
        if (this.currentUser?.role === "Admin") {
            querySingle("#admin-panel").classList.remove("hidden");
        }
        querySingle("#logout-btn").classList.remove("hidden");
    }

    private showPTOForm(): void {
        this.hideAllSections();
        querySingle("#pto-form").classList.remove("hidden");

        // Set available PTO balance on the form for validation
        const ptoForm = querySingle<PtoEntryForm>("#pto-entry-form");
        ptoForm.setAttribute('available-pto-balance', this.availablePtoBalance.toString());
    }

    private togglePTORequestMode(): void {
        try {
            const accrualCard = querySingle('pto-accrual-card') as PtoAccrualCard;
            const currentMode = accrualCard.getAttribute('request-mode') === 'true';
            accrualCard.setAttribute('request-mode', (!currentMode).toString());

            // Update button text
            const button = querySingle("#toggle-pto-request-mode");
            button.textContent = currentMode ? 'Submit PTO Requests' : 'View PTO Status';
        } catch (error) {
            // Element doesn't exist in test environment, skip
        }
    }

    private showEmployeeManagement(): void {
        // TODO: Implement employee management UI
        notifications.info('Employee management feature coming soon!');
    }

    private showReports(): void {
        // TODO: Implement reports UI
        notifications.info('Reports feature coming soon!');
    }

    private handleAddEmployee(): void {
        // TODO: Implement add employee dialog
        notifications.info('Add employee feature coming soon!');
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

    private handleAcknowledgeEmployee(employeeId: number): void {
        // Show month selection dialog for acknowledgment
        const month = prompt("Enter month to acknowledge (YYYY-MM):", getCurrentMonth());
        if (month) {
            this.submitAdminAcknowledgment(employeeId, month);
        }
    }

    private async submitAdminAcknowledgment(employeeId: number, month: string): Promise<void> {
        try {
            if (!this.currentUser) {
                notifications.error('You must be logged in to perform this action.');
                return;
            }
            const response = await api.submitAdminAcknowledgement(employeeId, month);
            notifications.success(response.message || 'Acknowledgment submitted successfully.');
        } catch (error: any) {
            console.error("Failed to submit admin acknowledgment:", error);
            notifications.error("Failed to submit acknowledgment: " + (error.message || "Unknown error"));
        }
    }

    private hideAllSections(): void {
        const sections = ["login-section", "dashboard", "pto-form", "admin-panel"];
        sections.forEach((id) => {
            querySingle(`#${id}`).classList.add("hidden");
        });
    }

    private async loadPTOStatus(): Promise<void> {
        console.log('loadPTOStatus called, currentUser:', this.currentUser);
        if (!this.currentUser) return;

        try {
            const status = await api.getPTOStatus();
            const entries = await api.getPTOEntries();

            // Store available PTO balance for form validation
            this.availablePtoBalance = status.availablePTO;

            const statusDiv = querySingle("#pto-status");
            const hireDate = formatDateForDisplay(status.hireDate);
            const nextRolloverDate = formatDateForDisplay(status.nextRolloverDate, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            statusDiv.innerHTML = `
                <h3>Your PTO Status</h3>
                <div class="pto-summary"></div>
            `;

            const summaryContainer = querySingle('.pto-summary', statusDiv) as HTMLElement;

            const summaryCard = createElement<PtoSummaryCard>('pto-summary-card');
            summaryCard.summary = {
                annualAllocation: status.annualAllocation,
                availablePTO: status.availablePTO,
                usedPTO: status.usedPTO,
                carryoverFromPreviousYear: status.carryoverFromPreviousYear
            };

            const accrualCard = createElement<PtoAccrualCard>('pto-accrual-card');
            accrualCard.monthlyAccruals = status.monthlyAccruals;
            accrualCard.ptoEntries = entries;
            accrualCard.calendarYear = getCurrentYear();
            accrualCard.monthlyUsage = this.buildMonthlyUsage(entries, getCurrentYear());
            accrualCard.setAttribute('request-mode', 'true'); // Enable calendar editing
            accrualCard.setAttribute('annual-allocation', status.annualAllocation.toString());

            const sickCard = createElement<PtoSickCard>('pto-sick-card');
            sickCard.bucket = status.sickTime;
            sickCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Sick');

            const bereavementCard = createElement('pto-bereavement-card') as PtoBereavementCard;
            bereavementCard.bucket = status.bereavementTime;
            bereavementCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Bereavement');

            const juryDutyCard = createElement('pto-jury-duty-card') as PtoJuryDutyCard;
            juryDutyCard.bucket = status.juryDutyTime;
            juryDutyCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Jury Duty');

            const employeeInfoCard = createElement('pto-employee-info-card') as PtoEmployeeInfoCard;
            employeeInfoCard.info = { hireDate, nextRolloverDate };

            summaryContainer.appendChild(summaryCard);
            summaryContainer.appendChild(accrualCard);
            summaryContainer.appendChild(sickCard);
            summaryContainer.appendChild(bereavementCard);
            summaryContainer.appendChild(juryDutyCard);
            summaryContainer.appendChild(employeeInfoCard);

            // Handle PTO request submission
            addEventListener(accrualCard, 'pto-request-submit', (e: CustomEvent) => {
                e.stopPropagation();
                this.handlePtoRequestSubmit(e);
            });
        } catch (error) {
            console.error("Failed to load PTO status:", error);
            const statusDiv = querySingle("#pto-status");
            statusDiv.innerHTML = `
                <h3>PTO Status</h3>
                <p>Error loading PTO status. Please try again later.</p>
            `;
        }
    }

    private buildUsageEntries(entries: ApiTypes.PTOEntry[], year: number, type: string): { date: string; hours: number }[] {
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

            hoursByDate.set(entry.date, (hoursByDate.get(entry.date) ?? 0) + entry.hours);
        }

        const result = Array.from(hoursByDate.entries())
            .map(([date, hours]) => ({ date, hours }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return result;
    }

    private buildMonthlyUsage(entries: ApiTypes.PTOEntry[], year: number): { month: number; hours: number }[] {
        const usageByMonth = new Map<number, number>();
        for (let month = 1; month <= 12; month += 1) {
            usageByMonth.set(month, 0);
        }

        const safeEntries = Array.isArray(entries) ? entries : [];
        for (const entry of safeEntries) {
            if (entry.type !== 'PTO') {
                continue;
            }

            const { year: entryYear, month: entryMonth } = parseDate(entry.date);
            if (entryYear !== year) {
                continue;
            }

            usageByMonth.set(entryMonth, (usageByMonth.get(entryMonth) ?? 0) + (entry.hours ?? 0));
        }

        return Array.from(usageByMonth.entries())
            .map(([month, hours]) => ({ month, hours }))
            .sort((a, b) => a.month - b.month);
    }

    private getWorkdaysBetween(startDateStr: string, endDateStr: string): string[] {
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
                        type: request.ptoType === 'Full PTO' ? 'PTO' : request.ptoType,
                        hours: request.hours
                    });
                }
                currentDateStr = addDays(currentDateStr, 1);
            }
            if (requests.length === 0) {
                notifications.error('No valid dates selected (must be weekdays).');
                return;
            }
            await this.handlePtoRequestSubmitOld(requests);
        }
    }

    private async handlePtoRequestSubmitOld(requests: CalendarEntry[]): Promise<void> {
        try {
            await api.createPTOEntry({ requests });
            notifications.success('PTO request submitted successfully!');
            await this.refreshPTOData();
        } catch (error) {
            console.error('Error submitting PTO request:', error);
            notifications.error('Failed to submit PTO request. Please try again.');
        }
    }

    private async refreshPTOData(): Promise<void> {
        if (!this.currentUser) return;

        try {
            // Re-query PTO status from server
            const status = await api.getPTOStatus();
            const entries = await api.getPTOEntries();

            // Update stored available PTO balance
            this.availablePtoBalance = status.availablePTO;

            // Re-render all PTO components with fresh data
            await this.renderPTOStatus(status, entries);

        } catch (error) {
            console.error("Failed to refresh PTO data:", error);
            notifications.error("Failed to refresh PTO data. Please refresh the page.");
        }
    }

    private async renderPTOStatus(status: ApiTypes.PTOStatusResponse, entries: ApiTypes.PTOEntry[]): Promise<void> {
        // Re-render the entire PTO status section with fresh data
        const statusDiv = querySingle("#pto-status");

        // Clear existing content
        statusDiv.innerHTML = '';

        // Recreate the HTML structure
        statusDiv.innerHTML = `
            <h3>Your PTO Status</h3>
            <div class="pto-summary"></div>
        `;

        // Re-create all PTO components with fresh data
        const summaryContainer = querySingle('.pto-summary', statusDiv);

        const summaryCard = createElement<PtoSummaryCard>('pto-summary-card');
        summaryCard.summary = {
            annualAllocation: status.annualAllocation,
            availablePTO: status.availablePTO,
            usedPTO: status.usedPTO,
            carryoverFromPreviousYear: status.carryoverFromPreviousYear
        };

        const accrualCard = createElement<PtoAccrualCard>('pto-accrual-card');
        accrualCard.monthlyAccruals = status.monthlyAccruals;
        accrualCard.ptoEntries = entries;
        accrualCard.calendarYear = getCurrentYear();
        accrualCard.monthlyUsage = this.buildMonthlyUsage(entries, getCurrentYear());
        accrualCard.setAttribute('request-mode', 'true');
        accrualCard.setAttribute('annual-allocation', status.annualAllocation.toString());

        const sickCard = createElement<PtoSickCard>('pto-sick-card');
        sickCard.bucket = status.sickTime;
        sickCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Sick');

        const bereavementCard = createElement<PtoBereavementCard>('pto-bereavement-card');
        bereavementCard.bucket = status.bereavementTime;
        bereavementCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Bereavement');

        const juryDutyCard = createElement<PtoJuryDutyCard>('pto-jury-duty-card');
        juryDutyCard.bucket = status.juryDutyTime;
        juryDutyCard.usageEntries = this.buildUsageEntries(entries, getCurrentYear(), 'Jury Duty');

        const employeeInfoCard = createElement<PtoEmployeeInfoCard>('pto-employee-info-card');
        employeeInfoCard.info = {
            hireDate: formatDateForDisplay(status.hireDate),
            nextRolloverDate: formatDateForDisplay(status.nextRolloverDate, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            })
        };

        summaryContainer.appendChild(summaryCard);
        summaryContainer.appendChild(accrualCard);
        summaryContainer.appendChild(sickCard);
        summaryContainer.appendChild(bereavementCard);
        summaryContainer.appendChild(juryDutyCard);
        summaryContainer.appendChild(employeeInfoCard);

        // Re-attach event listeners for the newly created components
        addEventListener(accrualCard, 'pto-request-submit', (e: CustomEvent) => {
            e.stopPropagation();
            this.handlePtoRequestSubmit(e);
        });
    }
}

export { UIManager };

const loginForm = document.getElementById("login-form");
if (loginForm) {
    (window as any).app = new UIManager();
}
