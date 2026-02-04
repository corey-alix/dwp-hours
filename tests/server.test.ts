import { describe, it, expect } from 'vitest';
import net from 'net';

describe('Server', () => {
    it('should be reachable on port 3000', async () => {
        const isReachable = await new Promise<boolean>((resolve) => {
            const client = net.createConnection({ port: 3000, host: 'localhost' }, () => {
                client.end();
                resolve(true);
            });
            client.on('error', () => {
                resolve(false);
            });
        });
        expect(isReachable).toBe(true);
    });
});