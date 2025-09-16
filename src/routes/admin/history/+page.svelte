<script lang="ts">
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import StatsOverview from '$lib/components/history/StatsOverview.svelte';
	import RoundCard from '$lib/components/history/RoundCard.svelte';
	import HistoryFilters from '$lib/components/history/HistoryFilters.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	
	export let data;
	const { user } = data;
	
	let rounds: any[] = [];
	let recentWinners: any[] = [];
	let loading = true;
	let error = '';
	let expandedRounds: Set<string> = new Set();
	let page = 1;
	let hasMore = true;
	let totalRounds = 0;
	let activeView = 'overview'; // 'overview', 'rounds', 'winners'
	
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
		loadRecentWinners();
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
	
	async function loadRecentWinners() {
		try {
			const response = await fetch('/api/winners?action=recent&limit=10');
			const data = await response.json();
			if (data.success) {
				recentWinners = data.recent;
			}
		} catch (err) {
			console.error('Error loading recent winners:', err);
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
		loadRounds(true);
	}
	
	// Filter rounds client-side
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
	<title>Admin History - Draw & Winner Analytics</title>
</svelte:head>

<AdminLayout title="🏛️ History & Analytics" description="Complete draw history and winner analytics" {user}>
	
	<!-- Quick Action Buttons -->
	<div class="flex justify-between items-center mb-6">
		<div class="flex gap-2">
			<Button
				variant={activeView === 'overview' ? 'default' : 'outline'}
				size="sm"
				on:click={() => activeView = 'overview'}
			>
				<Icon icon="mdi:chart-box" class="w-4 h-4 mr-2" />
				Overview
			</Button>
			
			<Button
				variant={activeView === 'rounds' ? 'default' : 'outline'}
				size="sm"
				on:click={() => activeView = 'rounds'}
			>
				<Icon icon="mdi:dice-multiple" class="w-4 h-4 mr-2" />
				All Rounds ({totalRounds})
			</Button>
			
			<Button
				variant={activeView === 'winners' ? 'default' : 'outline'}
				size="sm"
				on:click={() => activeView = 'winners'}
			>
				<Icon icon="mdi:trophy" class="w-4 h-4 mr-2" />
				Recent Winners
			</Button>
		</div>
		
		<div class="flex gap-2">
			<Button href="/past-draws" variant="outline" size="sm">
				<Icon icon="mdi:external-link" class="w-4 h-4 mr-2" />
				Public View
			</Button>
			
			<Button href="/admin/draw" variant="outline" size="sm">
				<Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
				Start New Round
			</Button>
		</div>
	</div>
	
	{#if activeView === 'overview'}
		<!-- Overview Dashboard -->
		<div class="space-y-6">
			<!-- Statistics Overview -->
			<StatsOverview />
			
			<!-- Quick Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<Card class="border border-blue-200">
					<CardContent class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-gray-600">Active Rounds</div>
								<div class="text-xl font-bold text-blue-600">0</div>
							</div>
							<Icon icon="mdi:play-circle" class="w-6 h-6 text-blue-400" />
						</div>
					</CardContent>
				</Card>
				
				<Card class="border border-green-200">
					<CardContent class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-gray-600">Completed Rounds</div>
								<div class="text-xl font-bold text-green-600">{totalRounds}</div>
							</div>
							<Icon icon="mdi:check-circle" class="w-6 h-6 text-green-400" />
						</div>
					</CardContent>
				</Card>
				
				<Card class="border border-purple-200">
					<CardContent class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-gray-600">Recent Winners</div>
								<div class="text-xl font-bold text-purple-600">{recentWinners.length}</div>
							</div>
							<Icon icon="mdi:account-star" class="w-6 h-6 text-purple-400" />
						</div>
					</CardContent>
				</Card>
				
				<Card class="border border-orange-200">
					<CardContent class="p-4">
						<div class="flex items-center justify-between">
							<div>
								<div class="text-sm text-gray-600">System Status</div>
								<div class="text-xl font-bold text-orange-600">✅ Online</div>
							</div>
							<Icon icon="mdi:server" class="w-6 h-6 text-orange-400" />
						</div>
					</CardContent>
				</Card>
			</div>
			
			<!-- Recent Activity -->
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<!-- Latest Round -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Icon icon="mdi:dice-6" class="w-5 h-5" />
							Latest Round
						</CardTitle>
						<CardDescription>Most recently completed draw</CardDescription>
					</CardHeader>
					<CardContent>
						{#if rounds.length > 0}
							<RoundCard 
								round={rounds[0]}
								expanded={expandedRounds.has(rounds[0].id)}
								onToggle={() => toggleExpanded(rounds[0].id)}
								onViewDetails={() => viewRoundDetails(rounds[0].id)}
							/>
						{:else}
							<div class="text-center py-8 text-gray-500">
								<Icon icon="mdi:dice-6" class="w-12 h-12 mx-auto mb-2 opacity-50" />
								<div>No rounds completed yet</div>
							</div>
						{/if}
					</CardContent>
				</Card>
				
				<!-- Recent Winners -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Icon icon="mdi:trophy" class="w-5 h-5" />
							Recent Winners
						</CardTitle>
						<CardDescription>Latest lucky winners</CardDescription>
					</CardHeader>
					<CardContent>
						{#if recentWinners.length > 0}
							<div class="space-y-3">
								{#each recentWinners.slice(0, 5) as winner}
									<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
										<div class="flex items-center gap-3">
											<span class="text-xl">{winner.animal_emoji}</span>
											<div>
												<div class="font-semibold text-sm">{winner.animal_name}</div>
												<div class="text-xs text-gray-600 font-mono">
													{winner.wallet_address.slice(0, 6)}...{winner.wallet_address.slice(-6)}
												</div>
											</div>
										</div>
										<div class="text-right">
											<div class="font-bold text-green-600">
												{parseFloat(winner.prize_amount).toFixed(3)} SOL
											</div>
											<div class="text-xs text-gray-500">
												Draw #{winner.draw?.draw_number || '?'}
											</div>
										</div>
									</div>
								{/each}
								
								<Button href="/winners" variant="outline" size="sm" class="w-full mt-3">
									<Icon icon="mdi:eye" class="w-4 h-4 mr-2" />
									View All Winners
								</Button>
							</div>
						{:else}
							<div class="text-center py-8 text-gray-500">
								<Icon icon="mdi:trophy" class="w-12 h-12 mx-auto mb-2 opacity-50" />
								<div>No winners yet</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
		
	{:else if activeView === 'rounds'}
		<!-- All Rounds View -->
		<div class="space-y-6">
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
			
			{#if rounds.length === 0 && !loading}
				<!-- No Data State -->
				<Card>
					<CardContent class="text-center py-16">
						<Icon icon="mdi:dice-6" class="w-16 h-16 mx-auto mb-4 text-gray-400" />
						<h3 class="text-lg font-semibold text-gray-900 mb-2">No rounds found</h3>
						<p class="text-gray-600 mb-4">No completed lottery rounds yet.</p>
						<Button href="/admin/draw">
							<Icon icon="mdi:plus" class="w-4 h-4 mr-2" />
							Start First Round
						</Button>
					</CardContent>
				</Card>
			{:else}
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
				{/if}
				
				<!-- Loading State -->
				{#if loading && rounds.length === 0}
					<div class="text-center py-16">
						<Icon icon="mdi:loading" class="w-12 h-12 animate-spin mx-auto text-orange-600 mb-4" />
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Loading rounds...</h3>
						<p class="text-gray-600">Fetching draw history</p>
					</div>
				{/if}
			{/if}
		</div>
		
	{:else if activeView === 'winners'}
		<!-- Winners View -->
		<div class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Winner Management</CardTitle>
					<CardDescription>View and manage all lottery winners</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="text-center py-8">
						<Icon icon="mdi:trophy" class="w-16 h-16 mx-auto mb-4 text-orange-400" />
						<h3 class="text-lg font-semibold text-gray-900 mb-2">Advanced Winner Management</h3>
						<p class="text-gray-600 mb-4">Use the dedicated winners page for detailed management</p>
						<Button href="/winners">
							<Icon icon="mdi:external-link" class="w-4 h-4 mr-2" />
							Open Winners Gallery
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
	
	<!-- Error State -->
	{#if error}
		<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
			<div class="flex items-center gap-3">
				<Icon icon="mdi:alert-circle" class="w-5 h-5 text-red-600" />
				<div>
					<div class="font-medium text-red-800">Error loading data</div>
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
</AdminLayout>