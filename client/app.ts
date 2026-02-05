// Type definitions
interface Employee {
    id: number;
    name: string;
    identifier: string;
    ptoRate: number;
    carryoverHours: number;
    role: string;
    hash: string;
}

// Import components and test utilities
import './components/index.js';
import { CalendarEntry } from './components/pto-calendar/index.js';
import { getElementById, addEventListener, querySingle } from './components/test-utils.js';

// Re-export playground for testing
export * from './components/test.js';
export { TestWorkflow } from './test.js';

interface PTOEntry {
    id: number;
    employeeId: number;
    startDate: string;
    endDate: string;
    type: string;
    hours: number;
    createdAt: string;
}

interface PTOStatus {
    employeeId: number;
    hireDate: string;
    annualAllocation: number;
    availablePTO: number;
    usedPTO: number;
    carryoverFromPreviousYear: number;
    monthlyAccruals: { month: number; hours: number }[];
    nextRolloverDate: string;
    sickTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    ptoTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    bereavementTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
    juryDutyTime: {
        allowed: number;
        used: number;
        remaining: number;
    };
}

type CalendarDay = {
    type: string;
    hours: number;
};

type CalendarData = Record<number, Record<number, CalendarDay>>;

// API client
class APIClient {
    private baseURL = "/api";

    async get(endpoint: string): Promise<any> {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        return response.json();
    }

    async post(endpoint: string, data: any): Promise<any> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        return response.json();
    }
}

const api = (window as any).api || new APIClient();

// UI Manager
class UIManager {
    private currentUser: Employee | null = null;

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
                const response = await api.get(`/auth/validate?token=${token}&ts=${ts}`);
                this.setAuthCookie(response.publicHash);
                localStorage.setItem('currentUser', JSON.stringify(response.employee));
                this.currentUser = response.employee;
                this.showDashboard();
                await this.loadPTOStatus();
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
                return;
            } catch (error) {
                alert('Invalid or expired magic link.');
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
        document.cookie = `auth_hash=${hash}; path=/; max-age=31536000`; // 1 year
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
        const loginForm = getElementById<HTMLFormElement>("login-form");
        addEventListener(loginForm, "submit", (e) => this.handleLogin(e));

        // PTO form
        const ptoForm = getElementById<HTMLFormElement>("pto-entry-form");
        addEventListener(ptoForm, "submit", (e) => this.handlePTO(e));

        const cancelBtn = getElementById<HTMLButtonElement>("cancel-pto");
        addEventListener(cancelBtn, "click", () => this.showDashboard());

        // Logout
        const logoutBtn = getElementById<HTMLButtonElement>("logout-btn");
        addEventListener(logoutBtn, "click", () => this.handleLogout());

        // Navigation
        const newPTOBtn = getElementById<HTMLButtonElement>("new-pto-btn");
        addEventListener(newPTOBtn, "click", () => this.showPTOForm());

        // Admin buttons (only if they exist - for test.html compatibility)
        try {
            const manageBtn = getElementById<HTMLButtonElement>("manage-employees-btn");
            addEventListener(manageBtn, "click", () => this.showEmployeeManagement());
        } catch (error) {
            // Element doesn't exist in test environment, skip
        }

        try {
            const reportsBtn = getElementById<HTMLButtonElement>("view-reports-btn");
            addEventListener(reportsBtn, "click", () => this.showReports());
        } catch (error) {
            // Element doesn't exist in test environment, skip
        }

        // Admin panel events (only if it exists)
        try {
            const adminPanel = querySingle('admin-panel') as any;
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
            getElementById<HTMLInputElement>("identifier")
        ).value;

        try {
            const response = await api.post("/auth/request-link", { identifier });
            const messageDiv = getElementById("login-message")!;
            messageDiv.textContent = response.message;
            messageDiv.innerHTML = "";
            const messageText = document.createElement("div");
            messageText.textContent = response.message;
            messageDiv.appendChild(messageText);
            messageDiv.classList.remove("hidden");
            if (response.magicLink) {
                const link = document.createElement("a");
                link.href = response.magicLink;
                link.textContent = response.magicLink;
                link.rel = "noopener noreferrer";
                link.target = "_self";

                const linkWrapper = document.createElement("div");
                linkWrapper.style.marginTop = "8px";
                linkWrapper.appendChild(link);
                messageDiv.appendChild(linkWrapper);
            }
        } catch (error) {
            alert("Failed to send magic link. Please try again.");
        }
    }

    private async handlePTO(e: Event): Promise<void> {
        e.preventDefault();
        if (!this.currentUser) return;

        const startDate = (
            getElementById<HTMLInputElement>("start-date")
        ).value;
        const endDate = (getElementById<HTMLInputElement>("end-date"))
            .value;
        const type = (getElementById<HTMLSelectElement>("pto-type"))
            .value;
        const hours = parseFloat(
            (getElementById<HTMLInputElement>("hours")).value,
        );

        try {
            await api.post("/pto", {
                employeeId: this.currentUser.id,
                startDate,
                endDate,
                type,
                hours,
            });

            alert("PTO submitted successfully!");
            this.showDashboard();
            await this.loadPTOStatus();
        } catch (error) {
            alert("Failed to submit PTO. Please try again.");
        }
    }

    private showLogin(): void {
        this.hideAllSections();
        getElementById("login-section").classList.remove("hidden");
        getElementById("logout-btn").classList.add("hidden");
    }

    private showDashboard(): void {
        this.hideAllSections();
        getElementById("dashboard").classList.remove("hidden");
        if (this.currentUser?.role === "Admin") {
            getElementById("admin-panel").classList.remove("hidden");
        }
        getElementById("logout-btn").classList.remove("hidden");
    }

    private showPTOForm(): void {
        this.hideAllSections();
        getElementById("pto-form").classList.remove("hidden");
    }

    private showEmployeeManagement(): void {
        // TODO: Implement employee management UI
        alert("Employee management coming soon!");
    }

    private showReports(): void {
        // TODO: Implement reports UI
        alert("Reports coming soon!");
    }

    private handleAddEmployee(): void {
        // TODO: Implement add employee dialog
        alert("Add employee coming soon!");
    }

    private handleEditEmployee(employeeId: number): void {
        // TODO: Implement edit employee dialog
        alert(`Edit employee ${employeeId} coming soon!`);
    }

    private handleDeleteEmployee(employeeId: number): void {
        // TODO: Implement delete employee confirmation
        if (confirm(`Are you sure you want to delete employee ${employeeId}?`)) {
            // TODO: Call API to delete
            alert(`Delete employee ${employeeId} coming soon!`);
        }
    }

    private handleAcknowledgeEmployee(employeeId: number): void {
        // Show month selection dialog for acknowledgment
        const month = prompt("Enter month to acknowledge (YYYY-MM):", new Date().toISOString().slice(0, 7));
        if (month) {
            this.submitAdminAcknowledgment(employeeId, month);
        }
    }

    private async submitAdminAcknowledgment(employeeId: number, month: string): Promise<void> {
        try {
            if (!this.currentUser) {
                alert("Not logged in");
                return;
            }
            const response = await api.post('/admin-acknowledgements', {
                employeeId,
                month,
                adminId: this.currentUser.id
            });
            alert(response.message);
        } catch (error: any) {
            console.error("Failed to submit admin acknowledgment:", error);
            alert("Failed to submit acknowledgment: " + (error.message || "Unknown error"));
        }
    }

    private hideAllSections(): void {
        const sections = ["login-section", "dashboard", "pto-form", "admin-panel"];
        sections.forEach((id) => {
            getElementById(id).classList.add("hidden");
        });
    }

    private async loadPTOStatus(): Promise<void> {
        if (!this.currentUser) return;

        try {
            const status: PTOStatus = await api.get(`/pto/status/${this.currentUser.id}`);
            const entries = await api.get(`/pto?employeeId=${this.currentUser.id}`);
            const calendarData = this.buildCalendarData(entries, new Date().getFullYear());

            const statusDiv = getElementById("pto-status");
            const hireDate = new Date(status.hireDate).toLocaleDateString();
            const nextRolloverDate = new Date(status.nextRolloverDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            statusDiv.innerHTML = `
                <h3>Your PTO Status</h3>
                <div class="pto-summary"></div>
            `;

            const summaryContainer = statusDiv.querySelector('.pto-summary') as HTMLElement;

            const summaryCard = document.createElement('pto-summary-card') as any;
            summaryCard.summary = {
                annualAllocation: status.annualAllocation,
                availablePTO: status.availablePTO,
                usedPTO: status.usedPTO,
                carryoverFromPreviousYear: status.carryoverFromPreviousYear
            };

            const accrualCard = document.createElement('pto-accrual-card') as any;
            accrualCard.monthlyAccruals = status.monthlyAccruals;
            accrualCard.calendar = calendarData;
            accrualCard.calendarYear = new Date().getFullYear();
            accrualCard.monthlyUsage = this.buildMonthlyUsage(entries, new Date().getFullYear());

            const sickCard = document.createElement('pto-sick-card') as any;
            sickCard.bucket = status.sickTime;
            sickCard.usageEntries = this.buildUsageEntries(entries, new Date().getFullYear(), 'Sick');

            const bereavementCard = document.createElement('pto-bereavement-card') as any;
            bereavementCard.bucket = status.bereavementTime;
            bereavementCard.usageEntries = this.buildUsageEntries(entries, new Date().getFullYear(), 'Bereavement');

            const juryDutyCard = document.createElement('pto-jury-duty-card') as any;
            juryDutyCard.bucket = status.juryDutyTime;
            juryDutyCard.usageEntries = this.buildUsageEntries(entries, new Date().getFullYear(), 'Jury Duty');

            const employeeInfoCard = document.createElement('pto-employee-info-card') as any;
            employeeInfoCard.info = { hireDate, nextRolloverDate };

            summaryContainer.appendChild(summaryCard);
            summaryContainer.appendChild(accrualCard);
            summaryContainer.appendChild(sickCard);
            summaryContainer.appendChild(bereavementCard);
            summaryContainer.appendChild(juryDutyCard);
            summaryContainer.appendChild(employeeInfoCard);

            // Handle PTO request submission
            accrualCard.addEventListener('pto-request-submit', (e: any) => {
                e.stopPropagation();
                this.handlePtoRequestSubmit(e.detail.requests);
            });
        } catch (error) {
            console.error("Failed to load PTO status:", error);
            const statusDiv = getElementById("pto-status");
            statusDiv.innerHTML = `
                <h3>PTO Status</h3>
                <p>Error loading PTO status. Please try again later.</p>
            `;
        }
    }

    private buildCalendarData(entries: any[], year: number): CalendarData {
        const calendar: CalendarData = {};
        const safeEntries = Array.isArray(entries) ? entries : [];

        for (const entry of safeEntries) {
            const start = new Date(entry.start_date ?? entry.startDate);
            const end = new Date(entry.end_date ?? entry.endDate ?? entry.start_date ?? entry.startDate);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                continue;
            }

            const workdays = this.getWorkdaysBetween(start, end);
            if (workdays.length === 0) {
                continue;
            }

            const hoursPerDay = (entry.hours ?? 0) / workdays.length;
            for (const day of workdays) {
                if (day.getFullYear() !== year) {
                    continue;
                }
                const month = day.getMonth() + 1;
                const date = day.getDate();
                if (!calendar[month]) {
                    calendar[month] = {};
                }
                if (!calendar[month][date]) {
                    calendar[month][date] = { type: entry.type, hours: 0 };
                }
                calendar[month][date].hours += hoursPerDay;
            }
        }

        return calendar;
    }

    private buildUsageEntries(entries: any[], year: number, type: string): { date: string; hours: number }[] {
        const safeEntries = Array.isArray(entries) ? entries : [];
        const hoursByDate = new Map<string, number>();

        for (const entry of safeEntries) {
            if (entry.type !== type) {
                continue;
            }

            const startDateStr = entry.start_date ?? entry.startDate;
            const [year, month, day] = startDateStr.split('-').map(Number);
            const start = new Date(year, month - 1, day);
            if (Number.isNaN(start.getTime())) {
                continue;
            }

            if (start.getFullYear() !== year) {
                continue;
            }

            const dateKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
            hoursByDate.set(dateKey, (hoursByDate.get(dateKey) ?? 0) + (entry.hours ?? 0));
        }

        const result = Array.from(hoursByDate.entries())
            .map(([date, hours]) => ({ date, hours }))
            .sort((a, b) => a.date.localeCompare(b.date));
        return result;
    }

    private buildMonthlyUsage(entries: any[], year: number): { month: number; hours: number }[] {
        const usageByMonth = new Map<number, number>();
        for (let month = 1; month <= 12; month += 1) {
            usageByMonth.set(month, 0);
        }

        const safeEntries = Array.isArray(entries) ? entries : [];
        for (const entry of safeEntries) {
            if (entry.type !== 'PTO') {
                continue;
            }

            const start = new Date(entry.start_date ?? entry.startDate);
            const end = new Date(entry.end_date ?? entry.endDate ?? entry.start_date ?? entry.startDate);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                continue;
            }

            const workdays = this.getWorkdaysBetween(start, end);
            if (workdays.length === 0) {
                continue;
            }

            const hoursPerDay = (entry.hours ?? 0) / workdays.length;
            for (const day of workdays) {
                if (day.getFullYear() !== year) {
                    continue;
                }
                const month = day.getMonth() + 1;
                usageByMonth.set(month, (usageByMonth.get(month) ?? 0) + hoursPerDay);
            }
        }

        return Array.from(usageByMonth.entries())
            .map(([month, hours]) => ({ month, hours }))
            .sort((a, b) => a.month - b.month);
    }

    private getWorkdaysBetween(startDate: Date, endDate: Date): Date[] {
        const days: Date[] = [];
        const current = new Date(startDate);
        current.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        while (current <= end) {
            const dayOfWeek = current.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                days.push(new Date(current));
            }
            current.setDate(current.getDate() + 1);
        }

        return days;
    }

    private async handlePtoRequestSubmit(requests: CalendarEntry[]): Promise<void> {
        if (!this.currentUser) {
            alert('You must be logged in to submit PTO requests');
            return;
        }

        try {
            // Submit each request
            for (const request of requests) {
                await api.post('/pto', {
                    employeeId: this.currentUser.id,
                    startDate: request.date,
                    endDate: request.date, // Single day requests
                    type: request.type,
                    hours: request.hours
                });
            }

            alert(`Successfully submitted ${requests.length} PTO request(s)!`);

            // Reload PTO status to reflect changes
            await this.loadPTOStatus();
        } catch (error) {
            console.error('Error submitting PTO request:', error);
            alert('Failed to submit PTO request. Please try again.');
        }
    }
}

export { UIManager };

const loginForm = document.getElementById("login-form");
if (loginForm) {
    (window as any).app = new UIManager();
}
