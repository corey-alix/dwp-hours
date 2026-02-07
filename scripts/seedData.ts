export type SeedPtoEntry = {
    employee_id: number;
    date: string;
    type: "Sick" | "PTO" | "Bereavement" | "Jury Duty";
    hours: number;
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
    { employee_id: 1, date: "2026-02-13", type: "Sick", hours: 8 },
    { employee_id: 1, date: "2026-02-15", type: "Sick", hours: 8 },
    { employee_id: 1, date: "2026-02-17", type: "Sick", hours: 8 },
    { employee_id: 1, date: "2026-02-21", type: "PTO", hours: 8 },
    { employee_id: 1, date: "2026-02-23", type: "PTO", hours: 8 },
    { employee_id: 1, date: "2026-02-25", type: "PTO", hours: 8 },
    { employee_id: 2, date: "2026-01-15", type: "PTO", hours: 8 },
    { employee_id: 2, date: "2026-01-17", type: "PTO", hours: 8 },
    { employee_id: 3, date: "2026-01-10", type: "PTO", hours: 8 }
];

export const seedEmployees: SeedEmployee[] = [
    {
        name: "John Doe",
        identifier: "john.doe@gmail.com",
        pto_rate: 0.71,
        carryover_hours: 40,
        hire_date: "2020-01-15",
        role: "Employee",
        hash: "test-hash-1"
    },
    {
        name: "Jane Smith",
        identifier: "jane.smith@example.com",
        pto_rate: 0.71,
        carryover_hours: 25,
        hire_date: "2021-06-01",
        role: "Employee",
        hash: "test-hash-2"
    },
    {
        name: "Admin User",
        identifier: "admin@example.com",
        pto_rate: 0.71,
        carryover_hours: 0,
        hire_date: "2019-03-10",
        role: "Admin",
        hash: "admin-hash"
    }
];
