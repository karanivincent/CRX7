<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import RoundCard from '$lib/components/history/RoundCard.svelte';
	import HistoryFilters from '$lib/components/history/HistoryFilters.svelte';
	import StatsOverview from '$lib/components/history/StatsOverview.svelte';
	
	let rounds: any[] = [];
	let loading = true;
	let error = '';
	let expandedRounds: Set<string> = new Set();
	let page = 1;
	let hasMore = true;
	let totalRounds = 0;
	
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
	});
	
	async function loadRounds(reset = false) {
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
					rounds = [...rounds, ...data.draws];
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
	
	function toggleExpanded(roundId: string) {
		if (expandedRounds.has(roundId)) {
			expandedRounds.delete(roundId);
		} else {
			expandedRounds.add(roundId);
		}
		expandedRounds = expandedRounds; // Trigger reactivity
	}
	
	function viewRoundDetails(roundId: string) {
		// Navigate to detailed round view (could be a modal or new page)
		console.log('View details for round:', roundId);
		// For now, just expand the card
		expandedRounds.add(roundId);
		expandedRounds = expandedRounds;
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
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🎰 DRAW HISTORY 🎰
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Past <span class="text-orange-500">Lottery</span> Draws 📊
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				Complete transparency. Every draw. Every winner. Every transaction.
				<br/>
				<span class="text-sm italic opacity-75">The most verifiable lottery in crypto 🔍</span>
			</p>
		</div>

		<!-- Statistics Overview -->
		<StatsOverview />

		{#if rounds.length === 0 && !loading}
			<!-- No Data State -->
			<div class="max-w-2xl mx-auto">
				<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
					<CardHeader class="text-center pb-2">
						<div class="flex justify-center mb-4">
							<Icon icon="mdi:history" class="h-16 w-16 text-orange-500 animate-spin-slow" />
						</div>
						<CardTitle class="text-2xl font-bold text-gray-900">
							No Draws Yet 📜
						</CardTitle>
						<CardDescription class="text-base text-gray-600">
							The first lottery hasn't happened yet. Be there when history begins!
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center space-y-6">
						<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
							<div class="font-semibold text-orange-800 mb-2">🚀 Coming Soon:</div>
							<div class="text-sm text-orange-700">
								Complete draw history • Winner verification • Transaction links • Full transparency
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
								href="/winners"
								class="px-6 py-3 hover:scale-105 transition-transform"
							>
								🏆 Check Winners
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		{:else}
			<!-- Filters -->
			<HistoryFilters 
				bind:searchTerm
				bind:sortBy
				bind:sortOrder
				bind:dateFrom
				bind:dateTo
				bind:minPrize
				bind:maxPrize
				{onFiltersChange}
				type="rounds"
			/>

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

			<!-- Rounds Grid -->
			{#if filteredRounds.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
					{#each filteredRounds as round (round.id)}
						<RoundCard 
							{round}
							expanded={expandedRounds.has(round.id)}
							onToggle={() => toggleExpanded(round.id)}
							onViewDetails={() => viewRoundDetails(round.id)}
						/>
					{/each}
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

<style>
	:global(.animate-spin-slow) {
		animation: spin 3s linear infinite;
	}
</style>