import { querySingle } from '../test-utils.js';

export function playground(): void {
    console.log('Starting PTO dashboard playground test...');

    const summary = querySingle('pto-summary-card') as any;
    const accrual = querySingle('pto-accrual-card') as any;
    const sick = querySingle('pto-sick-card') as any;
    const bereavement = querySingle('pto-bereavement-card') as any;
    const jury = querySingle('pto-jury-duty-card') as any;
    const info = querySingle('pto-employee-info-card') as any;

    summary.setAttribute('data', JSON.stringify({
        annualAllocation: 96,
        availablePTO: 72.5,
        usedPTO: 23.5,
        carryoverFromPreviousYear: 8
    }));

    accrual.setAttribute('accruals', JSON.stringify([
        { month: 1, hours: 8.4 },
        { month: 2, hours: 7.3 },
        { month: 3, hours: 7.7 }
    ]));
    accrual.setAttribute('calendar', JSON.stringify({
        1: {
            5: { type: 'PTO', hours: 8 },
            12: { type: 'Sick', hours: 4 }
        }
    }));
    accrual.setAttribute('year', new Date().getFullYear().toString());

    sick.setAttribute('data', JSON.stringify({ allowed: 24, used: 4, remaining: 20 }));
    bereavement.setAttribute('data', JSON.stringify({ allowed: 40, used: 0, remaining: 40 }));
    jury.setAttribute('data', JSON.stringify({ allowed: 40, used: 8, remaining: 32 }));

    info.setAttribute('data', JSON.stringify({
        hireDate: '2/13/2023',
        nextRolloverDate: '1/1/2027'
    }));

    console.log('PTO dashboard playground test initialized');
}
