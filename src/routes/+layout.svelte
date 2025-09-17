<script>
	import '../app.css';
	import { Button } from '$lib/components/ui/button';
	import Logo from '$lib/components/ui/logo.svelte';
	import { browser } from '$app/environment';
	import { goto, invalidateAll } from '$app/navigation';
	import { injectAnalytics } from '@vercel/analytics/sveltekit';

	export let data;
	
	const { supabase, session, isAdminRoute } = data;
	
	if (browser) {
		// Set up auth state change listener only in browser
		supabase.auth.onAuthStateChange(async (_, newSession) => {
			// Don't redirect to home if already on auth pages
			const currentPath = window.location.pathname;
			const isAuthPage = currentPath.startsWith('/auth/');
			
			if (!newSession && !isAuthPage) {
				// Only redirect to home if not on an auth page
				goto('/');
			}
			if (newSession?.expires_at !== session?.expires_at) {
				invalidateAll();
			}
		});
	}

	// Initialize Vercel Analytics
	injectAnalytics();
</script>


{#if isAdminRoute}
	<!-- Admin routes - minimal layout -->
	<div class="min-h-screen">
		<slot />
	</div>
{:else}
	<!-- Public routes - full layout with nav and footer -->
	<div class="flex min-h-screen flex-col">
		<nav class="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
			<div class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
				<a href="/" class="flex items-center">
					<Logo size="xl" showText={false} />
				</a>

				<div class="flex items-center gap-4">
					<a href="/past-draws" class="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
						📊 Past Draws
					</a>
					<a href="/winners" class="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
						🎉 Winners
					</a>
					<a href="/how-it-works" class="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
						❓ How it works
					</a>
					{#if session !== null}
						<Button href="/auth/logout" variant="ghost" size="sm">Logout</Button>
					{/if}
				</div>
			</div>
		</nav>

		<main class="flex-grow">
			<slot />
		</main>

		<footer class="bg-gray-50 border-t">
			<div class="mx-auto max-w-7xl px-6 py-8">
				<div class="flex items-center justify-center gap-3">
					<Logo size="sm" showText={false} />
					<p class="text-sm text-gray-600">© 2024 CRx7. All rights reserved.</p>
				</div>
			</div>
		</footer>
	</div>
{/if}

<style>
	:global(html),
	:global(body) {
		height: 100%;
		margin: 0;
		padding: 0;
	}
</style>
