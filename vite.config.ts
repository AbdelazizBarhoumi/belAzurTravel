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
        setupFiles: ['resources/js/test/setup.ts'],
    },
    server: {
        watch: {
            usePolling: true,
            interval: 100,
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
