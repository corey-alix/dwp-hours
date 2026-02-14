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

export interface EmployeesResponse extends Array<{
  id: number;
  name: string;
  identifier: string;
  role: string;
  hire_date: string;
}> {}

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

export interface GenericMessageResponse {
  message: string;
}

export interface ErrorResponse {
  error: string;
  details?: any[];
}
