import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Accrual Card test...');

    const card = querySingle('pto-accrual-card') as any;

    // Sample accrual data
    const sampleAccruals = [
        { month: 1, hours: 6.67 },
        { month: 2, hours: 6.67 },
        { month: 3, hours: 6.67 },
        { month: 4, hours: 6.67 },
        { month: 5, hours: 6.67 },
        { month: 6, hours: 6.67 }
    ];

    // Sample usage data
    const sampleUsage = [
        { month: 1, hours: 8 },
        { month: 3, hours: 16 }
    ];

    // Sample calendar data
    const sampleCalendar = {
        1: {
            15: { type: 'pto', hours: 8 }
        },
        3: {
            10: { type: 'pto', hours: 8 },
            11: { type: 'pto', hours: 8 }
        }
    };

    // Set data
    card.monthlyAccruals = sampleAccruals;
    card.monthlyUsage = sampleUsage;
    card.calendar = sampleCalendar;
    card.calendarYear = 2024;

    querySingle('#test-output').textContent = 'Accrual data set. Click calendar buttons to view details.';
}