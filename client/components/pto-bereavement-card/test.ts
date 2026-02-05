import { querySingle } from '../test-utils.js';

export function playground() {
    console.log('Starting PTO Bereavement Card test...');

    const card = querySingle('pto-bereavement-card') as any;

    // Sample bucket data
    card.bucket = {
        allowed: 24,
        used: 0,
        remaining: 24
    };

    // Sample usage entries (empty for test)
    card.usageEntries = [];

    querySingle('#test-output').textContent = 'Bereavement data set (no usage).';
}