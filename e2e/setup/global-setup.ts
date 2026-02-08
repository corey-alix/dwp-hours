import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
    console.log('🔄 Running lint and build before E2E tests...');

    try {
        // Run lint
        execSync('npm run lint', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });
        console.log('✅ Lint passed');

        // Run build
        execSync('npm run build', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });
        console.log('✅ Build complete');
    } catch (error) {
        console.error('❌ Lint or build failed:', error);
        throw error;
    }

    // Database seeding is now handled per test via /api/test/seed
}