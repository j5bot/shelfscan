import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        tsconfigPaths: true,
    },
    test: {
        environment: 'jsdom',
        globals: false,
        include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            include: ['src/**/*.ts', 'src/**/*.tsx'],
        },
    },
});
