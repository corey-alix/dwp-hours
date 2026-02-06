import { querySingle } from '../test-utils.js';
import { PtoSummaryCard } from './index.js';
export function playground() {
    console.log('Starting PTO Summary Card playground test...');

    const card = querySingle<PtoSummaryCard>('pto-summary-card');
    // Set initial sample data
    card.summary = {
        annualAllocation: 80,
        availablePTO: 45.5,
        usedPTO: 34.5,
        carryoverFromPreviousYear: 0
    };

    querySingle('#test-output').textContent = 'Initial data set via property';

    // Test attribute-based data setting
    setTimeout(() => {
        card.setAttribute('data', JSON.stringify({
            annualAllocation: 100,
            availablePTO: 60,
            usedPTO: 40,
            carryoverFromPreviousYear: 5
        }));
        querySingle('#test-output').textContent = 'Data updated via attribute';
    }, 2000);
}