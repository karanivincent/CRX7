<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';

	export let title: string;
	export let value: string;
	export let icon: string;
	export let color: 'orange' | 'green' | 'blue' | 'purple' = 'orange';
	export let trend: 'up' | 'down' | 'neutral' = 'neutral';
	export let trendValue: string = '';
	export let loading: boolean = false;

	const colorClasses = {
		orange: {
			border: 'border-orange-200',
			bg: 'bg-gradient-to-r from-orange-50 to-white',
			text: 'text-orange-600',
			icon: 'text-orange-500'
		},
		green: {
			border: 'border-green-200',
			bg: 'bg-gradient-to-r from-green-50 to-white',
			text: 'text-green-600',
			icon: 'text-green-500'
		},
		blue: {
			border: 'border-blue-200',
			bg: 'bg-gradient-to-r from-blue-50 to-white',
			text: 'text-blue-600',
			icon: 'text-blue-500'
		},
		purple: {
			border: 'border-purple-200',
			bg: 'bg-gradient-to-r from-purple-50 to-white',
			text: 'text-purple-600',
			icon: 'text-purple-500'
		}
	};

	const trendIcons = {
		up: { icon: 'mdi:trending-up', class: 'text-green-500' },
		down: { icon: 'mdi:trending-down', class: 'text-red-500' },
		neutral: { icon: 'mdi:minus', class: 'text-gray-400' }
	};

	$: classes = colorClasses[color];
	$: trendIcon = trendIcons[trend];
</script>

<Card class="border-2 {classes.border} {classes.bg} hover:shadow-md transition-shadow">
	<CardContent class="p-6">
		<div class="flex items-center justify-between">
			<div>
				<div class="flex items-center gap-3 mb-2">
					<Icon {icon} class="h-6 w-6 {classes.icon}" />
					<span class="text-sm font-medium text-gray-700">{title}</span>
				</div>
				
				{#if loading}
					<div class="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
				{:else}
					<div class="text-2xl font-bold {classes.text} mb-2">{value}</div>
				{/if}

				{#if trendValue && !loading}
					<div class="flex items-center gap-1 text-xs">
						<Icon icon={trendIcon.icon} class="h-3 w-3 {trendIcon.class}" />
						<span class="{trendIcon.class} font-medium">{trendValue}</span>
					</div>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>