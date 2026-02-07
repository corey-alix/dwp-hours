import { querySingle } from '../test-utils.js';
import { addEventListener } from '../test-utils.js';
import { AdminPanel } from './index.js';
export function playground() {
    console.log('Starting Admin Panel playground test...');

    const adminPanel = querySingle<AdminPanel>('admin-panel');
    const testOutput = querySingle<HTMLElement>('#test-output');

    const setOutput = (message: string) => {
        testOutput.textContent = message;
    };

    const attachChildListeners = () => {
        const shadowRoot = adminPanel.shadowRoot;
        if (!shadowRoot) {
            return;
        }

        const employeeList = shadowRoot.querySelector('employee-list');
        if (employeeList instanceof HTMLElement) {
            addEventListener(employeeList, 'add-employee', () => {
                setOutput('Add Employee clicked');
            });

            addEventListener(employeeList, 'employee-edit', (e: CustomEvent) => {
                setOutput(`Edit Employee: ${e.detail?.employeeId ?? 'unknown'}`);
            });

            addEventListener(employeeList, 'employee-delete', (e: CustomEvent) => {
                setOutput(`Delete Employee: ${e.detail?.employeeId ?? 'unknown'}`);
            });

            addEventListener(employeeList, 'employee-acknowledge', (e: CustomEvent) => {
                setOutput(`Acknowledge Employee: ${e.detail?.employeeId ?? 'unknown'}`);
            });
        }

        const requestQueue = shadowRoot.querySelector('pto-request-queue');
        if (requestQueue instanceof HTMLElement) {
            addEventListener(requestQueue, 'request-approve', (e: CustomEvent) => {
                setOutput(`Approve Request: ${e.detail?.requestId ?? 'unknown'}`);
            });

            addEventListener(requestQueue, 'request-reject', (e: CustomEvent) => {
                setOutput(`Reject Request: ${e.detail?.requestId ?? 'unknown'}`);
            });
        }

        const reportGenerator = shadowRoot.querySelector('report-generator');
        if (reportGenerator instanceof HTMLElement) {
            addEventListener(reportGenerator, 'generate-report', (e: CustomEvent) => {
                const reportType = e.detail?.reportType ?? 'unknown';
                setOutput(`Generate Report: ${reportType}`);
            });

            addEventListener(reportGenerator, 'report-exported', (e: CustomEvent) => {
                setOutput(`Report Exported: ${e.detail?.filename ?? 'csv'}`);
            });

            addEventListener(reportGenerator, 'report-type-change', (e: CustomEvent) => {
                setOutput(`Report Type: ${e.detail?.reportType ?? 'unknown'}`);
            });

            addEventListener(reportGenerator, 'date-range-change', (e: CustomEvent) => {
                const range = e.detail?.dateRange;
                if (range?.start && range?.end) {
                    setOutput(`Date Range: ${range.start} to ${range.end}`);
                }
            });
        }
    };

    // Test view changes
    addEventListener(adminPanel, 'view-change', (e: CustomEvent) => {
        console.log('View changed to:', e.detail.view);
        setOutput(`Current view: ${e.detail.view}`);
        attachChildListeners();
    });

    attachChildListeners();

    // Test programmatic view changes
    setTimeout(() => {
        console.log('Testing programmatic view change to PTO requests...');
        adminPanel.currentView = 'pto-requests';
    }, 2000);

    setTimeout(() => {
        console.log('Testing programmatic view change to reports...');
        adminPanel.currentView = 'reports';
    }, 4000);

    setTimeout(() => {
        console.log('Testing programmatic view change back to employees...');
        adminPanel.currentView = 'employees';
    }, 6000);

    console.log('Admin Panel playground test initialized');
}