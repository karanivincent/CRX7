import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// Using Vercel adapter for faster and more robust deployments
		// See https://kit.svelte.dev/docs/adapter-vercel for more information
		adapter: adapter({
			runtime: 'nodejs20.x'
		})
	}
};

export default config;
