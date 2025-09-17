<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { onMount } from 'svelte';

	export let supabase: any;
	export let form: any;

	let qrCode = '';
	let secret = '';
	let loading = false;
	let factorId = '';

	// Enroll MFA
	async function enrollMFA() {
		loading = true;
		try {
			const { data, error } = await supabase.auth.mfa.enroll({
				factorType: 'totp'
			});

			if (error) {
				console.error('Error enrolling MFA:', error);
				return;
			}

			if (data) {
				factorId = data.id;
				qrCode = data.totp.qr_code;
				secret = data.totp.secret;
			}
		} catch (err) {
			console.error('Error:', err);
		} finally {
			loading = false;
		}
	}

	// Verify and enable MFA
	async function verifyMFA(code: string) {
		loading = true;
		try {
			const { data, error } = await supabase.auth.mfa.verify({
				factorId,
				challengeId: '', // Will be provided by challenge
				code
			});

			if (error) {
				console.error('Error verifying MFA:', error);
				return false;
			}

			return true;
		} catch (err) {
			console.error('Error:', err);
			return false;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		enrollMFA();
	});
</script>

<Card.Root class="mx-auto max-w-md">
	<Card.Header>
		<Card.Title>Setup Two-Factor Authentication</Card.Title>
		<Card.Description>
			Secure your account with an authenticator app
		</Card.Description>
	</Card.Header>
	<Card.Content class="space-y-4">
		{#if loading}
			<div class="text-center">Setting up 2FA...</div>
		{:else if qrCode}
			<div class="space-y-4">
				<div class="text-sm">
					<p class="mb-2">1. Scan this QR code with your authenticator app:</p>
					<div class="flex justify-center">
						<img src={qrCode} alt="QR Code for 2FA setup" class="border" />
					</div>
				</div>
				
				<div class="text-sm">
					<p class="mb-2">2. Or manually enter this secret:</p>
					<code class="bg-gray-100 p-2 rounded text-xs break-all">{secret}</code>
				</div>

				<form method="POST" action="?/verify-mfa" use:enhance>
					<input type="hidden" name="factorId" value={factorId} />
					<div class="space-y-2">
						<Label for="code">3. Enter the code from your authenticator app:</Label>
						<Input
							id="code"
							name="code"
							type="text"
							placeholder="123456"
							maxlength="6"
							required
						/>
					</div>
					<Button type="submit" class="w-full mt-4" disabled={loading}>
						Verify & Enable 2FA
					</Button>
				</form>
			</div>
		{/if}

		{#if form?.errors?.form}
			<div class="text-red-600 text-sm">
				{#each form.errors.form as error}
					<p>{error}</p>
				{/each}
			</div>
		{/if}
	</Card.Content>
</Card.Root>