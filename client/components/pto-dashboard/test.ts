import { querySingle } from '../test-utils.js';
import { PtoAccrualCard, PtoBereavementCard, PtoSickCard, PtoSummaryCard } from './index.js';

// Extracted model from seed.js
const seedEmployees = [
    {
        id: 1,
        name: "John Doe",
        identifier: "coreyalix@gmail.com",
        pto_rate: 0.71,
        carryover_hours: 40,
        hire_date: new Date("2020-01-15"),
        role: "Employee",
        hash: "test-hash-1"
    }
];

const seedPTOEntries = [
    // Sick time for employee 1
    { id: 1, employee_id: 1, start_date: '2026-02-13', end_date: '2026-02-13', type: 'Sick', hours: 8 },
    { id: 2, employee_id: 1, start_date: '2026-02-15', end_date: '2026-02-15', type: 'Sick', hours: 8 },
    { id: 3, employee_id: 1, start_date: '2026-02-17', end_date: '2026-02-17', type: 'Sick', hours: 8 },
    // PTO for employee 1
    { id: 4, employee_id: 1, start_date: '2026-02-21', end_date: '2026-02-21', type: 'PTO', hours: 8 },
    { id: 5, employee_id: 1, start_date: '2026-02-23', end_date: '2026-02-23', type: 'PTO', hours: 8 },
    { id: 6, employee_id: 1, start_date: '2026-02-25', end_date: '2026-02-25', type: 'PTO', hours: 8 }
];

// Computed values for 2026 (current year Feb 5, 2026)
const employee = seedEmployees[0];
const currentYear = 2026;
const totalWorkDays = 261; // From workDays.ts for 2026
const allocationRate = 96 / totalWorkDays; // ~0.3678

// Monthly work days for 2026
const workDays: Record<number, number> = { 1: 23, 2: 20, 3: 21, 4: 22, 5: 22, 6: 21, 7: 23, 8: 21, 9: 22, 10: 23, 11: 20, 12: 23 };

// Calculate monthly accruals
const monthlyAccruals: { month: number; hours: number }[] = [];
for (let month = 1; month <= 12; month++) {
    const hours = Math.round(allocationRate * workDays[month] * 10) / 10; // Round to 1 decimal
    monthlyAccruals.push({ month, hours });
}

// Calculate monthly usage
const monthlyUsage: { month: number; hours: number }[] = [];
for (let month = 1; month <= 12; month++) {
    const monthEntries = seedPTOEntries.filter(entry => {
        const date = new Date(entry.start_date);
        return date.getMonth() + 1 === month;
    });
    const hours = monthEntries.reduce((sum, entry) => sum + entry.hours, 0);
    monthlyUsage.push({ month, hours });
}

// Build calendar data
const calendarData: Record<number, Record<number, { type: string; hours: number }>> = {};
seedPTOEntries.forEach(entry => {
    const date = new Date(entry.start_date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if (!calendarData[month]) calendarData[month] = {};
    calendarData[month][day] = { type: entry.type, hours: entry.hours };
});

// Calculate PTO summary
const usedPTO = seedPTOEntries.filter(e => e.type === 'PTO').reduce((sum, e) => sum + e.hours, 0);
const usedSick = seedPTOEntries.filter(e => e.type === 'Sick').reduce((sum, e) => sum + e.hours, 0);
const usedBereavement = seedPTOEntries.filter(e => e.type === 'Bereavement').reduce((sum, e) => sum + e.hours, 0);
const usedJury = seedPTOEntries.filter(e => e.type === 'Jury Duty').reduce((sum, e) => sum + e.hours, 0);

const annualAllocation = 96;
const availablePTO = annualAllocation + employee.carryover_hours - usedPTO;

// Sick entries for display
const sickEntries = seedPTOEntries.filter(e => e.type === 'Sick').map(e => ({
    date: e.start_date,
    hours: e.hours
}));

// Bereavement and Jury entries (none in seed)
const bereavementEntries: { date: string; hours: number }[] = [];
const juryEntries: { date: string; hours: number }[] = [];

export function playground(): void {
    console.log('Starting PTO dashboard playground test with seed data...');

    const summary = querySingle<PtoSummaryCard>('pto-summary-card');
    const accrual = querySingle<PtoAccrualCard>('pto-accrual-card');
    const sick = querySingle<PtoSickCard>('pto-sick-card');
    const bereavement = querySingle<PtoBereavementCard>('pto-bereavement-card');
    const jury = querySingle('pto-jury-duty-card') as any;
    const info = querySingle('pto-employee-info-card') as any;

    summary.setAttribute('data', JSON.stringify({
        annualAllocation,
        availablePTO,
        usedPTO,
        carryoverFromPreviousYear: employee.carryover_hours
    }));

    accrual.setAttribute('accruals', JSON.stringify(monthlyAccruals.slice(0, 3))); // First 3 months
    accrual.setAttribute('usage', JSON.stringify(monthlyUsage.slice(0, 3)));
    accrual.setAttribute('calendar', JSON.stringify(calendarData));
    accrual.setAttribute('year', currentYear.toString());

    sick.setAttribute('data', JSON.stringify({ allowed: 24, used: usedSick, remaining: Math.max(0, 24 - usedSick) }));
    sick.setAttribute('entries', JSON.stringify(sickEntries));

    bereavement.setAttribute('data', JSON.stringify({ allowed: 40, used: usedBereavement, remaining: Math.max(0, 40 - usedBereavement) }));
    bereavement.setAttribute('entries', JSON.stringify(bereavementEntries));

    jury.setAttribute('data', JSON.stringify({ allowed: 40, used: usedJury, remaining: Math.max(0, 40 - usedJury) }));
    jury.setAttribute('entries', JSON.stringify(juryEntries));

    info.setAttribute('data', JSON.stringify({
        hireDate: employee.hire_date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
        nextRolloverDate: new Date(currentYear + 1, 0, 1).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    }));

    console.log('PTO dashboard playground test initialized with seed data');
}
