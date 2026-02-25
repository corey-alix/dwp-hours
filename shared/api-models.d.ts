// client/api-types.d.ts
// Generated API response types for client-side strong typing

// Core entity types (serialized for JSON responses, using camelCase for client)
export interface Employee {
  id: number;
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string; // ISO date string
  role: string;
  hash?: string;
}

// Request payload types (what the client sends to the server)
export interface EmployeeCreateRequest {
  name: string;
  identifier: string;
  ptoRate: number;
  carryoverHours: number;
  hireDate: string;
  role: string;
}

export interface EmployeeUpdateRequest {
  name?: string;
  identifier?: string;
  ptoRate?: number;
  carryoverHours?: number;
  hireDate?: string;
  role?: string;
}

export interface PTOCreateRequest {
  date: string;
  hours: number;
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
}

export interface PTOBulkCreateRequest {
  requests: PTOCreateRequest[];
}

export interface PTOUpdateRequest {
  date?: string;
  hours?: number;
  type?: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  approved_by?: number | null;
}

export interface PTOEntry {
  id: number;
  employeeId: number;
  date: string; // Changed from startDate/endDate
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
  createdAt: string; // ISO date string
  approved_by?: number | null;
  employee?: Employee;
}

export interface MonthlyHours {
  id: number;
  employeeId: number;
  month: string; // ISO date string
  hoursWorked: number;
  submittedAt: string; // ISO date string
  employee?: Employee;
}

export interface Acknowledgement {
  id: number;
  employeeId: number;
  month: string; // ISO date string
  acknowledgedAt: string; // ISO date string
  employee?: Employee;
}

export interface AdminAcknowledgement {
  id: number;
  employeeId: number;
  month: string; // YYYY-MM string
  adminId: number;
  acknowledgedAt: string; // ISO date string
  employee?: Employee;
  admin?: Employee;
}

// API-specific response types
export interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
}

export interface AuthRequestLinkResponse {
  message: string;
  magicLink?: string;
}

export interface AuthValidateResponse {
  authToken: string;
  expiresAt: number;
  employee: {
    id: number;
    name: string;
    role: string;
  };
}

export interface PTOStatusResponse {
  employeeId: number;
  hireDate: string;
  dailyRate: number;
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

export interface HoursResponse {
  employeeId: number;
  hours: MonthlyHours[];
}

export interface HoursSubmitResponse {
  message: string;
  hours: MonthlyHours;
}

export interface AcknowledgementResponse {
  employeeId: number;
  acknowledgements: Acknowledgement[];
}

export interface AcknowledgementSubmitResponse {
  message: string;
  acknowledgement: Acknowledgement;
}

export interface MonthlySummaryResponse {
  employeeId: number;
  month: string;
  hoursWorked: number;
  ptoUsage: {
    PTO: number;
    Sick: number;
    Bereavement: number;
    "Jury Duty": number;
  };
}

export interface AdminAcknowledgementResponse {
  employeeId: number;
  acknowledgements: AdminAcknowledgement[];
}

export interface AdminAcknowledgementSubmitResponse {
  message: string;
  acknowledgement: AdminAcknowledgement;
}

export interface EmployeesResponse extends Array<Employee> {}

export interface EmployeeResponse extends Employee {}

export interface EmployeeCreateResponse {
  message: string;
  employee: Employee;
}

export interface EmployeeUpdateResponse {
  message: string;
  employee: Employee;
}

export interface PTOEntriesResponse extends Array<{
  date: string;
  type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
  hours: number;
}> {}

export interface PTOCreateResponse {
  message: string;
  ptoEntry: PTOEntry;
}

export interface PTOYearReviewResponse {
  year: number;
  months: {
    month: number; // 1-12
    ptoEntries: {
      date: string; // ISO date string
      type: "PTO" | "Sick" | "Bereavement" | "Jury Duty";
      hours: number;
      approved_by?: number | null;
    }[];
    summary: {
      totalDays: number;
      ptoHours: number;
      sickHours: number;
      bereavementHours: number;
      juryDutyHours: number;
    };
  }[];
}

export interface PTOUpdateResponse {
  message: string;
  ptoEntry: PTOEntry;
}

export interface AdminMonthlyReviewResponse extends Array<{
  employeeId: number;
  employeeName: string;
  month: string;
  totalHours: number;
  ptoHours: number;
  sickHours: number;
  bereavementHours: number;
  juryDutyHours: number;
  acknowledgedByAdmin: boolean;
  adminAcknowledgedAt?: string;
  adminAcknowledgedBy?: string;
}> {}

// Individual item type for admin monthly review
export interface AdminMonthlyReviewItem {
  employeeId: number;
  employeeName: string;
  month: string;
  totalHours: number;
  ptoHours: number;
  sickHours: number;
  bereavementHours: number;
  juryDutyHours: number;
  acknowledgedByAdmin: boolean;
  adminAcknowledgedAt?: string;
  adminAcknowledgedBy?: string;
  /** Whether the employee has locked (acknowledged) their calendar for this month. */
  calendarLocked: boolean;
  /** Whether a calendar_lock_reminder notification has been sent for this employee/month. */
  notificationSent: boolean;
  /** ISO timestamp when the employee dismissed/read the notification, or null if unread/none. */
  notificationReadAt: string | null;
}

export interface GenericMessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: any[];
}

// Auth types
export interface AuthRequestLinkResponse {
  message: string;
  magicLink?: string;
}

export interface AuthValidateResponse {
  authToken: string;
  expiresAt: number;
  employee: {
    id: number;
    name: string;
    role: string;
  };
}

export interface AuthValidateSessionResponse {
  valid: boolean;
  employee: {
    id: number;
    name: string;
    role: string;
  };
}

// PTO Balance Summary types
import type { PTOType } from "./businessRules.js";

export interface PtoBalanceCategoryItem {
  category: PTOType; // "PTO" | "Sick" | "Bereavement" | "Jury Duty"
  remaining: number; // positive = available, negative = exceeded
}

export interface PtoBalanceData {
  employeeId: number;
  employeeName: string;
  categories: PtoBalanceCategoryItem[];
}

// Notification types
export type NotificationType = "calendar_lock_reminder" | "system";

export interface NotificationItem {
  id: number;
  employee_id: number;
  type: NotificationType;
  message: string;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
  created_by: number | null;
}

export interface NotificationCreateRequest {
  employeeId: number;
  type: NotificationType;
  message: string;
}

export interface NotificationCreateResponse {
  message: string;
  notification: NotificationItem;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
}

export interface NotificationReadResponse {
  message: string;
  notification: NotificationItem;
}
