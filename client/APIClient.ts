// API client
import type * as ApiTypes from "../shared/api-models.js";

export class APIClient {
  private baseURL = "/api";

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  async put(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  // Typed API methods
  async requestAuthLink(
    identifier: string,
  ): Promise<ApiTypes.AuthRequestLinkResponse> {
    return this.post("/auth/request-link", { identifier });
  }

  async validateAuth(
    token: string,
    ts: string,
  ): Promise<ApiTypes.AuthValidateResponse> {
    return this.get(`/auth/validate?token=${token}&ts=${ts}`);
  }

  async getPTOStatus(): Promise<ApiTypes.PTOStatusResponse> {
    return this.get("/pto/status");
  }

  async getPTOEntries(): Promise<ApiTypes.PTOEntry[]> {
    return this.get("/pto");
  }

  async getPTOYearReview(
    year: number,
  ): Promise<ApiTypes.PTOYearReviewResponse> {
    return this.get(`/pto/year/${year}`);
  }

  async createPTOEntry(
    request:
      | { date: string; hours: number; type: string }
      | { requests: Array<{ date: string; hours: number; type: string }> },
  ): Promise<{
    message: string;
    ptoEntry: ApiTypes.PTOEntry;
    ptoEntries: ApiTypes.PTOEntry[];
  }> {
    return this.post("/pto", request);
  }

  async updatePTOEntry(
    id: number,
    updates: Partial<{ date: string; hours: number; type: string }>,
  ): Promise<ApiTypes.PTOUpdateResponse> {
    return this.put(`/pto/${id}`, updates);
  }

  async deletePTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse> {
    const response = await fetch(`${this.baseURL}/pto/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  async submitHours(
    month: string,
    hoursWorked: number,
  ): Promise<ApiTypes.HoursSubmitResponse> {
    return this.post("/hours", { month, hoursWorked });
  }

  async getHours(): Promise<ApiTypes.HoursResponse> {
    return this.get("/hours");
  }

  async submitAcknowledgement(
    month: string,
  ): Promise<ApiTypes.AcknowledgementSubmitResponse> {
    return this.post("/acknowledgements", { month });
  }

  async getAcknowledgements(): Promise<ApiTypes.AcknowledgementResponse> {
    return this.get("/acknowledgements");
  }

  async getMonthlySummary(
    month: string,
  ): Promise<ApiTypes.MonthlySummaryResponse> {
    return this.get(`/monthly-summary/${month}`);
  }

  async submitAdminAcknowledgement(
    employeeId: number,
    month: string,
  ): Promise<ApiTypes.AdminAcknowledgementSubmitResponse> {
    return this.post("/admin-acknowledgements", { employeeId, month });
  }

  async getAdminMonthlyReview(
    month: string,
  ): Promise<ApiTypes.AdminMonthlyReviewResponse> {
    return this.get(`/admin/monthly-review/${month}`);
  }

  async getEmployees(): Promise<ApiTypes.EmployeesResponse> {
    return this.get("/employees");
  }

  async createEmployee(
    employee: Omit<ApiTypes.Employee, "id" | "hash">,
  ): Promise<ApiTypes.EmployeeCreateResponse> {
    return this.post("/employees", employee);
  }

  async getEmployee(id: number): Promise<ApiTypes.EmployeeResponse> {
    return this.get(`/employees/${id}`);
  }

  async updateEmployee(
    id: number,
    updates: Partial<ApiTypes.Employee>,
  ): Promise<ApiTypes.EmployeeUpdateResponse> {
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
    return this.get("/health");
  }
}
