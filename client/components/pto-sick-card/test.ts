import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Sick Card test...');

    const card = querySingle('pto-sick-card') as any;

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