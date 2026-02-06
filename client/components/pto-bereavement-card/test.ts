import { querySingle } from '../test-utils.js';
import { PtoBereavementCard } from './index.js';

export function playground() {
    console.log('Starting PTO Bereavement Card test...');

    const card = querySingle<PtoBereavementCard>('pto-bereavement-card');

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