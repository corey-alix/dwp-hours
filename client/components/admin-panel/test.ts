import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting Admin Panel playground test...');

    const adminPanel = querySingle('admin-panel') as any;

    // Test view changes
    adminPanel.addEventListener('view-change', (e: CustomEvent) => {
        console.log('View changed to:', e.detail.view);
        querySingle('#test-output').textContent = `Current view: ${e.detail.view}`;
    });

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