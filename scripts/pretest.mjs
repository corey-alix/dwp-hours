import { execSync } from 'child_process';

export default async function globalSetup() {
    console.log('Running pretest: lint and build...');

    try {
        execSync('pnpm run lint', { stdio: 'inherit' });
        console.log('Lint passed.');
        execSync('pnpm run build', { stdio: 'inherit' });
        console.log('Build passed.');
    } catch (error) {
        console.error('Pretest failed:', error.message);
        process.exit(1);
    }
}