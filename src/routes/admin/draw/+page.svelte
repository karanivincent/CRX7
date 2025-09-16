<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import SpinningWheel from '$lib/components/admin/spinning-wheel.svelte';
	import { mapWalletsToAnimals, type AnimalMapping } from '$lib/utils/animal-mapping';
	import { onMount, onDestroy } from 'svelte';
	import { TEST_WALLETS, createTestWinners, isTestMode, validateTestWallets } from '$lib/config/test-wallets';
	
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
	import { startNewRound, completeRound } from '$lib/db/round-operations';
	
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
	
	// Test wallet balances
	let testWalletBalances: Record<string, number> = {};
	let loadingBalances = false;
	
	// Reactive values from store
	$: currentStageValue = $currentStage;
	$: currentDrawValue = $currentDrawNumber;
	$: currentContestants = $contestants;
	$: selectedWinners = $winners;
	$: progress = $roundProgress;
	$: loading = $isLoading;
	
	// Debug reactive values
	$: console.log('📊 MAIN PAGE: currentStage =', currentStageValue, '| loading =', loading);
	
	
	
	// Calculated values
	$: prizePerWinner = distributionAmount / MAX_DRAWS;
	$: remainingDraws = MAX_DRAWS - selectedWinners.length;
	$: totalPrizeRemaining = remainingDraws * prizePerWinner;
	$: holdingAmount = vaultTotalBalance * 0.4;
	$: charityAmount = vaultTotalBalance * 0.1;
	
	// Initialize page
	onMount(async () => {
		await refreshVaultBalance();
		// Removed automatic round recovery - user should start fresh
		
		// Temporarily disable auto-progression to debug infinite loop
		// unsubscribeAutoProgression = startAutoProgression();
	});
	
	onDestroy(() => {
		// if (unsubscribeAutoProgression) {
		// 	unsubscribeAutoProgression();
		// }
	});


	async function refreshVaultBalance() {
		try {
			isRefreshingBalance = true;
			const response = await fetch('/api/vault/balance?refresh=true');
			const result = await response.json();
			
			if (result.success && result.vault) {
				vaultTotalBalance = result.vault.balance;
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
		console.log('🎮 MAIN PAGE: startNewGameShow() called - current stage:', $currentStage);
		try {
			console.log('🔄 Setting loading to true');
			gameRoundActions.setLoading(true);
			
			// Allow starting new rounds without checking for existing active rounds
			console.log('🎯 Starting fresh round...');
			
			// Create new round in database
			console.log('🎯 Creating new round in database...');
			const result = await startNewRound(distributionAmount);
			console.log('✅ Created round:', result);
			
			// Initialize store with new round immediately
			console.log('🏪 Initializing store with new round...');
			gameRoundActions.startNewRound(result.id, distributionAmount);
			
			// Clear loading state so UI can proceed
			console.log('🔄 Setting loading to false');
			gameRoundActions.setLoading(false);
			console.log('✅ Game show started successfully!');
			
			// Get eligible holders count in background (non-blocking)
			console.log('👥 Fetching eligible holders in background...');
			getEligibleHoldersCount().then(count => {
				console.log('👥 Got eligible holders count:', count);
				gameRoundActions.updateExternalData({ eligibleHoldersCount: count });
			}).catch(err => {
				console.error('❌ Error fetching eligible holders:', err);
				// Continue anyway, just show 0 eligible holders
			});
			
		} catch (err) {
			console.error('❌ Error starting new game show:', err);
			gameRoundActions.setError(`Failed to start new round: ${err instanceof Error ? err.message : String(err)}`);
			gameRoundActions.setLoading(false);
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
		console.log('🔄 MAIN PAGE: generateContestantsForDraw() called');
		try {
			console.log('🔄 MAIN PAGE: Setting loading to true');
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
			console.log('🔄 MAIN PAGE: Setting contestants and clearing loading');
			gameRoundActions.setContestants(animalMappings);
			console.log('🔄 MAIN PAGE: generateContestantsForDraw() completed');
			
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
			
			// Clear loading state after successful completion
			gameRoundActions.setLoading(false);
			
		} catch (err) {
			console.error('Error completing round:', err);
			gameRoundActions.setError('Failed to complete round');
			// Clear loading state on error as well
			gameRoundActions.setLoading(false);
		}
	}

	function resetGameShow() {
		gameRoundActions.resetRound();
		console.log('✅ Game show reset successfully');
	}

	// Testing/Skip functions for quick navigation
	async function skipToSpinning() {
		try {
			gameRoundActions.setLoading(true);
			
			// If no round started, start one
			if (currentStageValue === 'IDLE') {
				await startNewGameShow();
				await new Promise(resolve => setTimeout(resolve, 500)); // Wait for round to initialize
			}
			
			// Skip to draw prep if needed
			if (currentStageValue === 'ROUND_START') {
				gameRoundActions.advanceStage(); // -> DRAW_PREP
			}
			
			// Generate contestants if needed and skip to spinning
			if (currentStageValue === 'DRAW_PREP') {
				await generateContestantsForDraw();
				gameRoundActions.advanceStage(); // -> SPINNING
			}
			
			gameRoundActions.setLoading(false);
		} catch (err) {
			console.error('Error skipping to spinning:', err);
			gameRoundActions.setLoading(false);
		}
	}

	async function skipToFinalWithWinners() {
		try {
			gameRoundActions.setLoading(true);
			
			// Start fresh round if needed
			if (currentStageValue === 'IDLE') {
				await startNewGameShow();
				await new Promise(resolve => setTimeout(resolve, 500));
			}
			
			// Validate test wallets first
			const validation = validateTestWallets();
			if (!validation.valid) {
				console.error('❌ Test wallet validation failed:', validation.errors);
				gameRoundActions.setError('Invalid test wallet configuration');
				return;
			}
			
			// Use real test wallets as winners
			console.log('🎯 Using real test wallets for testing');
			TEST_WALLETS.forEach((wallet, index) => {
				gameRoundActions.addWinner({
					address: wallet.address,
					animal: `${wallet.animal.emoji} ${wallet.animal.name}`,
					prizeAmount: prizePerWinner
				});
			});
			
			// Go directly to final stage
			gameRoundActions.goToStage('ROUND_COMPLETE');
			
			gameRoundActions.setLoading(false);
			console.log('✅ Skipped to final with 7 real test wallets:', TEST_WALLETS.map(w => w.name));
		} catch (err) {
			console.error('Error skipping to final:', err);
			gameRoundActions.setLoading(false);
		}
	}

	async function completeRoundAndGoToDistribution() {
		try {
			await completeRoundAndPersist();
			// After completing round, show a message with link to distribution
			setTimeout(() => {
				if (confirm('Round completed! Go to distribution page to manage payouts?')) {
					window.location.href = '/admin/distribution';
				}
			}, 1000);
		} catch (err) {
			console.error('Error completing round:', err);
		}
	}

	async function checkTestWalletBalances() {
		try {
			loadingBalances = true;
			testWalletBalances = {};
			
			// Check balance for each test wallet
			for (const wallet of TEST_WALLETS) {
				try {
					const response = await fetch(`/api/wallet/balance?address=${wallet.address}`);
					const data = await response.json();
					
					if (data.success) {
						testWalletBalances[wallet.address] = data.balance || 0;
					} else {
						testWalletBalances[wallet.address] = 0;
					}
				} catch (err) {
					console.error(`Error checking balance for ${wallet.name}:`, err);
					testWalletBalances[wallet.address] = 0;
				}
			}
		} catch (err) {
			console.error('Error checking test wallet balances:', err);
		} finally {
			loadingBalances = false;
		}
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
			round={$gameRound}
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
					autoSpin={false}
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
	
	<!-- Enhanced Testing Panel -->
	<div class="fixed top-4 right-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg shadow-xl p-4 border-2 border-orange-200 max-w-sm">
		<!-- Header -->
		<div class="flex items-center justify-between mb-3">
			<div class="flex items-center gap-2">
				<Icon icon="mdi:test-tube" class="w-5 h-5 text-orange-600" />
				<h3 class="font-bold text-orange-800">Testing Panel</h3>
			</div>
			<div class="px-2 py-1 bg-orange-200 rounded text-xs font-medium text-orange-800">
				TEST MODE
			</div>
		</div>
		
		<!-- Current Status -->
		<div class="bg-white rounded-lg p-3 mb-3 border border-orange-200">
			<div class="text-sm text-gray-600 space-y-1">
				<div class="flex justify-between">
					<span>Stage:</span>
					<span class="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{currentStageValue}</span>
				</div>
				<div class="flex justify-between">
					<span>Draw:</span>
					<span class="font-medium">{currentDrawValue} of {MAX_DRAWS}</span>
				</div>
				<div class="flex justify-between">
					<span>Winners:</span>
					<span class="font-medium text-green-600">{selectedWinners.length}</span>
				</div>
			</div>
		</div>
		
		<!-- Test Wallet Preview -->
		<div class="bg-white rounded-lg p-3 mb-3 border border-orange-200">
			<div class="text-xs font-medium text-gray-700 mb-2 flex items-center justify-between">
				<div class="flex items-center gap-1">
					<Icon icon="mdi:wallet" class="w-3 h-3" />
					Test Wallets ({TEST_WALLETS.length})
				</div>
				<Button variant="ghost" size="sm" on:click={checkTestWalletBalances} disabled={loadingBalances} class="text-xs py-1 px-2 h-6">
					<Icon icon="mdi:refresh" class="w-3 h-3 {loadingBalances ? 'animate-spin' : ''}" />
				</Button>
			</div>
			<div class="space-y-1 max-h-32 overflow-y-auto">
				{#each TEST_WALLETS.slice(0, 4) as wallet}
					<div class="flex items-center gap-2 text-xs">
						<span class="text-sm">{wallet.animal.emoji}</span>
						<div class="flex-1 min-w-0">
							<div class="font-medium text-gray-800 truncate">{wallet.animal.name}</div>
							<div class="text-gray-500 font-mono truncate">{wallet.address.slice(0, 8)}...{wallet.address.slice(-4)}</div>
						</div>
						<div class="text-right">
							{#if loadingBalances}
								<div class="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
							{:else if testWalletBalances[wallet.address] !== undefined}
								<div class="font-medium text-green-600 text-xs">
									{testWalletBalances[wallet.address].toFixed(3)} SOL
								</div>
							{:else}
								<div class="text-gray-400 text-xs">--</div>
							{/if}
						</div>
					</div>
				{/each}
				{#if TEST_WALLETS.length > 4}
					<div class="text-xs text-gray-500 text-center pt-1">
						+{TEST_WALLETS.length - 4} more wallets
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Quick Skip Actions -->
		<div class="space-y-2 mb-3">
			<div class="text-xs font-bold text-orange-700 mb-2 flex items-center gap-1">
				<Icon icon="mdi:rocket-launch" class="w-3 h-3" />
				Quick Skip Actions
			</div>
			
			<div class="grid grid-cols-2 gap-2">
				<Button variant="outline" size="sm" on:click={skipToSpinning} class="text-xs py-2 bg-blue-50 hover:bg-blue-100 border-blue-200">
					<Icon icon="mdi:dice-6" class="w-4 h-4 mb-1" />
					<div>To Spin</div>
				</Button>
				<Button variant="outline" size="sm" on:click={skipToFinalWithWinners} class="text-xs py-2 bg-green-50 hover:bg-green-100 border-green-200">
					<Icon icon="mdi:trophy" class="w-4 h-4 mb-1" />
					<div>To Final</div>
				</Button>
			</div>
			
			{#if currentStageValue === 'ROUND_COMPLETE'}
				<Button variant="outline" size="sm" on:click={completeRoundAndGoToDistribution} class="w-full text-xs py-2 bg-purple-50 hover:bg-purple-100 border-purple-200">
					<Icon icon="mdi:cash-multiple" class="w-4 h-4 mr-1" />
					Complete & Go to Distribution
				</Button>
			{/if}
		</div>
		
		<!-- Regular Controls -->
		<div class="border-t border-orange-200 pt-3">
			<div class="text-xs font-medium text-gray-700 mb-2">Controls</div>
			
			{#if currentStageValue !== 'IDLE' && currentStageValue !== 'DISTRIBUTION'}
				<Button variant="outline" size="sm" on:click={() => gameRoundActions.advanceStage()} class="w-full text-xs py-1 mb-2">
					<Icon icon="mdi:skip-next" class="w-3 h-3 mr-1" />
					Next Stage
				</Button>
			{/if}
			
			<div class="flex gap-2">
				<Button variant="outline" size="sm" on:click={resetGameShow} class="flex-1 text-xs py-1">
					<Icon icon="mdi:stop" class="w-3 h-3 mr-1" />
					Reset
				</Button>
				
				<Button variant="outline" size="sm" on:click={refreshVaultBalance} disabled={isRefreshingBalance} class="flex-1 text-xs py-1">
					<Icon icon="mdi:refresh" class="w-3 h-3 mr-1 {isRefreshingBalance ? 'animate-spin' : ''}" />
					Refresh
				</Button>
			</div>
		</div>
	</div>
</AdminLayout>