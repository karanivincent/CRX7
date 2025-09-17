<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Logo from '$lib/components/ui/logo.svelte';
	import { page } from '$app/stores';
	import { browser } from '$app/environment';
	import { getTokenDisplay } from '$lib/config/client';
	import { onMount } from 'svelte';
	
	// Dynamically import Icon to avoid SSR issues
	let Icon: any;
	onMount(async () => {
		const iconifyModule = await import('@iconify/svelte');
		Icon = iconifyModule.default;
	});

	const tokenDisplay = getTokenDisplay();

	const menuItems = [
		{
			id: 'overview',
			label: 'Overview',
			icon: 'mdi:view-dashboard',
			href: '/admin',
			description: 'Dashboard & vault status'
		},
		{
			id: 'draw',
			label: 'Draw Management',
			icon: 'mdi:dice-6',
			href: '/admin/draw',
			description: 'Start rounds & spin wheel'
		},
		{
			id: 'distribution',
			label: 'Distribution',
			icon: 'mdi:cash-multiple',
			href: '/admin/distribution',
			description: 'Manage SOL payouts'
		},
		{
			id: 'schedule',
			label: 'Schedule',
			icon: 'mdi:calendar-clock',
			href: '/admin/schedule',
			description: 'Set draw times'
		},
		{
			id: 'history',
			label: 'History',
			icon: 'mdi:history',
			href: '/admin/history',
			description: 'Past rounds & winners'
		},
		{
			id: 'configuration',
			label: 'Configuration',
			icon: 'mdi:cog',
			href: '/admin/configuration',
			description: 'Wallets & parameters'
		}
	];

	// Only access $page in browser to avoid SSR issues
	$: currentPath = browser ? $page.url.pathname : '';
</script>

<div class="w-64 h-screen bg-white border-r border-orange-200 flex flex-col hidden lg:flex">
	<!-- Header -->
	<div class="p-6 border-b border-orange-100">
		<div class="flex items-center gap-3">
			<Logo size="md" showText={false} className="flex-shrink-0" />
			<div>
				<h1 class="font-bold text-gray-900">{tokenDisplay}</h1>
				<p class="text-sm text-orange-600">Admin Panel</p>
			</div>
		</div>
	</div>

	<!-- Navigation -->
	<nav class="flex-1 p-4 space-y-2">
		{#each menuItems as item}
			<a href={item.href} class="block">
				<div
					class="flex items-center gap-3 p-3 rounded-lg transition-all group hover:bg-orange-50 
						{currentPath === item.href ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'text-gray-700 hover:text-orange-800'}"
				>
					{#if Icon}
						<Icon 
							icon={item.icon} 
							class="w-5 h-5 {currentPath === item.href ? 'text-orange-600' : 'text-gray-500 group-hover:text-orange-600'}" 
						/>
					{:else}
						<div class="w-5 h-5 bg-gray-300 rounded"></div>
					{/if}
					<div class="flex-1">
						<div class="font-medium text-sm">{item.label}</div>
						<div class="text-xs text-gray-500 group-hover:text-orange-600">{item.description}</div>
					</div>
				</div>
			</a>
		{/each}
	</nav>

	<!-- Footer -->
	<div class="p-4 border-t border-orange-100">
		<Button href="/" variant="outline" class="w-full mb-2">
			{#if Icon}
				<Icon icon="mdi:home" class="w-4 h-4 mr-2" />
			{:else}
				<div class="w-4 h-4 bg-gray-300 rounded mr-2"></div>
			{/if}
			Back to Home
		</Button>
		<Button href="/auth/logout" variant="ghost" class="w-full text-gray-600 hover:text-red-600">
			{#if Icon}
				<Icon icon="mdi:logout" class="w-4 h-4 mr-2" />
			{:else}
				<div class="w-4 h-4 bg-gray-300 rounded mr-2"></div>
			{/if}
			Logout
		</Button>
	</div>
</div>