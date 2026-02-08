import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        exclude: ['e2e/**', 'node_modules/**'],
        environment: 'node',
        globals: false,
        bail: 1
    },
    esbuild: {
        target: 'node18',
    },
});