<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	// Removed RoundCard import - using table layout instead
	// Removed HistoryFilters import - using simplified inline filters
	// Removed StatsOverview import for simplified design
	
	let rounds: any[] = [];
	let loading = true;
	let error = '';
	let page = 1;
	let hasMore = true;
	let totalRounds = 0;
	
	// Simplified stats
	let stats = {
		totalDistributed: 0,
		totalRounds: 0,
		latestDraw: null as any
	};
	let statsLoading = true;
	
	// Filter state
	let searchTerm = '';
	let sortBy = 'completed_at';
	let sortOrder = 'desc';
	let dateFrom = '';
	let dateTo = '';
	let minPrize = '';
	let maxPrize = '';
	
	onMount(() => {
		loadRounds();
		loadSimplifiedStats();
	});
	
	async function loadSimplifiedStats() {
		try {
			const [statsResponse, latestResponse] = await Promise.all([
				fetch('/api/rounds?action=stats'),
				fetch('/api/rounds?action=latest')
			]);
			
			const [statsData, latestData] = await Promise.all([
				statsResponse.json(),
				latestResponse.json()
			]);
			
			if (statsData.success) {
				stats.totalDistributed = statsData.stats.totalDistributed || 0;
				stats.totalRounds = statsData.stats.totalRounds || 0;
			}
			
			if (latestData.success) {
				stats.latestDraw = latestData.latestDraw;
			}
		} catch (error) {
			console.error('Failed to load stats:', error);
		} finally {
			statsLoading = false;
		}
	}
	
	async function loadRounds(reset = false) {
		if (typeof window === 'undefined') return; // Skip on server-side
		
		loading = true;
		error = '';
		
		if (reset) {
			rounds = [];
			page = 1;
		}
		
		try {
			const params = new URLSearchParams({
				action: 'history',
				page: page.toString(),
				limit: '12'
			});
			
			const response = await fetch(`/api/rounds?${params}`);
			const data = await response.json();
			
			if (data.success) {
				if (reset) {
					rounds = data.draws;
				} else {
					// Deduplicate rounds by ID to prevent duplicate key errors
					const existingIds = new Set(rounds.map(r => r.id));
					const newRounds = data.draws.filter(r => !existingIds.has(r.id));
					rounds = [...rounds, ...newRounds];
				}
				
				totalRounds = data.pagination.total;
				hasMore = data.pagination.page < data.pagination.totalPages;
			} else {
				error = data.error || 'Failed to load rounds';
			}
		} catch (err) {
			error = 'Failed to load rounds';
			console.error('Error loading rounds:', err);
		} finally {
			loading = false;
		}
	}
	
	
	function loadMore() {
		if (!loading && hasMore) {
			page++;
			loadRounds();
		}
	}
	
	function onFiltersChange() {
		// For now, just reload - in production you'd want to implement server-side filtering
		loadRounds(true);
	}
	
	// Filter rounds client-side (for demo purposes)
	$: filteredRounds = rounds.filter(round => {
		if (searchTerm && !round.draw_number.toString().includes(searchTerm)) {
			return false;
		}
		
		if (dateFrom && new Date(round.completed_at) < new Date(dateFrom)) {
			return false;
		}
		
		if (dateTo && new Date(round.completed_at) > new Date(dateTo)) {
			return false;
		}
		
		const prizePool = parseFloat(round.total_prize_pool || '0');
		if (minPrize && prizePool < parseFloat(minPrize)) {
			return false;
		}
		
		if (maxPrize && prizePool > parseFloat(maxPrize)) {
			return false;
		}
		
		return true;
	});
</script>

<svelte:head>
	<title>Past Draws - Who Got Lucky 🎰</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
				Past <span class="text-orange-500">Lottery</span> Draws
			</h1>
			<p class="text-lg text-gray-600 max-w-2xl mx-auto">
				Complete transparency. Every draw. Every winner. Every transaction.
			</p>
		</div>

		<!-- Simplified Statistics -->
		<div class="bg-white rounded-lg border border-gray-200 mb-8 p-6">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<!-- Total Distributed -->
				<div class="text-center">
					{#if statsLoading}
						<div class="animate-pulse">
							<div class="h-8 bg-gray-200 rounded w-20 mx-auto mb-2"></div>
							<div class="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
						</div>
					{:else}
						<div class="text-3xl font-bold text-gray-900 mb-1">
							{stats.totalDistributed.toFixed(2)} SOL
						</div>
						<div class="text-sm text-gray-600">Total Distributed</div>
					{/if}
				</div>
				
				<!-- Total Rounds -->
				<div class="text-center">
					{#if statsLoading}
						<div class="animate-pulse">
							<div class="h-8 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
							<div class="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
						</div>
					{:else}
						<div class="text-3xl font-bold text-gray-900 mb-1">
							{stats.totalRounds}
						</div>
						<div class="text-sm text-gray-600">Completed Rounds</div>
					{/if}
				</div>
				
				<!-- Latest Draw -->
				<div class="text-center">
					{#if statsLoading}
						<div class="animate-pulse">
							<div class="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
							<div class="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
						</div>
					{:else if stats.latestDraw}
						<div class="text-3xl font-bold text-gray-900 mb-1">
							#{stats.latestDraw.draw_number}
						</div>
						<div class="text-sm text-gray-600">Latest Draw</div>
					{:else}
						<div class="text-3xl font-bold text-gray-400 mb-1">
							-
						</div>
						<div class="text-sm text-gray-600">Latest Draw</div>
					{/if}
				</div>
			</div>
		</div>

		{#if rounds.length === 0 && !loading}
			<!-- No Data State -->
			<div class="max-w-2xl mx-auto">
				<Card class="border border-gray-200 bg-white">
					<CardHeader class="text-center pb-2">
						<div class="flex justify-center mb-4">
							<Icon icon="mdi:history" class="h-16 w-16 text-orange-500" />
						</div>
						<CardTitle class="text-2xl font-bold text-gray-900">
							No Draws Yet 📜
						</CardTitle>
						<CardDescription class="text-base text-gray-600">
							The first lottery hasn't happened yet. Be there when history begins!
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center space-y-6">
						<div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div class="font-semibold text-gray-800 mb-2">🚀 Coming Soon:</div>
							<div class="text-sm text-gray-600">
								Complete draw history • Winner verification • Transaction links • Full transparency
							</div>
						</div>

						<div class="flex flex-col sm:flex-row gap-4 justify-center">
							<Button 
								href="/"
								class="px-6 py-3"
							>
								🏠 Back to Home
							</Button>
							<Button 
								variant="outline"
								href="/winners"
								class="px-6 py-3"
							>
								🏆 Check Winners
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Simplified Filters -->
			<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6">
				<div class="flex flex-col sm:flex-row gap-4 items-center">
					<!-- Search -->
					<div class="flex-1">
						<div class="relative">
							<Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
							<input
								type="text"
								bind:value={searchTerm}
								placeholder="Search by draw number..."
								class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
								on:input={onFiltersChange}
							/>
						</div>
					</div>
					
					<!-- Sort -->
					<div class="flex items-center gap-2">
						<select 
							bind:value={sortBy}
							class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						>
							<option value="completed_at">Date Completed</option>
							<option value="draw_number">Draw Number</option>
							<option value="total_prize_pool">Prize Pool</option>
						</select>
						
						<button
							class="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
							on:click={() => { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; }}
						>
							<Icon 
								icon={sortOrder === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} 
								class="w-4 h-4 text-gray-600" 
							/>
						</button>
					</div>
				</div>
			</div>

			<!-- Results Summary -->
			{#if filteredRounds.length > 0}
				<div class="flex items-center justify-between mb-6">
					<div class="text-sm text-gray-600">
						Showing <span class="font-semibold">{filteredRounds.length}</span> 
						{filteredRounds.length === 1 ? 'round' : 'rounds'}
						{#if totalRounds > filteredRounds.length}
							of <span class="font-semibold">{totalRounds}</span> total
						{/if}
					</div>
					
					<div class="text-sm text-gray-500">
						{#if loading}
							<Icon icon="mdi:loading" class="w-4 h-4 animate-spin inline mr-1" />
							Loading...
						{:else if hasMore}
							{rounds.length} loaded, more available
						{:else if rounds.length > 0}
							All rounds loaded
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
							<div class="font-medium text-red-800">Failed to load rounds</div>
							<div class="text-sm text-red-700">{error}</div>
						</div>
					</div>
					<Button 
						variant="outline" 
						size="sm" 
						class="mt-3"
						on:click={() => loadRounds(true)}
					>
						Try Again
					</Button>
				</div>
			{/if}

			<!-- Rounds Table - Desktop -->
			{#if filteredRounds.length > 0}
				<div class="bg-white rounded-lg border border-gray-200 overflow-hidden mb-8">
					<!-- Desktop Table View -->
					<div class="hidden md:block overflow-x-auto">
						<table class="w-full">
							<thead class="bg-gray-50 border-b border-gray-200">
								<tr>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Draw
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date Completed
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Prize Pool
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Winners
									</th>
									<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Action
									</th>
								</tr>
							</thead>
							<tbody class="bg-white divide-y divide-gray-200">
								{#each filteredRounds as round (round.id)}
									<tr class="hover:bg-gray-50 transition-colors">
										<!-- Draw Number -->
										<td class="px-6 py-4 whitespace-nowrap">
											<div class="font-semibold text-gray-900">
												Draw #{round.draw_number}
											</div>
										</td>
										
										<!-- Date Completed -->
										<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
											{#if round.completed_at}
												{new Date(round.completed_at).toLocaleDateString()}
												<div class="text-xs text-gray-500">
													{new Date(round.completed_at).toLocaleTimeString()}
												</div>
											{:else}
												<span class="text-gray-400">In Progress</span>
											{/if}
										</td>
										
										<!-- Prize Pool -->
										<td class="px-6 py-4 whitespace-nowrap">
											{#if round.total_prize_pool}
												<div class="font-semibold text-gray-900">
													{parseFloat(round.total_prize_pool).toFixed(3)} SOL
												</div>
											{:else}
												<span class="text-gray-400">TBD</span>
											{/if}
										</td>
										
										<!-- Winners Count -->
										<td class="px-6 py-4 whitespace-nowrap">
											<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
												{round.winner?.[0]?.count || 0} winners
											</span>
										</td>
										
										<!-- Action -->
										<td class="px-6 py-4 whitespace-nowrap">
											<Button 
												size="sm" 
												variant="outline" 
												href="/winners?draw={round.draw_number}"
												class="text-orange-600 hover:text-orange-800 border-orange-200 hover:border-orange-300"
											>
												View Winners
											</Button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- Mobile Card View -->
					<div class="md:hidden">
						{#each filteredRounds as round (round.id)}
							<div class="p-4 border-b border-gray-200 last:border-b-0">
								<div class="flex items-center justify-between mb-3">
									<div class="font-semibold text-gray-900">
										Draw #{round.draw_number}
									</div>
									<Button 
										size="sm" 
										variant="outline" 
										href="/winners?draw={round.draw_number}"
										class="text-orange-600 hover:text-orange-800 border-orange-200 hover:border-orange-300 text-xs px-3"
									>
										Winners
									</Button>
								</div>

								<div class="space-y-2 text-sm">
									<div class="flex justify-between">
										<span class="text-gray-600">Date:</span>
										<span class="text-gray-900">
											{#if round.completed_at}
												{new Date(round.completed_at).toLocaleDateString()}
											{:else}
												<span class="text-gray-400">In Progress</span>
											{/if}
										</span>
									</div>

									<div class="flex justify-between">
										<span class="text-gray-600">Prize Pool:</span>
										<span class="font-semibold text-gray-900">
											{#if round.total_prize_pool}
												{parseFloat(round.total_prize_pool).toFixed(3)} SOL
											{:else}
												<span class="text-gray-400">TBD</span>
											{/if}
										</span>
									</div>

									<div class="flex justify-between">
										<span class="text-gray-600">Winners:</span>
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
											{round.winner?.[0]?.count || 0} winners
										</span>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<!-- Load More Button -->
				{#if hasMore && !loading}
					<div class="text-center">
						<Button 
							variant="outline" 
							size="lg"
							on:click={loadMore}
							class="px-8 py-3"
						>
							<Icon icon="mdi:chevron-down" class="w-4 h-4 mr-2" />
							Load More Rounds
						</Button>
					</div>
				{/if}

				<!-- Loading More Indicator -->
				{#if loading && rounds.length > 0}
					<div class="text-center py-8">
						<Icon icon="mdi:loading" class="w-8 h-8 animate-spin mx-auto text-orange-600 mb-2" />
						<div class="text-sm text-gray-600">Loading more rounds...</div>
					</div>
				{/if}
			{:else if !loading}
				<!-- No Results -->
				<div class="text-center py-12">
					<Icon icon="mdi:magnify" class="w-16 h-16 mx-auto text-gray-400 mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">No rounds found</h3>
					<p class="text-gray-600 mb-4">
						Try adjusting your filters or search terms.
					</p>
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
				</div>
			{/if}

			<!-- Initial Loading -->
			{#if loading && rounds.length === 0}
				<div class="text-center py-16">
					<Icon icon="mdi:loading" class="w-12 h-12 animate-spin mx-auto text-orange-600 mb-4" />
					<h3 class="text-lg font-semibold text-gray-900 mb-2">Loading draw history...</h3>
					<p class="text-gray-600">Fetching all completed lottery rounds</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

