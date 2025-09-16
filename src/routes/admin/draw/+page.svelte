<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import SpinningWheel from '$lib/components/admin/spinning-wheel.svelte';
	import { mapWalletsToAnimals, type AnimalMapping } from '$lib/utils/animal-mapping';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	
	// Import new stage-based system
	import { 
		drawState, 
		currentStage,
		currentDraw,
		contestants, 
		winners, 
		roundProgress,
		drawActions,
		startAutoProgression,
		setCurrentDrawId
	} from '$lib/stores/draw-state';
	
	// Import stage components
	import RoundOpening from '$lib/components/draw/RoundOpening.svelte';
	import DrawPreparation from '$lib/components/draw/DrawPreparation.svelte';
	import WinnerReveal from '$lib/components/draw/WinnerReveal.svelte';
	import IntermissionProgress from '$lib/components/draw/IntermissionProgress.svelte';
	import GrandFinale from '$lib/components/draw/GrandFinale.svelte';
	
	export let data;
	const { user, vaultBalance, vaultError } = data;
	
	const tokenDisplay = getTokenDisplay();
	
	// Vault and balance management
	let vaultTotalBalance = vaultBalance || 0;
	let distributionAmount = (vaultBalance || 0) * 0.5;
	let isRefreshingBalance = false;
	let eligibleHoldersCount = 0;
	
	// Legacy state for gradual migration
	let currentDrawData: any = null;
	let allHolders: string[] = [];
	let error = '';
	let currentCandidates: string[] = [];
	let animalMappings: any[] = [];
	let isLoading = false;
	let roundStatus = 'idle';
	let currentSpin = 0;
	let maxSpins = MAX_DRAWS;
	let currentWinnerAnimal = '';
	
	// Configuration
	const MINIMUM_TOKEN_BALANCE = 100;
	const CANDIDATES_PER_ROUND = 7;
	const MAX_DRAWS = 7;
	
	// Auto-progression cleanup
	let unsubscribeAutoProgression: (() => void) | null = null;
	
	// Reactive values from stores
	$: currentStageValue = $currentStage;
	$: currentContestants = $contestants;
	$: selectedWinners = $winners;
	$: progress = $roundProgress;
	
	// Reference calculation for debugging - NOT used for automatic updates
	$: calculatedDrawNumber = Math.min(selectedWinners.length + 1, MAX_DRAWS);
	
	// Log any mismatches for debugging but don't auto-correct
	$: {
		if ($currentDraw !== calculatedDrawNumber && selectedWinners.length > 0) {
			console.log(`📊 Draw state: store=${$currentDraw}, calculated=${calculatedDrawNumber}, winners=${selectedWinners.length}`);
		}
	}
	
	// Calculated values
	$: prizePerWinner = distributionAmount / MAX_DRAWS;
	$: remainingDraws = MAX_DRAWS - selectedWinners.length;
	$: totalPrizeRemaining = remainingDraws * prizePerWinner;
	$: eligibleHoldersRemaining = Math.max(0, eligibleHoldersCount - selectedWinners.length);
	$: winnerAmount = prizePerWinner; // Alias for compatibility
	$: holdingAmount = vaultTotalBalance * 0.4;
	$: charityAmount = vaultTotalBalance * 0.1;

	// Load current draw status on mount
	onMount(async () => {
		await loadCurrentDraw();
		await refreshVaultBalance();
		
		// Start auto-progression for stage transitions
		unsubscribeAutoProgression = startAutoProgression();
	});
	
	onDestroy(() => {
		if (unsubscribeAutoProgression) {
			unsubscribeAutoProgression();
		}
	});

	// Function to refresh vault balance
	async function refreshVaultBalance() {
		try {
			isRefreshingBalance = true;
			const response = await fetch('/api/vault/balance?refresh=true');
			const result = await response.json();
			
			if (result.success) {
				vaultTotalBalance = result.vault.balance;
				distributionAmount = vaultTotalBalance * 0.5; // Winners get 50% of vault
				console.log(`Updated winner distribution amount: ${distributionAmount} SOL (50% of ${vaultTotalBalance} SOL vault)`);
			} else {
				console.error('Failed to refresh vault balance:', result.error);
			}
		} catch (err) {
			console.error('Error refreshing vault balance:', err);
		} finally {
			isRefreshingBalance = false;
		}
	}

	async function loadCurrentDraw() {
		try {
			drawActions.setLoading(true);
			const response = await fetch('/api/draws?action=current');
			const result = await response.json();
			
			if (result.draw) {
				currentDrawData = result.draw;
				
				// If there's an active draw, load it into the state system
				if (currentDrawData.status === 'active') {
					await loadExistingDrawIntoState();
				}
			}
		} catch (err) {
			console.error('Error loading current draw:', err);
			drawActions.setError('Failed to load current draw');
		} finally {
			drawActions.setLoading(false);
		}
	}
	
	// Load existing active draw into new state system
	async function loadExistingDrawIntoState() {
		if (!currentDrawData) return;
		
		try {
			// Set current draw ID for persistence
			setCurrentDrawId(currentDrawData.id);
			
			const dashboardResponse = await fetch('/api/draws?action=dashboard');
			const dashboardData = await dashboardResponse.json();
			
			// Initialize the draw state with existing data
			drawActions.startRound(currentDrawData);
			
			// Load existing winners
			let existingWinners: any[] = [];
			if (dashboardData.latestWinners) {
				console.log('🏆 Raw winners data from dashboard:', dashboardData.latestWinners);
				
				existingWinners = dashboardData.latestWinners
					.filter((w: any) => w.draw?.draw_number === currentDrawData.draw_number)
					.map((w: any) => {
						console.log('🎯 Processing winner:', w);
						return {
							drawNumber: w.position || 1,
							address: w.wallet_address || 'Unknown Address',
							animal: w.participant?.animal_emoji && w.participant?.animal_name 
								? `${w.participant.animal_emoji} ${w.participant.animal_name}`
								: 'Unknown Animal',
							prizeAmount: parseFloat(w.prize_amount) || prizePerWinner,
							id: w.id
						};
					})
					.filter(winner => {
						const isValid = winner.address !== 'Unknown Address' && winner.animal !== 'Unknown Animal';
						if (!isValid) {
							console.warn('🚨 Filtering out invalid winner:', winner);
						}
						return isValid;
					});
				
				console.log('✅ Processed winners:', existingWinners);
				
				// Add all existing winners to state
				existingWinners.forEach(winner => {
					drawActions.addWinner(winner);
				});
			}
			
			// Restore stage from database if available
			const savedStage = currentDrawData.current_stage || currentDrawData.currentStage;
			
			if (savedStage && savedStage !== 'IDLE') {
				console.log(`🔄 Recovering to stage: ${savedStage}`);
				drawActions.goToStage(savedStage);
				
				// Draw number will be calculated reactively from winners count
				// Don't override it here to prevent double-increments
				console.log(`📊 Draw number will be calculated from ${existingWinners.length} winners`);
			} else {
				// Determine current stage based on progress
				const winnerCount = dashboardData.latestWinners?.filter((w: any) => w.drawNumber === currentDrawData.drawNumber)?.length || 0;
				if (winnerCount >= MAX_DRAWS) {
					drawActions.goToStage('ROUND_COMPLETE');
				} else if (winnerCount > 0) {
					drawActions.goToStage('INTERMISSION');
				} else {
					drawActions.goToStage('DRAW_PREP');
				}
			}
		} catch (err) {
			console.error('Error loading existing draw state:', err);
		}
	}

	// New stage-based functions
	async function startNewGameShow() {
		try {
			drawActions.setLoading(true);
			
			// Explicitly reset state before starting new round to prevent persistence issues
			drawActions.reset();
			currentDrawData = null;
			setCurrentDrawId('');
			
			// Create new draw in database
			const createResponse = await fetch('/api/draws', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'create',
					data: { scheduledAt: new Date().toISOString() }
				})
			});
			
			if (!createResponse.ok) {
				throw new Error('Failed to create draw');
			}
			
			const createResult = await createResponse.json();
			currentDrawData = createResult.draw;
			
			// Start the draw in database
			const startResponse = await fetch('/api/draws', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'start',
					data: { drawId: currentDrawData.id }
				})
			});
			
			if (!startResponse.ok) {
				throw new Error('Failed to start draw');
			}
			
			currentDrawData = (await startResponse.json()).draw;
			
			// Set current draw ID for persistence
			setCurrentDrawId(currentDrawData.id);
			
			// Get eligible holders count for display
			eligibleHoldersCount = await getEligibleHoldersCount();
			
			// Initialize the stage-based system
			drawActions.startRound(currentDrawData);
			
		} catch (err) {
			console.error('Error starting new game show:', err);
			drawActions.setError('Failed to start new round');
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
			drawActions.setLoading(true);
			
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
			
			// Update global state
			allHolders = eligibleHolders.map(holder => holder.address);
			eligibleHoldersCount = eligibleHolders.length;
			
			// Save participants to database if we have a current draw
			if (currentDrawData) {
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'add_participants',
						data: {
							drawId: currentDrawData.id,
							participants: animalMappings
						}
					})
				});
				
				if (!response.ok) {
					console.error('Failed to save participants to database');
				}
			}
			
			// Set contestants in state
			drawActions.setContestants(animalMappings);
			
		} catch (err) {
			console.error('Error generating contestants:', err);
			drawActions.setError(err instanceof Error ? err.message : 'Failed to generate contestants');
			
			// Fallback to mock data if API fails
			const mockFallback = [
				'8K9bPq5zN6tYrA7mW2p3Vx4d',
				'9J2cRe7zA5sB8nM4x6wV9qTy',
				'5F3dGh8kL9pQ2rA7mX4nB6yZ',
				'7H5jKl2nQ8vB4mR6wA9sE3xZ',
				'2A8dF3kP7nR9vB5mQ6wE4yTz',
				'6B9jKp3rQ7nV5mA8sE2wF4xY',
				'4C7hJl5nP9rB3mQ6wA8sE2yV'
			].slice(0, CANDIDATES_PER_ROUND);
			
			const fallbackMappings = mapWalletsToAnimals(mockFallback);
			drawActions.setContestants(fallbackMappings);
		}
	}
	
	async function handleSpinComplete(winner: string, animal: string) {
		try {
			const winnerData = {
				address: winner,
				animal,
				prizeAmount: prizePerWinner
			};
			
			// Add winner to state
			drawActions.addWinner(winnerData);
			
			// Save winner to database
			if (currentDrawData) {
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'record_winners',
						data: {
							drawId: currentDrawData.id,
							winners: [{
								participantId: '', // Will be resolved by the API
								walletAddress: winner,
								prizeAmount: prizePerWinner.toString(),
								position: selectedWinners.length
							}]
						}
					})
				});
				
				if (!response.ok) {
					console.error('Failed to save winner to database');
				}
			}
			
			// Do not auto-progress - wait for manual control
			// drawActions.nextStage();
			
		} catch (err) {
			console.error('Error handling spin complete:', err);
		}
	}
	
	async function completeRound() {
		try {
			if (currentDrawData) {
				await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'complete',
						data: { drawId: currentDrawData.id }
					})
				});
			}
			
			// Reset state after completing the round to prevent state persistence issues
			drawActions.reset();
			currentDrawData = null;
			setCurrentDrawId('');
			
			// Move to distribution stage
			drawActions.goToStage('DISTRIBUTION');
		} catch (err) {
			console.error('Error completing round:', err);
		}
	}
	
	function proceedToDistribution() {
		goto('/admin/distribution');
	}

	// Legacy function for gradual migration
	async function loadDrawData() {
		if (!currentDrawData) return;
		
		try {
			// Load participants and winners for the current draw
			const dashboardResponse = await fetch('/api/draws?action=dashboard');
			const dashboardData = await dashboardResponse.json();
			
			if (dashboardData.participants) {
				currentCandidates = dashboardData.participants.map((p: any) => p.wallet_address);
				// Use animal data from database participants
				animalMappings = dashboardData.participants.map((p: any) => ({
					walletAddress: p.wallet_address,
					animal: {
						name: p.animal_name,
						emoji: p.animal_emoji,
						description: `${p.animal_name} participant`
					}
				}));
			}
			
			if (dashboardData.latestWinners) {
				selectedWinners = dashboardData.latestWinners
					.filter((w: any) => w.drawNumber === currentDrawData.drawNumber)
					.map((w: any) => ({
						address: w.walletAddress,
						animal: `${w.participant?.animalEmoji} ${w.participant?.animalName}`,
						id: w.id
					}));
				currentSpin = selectedWinners.length;
			}
		} catch (err) {
			console.error('Error loading draw data:', err);
		}
	}
	
	async function startNewRound() {
		try {
			isLoading = true;
			error = '';

			// Create new draw in database
			const createResponse = await fetch('/api/draws', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'create',
					data: { scheduledAt: new Date().toISOString() }
				})
			});

			if (!createResponse.ok) {
				throw new Error('Failed to create draw');
			}

			const createResult = await createResponse.json();
			currentDrawData = createResult.draw;

			// Start the draw
			const startResponse = await fetch('/api/draws', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'start',
					data: { drawId: currentDrawData.id }
				})
			});

			if (!startResponse.ok) {
				throw new Error('Failed to start draw');
			}

			currentDrawData = (await startResponse.json()).draw;
			roundStatus = 'active';
			currentSpin = 0;
			selectedWinners = [];
			
			// Generate candidates and add to database
			await generateCandidates();
		} catch (err) {
			console.error('Error starting new round:', err);
			error = 'Failed to start new round';
		} finally {
			isLoading = false;
		}
	}
	
	async function generateCandidates() {
		try {
			isLoading = true;
			error = '';
			
			// Fetch real token holders from blockchain
			console.log('Fetching real token holders from blockchain...');
			const holdersResponse = await fetch('/api/holders');
			const holdersData = await holdersResponse.json();
			
			if (!holdersData.success) {
				throw new Error(holdersData.message || 'Failed to fetch token holders');
			}
			
			console.log(`Found ${holdersData.holders.length} total token holders`);
			
			// Filter holders by minimum balance and exclude previous winners
			const eligibleHolders = holdersData.holders.filter(holder => {
				const hasMinBalance = holder.balance >= (MINIMUM_TOKEN_BALANCE * Math.pow(10, holder.decimals || 6));
				const notPreviousWinner = !selectedWinners.some(winner => winner.address === holder.address);
				return hasMinBalance && notPreviousWinner;
			});
			
			console.log(`${eligibleHolders.length} holders meet minimum balance requirement of ${MINIMUM_TOKEN_BALANCE} tokens`);
			
			if (eligibleHolders.length < CANDIDATES_PER_ROUND) {
				throw new Error(`Not enough eligible holders. Need ${CANDIDATES_PER_ROUND}, found ${eligibleHolders.length}`);
			}
			
			// Randomly select candidates
			const shuffled = [...eligibleHolders].sort(() => 0.5 - Math.random());
			const selectedHolders = shuffled.slice(0, CANDIDATES_PER_ROUND);
			
			// Extract wallet addresses for the spinning wheel
			currentCandidates = selectedHolders.map(holder => holder.address);
			allHolders = eligibleHolders.map(holder => holder.address);
			
			console.log(`Selected ${currentCandidates.length} candidates for this round`);
			
			// Update animal mappings
			animalMappings = mapWalletsToAnimals(currentCandidates);
			
			// Save participants to database if we have a current draw
			if (currentDrawData) {
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'add_participants',
						data: {
							drawId: currentDrawData.id,
							participants: animalMappings
						}
					})
				});
				
				if (!response.ok) {
					console.error('Failed to save participants to database');
				} else {
					console.log('Successfully saved participants to database');
				}
			}
		} catch (err) {
			console.error('Error generating candidates:', err);
			error = err instanceof Error ? err.message : 'Failed to generate candidates';
			
			// Fallback to previous behavior if API fails
			if (currentCandidates.length === 0) {
				console.log('Falling back to mock data due to API failure');
				const mockFallback = [
					'8K9bPq5zN6tYrA7mW2p3Vx4d',
					'9J2cRe7zA5sB8nM4x6wV9qTy',
					'5F3dGh8kL9pQ2rA7mX4nB6yZ',
					'7H5jKl2nQ8vB4mR6wA9sE3xZ',
					'2A8dF3kP7nR9vB5mQ6wE4yTz',
					'6B9jKp3rQ7nV5mA8sE2wF4xY',
					'4C7hJl5nP9rB3mQ6wA8sE2yV'
				];
				currentCandidates = mockFallback.slice(0, CANDIDATES_PER_ROUND);
				animalMappings = mapWalletsToAnimals(currentCandidates);
			}
		} finally {
			isLoading = false;
		}
	}
	
	function onSpinStart() {
		// Clear previous winner when starting new spin
		currentWinnerAnimal = '';
	}
	
	async function onSpinComplete(winner: string, animal: string) {
		try {
			selectedWinners = [...selectedWinners, { address: winner, animal }];
			currentWinnerAnimal = animal;
			currentSpin++;
			
			// Save winner to database
			if (currentDrawData) {
				const winnerData = {
					participantId: '', // Will be resolved by the API
					walletAddress: winner,
					prizeAmount: winnerAmount.toString(), // Use calculated winner amount from live vault balance
					position: currentSpin
				};
				
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'record_winners',
						data: {
							drawId: currentDrawData.id,
							winners: [winnerData]
						}
					})
				});
				
				if (!response.ok) {
					console.error('Failed to save winner to database');
				}
			}
			
			if (currentSpin >= maxSpins) {
				roundStatus = 'completed';
				// Complete the draw in database
				if (currentDrawData) {
					await fetch('/api/draws', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							action: 'complete',
							data: { drawId: currentDrawData.id }
						})
					});
				}
			} else {
				// Generate new candidates for next spin (excluding previous winners)
				setTimeout(() => {
					generateCandidates();
				}, 3000); // Give more time to celebrate
			}
		} catch (err) {
			console.error('Error completing spin:', err);
		}
	}
	
	// Reset function with proper cleanup
	async function resetGameShow() {
		try {
			console.log('🔄 Starting game show reset...');
			
			// Set loading state to prevent component rendering during reset
			isLoading = true;
			
			// First, stop the auto-progression subscription to prevent errors during reset
			if (unsubscribeAutoProgression) {
				unsubscribeAutoProgression();
				unsubscribeAutoProgression = null;
			}
			
			// Wait for loading state to take effect and components to stop rendering
			await new Promise(resolve => setTimeout(resolve, 50));
			
			// Clear the current draw ID
			setCurrentDrawId('');
			
			// Reset all local state variables
			currentDrawData = null;
			allHolders = [];
			error = '';
			currentCandidates = [];
			animalMappings = [];
			roundStatus = 'idle';
			currentSpin = 0;
			currentWinnerAnimal = '';
			eligibleHoldersCount = 0;
			
			// Reset the draw state store completely
			drawActions.reset();
			
			// Wait a moment to ensure all reactive updates complete
			await new Promise(resolve => setTimeout(resolve, 100));
			
			// Restart auto-progression with fresh subscription
			unsubscribeAutoProgression = startAutoProgression();
			
			// Turn off loading state
			isLoading = false;
			
			console.log('✅ Game show reset successfully');
		} catch (error) {
			console.error('❌ Error resetting game show:', error);
			isLoading = false;
			// Ensure auto-progression is restarted even on error
			if (!unsubscribeAutoProgression) {
				unsubscribeAutoProgression = startAutoProgression();
			}
		}
	}
	
	// Reactive calculations already defined above
</script>
<svelte:head>
	<title>🎪 CRX7 Game Show - {tokenDisplay} Admin</title>
</svelte:head>

<AdminLayout title="🎪 CRX7 Game Show" description="Experience the lottery like never before" {user}>
	
	<!-- Stage-based Game Show Interface -->
	{#if isLoading}
		<!-- Loading/Reset State -->
		<div class="flex flex-col items-center justify-center min-h-[400px]">
			<Icon icon="mdi:loading" class="w-16 h-16 text-orange-600 animate-spin mb-4" />
			<h2 class="text-2xl font-bold text-orange-600">Resetting Game Show...</h2>
		</div>
	{:else if !currentStageValue || currentStageValue === 'IDLE'}
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
						<div class="text-3xl mb-2">💰</div>
						<div class="text-sm text-gray-600">Prize Pool</div>
						<div class="text-2xl font-bold text-orange-600">{distributionAmount.toFixed(2)} SOL</div>
					</div>
					<div class="bg-white rounded-lg p-6 border-2 border-blue-200 shadow-lg">
						<div class="text-3xl mb-2">🎯</div>
						<div class="text-sm text-gray-600">Winners Per Round</div>
						<div class="text-2xl font-bold text-blue-600">{MAX_DRAWS}</div>
					</div>
					<div class="bg-white rounded-lg p-6 border-2 border-green-200 shadow-lg">
						<div class="text-3xl mb-2">💎</div>
						<div class="text-sm text-gray-600">Prize Per Winner</div>
						<div class="text-2xl font-bold text-green-600">{prizePerWinner.toFixed(3)} SOL</div>
					</div>
				</div>
				
				{#if vaultError}
					<div class="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
						<p class="text-yellow-700 text-sm">⚠️ {vaultError}</p>
					</div>
				{/if}
				
				<Button on:click={startNewGameShow} size="lg" class="px-12 py-4 text-xl">
					<Icon icon="mdi:play-circle" class="mr-3 h-8 w-8" />
					Start the Show!
				</Button>
			</div>
		</div>
		
	{:else if currentStageValue === 'ROUND_START'}
		<!-- Round Opening Ceremony -->
		<RoundOpening 
			round={currentDrawData}
			vaultBalance={vaultTotalBalance}
			eligibleHolders={eligibleHoldersCount}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'DRAW_PREP'}
		<!-- Draw Preparation Stage -->
		<DrawPreparation 
			drawNumber={$currentDraw || 1}
			maxDraws={MAX_DRAWS}
			prizeAmount={prizePerWinner || 0}
			onGenerateContestants={generateContestantsForDraw}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'SPINNING'}
		<!-- Spinning Wheel Stage -->
		<div class="max-w-none">
			<div class="text-center mb-8">
				<h1 class="text-5xl font-bold text-purple-600 mb-4">
					🎯 DRAW {$currentDraw} - SPINNING NOW! 🎯
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
		
	{:else if currentStageValue === 'INTERMISSION' && selectedWinners}
		<!-- Intermission Progress -->
		<IntermissionProgress 
			winners={selectedWinners || []}
			remainingDraws={remainingDraws || 0}
			totalPrizeRemaining={totalPrizeRemaining || 0}
			eligibleHoldersRemaining={eligibleHoldersRemaining || 0}
			autoProgress={false}
		/>
		
	{:else if currentStageValue === 'ROUND_COMPLETE'}
		<!-- Grand Finale -->
		<GrandFinale 
			round={currentDrawData}
			winners={selectedWinners}
			vaultBalance={vaultTotalBalance}
			onProceedToDistribution={completeRound}
		/>
		
	{:else if currentStageValue === 'DISTRIBUTION'}
		<!-- Distribution Processing -->
		<div class="text-center py-16">
			<div class="max-w-2xl mx-auto">
				<div class="text-8xl mb-6">💸</div>
				<h1 class="text-4xl font-bold text-green-600 mb-4">
					Processing Distribution...
				</h1>
				<p class="text-xl text-gray-600 mb-8">
					Preparing {selectedWinners.length + 2} transactions for the blockchain
				</p>
				
				<div class="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-lg mb-8">
					<div class="text-lg font-bold text-gray-800 mb-4">Distribution Summary</div>
					<div class="grid grid-cols-3 gap-4 text-center">
						<div>
							<div class="text-2xl font-bold text-green-600">{selectedWinners.length}</div>
							<div class="text-sm text-gray-600">Winners</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-blue-600">1</div>
							<div class="text-sm text-gray-600">Holdings</div>
						</div>
						<div>
							<div class="text-2xl font-bold text-purple-600">1</div>
							<div class="text-sm text-gray-600">Charity</div>
						</div>
					</div>
				</div>
				
				<Button on:click={proceedToDistribution} size="lg" class="px-8 py-4 text-xl">
					<Icon icon="mdi:cash-multiple" class="mr-3 h-6 w-6" />
					Execute Distribution
				</Button>
			</div>
		</div>
		
	{/if}
	
	<!-- Admin Controls Overlay -->
	<div class="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
		<!-- Stage Indicator -->
		<div class="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-lg text-center">
			<div class="text-xs text-gray-600 mb-1">Current Stage</div>
			<div class="font-bold text-sm">{currentStageValue}</div>
		</div>
		
		<!-- Manual Controls -->
		{#if currentStageValue !== 'IDLE'}
			<div class="bg-white rounded-lg p-3 border-2 border-gray-200 shadow-lg">
				<div class="text-xs text-gray-600 mb-2">Admin Controls</div>
				<div class="flex flex-col gap-2">
					<!-- Manual Progression -->
					{#if currentStageValue !== 'DISTRIBUTION'}
						<Button variant="default" size="sm" on:click={() => drawActions.nextStage()}>
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
		{/if}
	</div>
	
	<!-- Error Display -->
	{#if $drawState.error}
		<div class="fixed top-4 right-4 z-50 max-w-md">
			<div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">
				<div class="flex items-center gap-2 text-red-800">
					<Icon icon="mdi:alert-circle" class="w-5 h-5" />
					<span class="font-bold">Error:</span>
				</div>
				<div class="text-red-600 text-sm mt-1">
					{$drawState.error}
				</div>
				<Button variant="outline" size="sm" class="mt-2" on:click={() => drawActions.setError(null)}>
					Dismiss
				</Button>
			</div>
		</div>
	{/if}
	
</AdminLayout>