<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';

	export let form: any;
</script>

<Card.Root class="mx-auto max-w-md">
	<Card.Header>
		<Card.Title>Two-Factor Authentication</Card.Title>
		<Card.Description>
			Enter the code from your authenticator app to continue
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if form?.errors?.form}
			<div class="text-red-600 text-sm">
				{#each form.errors.form as error}
					<p>{error}</p>
				{/each}
			</div>
		{/if}

		<form method="POST" action="?/verify-mfa-login" use:enhance>
			<div class="space-y-4">
				<div class="space-y-2">
					<Label for="code">Authentication Code</Label>
					<Input
						id="code"
						name="code"
						type="text"
						placeholder="123456"
						maxlength="6"
						required
						autofocus
						class="text-center text-lg font-mono"
					/>
					<p class="text-xs text-gray-500">Enter the 6-digit code from your authenticator app</p>
				</div>

				<Button type="submit" class="w-full">
					Verify Code
				</Button>
			</div>
		</form>

		<div class="text-center">
			<a href="/auth/login" class="text-sm text-blue-600 hover:underline">
				← Back to login
			</a>
		</div>
	</Card.Content>
</Card.Root>