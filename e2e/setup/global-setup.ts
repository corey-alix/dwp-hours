import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
    console.log('🔄 Resetting database for E2E tests...');

    try {
        // Run the seed script and reload to reset database to clean state
        execSync('npm run playwright:seed', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });

        console.log('✅ Database reset complete');
    } catch (error) {
        console.error('❌ Failed to reset database:', error);
        throw error;
    }
}