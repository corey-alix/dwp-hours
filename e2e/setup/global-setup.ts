import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function globalSetup() {
    console.log('🔄 Running lint and build before E2E tests...');

    try {
        // Run lint
        execSync('pnpm run lint', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });
        console.log('✅ Lint passed');

        // Run build
        execSync('pnpm run build', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });
        console.log('✅ Build complete');

        // Build test assets
        execSync('pnpm run build:test-assets', {
            cwd: path.join(__dirname, '..', '..'),
            stdio: 'inherit'
        });
        console.log('✅ Test assets built');
    } catch (error) {
        console.error('❌ Setup failed:', error);
        throw error;
    }

    // Database seeding is now handled per test via /api/test/seed
}