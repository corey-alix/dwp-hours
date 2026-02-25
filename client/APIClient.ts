// API client
import type * as ApiTypes from "../shared/api-models.js";
import { getTimeTravelYear, today } from "../shared/dateUtils.js";

export class APIClient {
  private baseURL = "/api";

  /**
   * Returns query-string parameters for time-travel override,
   * or an empty string when inactive.
   */
  private timeTravelQuery(
    style: "current_date" | "current_year",
    separator: "?" | "&" = "?",
  ): string {
    const year = getTimeTravelYear();
    if (year === null) return "";
    if (style === "current_date") {
      return `${separator}current_date=${encodeURIComponent(today())}`;
    }
    return `${separator}current_year=${year}`;
  }

  async get(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
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
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
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
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }

  async patch(endpoint: string, data?: any): Promise<any> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: data !== undefined ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const error = new Error(
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
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

  async validateAuth(token: string): Promise<ApiTypes.AuthValidateResponse> {
    return this.get(`/auth/validate?token=${token}`);
  }

  async validateSession(): Promise<ApiTypes.AuthValidateSessionResponse> {
    return this.get("/auth/validate-session");
  }

  async getPTOStatus(): Promise<ApiTypes.PTOStatusResponse> {
    return this.get(`/pto/status${this.timeTravelQuery("current_date")}`);
  }

  async getPTOEntries(): Promise<ApiTypes.PTOEntry[]> {
    return this.get("/pto");
  }

  async getPTOYearReview(
    year: number,
  ): Promise<ApiTypes.PTOYearReviewResponse> {
    return this.get(`/pto/year/${year}${this.timeTravelQuery("current_year")}`);
  }

  async createPTOEntry(
    request: ApiTypes.PTOCreateRequest | ApiTypes.PTOBulkCreateRequest,
  ): Promise<{
    message: string;
    ptoEntry: ApiTypes.PTOEntry;
    ptoEntries: ApiTypes.PTOEntry[];
    warnings?: string[];
  }> {
    return this.post("/pto", request);
  }

  async updatePTOEntry(
    id: number,
    updates: ApiTypes.PTOUpdateRequest,
  ): Promise<ApiTypes.PTOUpdateResponse> {
    return this.put(`/pto/${id}`, updates);
  }

  async approvePTOEntry(
    id: number,
    adminId: number,
  ): Promise<ApiTypes.PTOUpdateResponse> {
    return this.put(`/pto/${id}`, { approved_by: adminId });
  }

  async rejectPTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse> {
    return this.delete(`/pto/${id}`);
  }

  async deletePTOEntry(id: number): Promise<ApiTypes.GenericMessageResponse> {
    return this.delete(`/pto/${id}`);
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

  async deleteAcknowledgement(
    id: number,
  ): Promise<ApiTypes.GenericMessageResponse> {
    return this.delete(`/acknowledgements/${id}`);
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
    const ttQuery = this.timeTravelQuery("current_date");
    return this.post(`/admin-acknowledgements${ttQuery}`, {
      employeeId,
      month,
    });
  }

  async getAdminMonthlyReview(
    month: string,
  ): Promise<ApiTypes.AdminMonthlyReviewResponse> {
    return this.get(`/admin/monthly-review/${month}`);
  }

  async getAdminPTOEntries(): Promise<ApiTypes.PTOEntry[]> {
    return this.get("/admin/pto");
  }

  async getEmployees(): Promise<ApiTypes.EmployeesResponse> {
    return this.get("/employees");
  }

  async createEmployee(
    employee: ApiTypes.EmployeeCreateRequest,
  ): Promise<ApiTypes.EmployeeCreateResponse> {
    return this.post("/employees", employee);
  }

  async getEmployee(id: number): Promise<ApiTypes.EmployeeResponse> {
    return this.get(`/employees/${id}`);
  }

  async updateEmployee(
    id: number,
    updates: ApiTypes.EmployeeUpdateRequest,
  ): Promise<ApiTypes.EmployeeUpdateResponse> {
    return this.put(`/employees/${id}`, updates);
  }

  async deleteEmployee(id: number): Promise<ApiTypes.GenericMessageResponse> {
    return this.delete(`/employees/${id}`);
  }

  async health(): Promise<ApiTypes.HealthResponse> {
    return this.get("/health");
  }

  // Notification methods
  async getNotifications(): Promise<ApiTypes.NotificationsResponse> {
    return this.get("/notifications");
  }

  async markNotificationRead(
    id: number,
  ): Promise<ApiTypes.NotificationReadResponse> {
    return this.patch(`/notifications/${id}/read`);
  }

  async createNotification(
    employeeId: number,
    type: ApiTypes.NotificationType,
    message: string,
  ): Promise<ApiTypes.NotificationCreateResponse> {
    return this.post("/notifications", { employeeId, type, message });
  }

  async importExcel(file: File): Promise<any> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${this.baseURL}/admin/import-excel`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!response.ok) {
      // Handle nginx-level errors that return HTML instead of JSON
      if (response.status === 413) {
        throw new Error(
          "File too large. The server rejected the upload — try a smaller file.",
        );
      }
      if (response.status === 504) {
        throw new Error(
          "Import timed out. The server is still processing — check back shortly.",
        );
      }
      const errorData = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      const error = new Error(
        errorData.message ||
          errorData.error ||
          `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as any).responseData = errorData;
      throw error;
    }
    return response.json();
  }
}
