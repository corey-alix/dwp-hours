export type SeedPtoEntry = {
  employee_id: number;
  date: string;
  type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
  hours: number;
  approved_by?: number | null; // Admin ID who approved, null = pending approval
};

export type SeedEmployee = {
  name: string;
  identifier: string;
  pto_rate: number;
  carryover_hours: number;
  hire_date: string;
  role: "Employee" | "Admin";
  hash: string | null;
};

export const seedPTOEntries: SeedPtoEntry[] = [
  // 2025 data for John Doe (employee_id: 1) - approved by admin
  { employee_id: 1, date: "2025-01-15", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-01-17", type: "PTO", hours: 8, approved_by: 3 },
  {
    employee_id: 1,
    date: "2025-02-12",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2025-02-14",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  { employee_id: 1, date: "2025-03-05", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-03-07", type: "PTO", hours: 8, approved_by: 3 },
  {
    employee_id: 1,
    date: "2025-04-02",
    type: "Bereavement",
    hours: 8,
    approved_by: 3,
  },
  { employee_id: 1, date: "2025-05-21", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-05-23", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-06-11", type: "PTO", hours: 4, approved_by: 3 },
  { employee_id: 1, date: "2025-07-04", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-08-15", type: "PTO", hours: 8, approved_by: 3 },
  {
    employee_id: 1,
    date: "2025-09-03",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  { employee_id: 1, date: "2025-10-10", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-11-26", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-12-24", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2025-12-26", type: "PTO", hours: 8, approved_by: 3 },

  // 2026 data for John Doe (employee_id: 1) - approved by admin
  {
    employee_id: 1,
    date: "2026-02-13",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-02-12",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-02-17",
    type: "Sick",
    hours: 8,
    approved_by: 3,
  },
  { employee_id: 1, date: "2026-02-20", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2026-02-23", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 1, date: "2026-02-25", type: "PTO", hours: 8, approved_by: 3 },
  {
    employee_id: 1,
    date: "2026-06-12",
    type: "Bereavement",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-06-15",
    type: "Jury Duty",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-06-16",
    type: "Jury Duty",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-06-17",
    type: "Jury Duty",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-06-18",
    type: "Jury Duty",
    hours: 8,
    approved_by: 3,
  },
  {
    employee_id: 1,
    date: "2026-06-19",
    type: "Jury Duty",
    hours: 8,
    approved_by: 3,
  },

  // 2026 data for Jane Smith (employee_id: 2) - approved by admin
  { employee_id: 2, date: "2026-01-15", type: "PTO", hours: 8, approved_by: 3 },
  { employee_id: 2, date: "2026-01-16", type: "PTO", hours: 8, approved_by: 3 },

  // 2026 data for Admin User (employee_id: 3) - approved by admin
  { employee_id: 3, date: "2026-01-09", type: "PTO", hours: 8, approved_by: 3 },

  // Pending approval entries (approved_by = null)
  {
    employee_id: 1,
    date: "2026-03-10",
    type: "PTO",
    hours: 8,
    approved_by: null,
  },
  {
    employee_id: 2,
    date: "2026-03-15",
    type: "PTO",
    hours: 16,
    approved_by: null,
  },
  {
    employee_id: 1,
    date: "2026-04-01",
    type: "Sick",
    hours: 8,
    approved_by: null,
  },
  // Large requests requiring approval
  {
    employee_id: 1,
    date: "2026-07-01",
    type: "PTO",
    hours: 80,
    approved_by: null,
  },
  {
    employee_id: 2,
    date: "2026-08-01",
    type: "PTO",
    hours: 80,
    approved_by: null,
  },
  {
    employee_id: 3,
    date: "2026-05-01",
    type: "PTO",
    hours: 40,
    approved_by: null,
  },
];

export const seedEmployees: SeedEmployee[] = [
  {
    name: "John Doe",
    identifier: "john.doe@gmail.com",
    pto_rate: 0.71,
    carryover_hours: 40,
    hire_date: "2020-01-15",
    role: "Employee",
    hash: null,
  },
  {
    name: "Jane Smith",
    identifier: "jane.smith@example.com",
    pto_rate: 0.71,
    carryover_hours: 25,
    hire_date: "2021-06-01",
    role: "Employee",
    hash: null,
  },
  {
    name: "Admin User",
    identifier: "admin@example.com",
    pto_rate: 0.71,
    carryover_hours: 0,
    hire_date: "2019-03-10",
    role: "Admin",
    hash: null,
  },
];
