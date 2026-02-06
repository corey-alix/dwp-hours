import { querySingle } from '../test-utils.js';
import { PtoJuryDutyCard } from './index.js';

export function playground() {
    console.log('Starting PTO Jury Duty Card test...');

    const card = querySingle('pto-jury-duty-card') as PtoJuryDutyCard;

    // Sample bucket data
    card.bucket = {
        allowed: 40,
        used: 16,
        remaining: 24
    };

    // Sample usage entries
    card.usageEntries = [
        { date: '2024-02-05', hours: 8 },
        { date: '2024-02-06', hours: 8 }
    ];

    querySingle('#test-output').textContent = 'Jury duty data set.';
}