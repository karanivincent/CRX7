<script lang="ts">
	import MfaSetup from '$lib/components/auth/mfa-setup.svelte';
	
	export let data;
	export let form;
</script>

<svelte:head>
	<title>Setup Two-Factor Authentication - CRx7</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<MfaSetup supabase={data.supabase} {form} />
</div>