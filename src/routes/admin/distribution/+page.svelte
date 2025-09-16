<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { getTokenDisplay, getDistributionConfig } from '$lib/config/client';
	import AdminSidebar from '$lib/components/admin/admin-sidebar.svelte';
	import { browser } from '$app/environment';
	
	// Dynamically import Icon to avoid SSR issues
	let Icon: any;
	onMount(async () => {
		const iconifyModule = await import('@iconify/svelte');
		Icon = iconifyModule.default;
	});

	const tokenDisplay = getTokenDisplay();
	const distributionConfig = getDistributionConfig();

	// Balance and distribution state
	let balanceData: any = null;
	let loading = false;
	let error = '';
	let distributionAmount = '';
	let calculatedDistribution: any = null;
	
	// Pending winners state
	let pendingWinners: any = null;
	let loadingWinners = false;
	
	// Distribution history state
	let distributionHistory: any = null;
	let loadingHistory = false;

	// Calculate distribution preview when amount changes
	$: if (distributionAmount && !isNaN(Number(distributionAmount))) {
		const amount = Number(distributionAmount);
		calculatedDistribution = {
			total: amount,
			winners: {
				amount: amount * (distributionConfig.winnersPercentage / 100),
				percentage: distributionConfig.winnersPercentage
			},
			holding: {
				amount: amount * (distributionConfig.holdingPercentage / 100),
				percentage: distributionConfig.holdingPercentage
			},
			charity: {
				amount: amount * (distributionConfig.charityPercentage / 100),
				percentage: distributionConfig.charityPercentage
			}
		};
	} else {
		calculatedDistribution = null;
	}

	async function fetchAdminBalance() {
		if (!browser) return;
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/admin-wallet/balance');
			const data = await response.json();
			
			if (data.success) {
				balanceData = data;
				// Pre-fill distribution amount with available balance
				distributionAmount = data.balance.availableForDistribution.toString();
			} else {
				error = data.error || 'Failed to fetch balance';
			}
		} catch (err) {
			error = 'Network error fetching balance';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function refreshBalance() {
		if (!browser) return;
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/admin-wallet/balance', { method: 'POST' });
			const data = await response.json();
			
			if (data.success) {
				balanceData = data;
				// Update distribution amount with new available balance
				distributionAmount = data.balance.availableForDistribution.toString();
			} else {
				error = data.error || 'Failed to refresh balance';
			}
		} catch (err) {
			error = 'Network error refreshing balance';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function executeDistribution() {
		if (!calculatedDistribution || !distributionAmount) return;
		
		const confirmed = confirm(`Execute distribution of ${distributionAmount} SOL?\n\nWinners: ${calculatedDistribution.winners.amount.toFixed(3)} SOL (${calculatedDistribution.winners.percentage}%)\nHolding: ${calculatedDistribution.holding.amount.toFixed(3)} SOL (${calculatedDistribution.holding.percentage}%)\nCharity: ${calculatedDistribution.charity.amount.toFixed(3)} SOL (${calculatedDistribution.charity.percentage}%)`);
		
		if (!confirmed) return;
		
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/admin-wallet/distribution', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					distributionAmount: distributionAmount
				})
			});
			
			const data = await response.json();
			
			if (data.success) {
				alert(`Distribution executed successfully!\n\n${data.simulation ? '(Simulation mode)' : ''}\nTransaction IDs:\n${data.transactionIds?.join('\n') || 'None'}`);
				// Refresh balance, pending winners, and history after distribution
				await fetchAdminBalance();
				await fetchPendingWinners();
				await fetchDistributionHistory();
			} else {
				error = data.error || 'Failed to execute distribution';
			}
		} catch (err) {
			error = 'Network error executing distribution';
			console.error(err);
		} finally {
			loading = false;
		}
	}

	async function fetchPendingWinners() {
		if (!browser) return;
		
		loadingWinners = true;
		
		try {
			const response = await fetch('/api/admin/pending-winners');
			const data = await response.json();
			
			if (data.success) {
				pendingWinners = data.data;
			} else {
				console.error('Failed to fetch pending winners:', data.error);
			}
		} catch (err) {
			console.error('Error fetching pending winners:', err);
		} finally {
			loadingWinners = false;
		}
	}

	async function fetchDistributionHistory() {
		if (!browser) return;
		
		loadingHistory = true;
		
		try {
			const response = await fetch('/api/admin/distribution-history?limit=5');
			const data = await response.json();
			
			if (data.success) {
				distributionHistory = data.data;
			} else {
				console.error('Failed to fetch distribution history:', data.error);
			}
		} catch (err) {
			console.error('Error fetching distribution history:', err);
		} finally {
			loadingHistory = false;
		}
	}

	onMount(() => {
		fetchAdminBalance();
		fetchPendingWinners();
		fetchDistributionHistory();
	});
</script>

<svelte:head>
	<title>Distribution Management - {tokenDisplay} Admin</title>
</svelte:head>

<div class="min-h-screen bg-orange-50/30 flex">
	<AdminSidebar />
	
	<main class="flex-1 p-8">
		<div class="max-w-6xl mx-auto space-y-8">
			<!-- Header -->
			<div class="flex justify-between items-start">
				<div>
					<h1 class="text-3xl font-bold text-gray-900">Distribution Management</h1>
					<p class="text-gray-600 mt-2">Manage SOL distributions to winners, holding wallet, and charity</p>
				</div>
				<Button on:click={refreshBalance} disabled={loading} variant="outline">
					{#if Icon}
						<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
					{/if}
					Refresh Balance
				</Button>
			</div>

			{#if error}
				<Card class="border-red-200 bg-red-50">
					<CardContent class="p-4">
						<div class="flex items-center gap-2 text-red-600">
							{#if Icon}
								<Icon icon="mdi:alert-circle" class="w-5 h-5" />
							{/if}
							<span class="font-medium">Error:</span>
							<span>{error}</span>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Admin Wallet Balance Overview -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							{#if Icon}
								<Icon icon="mdi:wallet" class="w-5 h-5 text-orange-600" />
							{/if}
							Total Balance
						</CardTitle>
						<CardDescription>Current admin wallet balance</CardDescription>
					</CardHeader>
					<CardContent>
						{#if loading}
							<div class="animate-pulse bg-gray-200 h-8 rounded"></div>
						{:else if balanceData}
							<p class="text-2xl font-bold text-gray-900">{balanceData.balance.totalFormatted}</p>
							<p class="text-sm text-gray-500 mt-1">{balanceData.meta.walletAddress.slice(0, 8)}...{balanceData.meta.walletAddress.slice(-8)}</p>
						{:else}
							<p class="text-gray-400">No data</p>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							{#if Icon}
								<Icon icon="mdi:shield-check" class="w-5 h-5 text-blue-600" />
							{/if}
							Fee Reserve
						</CardTitle>
						<CardDescription>Reserved for transaction fees</CardDescription>
					</CardHeader>
					<CardContent>
						{#if loading}
							<div class="animate-pulse bg-gray-200 h-8 rounded"></div>
						{:else if balanceData}
							<p class="text-2xl font-bold text-blue-600">{balanceData.balance.feeReserveFormatted}</p>
							<p class="text-sm text-gray-500 mt-1">Always reserved</p>
						{:else}
							<p class="text-gray-400">No data</p>
						{/if}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							{#if Icon}
								<Icon icon="mdi:cash-multiple" class="w-5 h-5 text-green-600" />
							{/if}
							Available for Distribution
						</CardTitle>
						<CardDescription>Total - fee reserve</CardDescription>
					</CardHeader>
					<CardContent>
						{#if loading}
							<div class="animate-pulse bg-gray-200 h-8 rounded"></div>
						{:else if balanceData}
							<p class="text-2xl font-bold text-green-600">{balanceData.balance.availableFormatted}</p>
							<p class="text-sm text-gray-500 mt-1">Ready to distribute</p>
						{:else}
							<p class="text-gray-400">No data</p>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Distribution Configuration -->
			<Card>
				<CardHeader>
					<CardTitle>Distribution Setup</CardTitle>
					<CardDescription>Configure the amount to distribute and preview the breakdown</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<!-- Distribution Amount Input -->
					<div class="space-y-2">
						<Label for="distribution-amount">Distribution Amount (SOL)</Label>
						<Input
							id="distribution-amount"
							type="number"
							step="0.001"
							min="0"
							max={balanceData?.balance.availableForDistribution || undefined}
							bind:value={distributionAmount}
							placeholder="Enter SOL amount to distribute"
							class="max-w-xs"
						/>
						<p class="text-sm text-gray-500">
							Maximum available: {balanceData?.balance.availableFormatted || '0.000 SOL'}
						</p>
					</div>

					<!-- Distribution Preview -->
					{#if calculatedDistribution}
						<div class="border rounded-lg p-4 bg-gray-50">
							<h3 class="font-medium text-gray-900 mb-4">Distribution Preview</h3>
							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div class="bg-white rounded-lg p-4 border">
									<div class="flex items-center gap-2 mb-2">
										{#if Icon}
											<Icon icon="mdi:trophy" class="w-4 h-4 text-yellow-600" />
										{/if}
										<span class="font-medium text-gray-900">Winners</span>
										<span class="text-sm text-gray-500">({calculatedDistribution.winners.percentage}%)</span>
									</div>
									<p class="text-xl font-bold text-yellow-600">{calculatedDistribution.winners.amount.toFixed(3)} SOL</p>
								</div>
								
								<div class="bg-white rounded-lg p-4 border">
									<div class="flex items-center gap-2 mb-2">
										{#if Icon}
											<Icon icon="mdi:bank" class="w-4 h-4 text-blue-600" />
										{/if}
										<span class="font-medium text-gray-900">Holding</span>
										<span class="text-sm text-gray-500">({calculatedDistribution.holding.percentage}%)</span>
									</div>
									<p class="text-xl font-bold text-blue-600">{calculatedDistribution.holding.amount.toFixed(3)} SOL</p>
								</div>
								
								<div class="bg-white rounded-lg p-4 border">
									<div class="flex items-center gap-2 mb-2">
										{#if Icon}
											<Icon icon="mdi:heart" class="w-4 h-4 text-red-600" />
										{/if}
										<span class="font-medium text-gray-900">Charity</span>
										<span class="text-sm text-gray-500">({calculatedDistribution.charity.percentage}%)</span>
									</div>
									<p class="text-xl font-bold text-red-600">{calculatedDistribution.charity.amount.toFixed(3)} SOL</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Execute Distribution Button -->
					<div class="flex gap-4">
						<Button 
							on:click={executeDistribution} 
							disabled={!calculatedDistribution || loading}
							class="bg-orange-600 hover:bg-orange-700"
						>
							{#if Icon}
								<Icon icon="mdi:send" class="w-4 h-4 mr-2" />
							{/if}
							Execute Distribution
						</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Pending Winners Section -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						{#if Icon}
							<Icon icon="mdi:clock-outline" class="w-5 h-5 text-orange-600" />
						{/if}
						Pending Winners
					</CardTitle>
					<CardDescription>Winners awaiting payment distribution</CardDescription>
				</CardHeader>
				<CardContent>
					{#if loadingWinners}
						<div class="animate-pulse space-y-2">
							<div class="h-4 bg-gray-200 rounded w-1/4"></div>
							<div class="h-8 bg-gray-200 rounded"></div>
							<div class="h-8 bg-gray-200 rounded"></div>
						</div>
					{:else if pendingWinners && pendingWinners.count > 0}
						<div class="space-y-4">
							<!-- Summary -->
							<div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
								<div class="flex items-center justify-between">
									<div>
										<p class="font-medium text-gray-900">{pendingWinners.count} winners pending payment</p>
										<p class="text-sm text-gray-600">Total amount: {pendingWinners.totalPendingFormatted}</p>
									</div>
									<Button size="sm" variant="outline" on:click={fetchPendingWinners}>
										{#if Icon}
											<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
										{/if}
										Refresh
									</Button>
								</div>
							</div>

							<!-- Winners List -->
							<div class="space-y-3 max-h-64 overflow-y-auto">
								{#each pendingWinners.pendingWinners as winner (winner.id)}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
										<div class="flex items-center gap-3">
											<div class="text-2xl">{winner.animalEmoji}</div>
											<div>
												<p class="font-medium text-gray-900">{winner.animalName}</p>
												<p class="text-sm text-gray-500">
													{winner.walletAddress.slice(0, 8)}...{winner.walletAddress.slice(-8)}
												</p>
											</div>
										</div>
										<div class="text-right">
											<p class="font-bold text-green-600">{Number(winner.prizeAmount).toFixed(3)} SOL</p>
											<p class="text-xs text-gray-500">Draw #{winner.drawNumber}</p>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							{#if Icon}
								<Icon icon="mdi:check-circle" class="w-12 h-12 mx-auto mb-2 text-green-500" />
							{/if}
							<p class="font-medium">No pending winners</p>
							<p class="text-sm">All winners have been paid</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Distribution History Section -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						{#if Icon}
							<Icon icon="mdi:history" class="w-5 h-5 text-blue-600" />
						{/if}
						Recent Distribution History
					</CardTitle>
					<CardDescription>Last 5 distribution transactions</CardDescription>
				</CardHeader>
				<CardContent>
					{#if loadingHistory}
						<div class="animate-pulse space-y-2">
							<div class="h-4 bg-gray-200 rounded w-1/4"></div>
							<div class="h-8 bg-gray-200 rounded"></div>
							<div class="h-8 bg-gray-200 rounded"></div>
						</div>
					{:else if distributionHistory && distributionHistory.history.length > 0}
						<div class="space-y-3">
							{#each distributionHistory.history as record (record.id)}
								<div class="p-3 bg-gray-50 rounded-lg border">
									<div class="flex items-center justify-between mb-2">
										<div class="flex items-center gap-2">
											<div class="w-3 h-3 rounded-full {record.status === 'completed' ? 'bg-green-500' : record.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'}"></div>
											<span class="font-medium text-gray-900">
												{record.totalAmountFormatted}
											</span>
											<span class="text-sm text-gray-500 capitalize">
												{record.status}
											</span>
										</div>
										<span class="text-sm text-gray-500">
											{record.executedAtFormatted}
										</span>
									</div>
									<div class="grid grid-cols-3 gap-2 text-xs">
										<div>
											<span class="text-gray-500">Winners:</span>
											<span class="font-medium">{record.winnersAmountFormatted}</span>
										</div>
										<div>
											<span class="text-gray-500">Holding:</span>
											<span class="font-medium">{record.holdingAmountFormatted}</span>
										</div>
										<div>
											<span class="text-gray-500">Charity:</span>
											<span class="font-medium">{record.charityAmountFormatted}</span>
										</div>
									</div>
									{#if record.winnersTransactionHash}
										<div class="mt-2 text-xs text-blue-600">
											<div class="truncate">Winners TX: {record.winnersTransactionHash}</div>
										</div>
									{/if}
								</div>
							{/each}
							<Button size="sm" variant="outline" on:click={fetchDistributionHistory} class="w-full">
								{#if Icon}
									<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
								{/if}
								Refresh History
							</Button>
						</div>
					{:else}
						<div class="text-center py-8 text-gray-500">
							{#if Icon}
								<Icon icon="mdi:clock-outline" class="w-12 h-12 mx-auto mb-2 text-gray-400" />
							{/if}
							<p class="font-medium">No distribution history</p>
							<p class="text-sm">Distributions will appear here once executed</p>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Last Updated Info -->
			{#if balanceData?.meta.lastUpdated}
				<Card>
					<CardContent class="p-4">
						<div class="flex items-center justify-between text-sm text-gray-500">
							<span>Last updated: {new Date(balanceData.meta.lastUpdated).toLocaleString()}</span>
							{#if balanceData.meta.refreshed}
								<span class="text-green-600">✓ Recently refreshed</span>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>
	</main>
</div>