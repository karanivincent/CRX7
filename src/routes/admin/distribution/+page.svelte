<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import DistributionCard from '$lib/components/ui/distribution-card.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Collapsible, CollapsibleTrigger } from '$lib/components/ui/collapsible';
	import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '$lib/components/ui/dialog';
	import { getTokenDisplay, getDistributionConfig } from '$lib/config/client';
	import { getWalletAddresses, truncateWalletAddress } from '$lib/config/wallets';
	import AdminSidebar from '$lib/components/admin/admin-sidebar.svelte';
	import { browser } from '$app/environment';
	import { isTestMode } from '$lib/config/test-wallets';
	import ToastContainer from '$lib/components/ui/toast-container.svelte';
	import { showSuccess, showError } from '$lib/stores/toast';
	
	// Dynamically import Icon to avoid SSR issues
	let Icon: any;
	onMount(async () => {
		const iconifyModule = await import('@iconify/svelte');
		Icon = iconifyModule.default;
	});

	const tokenDisplay = getTokenDisplay();
	const distributionConfig = getDistributionConfig();
	const walletAddresses = getWalletAddresses();

	// Balance and distribution state
	let balanceData: any = null;
	let loading = false;
	let error = '';
	let distributionAmount = '';
	let calculatedDistribution: any = null;
	
	// Pending winners state
	let pendingWinners: any = null;
	let loadingWinners = false;
	let pendingWinnersOpen = false;
	
	// Distribution history state
	let distributionHistory: any = null;
	let loadingHistory = false;
	
	// Distribution dialog state
	let showDistributionDialog = false;
	let executingDistribution = false;
	
	// Copy to clipboard function
	async function copyToClipboard(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			// Could add a toast notification here
			console.log('Copied to clipboard:', text);
		} catch (err) {
			console.error('Failed to copy to clipboard:', err);
		}
	}

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
		if (!calculatedDistribution || !distributionAmount || !pendingWinners) return;
		
		executingDistribution = true;
		error = '';
		
		try {
			// Calculate actual amount per winner from the distribution dialog
			const amountPerWinner = pendingWinners.count > 0 ? 
				calculatedDistribution.winners.amount / pendingWinners.count : 0;
			
			// Create winner data with actual amounts being sent
			const winnersData = (pendingWinners.pendingWinners || []).map(winner => ({
				walletAddress: winner.walletAddress,
				amount: amountPerWinner
			}));
			
			console.log('🎯 Sending distribution with actual winner amounts:', {
				totalDistribution: distributionAmount,
				winnersTotal: calculatedDistribution.winners.amount,
				amountPerWinner,
				winnersCount: winnersData.length,
				winnersData
			});
			
			const response = await fetch('/api/admin-wallet/distribution', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					distributionAmount: distributionAmount,
					winnersData: winnersData
				})
			});
			
			const data = await response.json();
			
			if (data.success) {
				// Show success toast with transaction details
				const transactionDetails = data.transactionIds || [];
				showSuccess('Distribution executed successfully!', {
					title: `Distribution Complete ${data.simulation ? '(Simulation)' : ''}`,
					details: transactionDetails.length > 0 ? transactionDetails : ['No transaction IDs available'],
					duration: 8000 // Longer duration for important success message
				});
				
				// Refresh balance, pending winners, and history after distribution
				await fetchAdminBalance();
				await fetchPendingWinners();
				await fetchDistributionHistory();
				
				// Close dialog and reset form
				showDistributionDialog = false;
				distributionAmount = '';
				calculatedDistribution = null;
			} else {
				error = data.error || 'Failed to execute distribution';
			}
		} catch (err) {
			error = 'Network error executing distribution';
			console.error(err);
		} finally {
			executingDistribution = false;
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

	async function clearPendingWinners() {
		if (!browser) return;
		
		const winnerCount = pendingWinners?.count || 0;
		const totalAmount = pendingWinners?.totalPendingFormatted || '0 SOL';
		
		if (winnerCount === 0) {
			alert('No pending winners to clear');
			return;
		}
		
		const confirmMessage = `Are you sure you want to clear ${winnerCount} pending winners (${totalAmount})?\n\nThis action cannot be undone.`;
		if (!confirm(confirmMessage)) {
			return;
		}
		
		loadingWinners = true;
		
		try {
			const response = await fetch('/api/admin/clear-pending-winners', {
				method: 'POST'
			});
			const data = await response.json();
			
			if (data.success) {
				showSuccess(`Successfully cleared ${data.cleared.count} pending winners (${data.cleared.totalAmountFormatted})`);
				// Refresh the pending winners list
				await fetchPendingWinners();
			} else {
				showError(`Failed to clear pending winners: ${data.error}`);
			}
		} catch (err) {
			console.error('Error clearing pending winners:', err);
			showError('Error clearing pending winners. Please try again.');
		} finally {
			loadingWinners = false;
		}
	}

	function handleRetryInitiated(event) {
		console.log('Retry initiated for distribution:', event.detail);
		// Refresh the distribution history to show updated status
		setTimeout(() => {
			fetchDistributionHistory();
		}, 1000);
	}

	function handleRetryError(event) {
		console.error('Retry error:', event.detail.error);
		showError(`Failed to retry distribution: ${event.detail.error}`);
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
		<!-- Toast Container -->
		<ToastContainer />
		<div class="max-w-6xl mx-auto space-y-8">
			<!-- Test Mode Banner -->
			{#if isTestMode()}
				<div class="bg-gradient-to-r from-orange-100 to-orange-200 border border-orange-300 rounded-lg p-4">
					<div class="flex items-center gap-3">
						{#if Icon}
							<Icon icon="mdi:test-tube" class="w-6 h-6 text-orange-600" />
						{/if}
						<div>
							<h3 class="font-bold text-orange-800">🧪 Test Mode Active</h3>
							<p class="text-orange-700 text-sm">Using test wallets for safe SOL distribution testing. All transactions will go to your personal wallets.</p>
						</div>
					</div>
				</div>
			{/if}

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
							on:click={() => showDistributionDialog = true} 
							disabled={!calculatedDistribution || loading || executingDistribution}
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
						<Collapsible bind:open={pendingWinnersOpen}>
							<div slot="trigger" let:toggleOpen let:open>
								<div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
									<div class="flex items-center justify-between">
										<CollapsibleTrigger 
											onClick={toggleOpen} 
											{open} 
											disabled={loadingWinners}
											class="flex items-center gap-2 flex-1 text-left"
										>
											<div>
												<p class="font-medium text-gray-900">{pendingWinners.count} winners pending payment</p>
												<p class="text-sm text-gray-600">Total amount: {pendingWinners.totalPendingFormatted}</p>
											</div>
										</CollapsibleTrigger>
										<div class="flex gap-2 ml-4">
											<Button size="sm" variant="outline" on:click={fetchPendingWinners} disabled={loadingWinners}>
												{#if Icon}
													<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
												{/if}
												Refresh
											</Button>
											<Button size="sm" variant="destructive" on:click={clearPendingWinners} disabled={loadingWinners}>
												{#if Icon}
													<Icon icon="mdi:delete-sweep" class="w-4 h-4 mr-2" />
												{/if}
												Clear All
											</Button>
										</div>
									</div>
								</div>
							</div>
							
							<div slot="content">
								<div class="mt-4 space-y-4">
									{#if pendingWinners.drawGroups && pendingWinners.drawGroups.length > 0}
										{#each pendingWinners.drawGroups as drawGroup (drawGroup.drawId)}
											<div class="border rounded-lg overflow-hidden">
												<div class="bg-gray-50 px-4 py-2 border-b">
													<h4 class="font-medium text-gray-900">
														Draw #{drawGroup.drawNumber}
														<span class="text-sm text-gray-600 ml-2">
															({drawGroup.count} winners, {drawGroup.totalAmountFormatted})
														</span>
													</h4>
												</div>
												<div class="divide-y divide-gray-200">
													{#each drawGroup.winners as winner (winner.id)}
														<div class="flex items-center justify-between p-3">
															<div class="flex items-center gap-3">
																<div class="text-xl">{winner.animalEmoji}</div>
																<div>
																	<p class="font-medium text-gray-900">{winner.animalName}</p>
																	<p class="text-sm text-gray-500">
																		{winner.walletAddress.slice(0, 8)}...{winner.walletAddress.slice(-8)}
																	</p>
																</div>
															</div>
															<div class="text-right">
																<p class="font-bold text-green-600">{Number(winner.prizeAmount).toFixed(3)} SOL</p>
																<p class="text-xs text-gray-500">Position #{winner.sequenceNumber}</p>
															</div>
														</div>
													{/each}
												</div>
											</div>
										{/each}
									{:else}
										<!-- Fallback to old format if drawGroups not available -->
										<div class="space-y-3">
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
									{/if}
								</div>
							</div>
						</Collapsible>
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
						<!-- Loading State -->
						<div class="animate-pulse space-y-4">
							<div class="h-20 bg-gray-200 rounded-lg"></div>
							<div class="h-20 bg-gray-200 rounded-lg"></div>
							<div class="h-20 bg-gray-200 rounded-lg"></div>
						</div>
					{:else if distributionHistory && distributionHistory.history.length > 0}
						<!-- Distribution Cards -->
						<div class="space-y-4">
							{#each distributionHistory.history as record (record.id)}
								<DistributionCard 
									{record} 
									{Icon} 
									on:retryInitiated={handleRetryInitiated}
									on:retryError={handleRetryError}
								/>
							{/each}
							
							<!-- Refresh Button -->
							<div class="pt-2">
								<Button size="sm" variant="outline" on:click={fetchDistributionHistory} class="w-full">
									{#if Icon}
										<Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
									{/if}
									Refresh History
								</Button>
							</div>
						</div>
					{:else}
						<!-- Empty State -->
						<div class="text-center py-12 text-gray-500">
							{#if Icon}
								<Icon icon="mdi:clock-outline" class="w-16 h-16 mx-auto mb-4 text-gray-300" />
							{/if}
							<h3 class="font-medium text-gray-900 mb-2">No distribution history yet</h3>
							<p class="text-sm text-gray-500">Distribution transactions will appear here once executed</p>
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

<!-- Distribution Execution Dialog -->
<Dialog bind:open={showDistributionDialog} class="wide-dialog">
	<DialogContent class="max-h-[90vh] overflow-y-auto">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				{#if Icon}
					<Icon icon="mdi:send" class="w-5 h-5 text-orange-600" />
				{/if}
				Execute Distribution
			</DialogTitle>
			<DialogDescription>
				Review the distribution details below and confirm to proceed with the transaction.
			</DialogDescription>
		</DialogHeader>

		{#if calculatedDistribution}
			<div class="space-y-6 py-4">
				<!-- Top Row: Summary and Allocation -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
					<!-- Distribution Summary -->
					<div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
						<h3 class="font-semibold text-gray-900 mb-3">Distribution Summary</h3>
						<div class="grid grid-cols-2 gap-4">
							<div>
								<p class="text-sm text-gray-600">Total Amount</p>
								<p class="text-lg font-bold text-gray-900">{calculatedDistribution.total.toFixed(3)} SOL</p>
							</div>
							<div>
								<p class="text-sm text-gray-600">Fee Reserve</p>
								<p class="text-sm font-medium text-gray-700">0.1 SOL (maintained)</p>
							</div>
						</div>
					</div>

					<!-- Allocation Breakdown -->
					<div class="space-y-3">
						<h3 class="font-semibold text-gray-900">Allocation Breakdown</h3>
						
						<!-- Winners Allocation -->
						<div class="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200">
							<div class="flex items-center gap-2">
								{#if Icon}
									<Icon icon="mdi:trophy" class="w-4 h-4 text-green-600" />
								{/if}
								<div>
									<p class="font-medium text-gray-900 text-sm">Winners ({calculatedDistribution.winners.percentage}%)</p>
									{#if pendingWinners?.count}
										<p class="text-xs text-gray-600">{pendingWinners.count} recipients</p>
									{/if}
								</div>
							</div>
							<div class="text-right">
								<p class="font-bold text-green-600 text-sm">{calculatedDistribution.winners.amount.toFixed(3)} SOL</p>
								{#if pendingWinners?.count}
									<p class="text-xs text-gray-500">≈{(calculatedDistribution.winners.amount / pendingWinners.count).toFixed(3)} each</p>
								{/if}
							</div>
						</div>

						<!-- Holding Allocation -->
						<div class="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
							<div class="flex items-center gap-2">
								{#if Icon}
									<Icon icon="mdi:bank" class="w-4 h-4 text-blue-600" />
								{/if}
								<div>
									<p class="font-medium text-gray-900 text-sm">Holding ({calculatedDistribution.holding.percentage}%)</p>
									<p class="text-xs text-gray-600">Future rounds</p>
								</div>
							</div>
							<p class="font-bold text-blue-600 text-sm">{calculatedDistribution.holding.amount.toFixed(3)} SOL</p>
						</div>

						<!-- Charity Allocation -->
						<div class="flex items-center justify-between p-2 bg-purple-50 rounded-lg border border-purple-200">
							<div class="flex items-center gap-2">
								{#if Icon}
									<Icon icon="mdi:heart" class="w-4 h-4 text-purple-600" />
								{/if}
								<div>
									<p class="font-medium text-gray-900 text-sm">Charity ({calculatedDistribution.charity.percentage}%)</p>
									<p class="text-xs text-gray-600">Contributions</p>
								</div>
							</div>
							<p class="font-bold text-purple-600 text-sm">{calculatedDistribution.charity.amount.toFixed(3)} SOL</p>
						</div>
					</div>
				</div>

				<!-- Payment Destinations - Main Section -->
				<div class="space-y-4">
					<h3 class="font-semibold text-gray-900">Payment Destinations</h3>
					
					<!-- Two Column Layout -->
					<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
						<!-- Left Column: Winners -->
						<div class="space-y-4">
							<!-- Winners Payments -->
							{#if pendingWinners?.drawGroups && pendingWinners.drawGroups.length > 0}
								<div class="border rounded-lg overflow-hidden">
									<div class="bg-green-50 px-4 py-2 border-b border-green-200">
										<div class="flex items-center gap-2">
											{#if Icon}
												<Icon icon="mdi:trophy" class="w-4 h-4 text-green-600" />
											{/if}
											<h4 class="font-medium text-green-900 text-sm">
												Winners ({pendingWinners.count} recipients)
											</h4>
											<span class="text-xs text-green-700">
												{calculatedDistribution.winners.amount.toFixed(3)} SOL total
											</span>
										</div>
									</div>
									<div>
										{#each pendingWinners.drawGroups as drawGroup (drawGroup.drawId)}
											{#each drawGroup.winners as winner (winner.id)}
												<div class="flex items-center justify-between p-2 border-b border-gray-100 last:border-b-0">
													<div class="flex items-center gap-2">
														<div class="text-sm">{winner.animalEmoji}</div>
														<div>
															<p class="font-medium text-gray-900 text-sm">{winner.animalName}</p>
															<button 
																class="text-xs text-gray-500 hover:text-gray-700 font-mono cursor-pointer"
																on:click={() => copyToClipboard(winner.walletAddress)}
																title="Click to copy full address"
															>
																{truncateWalletAddress(winner.walletAddress, 6, 6)}
																{#if Icon}
																	<Icon icon="mdi:content-copy" class="w-3 h-3 inline ml-1" />
																{/if}
															</button>
														</div>
													</div>
													<div class="text-right">
														<p class="font-bold text-green-600 text-sm">
															{(calculatedDistribution.winners.amount / pendingWinners.count).toFixed(3)} SOL
														</p>
														<p class="text-xs text-gray-500">Draw #{winner.drawNumber}</p>
													</div>
												</div>
											{/each}
										{/each}
									</div>
								</div>
							{/if}
						</div>

						<!-- Right Column: Wallets & Summary -->
						<div class="space-y-4">
							<!-- Holding Wallet Payment -->
							<div class="border rounded-lg overflow-hidden">
								<div class="bg-blue-50 px-4 py-2 border-b border-blue-200">
									<div class="flex items-center gap-2">
										{#if Icon}
											<Icon icon="mdi:bank" class="w-4 h-4 text-blue-600" />
										{/if}
										<h4 class="font-medium text-blue-900 text-sm">Holding Wallet</h4>
										<span class="text-xs text-blue-700">
											{calculatedDistribution.holding.amount.toFixed(3)} SOL
										</span>
									</div>
								</div>
								<div class="p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900 text-sm">{walletAddresses.holdingWalletName}</p>
											<button 
												class="text-xs text-gray-500 hover:text-gray-700 font-mono cursor-pointer"
												on:click={() => copyToClipboard(walletAddresses.holdingWallet)}
												title="Click to copy full address"
											>
												{truncateWalletAddress(walletAddresses.holdingWallet, 6, 6)}
												{#if Icon}
													<Icon icon="mdi:content-copy" class="w-3 h-3 inline ml-1" />
												{/if}
											</button>
										</div>
										<p class="font-bold text-blue-600 text-sm">{calculatedDistribution.holding.amount.toFixed(3)} SOL</p>
									</div>
								</div>
							</div>

							<!-- Charity Wallet Payment -->
							<div class="border rounded-lg overflow-hidden">
								<div class="bg-purple-50 px-4 py-2 border-b border-purple-200">
									<div class="flex items-center gap-2">
										{#if Icon}
											<Icon icon="mdi:heart" class="w-4 h-4 text-purple-600" />
										{/if}
										<h4 class="font-medium text-purple-900 text-sm">Charity Wallet</h4>
										<span class="text-xs text-purple-700">
											{calculatedDistribution.charity.amount.toFixed(3)} SOL
										</span>
									</div>
								</div>
								<div class="p-3">
									<div class="flex items-center justify-between">
										<div>
											<p class="font-medium text-gray-900 text-sm">{walletAddresses.charityWalletName}</p>
											<button 
												class="text-xs text-gray-500 hover:text-gray-700 font-mono cursor-pointer"
												on:click={() => copyToClipboard(walletAddresses.charityWallet)}
												title="Click to copy full address"
											>
												{truncateWalletAddress(walletAddresses.charityWallet, 6, 6)}
												{#if Icon}
													<Icon icon="mdi:content-copy" class="w-3 h-3 inline ml-1" />
												{/if}
											</button>
										</div>
										<p class="font-bold text-purple-600 text-sm">{calculatedDistribution.charity.amount.toFixed(3)} SOL</p>
									</div>
								</div>
							</div>

							<!-- Total Verification -->
							<div class="bg-gray-50 rounded-lg p-3 border">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										{#if Icon}
											<Icon icon="mdi:calculator" class="w-4 h-4 text-gray-600" />
										{/if}
										<p class="font-medium text-gray-900 text-sm">Total Distribution</p>
									</div>
									<div class="text-right">
										<p class="font-bold text-gray-900 text-sm">{calculatedDistribution.total.toFixed(3)} SOL</p>
										<p class="text-xs text-gray-500">
											{pendingWinners?.count || 0} recipients + 2 wallets
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Warning -->
				<div class="bg-red-50 rounded-lg p-4 border border-red-200">
					<div class="flex items-start gap-3">
						{#if Icon}
							<Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600 mt-0.5" />
						{/if}
						<div>
							<p class="font-medium text-red-900">Important Notice</p>
							<p class="text-sm text-red-700 mt-1">
								This action cannot be undone. All pending winners will be marked as paid and SOL will be distributed according to the allocation above.
							</p>
						</div>
					</div>
				</div>

				{#if error}
					<div class="bg-red-50 rounded-lg p-4 border border-red-200">
						<p class="text-sm text-red-700">{error}</p>
					</div>
				{/if}
			</div>
		{/if}

		<DialogFooter>
			<Button 
				variant="outline" 
				on:click={() => showDistributionDialog = false}
				disabled={executingDistribution}
			>
				Cancel
			</Button>
			<Button 
				on:click={executeDistribution}
				disabled={executingDistribution || !calculatedDistribution}
				class="bg-orange-600 hover:bg-orange-700"
			>
				{#if executingDistribution}
					{#if Icon}
						<Icon icon="mdi:loading" class="w-4 h-4 mr-2 animate-spin" />
					{/if}
					Executing...
				{:else}
					{#if Icon}
						<Icon icon="mdi:send" class="w-4 h-4 mr-2" />
					{/if}
					Execute Distribution
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>

<style>
	:global(.wide-dialog) {
		max-width: none !important;
		width: 90vw !important;
		max-width: 1200px !important;
	}
</style>