// API client
class APIClient {
    constructor() {
        this.baseURL = "/api";
    }
    async get(endpoint) {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        return response.json();
    }
    async post(endpoint, data) {
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
    constructor() {
        this.currentUser = null;
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.showLogin();
    }
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById("login-form");
        loginForm.addEventListener("submit", (e) => this.handleLogin(e));
        // PTO form
        const ptoForm = document.getElementById("pto-entry-form");
        ptoForm.addEventListener("submit", (e) => this.handlePTO(e));
        const cancelBtn = document.getElementById("cancel-pto");
        cancelBtn.addEventListener("click", () => this.showDashboard());
        // Navigation
        const newPTOBtn = document.getElementById("new-pto-btn");
        newPTOBtn.addEventListener("click", () => this.showPTOForm());
        // Admin buttons
        const manageBtn = document.getElementById("manage-employees-btn");
        manageBtn.addEventListener("click", () => this.showEmployeeManagement());
        const reportsBtn = document.getElementById("view-reports-btn");
        reportsBtn.addEventListener("click", () => this.showReports());
    }
    async handleLogin(e) {
        e.preventDefault();
        const identifier = document.getElementById("identifier").value;
        const hash = document.getElementById("hash").value;
        try {
            // TODO: Implement proper authentication
            // For now, assume login succeeds
            this.currentUser = {
                id: 1,
                name: "Test User",
                identifier,
                ptoRate: 0.71,
                carryoverHours: 0,
                role: "Employee",
                hash,
            };
            this.showDashboard();
            await this.loadPTOStatus();
        }
        catch (error) {
            alert("Login failed. Please check your credentials.");
        }
    }
    async handlePTO(e) {
        e.preventDefault();
        if (!this.currentUser)
            return;
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date")
            .value;
        const type = document.getElementById("pto-type")
            .value;
        const hours = parseFloat(document.getElementById("hours").value);
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
        }
        catch (error) {
            alert("Failed to submit PTO. Please try again.");
        }
    }
    showLogin() {
        this.hideAllSections();
        document.getElementById("login-section").classList.remove("hidden");
    }
    showDashboard() {
        this.hideAllSections();
        document.getElementById("dashboard").classList.remove("hidden");
        if (this.currentUser?.role === "Admin") {
            document.getElementById("admin-panel").classList.remove("hidden");
        }
    }
    showPTOForm() {
        this.hideAllSections();
        document.getElementById("pto-form").classList.remove("hidden");
    }
    showEmployeeManagement() {
        // TODO: Implement employee management UI
        alert("Employee management coming soon!");
    }
    showReports() {
        // TODO: Implement reports UI
        alert("Reports coming soon!");
    }
    hideAllSections() {
        const sections = ["login-section", "dashboard", "pto-form", "admin-panel"];
        sections.forEach((id) => {
            document.getElementById(id).classList.add("hidden");
        });
    }
    async loadPTOStatus() {
        if (!this.currentUser)
            return;
        try {
            // TODO: Implement PTO status calculation
            const status = {
                available: 80,
                used: 16,
                remaining: 64,
            };
            const statusDiv = document.getElementById("pto-status");
            statusDiv.innerHTML = `
                <h3>Your PTO Status</h3>
                <p>Available: ${status.available} hours</p>
                <p>Used: ${status.used} hours</p>
                <p>Remaining: ${status.remaining} hours</p>
            `;
        }
        catch (error) {
            console.error("Failed to load PTO status:", error);
        }
    }
}
// Initialize the application
new UIManager();
export {};
//# sourceMappingURL=app.js.map