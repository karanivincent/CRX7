<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	export let title: string;
	export let description: string = '';
	export let user: any;
	export let showActions: boolean = true;

	function getInitials(email: string) {
		return email.split('@')[0].slice(0, 2).toUpperCase();
	}
</script>

<div class="bg-white border-b border-orange-100 px-6 py-4">
	<div class="flex items-center justify-between">
		<!-- Mobile menu button -->
		<div class="lg:hidden">
			<Button variant="ghost" size="sm">
				<Icon icon="mdi:menu" class="w-5 h-5" />
			</Button>
		</div>
		<div>
			<h1 class="text-2xl font-bold text-gray-900">{title}</h1>
			{#if description}
				<p class="text-gray-600 mt-1">{description}</p>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			{#if showActions}
				<Button variant="outline" size="sm">
					<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
					Refresh
				</Button>
				<Button variant="outline" size="sm">
					<Icon icon="mdi:bell" class="w-4 h-4" />
				</Button>
			{/if}

			<!-- User Profile -->
			<div class="flex items-center gap-3 pl-4 border-l border-gray-200">
				<div class="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
					<span class="text-white text-sm font-medium">{getInitials(user?.email || 'A')}</span>
				</div>
				<div class="text-sm">
					<div class="font-medium text-gray-900">Admin</div>
					<div class="text-gray-500">{user?.email || 'admin@lottery.com'}</div>
				</div>
			</div>
		</div>
	</div>
</div>