import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting Report Generator playground test...');

    const reportGenerator = querySingle('report-generator') as any;

    // Sample report data
    const sampleReportData = [
        {
            employeeId: 1,
            employeeName: 'John Doe',
            totalPTOHours: 80,
            usedPTOHours: 32,
            remainingPTOHours: 48,
            carryoverHours: 16
        },
        {
            employeeId: 2,
            employeeName: 'Jane Smith',
            totalPTOHours: 80,
            usedPTOHours: 56,
            remainingPTOHours: 24,
            carryoverHours: 8
        },
        {
            employeeId: 3,
            employeeName: 'Bob Johnson',
            totalPTOHours: 80,
            usedPTOHours: 16,
            remainingPTOHours: 64,
            carryoverHours: 24
        },
        {
            employeeId: 4,
            employeeName: 'Alice Wilson',
            totalPTOHours: 80,
            usedPTOHours: 72,
            remainingPTOHours: 8,
            carryoverHours: 4
        }
    ];

    // Set initial data
    reportGenerator.reportData = sampleReportData;
    reportGenerator.reportType = 'summary';

    // Test event listeners
    reportGenerator.addEventListener('report-type-change', (e: CustomEvent) => {
        console.log('Report type changed:', e.detail);
        querySingle('#test-output').textContent = `Report type changed to ${e.detail.reportType}`;
    });

    reportGenerator.addEventListener('date-range-change', (e: CustomEvent) => {
        console.log('Date range changed:', e.detail);
        querySingle('#test-output').textContent = `Date range: ${e.detail.dateRange.start} to ${e.detail.dateRange.end}`;
    });

    reportGenerator.addEventListener('generate-report', (e: CustomEvent) => {
        console.log('Generate report requested:', e.detail);
        querySingle('#test-output').textContent = `Generating ${e.detail.reportType} report`;
    });

    reportGenerator.addEventListener('report-exported', (e: CustomEvent) => {
        console.log('Report exported:', e.detail);
        querySingle('#test-output').textContent = `Report exported as ${e.detail.format}`;
    });

    console.log('Report Generator playground test initialized');
}