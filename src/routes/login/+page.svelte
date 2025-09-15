<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	
	export let form: ActionData;
	
	let loading = false;
</script>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-white">
	<Card class="w-full max-w-md">
		<CardHeader class="space-y-1">
			<CardTitle class="text-2xl font-bold">CRx7 Admin</CardTitle>
			<CardDescription>Enter your credentials to access the admin panel</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/login" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}} class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						placeholder="admin@example.com"
						class="h-11"
					/>
				</div>
				
				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						placeholder="••••••••"
						class="h-11"
					/>
				</div>
				
				{#if form?.error}
					<div class="rounded-md border border-destructive/20 bg-destructive/10 p-3">
						<p class="text-sm text-destructive">{form.error}</p>
					</div>
				{/if}
				
				<Button
					type="submit"
					disabled={loading}
					class="w-full h-11"
				>
					{loading ? 'Signing in...' : 'Sign in'}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>