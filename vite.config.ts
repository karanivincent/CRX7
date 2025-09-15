import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}', 'tests/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./tests/setup.ts'],
		alias: {
			'$lib': new URL('./src/lib', import.meta.url).pathname,
			'$app': new URL('./src/app', import.meta.url).pathname
		}
	},
	server: {
		hmr: {
			overlay: false
		}
	}
});
