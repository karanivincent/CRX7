<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	export let form;
	
	let isSignup = false;
</script>

<Card.Root class="mx-auto max-w-md">
	<Card.Header>
		<Card.Title class="text-3xl font-thin">{isSignup ? 'Sign Up' : 'Login'}</Card.Title>
		<Card.Description>
			{isSignup ? 'Create a new account' : 'Enter your credentials to login'}
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if form?.message}
			<div class="text-green-600 text-sm">{form.message}</div>
		{/if}
		
		{#if form?.errors?.form}
			<div class="text-red-600 text-sm">
				{#each form.errors.form as error}
					<p>{error}</p>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/{isSignup ? 'signup' : 'login'}" use:enhance>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="your@email.com"
						value={form?.email ?? ''}
						required
					/>
					{#if form?.errors?.email}
						<p class="text-red-600 text-sm">{form.errors.email[0]}</p>
					{/if}
				</div>

				<div class="space-y-2">
					<Label for="password">Password</Label>
					<Input
						id="password"
						name="password"
						type="password"
						placeholder="Password"
						required
					/>
					{#if form?.errors?.password}
						<p class="text-red-600 text-sm">{form.errors.password[0]}</p>
					{/if}
				</div>

				{#if isSignup}
					<div class="space-y-2">
						<Label for="confirmPassword">Confirm Password</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type="password"
							placeholder="Confirm Password"
							required
						/>
						{#if form?.errors?.confirmPassword}
							<p class="text-red-600 text-sm">{form.errors.confirmPassword[0]}</p>
						{/if}
					</div>
				{/if}

				<Button type="submit" class="w-full">
					{isSignup ? 'Sign Up' : 'Login'}
				</Button>
			</div>
		</form>

		<div class="text-center text-sm">
			<button
				type="button"
				on:click={() => (isSignup = !isSignup)}
				class="text-blue-600 hover:underline"
			>
				{isSignup ? 'Already have an account? Login' : "Don't have an account? Sign up"}
			</button>
		</div>
	</Card.Content>
</Card.Root>
