import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
    base: '/',
    plugins: [react(), tailwindcss()],
    server: {
        host: '0.0.0.0',
        port: 5180,
        strictPort: true
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        },
        preserveSymlinks: true
    }
});
