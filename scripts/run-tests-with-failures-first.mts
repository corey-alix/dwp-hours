#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if there are any previously failed tests
try {
    console.log('🔍 Checking for previously failed tests...');
    execSync('npx playwright test --last-failed --dry-run', {
        cwd: path.join(__dirname, '..'),
        stdio: 'pipe'
    });

    console.log('📋 Found previously failed tests, running them first...');
    // Run failed tests first
    execSync('npx playwright test --last-failed', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
    });

    console.log('✅ Failed tests completed. Now running remaining tests...');
} catch (error) {
    console.log('ℹ️  No previously failed tests found.');
}

// Run all tests (this will include any that weren't previously failed)
console.log('🚀 Running all tests...');
execSync('npm run playwright:test', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
});

console.log('✨ Test run complete!');