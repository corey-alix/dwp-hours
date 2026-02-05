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

const api = new APIClient();

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
        const loginForm = document.getElementById("login-form") as HTMLFormElement;
        loginForm.addEventListener("submit", (e) => this.handleLogin(e));

        // PTO form
        const ptoForm = document.getElementById(
            "pto-entry-form",
        ) as HTMLFormElement;
        ptoForm.addEventListener("submit", (e) => this.handlePTO(e));

        const cancelBtn = document.getElementById(
            "cancel-pto",
        ) as HTMLButtonElement;
        cancelBtn.addEventListener("click", () => this.showDashboard());

        // Logout
        const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
        logoutBtn.addEventListener("click", () => this.handleLogout());

        // Navigation
        const newPTOBtn = document.getElementById(
            "new-pto-btn",
        ) as HTMLButtonElement;
        newPTOBtn.addEventListener("click", () => this.showPTOForm());

        // Admin buttons
        const manageBtn = document.getElementById(
            "manage-employees-btn",
        ) as HTMLButtonElement;
        manageBtn.addEventListener("click", () => this.showEmployeeManagement());

        const reportsBtn = document.getElementById(
            "view-reports-btn",
        ) as HTMLButtonElement;
        reportsBtn.addEventListener("click", () => this.showReports());
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
            document.getElementById("identifier") as HTMLInputElement
        ).value;

        try {
            const response = await api.post("/auth/request-link", { identifier });
            const messageDiv = document.getElementById("login-message")!;
            messageDiv.textContent = response.message;
            messageDiv.classList.remove("hidden");
        } catch (error) {
            alert("Failed to send magic link. Please try again.");
        }
    }

    private async handlePTO(e: Event): Promise<void> {
        e.preventDefault();
        if (!this.currentUser) return;

        const startDate = (
            document.getElementById("start-date") as HTMLInputElement
        ).value;
        const endDate = (document.getElementById("end-date") as HTMLInputElement)
            .value;
        const type = (document.getElementById("pto-type") as HTMLSelectElement)
            .value;
        const hours = parseFloat(
            (document.getElementById("hours") as HTMLInputElement).value,
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
        document.getElementById("login-section")!.classList.remove("hidden");
        document.getElementById("logout-btn")!.classList.add("hidden");
    }

    private showDashboard(): void {
        this.hideAllSections();
        document.getElementById("dashboard")!.classList.remove("hidden");
        if (this.currentUser?.role === "Admin") {
            document.getElementById("admin-panel")!.classList.remove("hidden");
        }
        document.getElementById("logout-btn")!.classList.remove("hidden");
    }

    private showPTOForm(): void {
        this.hideAllSections();
        document.getElementById("pto-form")!.classList.remove("hidden");
    }

    private showEmployeeManagement(): void {
        // TODO: Implement employee management UI
        alert("Employee management coming soon!");
    }

    private showReports(): void {
        // TODO: Implement reports UI
        alert("Reports coming soon!");
    }

    private hideAllSections(): void {
        const sections = ["login-section", "dashboard", "pto-form", "admin-panel"];
        sections.forEach((id) => {
            document.getElementById(id)!.classList.add("hidden");
        });
    }

    private async loadPTOStatus(): Promise<void> {
        if (!this.currentUser) return;

        try {
            const status: PTOStatus = await api.get(`/pto/status/${this.currentUser.id}`);

            const statusDiv = document.getElementById("pto-status")!;
            const hireDate = new Date(status.hireDate).toLocaleDateString();
            const nextRolloverDate = new Date(status.nextRolloverDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Create monthly accrual display
            const monthlyDisplay = status.monthlyAccruals.map(accrual => {
                const monthName = new Date(2024, accrual.month - 1, 1).toLocaleString('default', { month: 'short' });
                return `<span>${monthName}: ${accrual.hours.toFixed(1)}h</span>`;
            }).join(', ');

            statusDiv.innerHTML = `
                <h3>Your PTO Status</h3>
                <div class="pto-summary">
                    <div class="pto-section">
                        <h4>Regular PTO</h4>
                        <p><strong>Annual Allocation:</strong> ${status.annualAllocation} hours</p>
                        <p><strong>Available:</strong> ${status.availablePTO.toFixed(2)} hours</p>
                        <p><strong>Used:</strong> ${status.usedPTO.toFixed(2)} hours</p>
                        <p><strong>Carryover from Previous Year:</strong> ${status.carryoverFromPreviousYear.toFixed(2)} hours</p>
                    </div>
                    <div class="pto-section">
                        <h4>Monthly Accrual Breakdown</h4>
                        <p><small>${monthlyDisplay}</small></p>
                    </div>
                    <div class="pto-section">
                        <h4>Sick Time</h4>
                        <p><strong>Allowed:</strong> ${status.sickTime.allowed} hours</p>
                        <p><strong>Used:</strong> ${status.sickTime.used.toFixed(2)} hours</p>
                        <p><strong>Remaining:</strong> ${status.sickTime.remaining.toFixed(2)} hours</p>
                    </div>
                    <div class="pto-section">
                        <h4>Bereavement</h4>
                        <p><strong>Allowed:</strong> ${status.bereavementTime.allowed} hours</p>
                        <p><strong>Used:</strong> ${status.bereavementTime.used.toFixed(2)} hours</p>
                        <p><strong>Remaining:</strong> ${status.bereavementTime.remaining.toFixed(2)} hours</p>
                    </div>
                    <div class="pto-section">
                        <h4>Jury Duty</h4>
                        <p><strong>Allowed:</strong> ${status.juryDutyTime.allowed} hours</p>
                        <p><strong>Used:</strong> ${status.juryDutyTime.used.toFixed(2)} hours</p>
                        <p><strong>Remaining:</strong> ${status.juryDutyTime.remaining.toFixed(2)} hours</p>
                    </div>
                    <div class="pto-section">
                        <h4>Employee Information</h4>
                        <p><strong>Hire Date:</strong> ${hireDate}</p>
                        <p><strong>Next Rollover:</strong> ${nextRolloverDate}</p>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error("Failed to load PTO status:", error);
            const statusDiv = document.getElementById("pto-status")!;
            statusDiv.innerHTML = `
                <h3>PTO Status</h3>
                <p>Error loading PTO status. Please try again later.</p>
            `;
        }
    }
}

// Initialize the application
new UIManager();
