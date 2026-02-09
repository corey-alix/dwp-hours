import { querySingle } from '../test-utils.js';
import { PtoAccrualCard } from './index.js';
import { parseDate, today } from '../../../shared/dateUtils.js';

// API response data
const ptoStatus = {
    "employeeId": 1,
    "hireDate": "2020-01-14",
    "annualAllocation": 96,
    "availablePTO": 96,
    "usedPTO": 40,
    "carryoverFromPreviousYear": 40,
    "monthlyAccruals": [
        {
            "month": 1,
            "hours": 8.091954022988507
        },
        {
            "month": 2,
            "hours": 7.35632183908046
        },
        {
            "month": 3,
            "hours": 8.091954022988507
        },
        {
            "month": 4,
            "hours": 8.091954022988507
        },
        {
            "month": 5,
            "hours": 7.724137931034482
        },
        {
            "month": 6,
            "hours": 8.091954022988507
        },
        {
            "month": 7,
            "hours": 8.459770114942529
        },
        {
            "month": 8,
            "hours": 7.724137931034482
        },
        {
            "month": 9,
            "hours": 8.091954022988507
        },
        {
            "month": 10,
            "hours": 8.091954022988507
        },
        {
            "month": 11,
            "hours": 7.724137931034482
        },
        {
            "month": 12,
            "hours": 8.459770114942529
        }
    ],
    "nextRolloverDate": "2027-01-01",
    "sickTime": {
        "allowed": 24,
        "used": 24,
        "remaining": 0
    },
    "ptoTime": {
        "allowed": 136,
        "used": 40,
        "remaining": 96
    },
    "bereavementTime": {
        "allowed": 40,
        "used": 24,
        "remaining": 16
    },
    "juryDutyTime": {
        "allowed": 40,
        "used": 80,
        "remaining": -40
    }
};

const ptoEntries = [
    {
        "date": "2026-03-02",
        "type": "PTO",
        "hours": 4
    },
    {
        "date": "2026-03-03",
        "type": "PTO",
        "hours": 4
    },
    {
        "date": "2026-03-04",
        "type": "PTO",
        "hours": 4
    },
    {
        "date": "2026-03-05",
        "type": "PTO",
        "hours": 4
    },
    {
        "date": "2026-02-24",
        "type": "PTO",
        "hours": 8
    },
    {
        "date": "2026-02-22",
        "type": "PTO",
        "hours": 8
    },
    {
        "date": "2026-02-20",
        "type": "PTO",
        "hours": 8
    },
    {
        "date": "2026-02-16",
        "type": "Sick",
        "hours": 8
    },
    {
        "date": "2026-02-14",
        "type": "Sick",
        "hours": 8
    },
    {
        "date": "2026-02-12",
        "type": "Sick",
        "hours": 8
    },
    // Bereavement time: January 21-23
    {
        "date": "2026-01-21",
        "type": "Bereavement",
        "hours": 8
    },
    {
        "date": "2026-01-22",
        "type": "Bereavement",
        "hours": 8
    },
    {
        "date": "2026-01-23",
        "type": "Bereavement",
        "hours": 8
    },
    // Jury duty: July 20-31
    {
        "date": "2026-07-20",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-21",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-22",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-23",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-24",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-27",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-28",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-29",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-30",
        "type": "Jury Duty",
        "hours": 8
    },
    {
        "date": "2026-07-31",
        "type": "Jury Duty",
        "hours": 8
    }
];

export function playground() {
    console.log('Starting PTO Accrual Card test...');

    // Wait for component to be defined and ready
    customElements.whenDefined('pto-accrual-card').then(() => {
        console.log('pto-accrual-card component defined, waiting for element...');

        const waitForComponent = () => {
            const card = document.querySelector('pto-accrual-card') as PtoAccrualCard;
            if (card && card.shadowRoot) {
                console.log('PTO Accrual Card component found and ready, initializing...');

                // Process ptoEntries to get monthlyUsage
                const monthlyUsageMap: Record<string, number> = {};
                ptoEntries.forEach(entry => {
                    const month = parseDate(entry.date).month;
                    const monthStr = month.toString();
                    if (!monthlyUsageMap[monthStr]) monthlyUsageMap[monthStr] = 0;
                    monthlyUsageMap[monthStr] += entry.hours;
                });
                const monthlyUsage = Object.keys(monthlyUsageMap).map(month => ({
                    month: parseInt(month),
                    hours: monthlyUsageMap[month]
                }));

                // Set data
                // Convert simplified PTO entries to full PTOEntry format for the component
                const fullPtoEntries = ptoEntries.map((entry, index) => ({
                    id: index + 1,
                    employeeId: 1,
                    date: entry.date,
                    type: entry.type as "PTO" | "Sick" | "Bereavement" | "Jury Duty",
                    hours: entry.hours,
                    createdAt: today()
                }));

                card.ptoEntries = fullPtoEntries;
                card.monthlyAccruals = ptoStatus.monthlyAccruals;
                card.monthlyUsage = monthlyUsage;
                card.calendarYear = 2026;

                querySingle('#test-output').textContent = 'Accrual data set. Click calendar buttons to view details.';
            } else {
                console.log('PTO Accrual Card component not ready yet, retrying...');
                setTimeout(waitForComponent, 100);
            }
        };

        waitForComponent();
    }).catch(error => {
        console.error('Error waiting for pto-accrual-card component:', error);
    });
}