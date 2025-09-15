<script>
	import '../app.css';
	import { goto, invalidate } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/stores';

	const { data: propsData, children } = $props();

	const { supabase, session } = propsData;
	
	// Check if we're on an admin route
	const isAdminRoute = $derived($page.url.pathname.startsWith('/admin'));

	$effect(() => {
		const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
			if (!newSession) {
				/**
				 * Queue this as a task so the navigation won't prevent the
				 * triggering function from completing
				 */
				setTimeout(() => {
					goto('/', { invalidateAll: true });
				});
			}
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => data.subscription.unsubscribe();
	});
</script>


{#if isAdminRoute}
	<!-- Admin routes - minimal layout -->
	<div class="min-h-screen">
		{@render children()}
	</div>
{:else}
	<!-- Public routes - full layout with nav and footer -->
	<div class="flex min-h-screen flex-col">
		<nav class="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
			<div class="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
				<a href="/" class="text-xl font-bold text-gray-900">CRx7</a>

				<div class="flex items-center gap-4">
					<a href="/leaderboard" class="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors">
						🏆 Leaderboard
					</a>
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
						<Button href="/admin" variant="outline" size="sm">Admin</Button>
						<Button href="/auth/logout" variant="ghost" size="sm">Logout</Button>
					{:else}
						<Button href="/auth/login" size="sm">Admin Login</Button>
					{/if}
				</div>
			</div>
		</nav>

		<main class="flex-grow">
			{@render children()}
		</main>

		<footer class="bg-gray-50 border-t">
			<div class="mx-auto max-w-7xl px-6 py-8">
				<div class="flex items-center justify-center">
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
