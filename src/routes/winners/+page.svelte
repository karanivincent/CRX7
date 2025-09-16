<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay, getTokenSymbol } from '$lib/config/client';
	import { onMount } from 'svelte';
	import HistoryFilters from '$lib/components/history/HistoryFilters.svelte';
	import StatsOverview from '$lib/components/history/StatsOverview.svelte';
	
	// Cache the config values
	const tokenDisplay = getTokenDisplay();
	const tokenSymbol = getTokenSymbol();
	
	let winners: any[] = [];
	let recentWinners: any[] = [];
	let biggestWins: any[] = [];
	let leaderboard: any[] = [];
	let loading = true;
	let error = '';
	let page = 1;
	let hasMore = true;
	let totalWinners = 0;
	let totalPages = 1;
	let pageSize = 20;
	let activeTab = 'all'; // 'all', 'recent', 'biggest', 'leaderboard'
	
	// Filter state
	let searchTerm = '';
	let sortBy = 'won_at';
	let sortOrder = 'desc';
	let dateFrom = '';
	let dateTo = '';
	let minPrize = '';
	let maxPrize = '';
	
	onMount(() => {
		loadWinners();
		loadRecentWinners();
		loadBiggestWins();
		loadLeaderboard();
	});
	
	async function loadWinners(reset = false) {
		if (typeof window === 'undefined') return; // Skip on server-side
		
		loading = true;
		error = '';
		
		if (reset) {
			winners = [];
			page = 1;
		}
		
		try {
			const params = new URLSearchParams({
				action: 'all',
				page: page.toString(),
				limit: '20',
				sort: sortBy,
				order: sortOrder
			});
			
			const response = await fetch(`/api/winners?${params}`);
			const data = await response.json();
			
			if (data.success) {
				if (reset) {
					winners = data.winners;
				} else {
					// Deduplicate winners by ID to prevent duplicate key errors
					const existingIds = new Set(winners.map(w => w.id));
					const newWinners = data.winners.filter(w => !existingIds.has(w.id));
					winners = [...winners, ...newWinners];
				}
				
				totalWinners = data.pagination.total;
				totalPages = data.pagination.totalPages;
				hasMore = data.pagination.page < data.pagination.totalPages;
			} else {
				error = data.error || 'Failed to load winners';
			}
		} catch (err) {
			error = 'Failed to load winners';
			console.error('Error loading winners:', err);
		} finally {
			loading = false;
		}
	}
	
	async function loadRecentWinners() {
		if (typeof window === 'undefined') return; // Skip on server-side
		try {
			const response = await fetch('/api/winners?action=recent&limit=5');
			const data = await response.json();
			if (data.success) {
				recentWinners = data.recent;
			}
		} catch (err) {
			console.error('Error loading recent winners:', err);
		}
	}
	
	async function loadBiggestWins() {
		if (typeof window === 'undefined') return; // Skip on server-side
		try {
			const response = await fetch('/api/winners?action=biggest&limit=10');
			const data = await response.json();
			if (data.success) {
				biggestWins = data.biggest;
			}
		} catch (err) {
			console.error('Error loading biggest wins:', err);
		}
	}
	
	async function loadLeaderboard() {
		if (typeof window === 'undefined') return; // Skip on server-side
		try {
			const response = await fetch('/api/winners?action=leaderboard&limit=10');
			const data = await response.json();
			if (data.success) {
				leaderboard = data.leaderboard;
			}
		} catch (err) {
			console.error('Error loading leaderboard:', err);
		}
	}
	
	function loadMore() {
		if (!loading && hasMore && activeTab === 'all') {
			page++;
			loadWinners();
		}
	}
	
	function goToPage(newPage: number) {
		if (newPage >= 1 && newPage <= totalPages && newPage !== page && !loading) {
			page = newPage;
			loadWinners(true); // Always reset when going to a specific page
		}
	}
	
	function nextPage() {
		if (page < totalPages) {
			goToPage(page + 1);
		}
	}
	
	function prevPage() {
		if (page > 1) {
			goToPage(page - 1);
		}
	}
	
	function onFiltersChange() {
		page = 1; // Reset to first page when filters change
		loadWinners(true);
	}
	
	function handleSort(field: string) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
		} else {
			sortBy = field;
			sortOrder = 'desc';
		}
		page = 1; // Reset to first page when sorting changes
		loadWinners(true); // Reload data with new sorting
	}
	
	function setActiveTab(tab: string) {
		activeTab = tab;
		if (tab === 'all') {
			loadWinners(true);
		}
	}
	
	// Filter winners client-side (for demo purposes)
	$: filteredWinners = winners.filter(winner => {
		if (searchTerm && !winner.wallet_address.toLowerCase().includes(searchTerm.toLowerCase())) {
			return false;
		}
		
		if (dateFrom && new Date(winner.won_at) < new Date(dateFrom)) {
			return false;
		}
		
		if (dateTo && new Date(winner.won_at) > new Date(dateTo)) {
			return false;
		}
		
		const prizeAmount = parseFloat(winner.prize_amount || '0');
		if (minPrize && prizeAmount < parseFloat(minPrize)) {
			return false;
		}
		
		if (maxPrize && prizeAmount > parseFloat(maxPrize)) {
			return false;
		}
		
		return true;
	});
	
	$: currentData = activeTab === 'all' ? filteredWinners : 
	                 activeTab === 'recent' ? recentWinners :
	                 activeTab === 'biggest' ? biggestWins :
	                 activeTab === 'leaderboard' ? leaderboard : [];
</script>

<svelte:head>
	<title>Winners - {tokenDisplay} Champions 🏆</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🎉 WINNER'S CIRCLE 🎉
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				{tokenDisplay} <span class="text-orange-500">Winners</span> Hall of Fame 🏆
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				Every lucky winner. Every prize. Every transaction. 
				<br/>
				<span class="text-sm italic opacity-75">Transparency is the name of the game 🔍</span>
			</p>
		</div>

		<!-- Statistics Overview -->
		<StatsOverview />

		{#if winners.length === 0 && !loading}
			<!-- No Data State -->
			<div class="max-w-2xl mx-auto">
				<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
					<CardHeader class="text-center pb-2">
						<div class="flex justify-center mb-4">
							<Icon icon="mdi:trophy-award" class="h-16 w-16 text-orange-500 animate-pulse" />
						</div>
						<CardTitle class="text-2xl font-bold text-gray-900">
							No Winners Yet 🎊
						</CardTitle>
						<CardDescription class="text-base text-gray-600">
							The first lottery hasn't happened yet. Someone will be first!
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center space-y-6">
						<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
							<div class="font-semibold text-orange-800 mb-2">🏆 Coming Soon:</div>
							<div class="text-sm text-orange-700">
								Complete winner gallery • Public verification • Transaction links • Leaderboards
							</div>
						</div>

						<div class="flex flex-col sm:flex-row gap-4 justify-center">
							<Button 
								href="/"
								class="px-6 py-3 hover:scale-105 transition-transform"
							>
								🏠 Back to Home
							</Button>
							<Button 
								variant="outline"
								href="/past-draws"
								class="px-6 py-3 hover:scale-105 transition-transform"
							>
								📊 View Draw History
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Tab Navigation -->
			<div class="flex flex-wrap justify-center gap-2 mb-8">
				<Button
					variant={activeTab === 'all' ? 'default' : 'outline'}
					size="sm"
					on:click={() => setActiveTab('all')}
					class="px-4 py-2"
				>
					<Icon icon="mdi:account-group" class="w-4 h-4 mr-2" />
					All Winners ({totalWinners})
				</Button>
				
				<Button
					variant={activeTab === 'recent' ? 'default' : 'outline'}
					size="sm"
					on:click={() => setActiveTab('recent')}
					class="px-4 py-2"
				>
					<Icon icon="mdi:clock" class="w-4 h-4 mr-2" />
					Recent Wins
				</Button>
				
				<Button
					variant={activeTab === 'biggest' ? 'default' : 'outline'}
					size="sm"
					on:click={() => setActiveTab('biggest')}
					class="px-4 py-2"
				>
					<Icon icon="mdi:trophy" class="w-4 h-4 mr-2" />
					Biggest Wins
				</Button>
				
				<Button
					variant={activeTab === 'leaderboard' ? 'default' : 'outline'}
					size="sm"
					on:click={() => setActiveTab('leaderboard')}
					class="px-4 py-2"
				>
					<Icon icon="mdi:podium" class="w-4 h-4 mr-2" />
					Leaderboard
				</Button>
			</div>

			<!-- Filters (only for 'all' tab) -->
			{#if activeTab === 'all'}
				<HistoryFilters 
					bind:searchTerm
					bind:sortBy
					bind:sortOrder
					bind:dateFrom
					bind:dateTo
					bind:minPrize
					bind:maxPrize
					{onFiltersChange}
					type="winners"
				/>
			{/if}

			<!-- Results Summary -->
			{#if currentData.length > 0}
				<div class="flex items-center justify-between mb-6">
					<div class="text-sm text-gray-600">
						Showing <span class="font-semibold">{currentData.length}</span> 
						{currentData.length === 1 ? 'winner' : 'winners'}
						{#if activeTab === 'all' && totalWinners > currentData.length}
							of <span class="font-semibold">{totalWinners}</span> total
						{/if}
					</div>
					
					<div class="text-sm text-gray-500">
						{#if loading && activeTab === 'all'}
							<Icon icon="mdi:loading" class="w-4 h-4 animate-spin inline mr-1" />
							Loading...
						{:else if hasMore && activeTab === 'all'}
							{winners.length} loaded, more available
						{:else if winners.length > 0 && activeTab === 'all'}
							All winners loaded
						{/if}
					</div>
				</div>
			{/if}

			<!-- Error State -->
			{#if error}
				<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
					<div class="flex items-center gap-3">
						<Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600" />
						<div>
							<div class="font-medium text-red-800">Failed to load winners</div>
							<div class="text-sm text-red-700">{error}</div>
						</div>
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						class="mt-3"
						on:click={() => loadWinners(true)}
					>
						Try Again
					</Button>
				</div>
			{/if}

			<!-- Winners Grid -->
			{#if currentData.length > 0}
				<!-- Special Layout for Leaderboard -->
				{#if activeTab === 'leaderboard'}
					<div class="space-y-4 mb-8">
						{#each leaderboard as winner, index (winner.wallet_address)}
							<Card class="border-2 {index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' : index === 1 ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-white' : index === 2 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-white' : 'border-gray-200'}">
								<CardContent class="p-6">
									<div class="flex items-center gap-6">
										<!-- Rank -->
										<div class="text-center">
											<div class="text-4xl font-bold {index === 0 ? 'text-yellow-600' : index === 1 ? 'text-gray-600' : index === 2 ? 'text-orange-600' : 'text-gray-400'}">
												#{index + 1}
											</div>
											{#if index < 3}
												<div class="text-2xl">
													{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
												</div>
											{/if}
										</div>
										
										<!-- Winner Info -->
										<div class="flex-1">
											<div class="flex items-center gap-3 mb-2">
												<span class="text-2xl">{winner.animal_emoji}</span>
												<div>
													<div class="font-bold text-lg uppercase">{winner.animal_name}</div>
													<div class="font-mono text-sm text-gray-600">
														{winner.wallet_address.slice(0, 6)}...{winner.wallet_address.slice(-6)}
													</div>
												</div>
											</div>
										</div>
										
										<!-- Stats -->
										<div class="text-right">
											<div class="text-2xl font-bold text-green-600">
												{parseFloat(winner.total_won).toFixed(2)} SOL
											</div>
											<div class="text-sm text-gray-600">
												{winner.wins_count} win{winner.wins_count > 1 ? 's' : ''}
											</div>
											<div class="text-xs text-gray-500">
												Last: {new Date(winner.last_win).toLocaleDateString()}
											</div>
										</div>
									</div>
								</CardContent>
							</Card>
						{/each}
					</div>
				{:else}
					<!-- Winners Table -->
					<div class="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="bg-gray-50 border-b border-gray-200">
									<tr>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Winner
										</th>
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Wallet Address
										</th>
										{#if activeTab === 'all'}
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
													on:click={() => handleSort('prize_amount')}>
												<div class="flex items-center gap-1">
													Prize Amount
													{#if sortBy === 'prize_amount'}
														<Icon icon={sortOrder === 'desc' ? 'mdi:chevron-down' : 'mdi:chevron-up'} class="w-4 h-4" />
													{/if}
												</div>
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
													on:click={() => handleSort('draw_sequence')}>
												<div class="flex items-center gap-1">
													Draw #
													{#if sortBy === 'draw_sequence'}
														<Icon icon={sortOrder === 'desc' ? 'mdi:chevron-down' : 'mdi:chevron-up'} class="w-4 h-4" />
													{/if}
												</div>
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
													on:click={() => handleSort('won_at')}>
												<div class="flex items-center gap-1">
													Date Won
													{#if sortBy === 'won_at'}
														<Icon icon={sortOrder === 'desc' ? 'mdi:chevron-down' : 'mdi:chevron-up'} class="w-4 h-4" />
													{/if}
												</div>
											</th>
										{:else}
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												{activeTab === 'leaderboard' ? 'Total Won' : 'Prize Amount'}
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												{activeTab === 'leaderboard' ? 'Win Count' : 'Draw #'}
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
												{activeTab === 'leaderboard' ? 'Last Win' : 'Date Won'}
											</th>
										{/if}
										<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
											Verify
										</th>
									</tr>
								</thead>
								<tbody class="bg-white divide-y divide-gray-200">
									{#each currentData as winner (winner.id || winner.wallet_address)}
										<tr class="hover:bg-gray-50 transition-colors">
											<!-- Winner (Animal) -->
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="flex items-center gap-3">
													<span class="text-2xl">{winner.animal_emoji}</span>
													<div>
														<div class="font-semibold text-gray-900 uppercase text-sm">
															{winner.animal_name}
														</div>
													</div>
												</div>
											</td>
											
											<!-- Wallet Address -->
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="flex items-center gap-2">
													<code class="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
														{winner.wallet_address.slice(0, 6)}...{winner.wallet_address.slice(-6)}
													</code>
													<button
														class="text-gray-400 hover:text-gray-600 transition-colors"
														on:click={() => navigator.clipboard.writeText(winner.wallet_address)}
														title="Copy full address"
													>
														<Icon icon="mdi:content-copy" class="w-4 h-4" />
													</button>
												</div>
											</td>
											
											<!-- Prize Amount -->
											<td class="px-6 py-4 whitespace-nowrap">
												{#if activeTab === 'leaderboard'}
													<div class="font-bold text-green-600">
														{parseFloat(winner.total_won || 0).toFixed(3)} SOL
													</div>
													<div class="text-xs text-gray-500">
														{winner.wins_count} win{winner.wins_count > 1 ? 's' : ''}
													</div>
												{:else}
													<div class="font-bold text-green-600">
														{parseFloat(winner.prize_amount || 0).toFixed(3)} SOL
													</div>
													<div class="text-xs text-gray-500">
														≈ ${(parseFloat(winner.prize_amount || 0) * 150).toFixed(2)}
													</div>
												{/if}
											</td>
											
											<!-- Draw Number -->
											<td class="px-6 py-4 whitespace-nowrap">
												{#if activeTab === 'leaderboard'}
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
														Total Wins
													</span>
												{:else}
													<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
														#{winner.draw?.draw_number || winner.drawNumber || winner.draw_sequence || 'N/A'}
													</span>
												{/if}
											</td>
											
											<!-- Date Won -->
											<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												{#if activeTab === 'leaderboard'}
													{new Date(winner.last_win).toLocaleDateString()}
													<div class="text-xs text-gray-500">
														Last win
													</div>
												{:else}
													{new Date(winner.won_at || winner.created_at).toLocaleDateString()}
													<div class="text-xs text-gray-500">
														{new Date(winner.won_at || winner.created_at).toLocaleTimeString()}
													</div>
												{/if}
											</td>
											
											<!-- Verify Actions -->
											<td class="px-6 py-4 whitespace-nowrap">
												<div class="flex items-center gap-2">
													<!-- Solscan Link -->
													<a 
														href="https://solscan.io/account/{winner.wallet_address}"
														target="_blank"
														rel="noopener noreferrer"
														class="text-blue-600 hover:text-blue-800 transition-colors"
														title="View on Solscan"
													>
														<Icon icon="mdi:open-in-new" class="w-4 h-4" />
													</a>
													
													<!-- Transaction Link (if available) -->
													{#if winner.transaction_hash}
														<a 
															href="https://solscan.io/tx/{winner.transaction_hash}"
															target="_blank"
															rel="noopener noreferrer"
															class="text-green-600 hover:text-green-800 transition-colors"
															title="View transaction"
														>
															<Icon icon="mdi:check-circle" class="w-4 h-4" />
														</a>
													{:else}
														<span class="text-gray-400" title="Transaction pending">
															<Icon icon="mdi:clock" class="w-4 h-4" />
														</span>
													{/if}
												</div>
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>
				{/if}

				<!-- Pagination Controls (only for 'all' tab) -->
				{#if activeTab === 'all' && totalPages > 1}
					<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-lg">
						<div class="flex flex-1 justify-between sm:hidden">
							<!-- Mobile pagination -->
							<Button
								variant="outline"
								size="sm"
								disabled={page <= 1 || loading}
								on:click={prevPage}
							>
								Previous
							</Button>
							<span class="text-sm text-gray-700 self-center">
								Page {page} of {totalPages}
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={page >= totalPages || loading}
								on:click={nextPage}
							>
								Next
							</Button>
						</div>
						<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
							<div>
								<p class="text-sm text-gray-700">
									Showing
									<span class="font-medium">{(page - 1) * pageSize + 1}</span>
									to
									<span class="font-medium">{Math.min(page * pageSize, totalWinners)}</span>
									of
									<span class="font-medium">{totalWinners}</span>
									results
								</p>
							</div>
							<div>
								<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
									<!-- Previous button -->
									<Button
										variant="outline"
										size="sm"
										disabled={page <= 1 || loading}
										on:click={prevPage}
										class="rounded-l-md"
									>
										<Icon icon="mdi:chevron-left" class="w-4 h-4" />
										<span class="sr-only">Previous</span>
									</Button>
									
									<!-- Page numbers -->
									{#each Array.from({length: Math.min(7, totalPages)}, (_, i) => {
										if (totalPages <= 7) return i + 1;
										if (page <= 4) return i + 1;
										if (page > totalPages - 4) return totalPages - 6 + i;
										return page - 3 + i;
									}) as pageNum}
										<Button
											variant={pageNum === page ? "default" : "outline"}
											size="sm"
											disabled={loading}
											on:click={() => goToPage(pageNum)}
											class="text-sm"
										>
											{pageNum}
										</Button>
									{/each}
									
									<!-- Next button -->
									<Button
										variant="outline"
										size="sm"
										disabled={page >= totalPages || loading}
										on:click={nextPage}
										class="rounded-r-md"
									>
										<span class="sr-only">Next</span>
										<Icon icon="mdi:chevron-right" class="w-4 h-4" />
									</Button>
								</nav>
							</div>
						</div>
					</div>
				{/if}

				<!-- Loading More Indicator -->
				{#if loading && winners.length > 0 && activeTab === 'all'}
					<div class="text-center py-8">
						<Icon icon="mdi:loading" class="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
						<div class="text-sm text-gray-600">Loading more winners...</div>
					</div>
				{/if}
			{:else if !loading}
				<!-- No Results -->
				<div class="text-center py-12">
					<Icon icon="mdi:account-search" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">No winners found</h3>
					<p class="text-gray-600 mb-4">
						{#if activeTab === 'all'}
							Try adjusting your filters or search terms.
						{:else}
							No data available for this view yet.
						{/if}
					</p>
					{#if activeTab === 'all'}
						<Button 
							variant="outline" 
							on:click={() => { 
								searchTerm = ''; 
								dateFrom = ''; 
								dateTo = ''; 
								minPrize = ''; 
								maxPrize = ''; 
								onFiltersChange(); 
							}}
						>
							Clear Filters
						</Button>
					{/if}
				</div>
			{/if}

			<!-- Initial Loading -->
			{#if loading && winners.length === 0}
				<div class="text-center py-16">
					<Icon icon="mdi:loading" class="w-12 h-12 animate-spin mx-auto text-orange-600 mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Loading winners...</h3>
					<p class="text-gray-600">Fetching all lucky winners from the database</p>
				</div>
			{/if}
		{/if}
	</div>
</div>