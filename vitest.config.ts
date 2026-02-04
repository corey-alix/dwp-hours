import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        exclude: ['e2e/**', 'node_modules/**'],
        environment: 'node',
        globals: false,
    },
    esbuild: {
        target: 'node18',
    },
});