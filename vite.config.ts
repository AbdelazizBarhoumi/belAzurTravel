import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/main.tsx'],
            refresh: true,
        }),
        react(),
        wayfinder({
            formVariants: true,
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'resources/js'),
        },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['resources/js/test/setup.ts'],
    },
    server: {
        watch: {
            // On Windows, polling at 100ms can cause frequent rebuilds when tools
            // touch files or the OS reports noisy FS events. Use the default
            // non-polling watcher in dev to avoid spurious full-page reloads.
            usePolling: false,
            // If polling is required in some CI/dev setups, increase the
            // interval to a less aggressive value to avoid reload storms.
            interval: 1000,
        },
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
});
