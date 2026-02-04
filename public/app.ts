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
    available: number;
    used: number;
    remaining: number;
}

// API client
class APIClient {
    private baseURL = '/api';

    async get(endpoint: string): Promise<any> {
        const response = await fetch(`${this.baseURL}${endpoint}`);
        return response.json();
    }

    async post(endpoint: string, data: any): Promise<any> {
        const response = await fetch(`${this.baseURL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
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
        this.setupEventListeners();
        this.showLogin();
    }

    private setupEventListeners(): void {
        // Login form
        const loginForm = document.getElementById('login-form') as HTMLFormElement;
        loginForm.addEventListener('submit', (e) => this.handleLogin(e));

        // PTO form
        const ptoForm = document.getElementById('pto-entry-form') as HTMLFormElement;
        ptoForm.addEventListener('submit', (e) => this.handlePTO(e));

        const cancelBtn = document.getElementById('cancel-pto') as HTMLButtonElement;
        cancelBtn.addEventListener('click', () => this.showDashboard());

        // Navigation
        const newPTOBtn = document.getElementById('new-pto-btn') as HTMLButtonElement;
        newPTOBtn.addEventListener('click', () => this.showPTOForm());

        // Admin buttons
        const manageBtn = document.getElementById('manage-employees-btn') as HTMLButtonElement;
        manageBtn.addEventListener('click', () => this.showEmployeeManagement());

        const reportsBtn = document.getElementById('view-reports-btn') as HTMLButtonElement;
        reportsBtn.addEventListener('click', () => this.showReports());
    }

    private async handleLogin(e: Event): void {
        e.preventDefault();
        const identifier = (document.getElementById('identifier') as HTMLInputElement).value;
        const hash = (document.getElementById('hash') as HTMLInputElement).value;

        try {
            // TODO: Implement proper authentication
            // For now, assume login succeeds
            this.currentUser = {
                id: 1,
                name: 'Test User',
                identifier,
                ptoRate: 0.71,
                carryoverHours: 0,
                role: 'Employee',
                hash
            };

            this.showDashboard();
            await this.loadPTOStatus();
        } catch (error) {
            alert('Login failed. Please check your credentials.');
        }
    }

    private async handlePTO(e: Event): void {
        e.preventDefault();
        if (!this.currentUser) return;

        const startDate = (document.getElementById('start-date') as HTMLInputElement).value;
        const endDate = (document.getElementById('end-date') as HTMLInputElement).value;
        const type = (document.getElementById('pto-type') as HTMLSelectElement).value;
        const hours = parseFloat((document.getElementById('hours') as HTMLInputElement).value);

        try {
            await api.post('/pto', {
                employeeId: this.currentUser.id,
                startDate,
                endDate,
                type,
                hours
            });

            alert('PTO submitted successfully!');
            this.showDashboard();
            await this.loadPTOStatus();
        } catch (error) {
            alert('Failed to submit PTO. Please try again.');
        }
    }

    private showLogin(): void {
        this.hideAllSections();
        document.getElementById('login-section')!.classList.remove('hidden');
    }

    private showDashboard(): void {
        this.hideAllSections();
        document.getElementById('dashboard')!.classList.remove('hidden');
        if (this.currentUser?.role === 'Admin') {
            document.getElementById('admin-panel')!.classList.remove('hidden');
        }
    }

    private showPTOForm(): void {
        this.hideAllSections();
        document.getElementById('pto-form')!.classList.remove('hidden');
    }

    private showEmployeeManagement(): void {
        // TODO: Implement employee management UI
        alert('Employee management coming soon!');
    }

    private showReports(): void {
        // TODO: Implement reports UI
        alert('Reports coming soon!');
    }

    private hideAllSections(): void {
        const sections = ['login-section', 'dashboard', 'pto-form', 'admin-panel'];
        sections.forEach(id => {
            document.getElementById(id)!.classList.add('hidden');
        });
    }

    private async loadPTOStatus(): Promise<void> {
        if (!this.currentUser) return;

        try {
            // TODO: Implement PTO status calculation
            const status: PTOStatus = {
                available: 80,
                used: 16,
                remaining: 64
            };

            const statusDiv = document.getElementById('pto-status')!;
            statusDiv.innerHTML = `
                <h3>Your PTO Status</h3>
                <p>Available: ${status.available} hours</p>
                <p>Used: ${status.used} hours</p>
                <p>Remaining: ${status.remaining} hours</p>
            `;
        } catch (error) {
            console.error('Failed to load PTO status:', error);
        }
    }
}

// Initialize the application
new UIManager();