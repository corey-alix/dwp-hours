/**
 * Service container — holds a shared APIClient and exposes typed
 * domain services.  A module-level singleton is available via
 * `getServices()` for non-component code (e.g. route loaders).
 *
 * Web components can also receive the container through the context
 * protocol (see CONTEXT_KEYS.SERVICES in context.ts).
 */
import { APIClient } from "../APIClient.js";
import type {
  IAuthApiService,
  IPtoService,
  IAcknowledgementService,
  IHoursService,
  IAdminService,
  IEmployeeService,
  INotificationService,
  IImportService,
  IHealthService,
} from "./interfaces.js";
import type * as Api from "../../shared/api-models.js";

// ── Concrete implementations ────────────────────────────────────

class AuthApiService implements IAuthApiService {
  constructor(private api: APIClient) {}
  requestAuthLink(identifier: string) {
    return this.api.requestAuthLink(identifier);
  }
  validateAuth(token: string) {
    return this.api.validateAuth(token);
  }
  validateSession() {
    return this.api.validateSession();
  }
  timesheetLogin(payload: Api.TimesheetLoginRequest) {
    return this.api.timesheetLogin(payload);
  }
}

class PtoService implements IPtoService {
  constructor(private api: APIClient) {}
  getStatus() {
    return this.api.getPTOStatus();
  }
  getEntries() {
    return this.api.getPTOEntries();
  }
  getYearReview(year: number) {
    return this.api.getPTOYearReview(year);
  }
  create(request: Api.PTOCreateRequest | Api.PTOBulkCreateRequest) {
    return this.api.createPTOEntry(request);
  }
  update(id: number, updates: Api.PTOUpdateRequest) {
    return this.api.updatePTOEntry(id, updates);
  }
  remove(id: number) {
    return this.api.deletePTOEntry(id);
  }
}

class AcknowledgementService implements IAcknowledgementService {
  constructor(private api: APIClient) {}
  getAll() {
    return this.api.getAcknowledgements();
  }
  submit(month: string) {
    return this.api.submitAcknowledgement(month);
  }
  remove(id: number) {
    return this.api.deleteAcknowledgement(id);
  }
}

class HoursService implements IHoursService {
  constructor(private api: APIClient) {}
  getAll() {
    return this.api.getHours();
  }
  submit(month: string, hoursWorked: number) {
    return this.api.submitHours(month, hoursWorked);
  }
  getMonthlySummary(month: string) {
    return this.api.getMonthlySummary(month);
  }
}

class AdminService implements IAdminService {
  constructor(private api: APIClient) {}
  getPTOEntries(options?: {
    excludeLockedMonths?: boolean;
    employeeId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return this.api.getAdminPTOEntries(options);
  }
  getEmployeePTOStatus(employeeId: number, currentDate?: string) {
    return this.api.getAdminEmployeePTOStatus(employeeId, currentDate);
  }
  getAcknowledgements(employeeId: number) {
    return this.api.getAdminAcknowledgements(employeeId);
  }
  getMonthlyReview(month: string) {
    return this.api.getAdminMonthlyReview(month);
  }
  submitAcknowledgement(employeeId: number, month: string) {
    return this.api.submitAdminAcknowledgement(employeeId, month);
  }
  approvePTOEntry(id: number, adminId: number) {
    return this.api.approvePTOEntry(id, adminId);
  }
  rejectPTOEntry(id: number) {
    return this.api.rejectPTOEntry(id);
  }
}

class EmployeeService implements IEmployeeService {
  constructor(private api: APIClient) {}
  getAll() {
    return this.api.getEmployees();
  }
  get(id: number) {
    return this.api.getEmployee(id);
  }
  create(employee: Api.EmployeeCreateRequest) {
    return this.api.createEmployee(employee);
  }
  update(id: number, updates: Api.EmployeeUpdateRequest) {
    return this.api.updateEmployee(id, updates);
  }
  remove(id: number) {
    return this.api.deleteEmployee(id);
  }
}

class NotificationServiceImpl implements INotificationService {
  constructor(private api: APIClient) {}
  getAll() {
    return this.api.getNotifications();
  }
  markRead(id: number) {
    return this.api.markNotificationRead(id);
  }
  create(employeeId: number, type: Api.NotificationType, message: string) {
    return this.api.createNotification(employeeId, type, message);
  }
}

class ImportService implements IImportService {
  constructor(private api: APIClient) {}
  importExcel(file: File) {
    return this.api.importExcel(file);
  }
  importBulk(payload: Api.BulkImportPayload) {
    return this.api.importBulk(payload);
  }
  async importEmployeeBulk(body: {
    employeeName: string;
    hireDate: string;
    year: number;
    ptoEntries: Api.BulkImportPtoEntry[];
    acknowledgements: Api.BulkImportAcknowledgement[];
  }): Promise<Api.EmployeeImportBulkResponse> {
    const response = await fetch("/api/employee/import-bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) {
      const error = new Error(
        data.error || `HTTP ${response.status}: ${response.statusText}`,
      );
      (error as unknown as Record<string, unknown>).responseData = data;
      throw error;
    }
    return data as Api.EmployeeImportBulkResponse;
  }
}

class HealthService implements IHealthService {
  constructor(private api: APIClient) {}
  check() {
    return this.api.health();
  }
}

// ── Container ───────────────────────────────────────────────────

export class ServiceContainer {
  readonly api: APIClient;
  readonly auth: IAuthApiService;
  readonly pto: IPtoService;
  readonly acknowledgements: IAcknowledgementService;
  readonly hours: IHoursService;
  readonly admin: IAdminService;
  readonly employees: IEmployeeService;
  readonly notifications: INotificationService;
  readonly imports: IImportService;
  readonly health: IHealthService;

  constructor(api?: APIClient) {
    const client = api ?? new APIClient();
    this.api = client;
    this.auth = new AuthApiService(client);
    this.pto = new PtoService(client);
    this.acknowledgements = new AcknowledgementService(client);
    this.hours = new HoursService(client);
    this.admin = new AdminService(client);
    this.employees = new EmployeeService(client);
    this.notifications = new NotificationServiceImpl(client);
    this.imports = new ImportService(client);
    this.health = new HealthService(client);
  }
}

// ── Module singleton ────────────────────────────────────────────

let _instance: ServiceContainer | undefined;

/** Return the application-wide ServiceContainer (lazy-created). */
export function getServices(): ServiceContainer {
  if (!_instance) {
    _instance = new ServiceContainer();
  }
  return _instance;
}

/**
 * Replace the singleton — primarily for testing.
 * Call early (before any component renders) to ensure all consumers
 * pick up the replacement.
 */
export function setServices(container: ServiceContainer): void {
  _instance = container;
}
