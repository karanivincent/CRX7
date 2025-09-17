<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import StatsCard from '$lib/components/ui/stats-card.svelte';
	import { onMount } from 'svelte';
	
	export let data;
	const { user, vaultData: initialVaultData, clientConfig } = data;
	
	// Cache config values from server-loaded configuration
	const tokenDisplay = clientConfig?.displayName || 'CRX7';
	
	// Real-time vault data
	let vaultData = initialVaultData;
	let vaultLoading = false;
	let lastRefresh = vaultData?.lastUpdated ? new Date(vaultData.lastUpdated) : new Date();
	
	// Current draw amount input
	let distributionAmount = '';
	let recommendedAmount = vaultData?.balance || 0;
	
	// Auto-refresh interval (30 seconds)
	let refreshInterval: number;
	
	// Refresh vault balance from API
	async function refreshVaultBalance(force = false) {
		vaultLoading = true;
		try {
			const url = force ? '/api/vault/balance?refresh=true' : '/api/vault/balance';
			const response = await fetch(url);
			const result = await response.json();
			
			if (result.success && result.vault) {
				vaultData = {
					balance: result.vault.balance,
					balanceFormatted: result.vault.balanceFormatted,
					distribution: result.distribution,
					winnerBreakdown: result.distribution.winners.breakdown,
					lastUpdated: result.vault.lastUpdated,
					address: result.vault.address,
					breakdown: result.vault.breakdown || null
				};
				recommendedAmount = vaultData.balance;
				lastRefresh = new Date(result.vault.lastUpdated);
			} else {
				console.error('Failed to refresh vault balance:', result.error);
			}
		} catch (error) {
			console.error('Error refreshing vault balance:', error);
		} finally {
			vaultLoading = false;
		}
	}
	
	// Format time since last update
	function getTimeSinceUpdate() {
		const now = new Date();
		const diff = now.getTime() - lastRefresh.getTime();
		const seconds = Math.floor(diff / 1000);
		const minutes = Math.floor(seconds / 60);
		
		if (minutes > 0) {
			return `${minutes}m ago`;
		} else {
			return `${seconds}s ago`;
		}
	}
	
	// Set up auto-refresh
	onMount(() => {
		// Refresh every 30 seconds
		refreshInterval = setInterval(() => {
			refreshVaultBalance(false);
		}, 30000);
		
		// Cleanup interval on destroy
		return () => {
			if (refreshInterval) {
				clearInterval(refreshInterval);
			}
		};
	});
	
	// Reactive vault stats for display
	$: unclaimedBalance = vaultData ? {
		value: vaultData.balanceFormatted,
		loading: vaultLoading,
		trend: 'neutral' as const,
		trendValue: getTimeSinceUpdate()
	} : {
		value: 'Loading...',
		loading: true,
		trend: 'neutral' as const,
		trendValue: 'Fetching data...'
	};
</script>

<svelte:head>
	<title>Admin Dashboard - {tokenDisplay} Lottery</title>
</svelte:head>

<AdminLayout title="Dashboard Overview" description="Vault status, draw scheduling, and lottery management" {user}>

	<!-- Vault Status -->
	<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
		<StatsCard 
			title="Vault Balance" 
			value={unclaimedBalance.value}
			icon="mdi:safe" 
			color="orange"
			trend={unclaimedBalance.trend}
			trendValue={unclaimedBalance.trendValue}
			loading={unclaimedBalance.loading}
		/>
		<StatsCard 
			title="Winners Share" 
			value={vaultData?.distribution?.winners?.formatted || 'Loading...'}
			icon="mdi:trophy" 
			color="green"
			trend="neutral"
			trendValue="50% of vault"
			loading={vaultLoading}
		/>
		<StatsCard 
			title="Holding Share" 
			value={vaultData?.distribution?.holding?.formatted || 'Loading...'}
			icon="mdi:bank" 
			color="blue"
			trend="neutral"
			trendValue="40% of vault"
			loading={vaultLoading}
		/>
		<StatsCard 
			title="Charity Share" 
			value={vaultData?.distribution?.charity?.formatted || 'Loading...'}
			icon="mdi:heart" 
			color="purple"
			trend="neutral"
			trendValue="10% of vault"
			loading={vaultLoading}
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
							<CardTitle class="text-lg">Reward Vault</CardTitle>
							<CardDescription>Live SOL balance for distribution</CardDescription>
						</div>
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						on:click={() => refreshVaultBalance(true)}
						disabled={vaultLoading}
					>
						<Icon 
							icon="mdi:refresh" 
							class="w-4 h-4 mr-2 {vaultLoading ? 'animate-spin' : ''}" 
						/>
						Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="text-center p-4 bg-orange-50 rounded-lg">
					{#if vaultData}
						<div class="text-3xl font-bold text-orange-600 mb-1">
							{vaultData.balanceFormatted}
						</div>
						<div class="text-sm text-gray-600">Available for distribution</div>
						
						{#if vaultData.breakdown}
							<div class="mt-2 pt-2 border-t border-orange-200">
								<div class="grid grid-cols-2 gap-4 text-xs">
									<div>
										<div class="font-medium text-gray-700">SOL</div>
										<div class="text-orange-600">{vaultData.breakdown.solFormatted}</div>
									</div>
									<div>
										<div class="font-medium text-gray-700">WSOL</div>
										<div class="text-orange-600">{vaultData.breakdown.wsolFormatted}</div>
									</div>
								</div>
							</div>
						{/if}
						
						<div class="text-xs text-gray-400 mt-1">
							Updated {getTimeSinceUpdate()}
						</div>
					{:else}
						<div class="text-3xl font-bold text-gray-400 mb-1">Loading...</div>
						<div class="text-sm text-gray-600">Fetching vault balance</div>
					{/if}
				</div>
				
				{#if vaultData && vaultData.balance > 0}
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Distribution Amount (SOL)</label>
						<div class="flex gap-2">
							<input 
								type="number" 
								bind:value={distributionAmount}
								placeholder="{recommendedAmount.toFixed(2)}"
								step="0.01"
								min="0"
								max="{recommendedAmount}"
								class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							/>
							<Button 
								variant="outline" 
								size="sm" 
								on:click={() => distributionAmount = recommendedAmount.toFixed(2)}
							>
								Max
							</Button>
						</div>
						<div class="text-xs text-gray-500">
							Maximum: {recommendedAmount.toFixed(2)} SOL
						</div>
					</div>
				{:else if vaultData && vaultData.balance === 0}
					<div class="text-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
						<div class="text-sm text-yellow-700">
							Vault is empty. Add SOL to start distributions.
						</div>
					</div>
				{/if}
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
			{#if distributionAmount && Number(distributionAmount) > 0}
				{@const amount = Number(distributionAmount)}
				{@const winnersPercent = (clientConfig?.distribution.winnersPercentage || 50) / 100}
				{@const holdingPercent = (clientConfig?.distribution.holdingPercentage || 40) / 100}
				{@const charityPercent = (clientConfig?.distribution.charityPercentage || 10) / 100}
				{@const winnersTotal = amount * winnersPercent}
				{@const holdingTotal = amount * holdingPercent}
				{@const charityTotal = amount * charityPercent}
				{@const perWinner = winnersTotal / (clientConfig?.winnersPerDraw || 7)}
				
				<div class="space-y-4">
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
						<!-- Winners -->
						<div class="text-center p-4 bg-orange-50 rounded-lg">
							<div class="text-lg font-bold text-orange-600">{winnersTotal.toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Winners ({clientConfig?.distribution.winnersPercentage || 50}%)</div>
							<div class="text-xs text-gray-500">{perWinner.toFixed(3)} SOL each ({clientConfig?.winnersPerDraw || 7} winners)</div>
						</div>
						<!-- Holding -->
						<div class="text-center p-4 bg-blue-50 rounded-lg">
							<div class="text-lg font-bold text-blue-600">{holdingTotal.toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Holding ({clientConfig?.distribution.holdingPercentage || 40}%)</div>
							<div class="text-xs text-gray-500">Future rounds</div>
						</div>
						<!-- Charity -->
						<div class="text-center p-4 bg-green-50 rounded-lg">
							<div class="text-lg font-bold text-green-600">{charityTotal.toFixed(2)} SOL</div>
							<div class="text-sm text-gray-600">Charity ({clientConfig?.distribution.charityPercentage || 10}%)</div>
							<div class="text-xs text-gray-500">Good cause</div>
						</div>
					</div>
					
					{#if vaultData && amount > vaultData.balance}
						<div class="p-3 bg-red-50 rounded-lg border border-red-200">
							<div class="text-sm text-red-700">
								⚠️ Distribution amount ({amount.toFixed(2)} SOL) exceeds vault balance ({vaultData.balanceFormatted})
							</div>
						</div>
					{/if}
					
					<div class="flex gap-3 pt-4 border-t">
						<Button 
							href="/admin/draw" 
							class="flex-1"
							disabled={vaultData && amount > vaultData.balance}
						>
							<Icon icon="mdi:play" class="mr-2 h-4 w-4" />
							Start Round with {distributionAmount} SOL
						</Button>
						<Button href="/admin/configuration" variant="outline">
							<Icon icon="mdi:cog" class="mr-2 h-4 w-4" />
							Settings
						</Button>
					</div>
				</div>
			{:else if vaultData && vaultData.balance > 0}
				<div class="text-center py-8 text-gray-500">
					<Icon icon="mdi:calculator" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
					<p>Enter a distribution amount above to see the breakdown</p>
					<p class="text-xs mt-2">Available: {vaultData.balanceFormatted}</p>
				</div>
			{:else}
				<div class="text-center py-8 text-gray-500">
					<Icon icon="mdi:safe" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
					<p>Vault balance loading or empty</p>
					<p class="text-xs mt-2">Cannot calculate distribution</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Development Status -->
	<Card class="mt-8 border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
		<CardHeader>
			<CardTitle class="text-center flex items-center justify-center gap-2">
				<Icon icon="mdi:check-circle" class="w-5 h-5 text-green-600" />
				Vault System Active
			</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-center">
				<p class="text-gray-600 mb-4">
					✅ Real-time SOL balance tracking integrated<br/>
					✅ Automatic 50/40/10 distribution calculations<br/>
					✅ Live vault monitoring with 30-second auto-refresh
				</p>
				<div class="text-sm text-gray-500">
					<span class="font-medium">Vault Address:</span> 
					<code class="bg-gray-100 px-2 py-1 rounded text-xs">
						{vaultData?.address || 'Loading...'}
					</code>
				</div>
			</div>
		</CardContent>
	</Card>
</AdminLayout>