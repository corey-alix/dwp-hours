// API client
import type * as ApiTypes from './api-types.js';

export class APIClient {
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

    // Typed API methods
    async requestAuthLink(identifier: string): Promise<ApiTypes.AuthRequestLinkResponse> {
        return this.post('/auth/request-link', { identifier });
    }

    async validateAuth(token: string, ts: string): Promise<ApiTypes.AuthValidateResponse> {
        return this.get(`/auth/validate?token=${token}&ts=${ts}`);
    }

    async getPTOStatus(employeeId: number): Promise<ApiTypes.PTOStatusResponse> {
        return this.get(`/pto/status/${employeeId}`);
    }

    async getPTOEntries(employeeId?: number): Promise<ApiTypes.PTOEntry[]> {
        const endpoint = employeeId ? `/pto?employeeId=${employeeId}` : '/pto';
        return this.get(endpoint);
    }

    async createPTOEntry(request: { employeeId: number; date: string; hours: number; type: string } | { requests: Array<{ employeeId: number; date: string; hours: number; type: string }> }): Promise<{ message: string; ptoEntry: ApiTypes.PTOEntry; ptoEntries: ApiTypes.PTOEntry[] }> {
        return this.post('/pto', request);
    }

    async updatePTOEntry(id: number, updates: Partial<{ date: string; hours: number; type: string }>): Promise<ApiTypes.PTOUpdateResponse> {
        return this.post(`/pto/${id}`, updates);
    }

    async deletePTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse> {
        const response = await fetch(`${this.baseURL}/pto/${id}`, {
            method: "DELETE",
        });
        return response.json();
    }

    async submitHours(employeeId: number, month: string, hoursWorked: number): Promise<ApiTypes.HoursSubmitResponse> {
        return this.post('/hours', { employeeId, month, hoursWorked });
    }

    async getHours(employeeId: number): Promise<ApiTypes.HoursResponse> {
        return this.get(`/hours/${employeeId}`);
    }

    async submitAcknowledgement(employeeId: number, month: string): Promise<ApiTypes.AcknowledgementSubmitResponse> {
        return this.post('/acknowledgements', { employeeId, month });
    }

    async getAcknowledgements(employeeId: number): Promise<ApiTypes.AcknowledgementResponse> {
        return this.get(`/acknowledgements/${employeeId}`);
    }

    async getMonthlySummary(employeeId: number, month: string): Promise<ApiTypes.MonthlySummaryResponse> {
        return this.get(`/monthly-summary/${employeeId}/${month}`);
    }

    async submitAdminAcknowledgement(employeeId: number, month: string, adminId: number): Promise<ApiTypes.AdminAcknowledgementSubmitResponse> {
        return this.post('/admin-acknowledgements', { employeeId, month, adminId });
    }

    async getAdminAcknowledgements(employeeId: number): Promise<ApiTypes.AdminAcknowledgementResponse> {
        return this.get(`/admin-acknowledgements/${employeeId}`);
    }

    async getEmployees(): Promise<ApiTypes.EmployeesResponse> {
        return this.get('/employees');
    }

    async createEmployee(employee: Omit<ApiTypes.Employee, 'id' | 'hash'>): Promise<ApiTypes.EmployeeCreateResponse> {
        return this.post('/employees', employee);
    }

    async getEmployee(id: number): Promise<ApiTypes.EmployeeResponse> {
        return this.get(`/employees/${id}`);
    }

    async updateEmployee(id: number, updates: Partial<ApiTypes.Employee>): Promise<ApiTypes.EmployeeUpdateResponse> {
        const response = await fetch(`${this.baseURL}/employees/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(updates),
        });
        return response.json();
    }

    async deleteEmployee(id: number): Promise<ApiTypes.GenericMessageResponse> {
        const response = await fetch(`${this.baseURL}/employees/${id}`, {
            method: "DELETE",
        });
        return response.json();
    }

    async health(): Promise<ApiTypes.HealthResponse> {
        return this.get('/health');
    }
}
