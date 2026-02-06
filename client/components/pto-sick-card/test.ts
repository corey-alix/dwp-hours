import { querySingle } from '../test-utils.js';
import { PtoSickCard } from './index.js';

export function playground() {
    console.log('Starting PTO Sick Card test...');

    const card = querySingle<PtoSickCard>('pto-sick-card');

    // Sample bucket data
    card.bucket = {
        allowed: 80,
        used: 24,
        remaining: 56
    };

    // Sample usage entries
    card.usageEntries = [
        { date: '2024-01-15', hours: 8 },
        { date: '2024-03-10', hours: 8 },
        { date: '2024-05-22', hours: 8 }
    ];

    querySingle('#test-output').textContent = 'Sick time data set.';
}