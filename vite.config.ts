import { defineConfig } from "vitest/config";
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
    plugins: [sveltekit()],
    build: {
        // Copy the map style file to the build output
        rollupOptions: {
            input: {
                'map.json': 'static/map.json'
            }
        }
    },
    test: {
        include: ['src/**/*.{test,spec}.{js,ts}']
    },
    base: process.env.NODE_ENV === 'production' ? '/create-real-estate-event/' : '/'
});
