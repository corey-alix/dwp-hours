import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Employee Info Card test...');

    const card = querySingle('pto-employee-info-card') as any;

    // Sample info data
    card.info = {
        hireDate: '2020-01-15',
        nextRolloverDate: '2025-01-01'
    };

    querySingle('#test-output').textContent = 'Employee info data set.';
}