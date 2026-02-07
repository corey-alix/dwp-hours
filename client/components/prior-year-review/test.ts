import { querySingle } from '../test-utils.js';
import { PriorYearReview } from './index.js';
import type { PTOYearReviewResponse } from '../../api-types.js';

// Mock data for 2025 based on seed data
const mock2025Data: PTOYearReviewResponse = {
    year: 2025,
    months: [
        {
            month: 1,
            ptoEntries: [
                { date: "2025-01-15", type: "PTO", hours: 8 },
                { date: "2025-01-17", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 2, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 2,
            ptoEntries: [
                { date: "2025-02-12", type: "Sick", hours: 8 },
                { date: "2025-02-14", type: "Sick", hours: 8 }
            ],
            summary: { totalDays: 28, ptoDays: 0, sickDays: 2, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 3,
            ptoEntries: [
                { date: "2025-03-05", type: "PTO", hours: 8 },
                { date: "2025-03-07", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 2, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 4,
            ptoEntries: [
                { date: "2025-04-02", type: "Bereavement", hours: 8 }
            ],
            summary: { totalDays: 30, ptoDays: 0, sickDays: 0, bereavementDays: 1, juryDutyDays: 0 }
        },
        {
            month: 5,
            ptoEntries: [
                { date: "2025-05-21", type: "PTO", hours: 8 },
                { date: "2025-05-23", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 2, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 6,
            ptoEntries: [
                { date: "2025-06-11", type: "PTO", hours: 4 }
            ],
            summary: { totalDays: 30, ptoDays: 1, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 7,
            ptoEntries: [
                { date: "2025-07-04", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 1, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 8,
            ptoEntries: [
                { date: "2025-08-15", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 1, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 9,
            ptoEntries: [
                { date: "2025-09-03", type: "Sick", hours: 8 }
            ],
            summary: { totalDays: 30, ptoDays: 0, sickDays: 1, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 10,
            ptoEntries: [
                { date: "2025-10-09", type: "PTO", hours: 8 },
                { date: "2025-10-11", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 2, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 11,
            ptoEntries: [
                { date: "2025-11-26", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 30, ptoDays: 1, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        },
        {
            month: 12,
            ptoEntries: [
                { date: "2025-12-24", type: "PTO", hours: 8 },
                { date: "2025-12-26", type: "PTO", hours: 8 }
            ],
            summary: { totalDays: 31, ptoDays: 2, sickDays: 0, bereavementDays: 0, juryDutyDays: 0 }
        }
    ]
};

// Mock data map - only include years with data
const mockDataMap: Record<number, PTOYearReviewResponse> = {
    2025: mock2025Data
};

export function playground() {
    console.log('Starting prior year review playground test...');

    const component = querySingle<PriorYearReview>('prior-year-review');
    const output = querySingle('#test-output');

    // Create year selector externally
    const yearSelectorContainer = document.createElement('div');
    yearSelectorContainer.style.marginBottom = '16px';
    yearSelectorContainer.innerHTML = `
        <label for="external-year-select" style="font-weight: 600;">Select Year:</label>
        <select id="external-year-select" style="margin-left: 8px; padding: 4px 8px;">
            ${Object.keys(mockDataMap).map(year => `<option value="${year}">${year}</option>`).join('')}
        </select>
    `;

    // Insert before the component
    component.parentNode?.insertBefore(yearSelectorContainer, component);

    // Function to update component data
    const updateComponent = (year: number) => {
        const data = mockDataMap[year];
        component.data = data || null;
        output.textContent = data ? `Loaded data for ${year}` : `No data available for ${year}`;
    };

    // Initial load
    const initialYear = 2025;
    updateComponent(initialYear);
    (document.getElementById('external-year-select') as HTMLSelectElement).value = initialYear.toString();

    // Handle year change
    document.getElementById('external-year-select')?.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const year = parseInt(target.value, 10);
        updateComponent(year);
    });

    console.log('Prior Year Review playground test initialized with external year selector');
}