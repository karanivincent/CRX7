<script lang="ts">
	import AdminSidebar from './admin-sidebar.svelte';
	import AdminHeader from './admin-header.svelte';

	export let title: string;
	export let description: string = '';
	export let user: any;
	export let showHeader: boolean = true;
	export let showActions: boolean = true;
</script>

<div class="flex h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<!-- Sidebar -->
	<AdminSidebar />
	
	<!-- Main Content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		{#if showHeader}
			<AdminHeader {title} {description} {user} {showActions} />
		{/if}
		
		<!-- Content Area -->
		<main class="flex-1 overflow-y-auto p-6">
			<slot />
		</main>
	</div>
</div>