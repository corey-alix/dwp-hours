import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: ['e2e/**', 'node_modules/**'],
        environment: 'node',
        globals: false,
        bail: 1
    },
    esbuild: {
        target: 'node18',
    },
});