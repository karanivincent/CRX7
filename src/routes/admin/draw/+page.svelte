<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import SpinningWheel from '$lib/components/admin/spinning-wheel.svelte';
	import { mapWalletsToAnimals, type AnimalMapping } from '$lib/utils/animal-mapping';
	import { onMount, onDestroy } from 'svelte';
	
	// Import new store-based system
	import { 
		gameRound,
		currentStage,
		currentDrawNumber,
		contestants, 
		winners, 
		roundProgress,
		isLoading,
		gameRoundActions,
		startAutoProgression,
		getCurrentRoundData,
		type Winner
	} from '$lib/stores/game-round';
	
	// Import stage components (same as before)
	import RoundOpening from '$lib/components/draw/RoundOpening.svelte';
	import DrawPreparation from '$lib/components/draw/DrawPreparation.svelte';
	import WinnerReveal from '$lib/components/draw/WinnerReveal.svelte';
	import IntermissionProgress from '$lib/components/draw/IntermissionProgress.svelte';
	import GrandFinale from '$lib/components/draw/GrandFinale.svelte';
	
	// Import database operations
	import { startNewRound, completeRound, getActiveRound, hasActiveRound } from '$lib/db/round-operations';
	
	export let data;
	const { user, vaultBalance, vaultError } = data;
	
	const tokenDisplay = getTokenDisplay();
	
	// Vault and balance management
	let vaultTotalBalance = vaultBalance || 0;
	let distributionAmount = (vaultBalance || 0) * 0.5;
	let isRefreshingBalance = false;
	
	// Configuration
	const MINIMUM_TOKEN_BALANCE = 100;
	const CANDIDATES_PER_ROUND = 7;
	const MAX_DRAWS = 7;
	
	// Auto-progression cleanup
	let unsubscribeAutoProgression: (() => void) | null = null;
	
	// Reactive values from store
	$: currentStageValue = $currentStage;
	$: currentDrawValue = $currentDrawNumber;
	$: currentContestants = $contestants;
	$: selectedWinners = $winners;
	$: progress = $roundProgress;
	$: loading = $isLoading;
	
	// Calculated values
	$: prizePerWinner = distributionAmount / MAX_DRAWS;
	$: remainingDraws = MAX_DRAWS - selectedWinners.length;
	$: totalPrizeRemaining = remainingDraws * prizePerWinner;
	$: holdingAmount = vaultTotalBalance * 0.4;
	$: charityAmount = vaultTotalBalance * 0.1;
	
	// Check for active round on mount
	onMount(async () => {
		await refreshVaultBalance();
		await checkForActiveRound();
		
		// Start auto-progression
		unsubscribeAutoProgression = startAutoProgression();
	});
	
	onDestroy(() => {
		if (unsubscribeAutoProgression) {
			unsubscribeAutoProgression();
		}
	});

	async function checkForActiveRound() {
		try {
			const activeRound = await getActiveRound();
			if (activeRound) {
				// Recover active round instead of starting new
				gameRoundActions.recoverActiveRound(activeRound.id, 1);
				console.log('🔄 Recovered active round from database');
			}
		} catch (error) {
			console.error('Error checking for active round:', error);
		}
	}

	async function refreshVaultBalance() {
		try {
			isRefreshingBalance = true;
			const response = await fetch('/api/vault/balance?refresh=true');
			const result = await response.json();
			
			if (result.success) {
				vaultTotalBalance = result.balance;
				distributionAmount = vaultTotalBalance * 0.5;
				
				// Update store with external data
				gameRoundActions.updateExternalData({ vaultBalance: vaultTotalBalance });
			}
		} catch (error) {
			console.error('Error refreshing vault balance:', error);
		} finally {
			isRefreshingBalance = false;
		}
	}

	async function startNewGameShow() {
		try {
			gameRoundActions.setLoading(true);
			
			// Check if there's already an active round
			if (await hasActiveRound()) {
				gameRoundActions.setError('There is already an active round. Please complete it first.');
				return;
			}
			
			// Create new round in database
			const { id: roundId } = await startNewRound(distributionAmount);
			
			// Get eligible holders count
			const eligibleHoldersCount = await getEligibleHoldersCount();
			gameRoundActions.updateExternalData({ eligibleHoldersCount });
			
			// Initialize store with new round
			gameRoundActions.startNewRound(roundId, distributionAmount);
			
		} catch (err) {
			console.error('Error starting new game show:', err);
			gameRoundActions.setError('Failed to start new round');
		}
	}
	
	async function getEligibleHoldersCount(): Promise<number> {
		try {
			const response = await fetch('/api/holders');
			const data = await response.json();
			
			if (data.success && data.holders) {
				const eligible = data.holders.filter((holder: any) => {
					const hasMinBalance = holder.balance >= (MINIMUM_TOKEN_BALANCE * Math.pow(10, holder.decimals || 6));
					return hasMinBalance;
				});
				return eligible.length;
			}
			return 0;
		} catch (err) {
			console.error('Error getting eligible holders count:', err);
			return 0;
		}
	}
	
	async function generateContestantsForDraw() {
		try {
			gameRoundActions.setLoading(true);
			
			// Fetch real token holders from blockchain
			const holdersResponse = await fetch('/api/holders');
			const holdersData = await holdersResponse.json();
			
			if (!holdersData.success) {
				throw new Error(holdersData.message || 'Failed to fetch token holders');
			}
			
			// Filter holders by minimum balance and exclude previous winners
			const eligibleHolders = holdersData.holders.filter((holder: any) => {
				const hasMinBalance = holder.balance >= (MINIMUM_TOKEN_BALANCE * Math.pow(10, holder.decimals || 6));
				const notPreviousWinner = !selectedWinners.some(winner => winner.address === holder.address);
				return hasMinBalance && notPreviousWinner;
			});
			
			if (eligibleHolders.length < CANDIDATES_PER_ROUND) {
				throw new Error(`Not enough eligible holders. Need ${CANDIDATES_PER_ROUND}, found ${eligibleHolders.length}`);
			}
			
			// Randomly select candidates
			const shuffled = [...eligibleHolders].sort(() => 0.5 - Math.random());
			const selectedHolders = shuffled.slice(0, CANDIDATES_PER_ROUND);
			
			// Extract wallet addresses and create animal mappings
			const walletAddresses = selectedHolders.map(holder => holder.address);
			const animalMappings = mapWalletsToAnimals(walletAddresses);
			
			// Update store with contestants
			gameRoundActions.setContestants(animalMappings);
			
		} catch (err) {
			console.error('Error generating contestants:', err);
			gameRoundActions.setError('Failed to generate contestants');
		}
	}

	async function handleSpinComplete(winner: string) {
		try {
			// Find winner details
			const winnerMapping = currentContestants.find(c => c.walletAddress === winner);
			if (!winnerMapping) {
				throw new Error('Winner not found in contestants');
			}
			
			// Add winner to store
			gameRoundActions.addWinner({
				address: winner,
				animal: `${winnerMapping.animal.emoji} ${winnerMapping.animal.name}`,
				prizeAmount: prizePerWinner
			});
			
			// Advance to winner reveal stage
			gameRoundActions.advanceStage();
			
		} catch (err) {
			console.error('Error handling spin complete:', err);
			gameRoundActions.setError('Failed to process winner');
		}
	}

	async function completeRoundAndPersist() {
		try {
			gameRoundActions.setLoading(true);
			
			const currentState = getCurrentRoundData();
			if (!currentState || !currentState.roundId) {
				throw new Error('No active round to complete');
			}
			
			// Prepare data for persistence
			const completeData = {
				roundId: currentState.roundId,
				winners: currentState.winners,
				participants: currentState.contestants,
				metadata: {
					totalPrizePool: currentState.prizePool,
					completedAt: new Date(),
					roundDurationMs: currentState.startedAt ? Date.now() - currentState.startedAt.getTime() : 0
				}
			};
			
			// Persist to database
			await completeRound(completeData);
			
			// Mark round as completed in store
			await gameRoundActions.completeRound();
			
			console.log('✅ Round completed and persisted successfully');
			
		} catch (err) {
			console.error('Error completing round:', err);
			gameRoundActions.setError('Failed to complete round');
		}
	}

	function resetGameShow() {
		gameRoundActions.resetRound();
		console.log('✅ Game show reset successfully');
	}
</script>

<svelte:head>
	<title>🎪 CRX7 Game Show - {tokenDisplay} Admin</title>
</svelte:head>

<AdminLayout title="🎪 CRX7 Game Show" description="Experience the lottery like never before" {user}>
	
	<!-- Stage-based Game Show Interface -->
	{#if loading}
		<!-- Loading State -->
		<div class="flex flex-col items-center justify-center min-h-[400px]">
			<Icon icon="mdi:loading" class="w-16 h-16 text-orange-600 animate-spin mb-4" />
			<h2 class="text-2xl font-bold text-orange-600">Loading...</h2>
		</div>
	{:else if currentStageValue === 'IDLE'}
		<!-- Not Started State -->
		<div class="text-center py-16">
			<div class="max-w-2xl mx-auto">
				<div class="text-8xl mb-6 animate-bounce">🎪</div>
				<h1 class="text-4xl font-bold text-orange-600 mb-4">
					Welcome to the CRX7 Game Show!
				</h1>
				<p class="text-xl text-gray-600 mb-8">
					Ready to create an unforgettable experience for your community?
				</p>
				
				<!-- Quick Stats -->
				<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
					<div class="bg-white rounded-lg p-6 border-2 border-orange-200 shadow-lg">
						<div class="text-4xl mb-2">💰</div>
						<div class="text-sm text-gray-600 mb-1">Vault Balance</div>
						<div class="text-3xl font-bold text-orange-600">{vaultTotalBalance?.toFixed(2) || '0.00'} SOL</div>
					</div>
					
					<div class="bg-white rounded-lg p-6 border-2 border-green-200 shadow-lg">
						<div class="text-4xl mb-2">🎁</div>
						<div class="text-sm text-gray-600 mb-1">Prize Distribution</div>
						<div class="text-3xl font-bold text-green-600">{distributionAmount?.toFixed(2) || '0.00'} SOL</div>
					</div>
					
					<div class="bg-white rounded-lg p-6 border-2 border-blue-200 shadow-lg">
						<div class="text-4xl mb-2">🏆</div>
						<div class="text-sm text-gray-600 mb-1">Per Winner</div>
						<div class="text-3xl font-bold text-blue-600">{prizePerWinner?.toFixed(3) || '0.000'} SOL</div>
					</div>
				</div>
				
				<!-- Prize Breakdown -->
				<div class="bg-gray-50 rounded-lg p-6 mb-8">
					<h3 class="text-xl font-semibold mb-4">Prize Breakdown</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
						<div>
							<span class="font-medium text-green-600">50% Distribution:</span>
							<span class="ml-2">{distributionAmount?.toFixed(2) || '0.00'} SOL</span>
						</div>
						<div>
							<span class="font-medium text-blue-600">40% Holdings:</span>
							<span class="ml-2">{holdingAmount?.toFixed(2) || '0.00'} SOL</span>
						</div>
						<div>
							<span class="font-medium text-purple-600">10% Charity:</span>
							<span class="ml-2">{charityAmount?.toFixed(2) || '0.00'} SOL</span>
						</div>
					</div>
				</div>
				
				<Button on:click={startNewGameShow} size="lg" class="px-8 py-4 text-xl">
					<Icon icon="mdi:play-circle" class="mr-2 h-6 w-6" />
					Start the Show!
				</Button>
			</div>
		</div>
		
	{:else if currentStageValue === 'ROUND_START'}
		<!-- Round Opening -->
		<RoundOpening 
			totalPrize={distributionAmount}
			prizePerWinner={prizePerWinner}
			vaultBalance={vaultTotalBalance}
			eligibleHolders={$gameRound.eligibleHoldersCount}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'DRAW_PREP'}
		<!-- Draw Preparation Stage -->
		<DrawPreparation 
			drawNumber={currentDrawValue}
			maxDraws={MAX_DRAWS}
			prizeAmount={prizePerWinner}
			onGenerateContestants={generateContestantsForDraw}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'SPINNING'}
		<!-- Spinning Wheel Stage -->
		<div class="max-w-none">
			<div class="text-center mb-8">
				<h1 class="text-5xl font-bold text-purple-600 mb-4">
					🎯 DRAW {currentDrawValue} - SPINNING NOW! 🎯
				</h1>
				<div class="text-xl text-purple-700">
					Finding our lucky winner from {currentContestants.length} brave contestants...
				</div>
			</div>
			
			<div class="flex justify-center">
				<SpinningWheel 
					candidates={currentContestants.map(c => c.walletAddress)}
					onSpinComplete={handleSpinComplete}
					size="xlarge"
					showLegend={false}
					autoSpin={true}
				/>
			</div>
		</div>
		
	{:else if currentStageValue === 'WINNER_REVEAL'}
		<!-- Winner Reveal Stage -->
		{#if selectedWinners.length > 0}
			<WinnerReveal 
				winner={selectedWinners[selectedWinners.length - 1]}
				drawNumber={selectedWinners[selectedWinners.length - 1].drawNumber}
				autoProgress={false}
			/>
		{/if}
		
	{:else if currentStageValue === 'INTERMISSION'}
		<!-- Intermission Progress -->
		<IntermissionProgress 
			winners={selectedWinners}
			remainingDraws={remainingDraws}
			totalPrizeRemaining={totalPrizeRemaining}
			eligibleHoldersRemaining={$gameRound.eligibleHoldersCount}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'ROUND_COMPLETE'}
		<!-- Grand Finale -->
		<GrandFinale 
			round={{ drawNumber: $gameRound.roundId }}
			winners={selectedWinners}
			vaultBalance={vaultTotalBalance}
			onProceedToDistribution={completeRoundAndPersist}
		/>
		
	{:else if currentStageValue === 'DISTRIBUTION'}
		<!-- Distribution Complete -->
		<div class="text-center py-16">
			<div class="text-8xl mb-6">🎊</div>
			<h1 class="text-4xl font-bold text-green-600 mb-4">
				Round Complete!
			</h1>
			<p class="text-xl text-gray-600 mb-8">
				All prizes have been distributed successfully.
			</p>
			
			<div class="bg-green-50 rounded-lg p-6 mb-8 max-w-md mx-auto">
				<h3 class="text-lg font-semibold text-green-800 mb-2">Final Results</h3>
				<div class="text-sm text-green-700">
					<div>Winners: {selectedWinners.length}</div>
					<div>Total Distributed: {distributionAmount?.toFixed(2) || '0.00'} SOL</div>
				</div>
			</div>
			
			<Button on:click={resetGameShow} size="lg">
				<Icon icon="mdi:refresh" class="mr-2 h-6 w-6" />
				Start New Round
			</Button>
		</div>
	{/if}
	
	<!-- Debug/Admin Controls -->
	<div class="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
		<div class="text-sm text-gray-600 mb-2">
			<div>Stage: <span class="font-mono">{currentStageValue}</span></div>
			<div>Draw: {currentDrawValue} of {MAX_DRAWS}</div>
			<div>Winners: {selectedWinners.length}</div>
		</div>
		
		<div class="flex gap-2">
			{#if currentStageValue !== 'IDLE' && currentStageValue !== 'DISTRIBUTION'}
				<Button variant="outline" size="sm" on:click={() => gameRoundActions.advanceStage()}>
					<Icon icon="mdi:skip-next" class="w-4 h-4 mr-1" />
					Next Stage
				</Button>
			{/if}
			
			<Button variant="outline" size="sm" on:click={resetGameShow}>
				<Icon icon="mdi:stop" class="w-4 h-4 mr-1" />
				Reset
			</Button>
			
			<Button variant="outline" size="sm" on:click={refreshVaultBalance} disabled={isRefreshingBalance}>
				<Icon icon="mdi:refresh" class="w-4 h-4 mr-1 {isRefreshingBalance ? 'animate-spin' : ''}" />
				Refresh
			</Button>
		</div>
	</div>
</AdminLayout>