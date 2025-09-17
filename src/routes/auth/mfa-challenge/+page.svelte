<script lang="ts">
	import MfaChallenge from '$lib/components/auth/mfa-challenge.svelte';
	
	export let form;
</script>

<svelte:head>
	<title>Two-Factor Authentication - CRx7</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<MfaChallenge {form} />
</div>