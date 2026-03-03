/**
 * Service layer interfaces.
 *
 * Each interface groups logically related APIClient methods into a
 * domain-specific contract.  Components depend on these interfaces
 * (via the ServiceContainer) rather than on the concrete APIClient,
 * which makes them easy to mock in unit tests.
 */
import type * as Api from "../../shared/api-models.js";

// ── Auth ────────────────────────────────────────────────────────

export interface IAuthApiService {
  requestAuthLink(identifier: string): Promise<Api.AuthRequestLinkResponse>;
  validateAuth(token: string): Promise<Api.AuthValidateResponse>;
  validateSession(): Promise<Api.AuthValidateSessionResponse>;
  timesheetLogin(
    payload: Api.TimesheetLoginRequest,
  ): Promise<Api.TimesheetLoginResponse>;
}

// ── PTO (employee-facing) ───────────────────────────────────────

export interface IPtoService {
  getStatus(): Promise<Api.PTOStatusResponse>;
  getEntries(): Promise<Api.PTOEntry[]>;
  getYearReview(year: number): Promise<Api.PTOYearReviewResponse>;
  getAvailableYears(): Promise<Api.PTOAvailableYearsResponse>;
  create(request: Api.PTOCreateRequest | Api.PTOBulkCreateRequest): Promise<{
    message: string;
    ptoEntry: Api.PTOEntry;
    ptoEntries: Api.PTOEntry[];
    warnings?: string[];
  }>;
  update(
    id: number,
    updates: Api.PTOUpdateRequest,
  ): Promise<Api.PTOUpdateResponse>;
  remove(id: number): Promise<Api.GenericMessageResponse>;
}

// ── Acknowledgements (employee-facing) ──────────────────────────

export interface IAcknowledgementService {
  getAll(): Promise<Api.AcknowledgementResponse>;
  submit(month: string): Promise<Api.AcknowledgementSubmitResponse>;
  remove(id: number): Promise<Api.GenericMessageResponse>;
}

// ── Hours ───────────────────────────────────────────────────────

export interface IHoursService {
  getAll(): Promise<Api.HoursResponse>;
  submit(month: string, hoursWorked: number): Promise<Api.HoursSubmitResponse>;
  getMonthlySummary(month: string): Promise<Api.MonthlySummaryResponse>;
}

// ── Admin PTO / Review ──────────────────────────────────────────

export interface IAdminService {
  getPTOEntries(options?: {
    excludeLockedMonths?: boolean;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<Api.PTOEntry[]>;
  getEmployeePTOStatus(
    employeeId: number,
    currentDate?: string,
  ): Promise<Api.PTOStatusResponse & { employeeName: string }>;
  getAcknowledgements(
    employeeId: number,
  ): Promise<Api.AdminAcknowledgementResponse>;
  getMonthlyReview(month: string): Promise<Api.AdminMonthlyReviewResponse>;
  submitAcknowledgement(
    employeeId: number,
    month: string,
  ): Promise<Api.AdminAcknowledgementSubmitResponse>;
  approvePTOEntry(id: number, adminId: number): Promise<Api.PTOUpdateResponse>;
  rejectPTOEntry(id: number): Promise<Api.GenericMessageResponse>;
}

// ── Employees ───────────────────────────────────────────────────

export interface IEmployeeService {
  getAll(): Promise<Api.EmployeesResponse>;
  get(id: number): Promise<Api.EmployeeResponse>;
  create(
    employee: Api.EmployeeCreateRequest,
  ): Promise<Api.EmployeeCreateResponse>;
  update(
    id: number,
    updates: Api.EmployeeUpdateRequest,
  ): Promise<Api.EmployeeUpdateResponse>;
  remove(id: number): Promise<Api.GenericMessageResponse>;
}

// ── Notifications ───────────────────────────────────────────────

export interface INotificationService {
  getAll(): Promise<Api.NotificationsResponse>;
  markRead(id: number): Promise<Api.NotificationReadResponse>;
  create(
    employeeId: number,
    type: Api.NotificationType,
    message: string,
  ): Promise<Api.NotificationCreateResponse>;
}

// ── Import ──────────────────────────────────────────────────────

export interface IImportService {
  importExcel(file: File): Promise<Api.BulkImportResponse>;
  importBulk(payload: Api.BulkImportPayload): Promise<Api.BulkImportResponse>;
  /** Employee self-service timesheet upload. */
  importEmployeeBulk(body: {
    employeeName: string;
    hireDate: string;
    year: number;
    ptoEntries: Api.BulkImportPtoEntry[];
    acknowledgements: Api.BulkImportAcknowledgement[];
  }): Promise<Api.EmployeeImportBulkResponse>;
}

// ── Health ──────────────────────────────────────────────────────

export interface IHealthService {
  check(): Promise<Api.HealthResponse>;
}
