import { defineConfig } from 'vite';
import { fresh } from '@fresh/plugin-vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    envDir: '.',
    resolve: {
        alias: {
            $fonts: '/static/fonts',
        },
    },
    plugins: [
        fresh(),
        tailwindcss(),
    ],
});
