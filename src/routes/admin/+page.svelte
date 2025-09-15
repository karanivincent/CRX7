<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import StatsCard from '$lib/components/ui/stats-card.svelte';
	
	export let data;
	const { user } = data;
	
	// Cache config values
	const tokenDisplay = getTokenDisplay();
	
	// Vault and draw-specific data - will be replaced with real API data later
	let vaultData = {
		unclaimedBalance: { value: '127.5 SOL', loading: false, trend: 'up', trendValue: '+23.1 SOL' },
		lastDistribution: { value: '89.3 SOL', loading: false, trend: 'neutral', trendValue: '3 days ago' },
		pendingRounds: { value: '0', loading: false, trend: 'neutral', trendValue: 'No active rounds' },
		nextScheduled: { value: 'Tomorrow 5PM', loading: false, trend: 'neutral', trendValue: 'UTC' }
	};
	
	// Current draw amount input
	let distributionAmount = '';
	let recommendedAmount = 127.5; // Based on vault balance
</script>

<svelte:head>
	<title>Admin Dashboard - {tokenDisplay} Lottery</title>
</svelte:head>

<AdminLayout title="Dashboard Overview" description="Vault status, draw scheduling, and lottery management" {user}>

	<!-- Vault Status -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
		<StatsCard 
			title="Unclaimed Vault" 
			value={vaultData.unclaimedBalance.value}
			icon="mdi:safe" 
			color="orange"
			trend={vaultData.unclaimedBalance.trend}
			trendValue={vaultData.unclaimedBalance.trendValue}
			loading={vaultData.unclaimedBalance.loading}
		/>
		<StatsCard 
			title="Last Distribution" 
			value={vaultData.lastDistribution.value}
			icon="mdi:cash-multiple" 
			color="green"
			trend={vaultData.lastDistribution.trend}
			trendValue={vaultData.lastDistribution.trendValue}
			loading={vaultData.lastDistribution.loading}
		/>
		<StatsCard 
			title="Pending Rounds" 
			value={vaultData.pendingRounds.value}
			icon="mdi:clock-outline" 
			color="blue"
			trend={vaultData.pendingRounds.trend}
			trendValue={vaultData.pendingRounds.trendValue}
			loading={vaultData.pendingRounds.loading}
		/>
		<StatsCard 
			title="Next Scheduled" 
			value={vaultData.nextScheduled.value}
			icon="mdi:calendar-clock" 
			color="purple"
			trend={vaultData.nextScheduled.trend}
			trendValue={vaultData.nextScheduled.trendValue}
			loading={vaultData.nextScheduled.loading}
		/>
	</div>

	<!-- Vault Management -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
		<!-- Vault Balance & Distribution Input -->
		<Card class="border-2 border-orange-200">
			<CardHeader>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
							<Icon icon="mdi:safe" class="w-5 h-5 text-orange-600" />
						</div>
						<div>
							<CardTitle class="text-lg">Pump.fun Vault</CardTitle>
							<CardDescription>Current unclaimed balance</CardDescription>
						</div>
					</div>
					<Button variant="outline" size="sm">
						<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
						Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="text-center p-4 bg-orange-50 rounded-lg">
					<div class="text-3xl font-bold text-orange-600 mb-1">127.5 SOL</div>
					<div class="text-sm text-gray-600">Available for distribution</div>
				</div>
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Distribution Amount (SOL)</label>
					<div class="flex gap-2">
						<input 
							type="number" 
							bind:value={distributionAmount}
							placeholder="{recommendedAmount}"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						/>
						<Button variant="outline" size="sm" on:click={() => distributionAmount = recommendedAmount.toString()}>
							Max
						</Button>
					</div>
					<div class="text-xs text-gray-500">Recommended: {recommendedAmount} SOL</div>
				</div>
			</CardContent>
		</Card>
		
		<!-- Quick Draw Actions -->
		<Card class="border-2 border-blue-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:dice-6" class="w-5 h-5 text-blue-600" />
					Draw Management
				</CardTitle>
				<CardDescription>Start new rounds and manage draws</CardDescription>
			</CardHeader>
			<CardContent class="space-y-3">
				<Button href="/admin/draw" class="w-full justify-start">
					<Icon icon="mdi:play" class="mr-3 h-4 w-4" />
					Start New Round
				</Button>
				<Button href="/admin/schedule" variant="outline" class="w-full justify-start">
					<Icon icon="mdi:calendar-clock" class="mr-3 h-4 w-4" />
					Schedule Next Draw
				</Button>
				<Button href="/admin/history" variant="outline" class="w-full justify-start">
					<Icon icon="mdi:history" class="mr-3 h-4 w-4" />
					View Past Rounds
				</Button>
			</CardContent>
		</Card>
	</div>

	<!-- Distribution Preview -->
	<Card class="border-2 border-green-200">
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Icon icon="mdi:calculator" class="w-5 h-5 text-green-600" />
				Distribution Preview
			</CardTitle>
			<CardDescription>See how SOL will be distributed based on your input</CardDescription>
		</CardHeader>
		<CardContent>
			{#if distributionAmount}
				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- Winners 50% -->
						<div class="text-center p-4 bg-orange-50 rounded-lg">
							<div class="text-lg font-bold text-orange-600">{(Number(distributionAmount) * 0.5).toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Winners (50%)</div>
							<div class="text-xs text-gray-500">{(Number(distributionAmount) * 0.5 / 7).toFixed(3)} SOL each</div>
						</div>
						<!-- Holding 40% -->
						<div class="text-center p-4 bg-blue-50 rounded-lg">
							<div class="text-lg font-bold text-blue-600">{(Number(distributionAmount) * 0.4).toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Holding (40%)</div>
							<div class="text-xs text-gray-500">Future operations</div>
						</div>
						<!-- Charity 10% -->
						<div class="text-center p-4 bg-green-50 rounded-lg">
							<div class="text-lg font-bold text-green-600">{(Number(distributionAmount) * 0.1).toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Charity (10%)</div>
							<div class="text-xs text-gray-500">Good cause</div>
						</div>
					</div>
					<div class="flex gap-3 pt-4 border-t">
						<Button href="/admin/draw" class="flex-1">
							<Icon icon="mdi:play" class="mr-2 h-4 w-4" />
							Start Round with {distributionAmount} SOL
						</Button>
						<Button href="/admin/configuration" variant="outline">
							<Icon icon="mdi:cog" class="mr-2 h-4 w-4" />
							Settings
						</Button>
					</div>
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					<Icon icon="mdi:calculator" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
					<p>Enter a distribution amount above to see the breakdown</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Development Status -->
	<Card class="mt-8 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white">
		<CardHeader>
			<CardTitle class="text-center flex items-center justify-center gap-2">
				<Icon icon="mdi:hammer-wrench" class="w-5 h-5 text-yellow-600" />
				Development Status
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-center">
				<p class="text-gray-600 mb-4">
					Admin dashboard updated to match PRD requirements. Draw management, vault integration, 
					and distribution system are ready for implementation.
				</p>
				<div class="text-sm text-gray-500">
					<span class="font-medium">Next:</span> Build Draw Management Interface with Spinning Wheel
				</div>
			</div>
		</CardContent>
	</Card>
</AdminLayout>