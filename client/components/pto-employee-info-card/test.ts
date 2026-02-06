import { querySingle } from '../test-utils.js';
import type { PtoEmployeeInfoCard } from './index.js';

export function playground() {
    console.log('Starting PTO Employee Info Card test...');

    const card = querySingle<PtoEmployeeInfoCard>('pto-employee-info-card');

    // Sample info data
    card.info = {
        hireDate: '2020-01-15',
        nextRolloverDate: '2025-01-01'
    };

    querySingle('#test-output').textContent = 'Employee info data set.';
}