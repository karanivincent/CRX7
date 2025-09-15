<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	import SpinningWheel from '$lib/components/admin/spinning-wheel.svelte';
	import { mapWalletsToAnimals, type AnimalMapping } from '$lib/utils/animal-mapping';
	import { onMount } from 'svelte';
	
	export let data;
	const { user } = data;
	
	const tokenDisplay = getTokenDisplay();
	
	// Draw state
	let currentDraw: any = null;
	let distributionAmount = 100; // From previous page or API
	let roundStatus = 'not_started'; // not_started, active, completed
	let currentSpin = 0;
	let maxSpins = 7;
	
	// Database-backed data
	let currentCandidates: string[] = [];
	let selectedWinners: { address: string; animal: string; id?: string }[] = [];
	let isSpinning = false;
	let currentWinnerAnimal = '';
	let animalMappings: AnimalMapping[] = [];
	let allHolders: string[] = [];
	let isLoading = false;
	let error = '';
	
	// Mock eligible holders
	const mockHolders = [
		'8K9bPq5zN6tYrA7mW2p3Vx4d',
		'9J2cRe7zA5sB8nM4x6wV9qTy',
		'5F3dGh8kL9pQ2rA7mX4nB6yZ',
		'7H5jKl2nQ8vB4mR6wA9sE3xZ',
		'2A8dF3kP7nR9vB5mQ6wE4yTz',
		'6B9jKp3rQ7nV5mA8sE2wF4xY',
		'4C7hJl5nP9rB3mQ6wA8sE2yV',
		'3D6gHk8pQ2nR7vB4mA5sE9wX',
		'1E4fGj7kL9pQ3nR8vB6mA2sW',
		'9G2hJl4nP8rQ5vB7mA3sE6wZ',
		'8H5jKp7nQ9rB4vA6mS2eW1xY',
		'7J3gHl6kP2nQ8rB5vA9mS4eW'
	];

	// Load current draw status on mount
	onMount(async () => {
		await loadCurrentDraw();
	});

	async function loadCurrentDraw() {
		try {
			isLoading = true;
			const response = await fetch('/api/draws?action=current');
			const result = await response.json();
			
			if (result.draw) {
				currentDraw = result.draw;
				roundStatus = currentDraw.status === 'active' ? 'active' : 'not_started';
				// Load participants and winners if draw is active
				if (currentDraw.status === 'active') {
					await loadDrawData();
				}
			}
		} catch (err) {
			console.error('Error loading current draw:', err);
			error = 'Failed to load current draw';
		} finally {
			isLoading = false;
		}
	}

	async function loadDrawData() {
		if (!currentDraw) return;
		
		try {
			// Load participants and winners for the current draw
			const dashboardResponse = await fetch('/api/draws?action=dashboard');
			const dashboardData = await dashboardResponse.json();
			
			if (dashboardData.participants) {
				currentCandidates = dashboardData.participants.map((p: any) => p.walletAddress);
				animalMappings = dashboardData.participants.map((p: any) => ({
					walletAddress: p.walletAddress,
					animal: {
						name: p.animalName,
						emoji: p.animalEmoji,
						description: `${p.animalName} participant`
					}
				}));
			}
			
			if (dashboardData.latestWinners) {
				selectedWinners = dashboardData.latestWinners
					.filter((w: any) => w.drawNumber === currentDraw.drawNumber)
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
			currentDraw = createResult.draw;

			// Start the draw
			const startResponse = await fetch('/api/draws', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'start',
					data: { drawId: currentDraw.id }
				})
			});

			if (!startResponse.ok) {
				throw new Error('Failed to start draw');
			}

			currentDraw = (await startResponse.json()).draw;
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
			// TODO: Replace with actual Helius API call when ready
			// For now, use mock data and exclude previous winners
			const availableHolders = mockHolders.filter(
				holder => !selectedWinners.some(winner => winner.address === holder)
			);
			
			const shuffled = [...availableHolders].sort(() => 0.5 - Math.random());
			currentCandidates = shuffled.slice(0, 7);
			
			// Update animal mappings
			animalMappings = mapWalletsToAnimals(currentCandidates);
			
			// Save participants to database if we have a current draw
			if (currentDraw) {
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'add_participants',
						data: {
							drawId: currentDraw.id,
							participants: animalMappings
						}
					})
				});
				
				if (!response.ok) {
					console.error('Failed to save participants to database');
				}
			}
		} catch (err) {
			console.error('Error generating candidates:', err);
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
			if (currentDraw) {
				const winnerData = {
					participantId: '', // Will be resolved by the API
					walletAddress: winner,
					prizeAmount: (distributionAmount * 0.5 / 7).toString(),
					position: currentSpin
				};
				
				const response = await fetch('/api/draws', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'record_winners',
						data: {
							drawId: currentDraw.id,
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
				if (currentDraw) {
					await fetch('/api/draws', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							action: 'complete',
							data: { drawId: currentDraw.id }
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
	
	function proceedToDistribution() {
		// Navigate to distribution page with winners data
		window.location.href = '/admin/distribution';
	}
	
	$: winnerAmount = distributionAmount * 0.5 / 7;
	$: holdingAmount = distributionAmount * 0.4;
	$: charityAmount = distributionAmount * 0.1;
</script>

<svelte:head>
	<title>Draw Management - {tokenDisplay} Admin</title>
</svelte:head>

<AdminLayout title="Draw Management" description="Run live lottery draws and select winners" {user}>

	<!-- Full Width Layout When Active -->
	{#if roundStatus === 'active'}
		<div class="max-w-none">
			<!-- Header -->
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900 mb-2">
					<Icon icon="mdi:dice-6" class="inline w-8 h-8 text-orange-600 mr-2" />
					🎯 LIVE DRAW - Round #{currentDraw?.drawNumber || 'Unknown'}
				</h1>
				<p class="text-lg text-gray-600 mb-4">
					Spin {currentSpin + 1} of {maxSpins} - Who will be our next lucky winner?
				</p>
				<div class="flex items-center justify-center gap-8 text-lg">
					<div class="text-orange-600 font-bold">
						🏆 {currentSpin}/{maxSpins} Winners Selected
					</div>
					<div class="text-green-600 font-bold">
						💰 {winnerAmount.toFixed(3)} SOL Each
					</div>
				</div>
			</div>

			<!-- Top Row: Spinning Wheel Left, Winner Display Right -->
			<!-- Use min-width breakpoint for responsive layout -->
			<div class="grid grid-cols-1 min-[1200px]:grid-cols-5 gap-6 mb-8">
				<!-- Left: Spinning Wheel (takes 3 columns on wide screens) -->
				<Card class="border-2 border-orange-200 min-[1200px]:col-span-3">
					<CardHeader>
						<CardTitle class="text-center">🎯 Spinning Wheel</CardTitle>
					</CardHeader>
					<CardContent class="flex justify-center py-4">
						<SpinningWheel 
							candidates={currentCandidates}
							bind:isSpinning
							{onSpinComplete}
							{onSpinStart}
							size="large"
							showLegend={false}
						/>
					</CardContent>
				</Card>

				<!-- Right: Winner Display (takes 2 columns on wide screens, full width below breakpoint) -->
				<Card class="border-2 border-green-200 min-[1200px]:col-span-2">
					<CardHeader>
						<CardTitle class="text-center">🏆 Latest Winner</CardTitle>
					</CardHeader>
					<CardContent class="flex items-center justify-center py-4 min-h-[300px]">
						{#if currentWinnerAnimal && selectedWinners.length > 0}
							<!-- Latest Winner Display -->
							<div class="text-center">
								<div class="text-4xl mb-3">🎉</div>
								<div class="text-2xl font-bold text-green-800 mb-2">{currentWinnerAnimal}</div>
								<div class="text-lg text-green-600 mb-3">WINS!</div>
								<div class="text-sm text-gray-600 mb-2">Wallet Address:</div>
								<div class="font-mono text-xs bg-white px-3 py-2 rounded-lg border shadow-sm break-all">
									{selectedWinners[selectedWinners.length - 1]?.address}
								</div>
								<div class="mt-3 text-lg font-bold text-green-600">
									+{winnerAmount.toFixed(3)} SOL
								</div>
							</div>
						{:else if isSpinning}
							<!-- Spinning State -->
							<div class="text-center">
								<Icon icon="mdi:loading" class="w-12 h-12 mx-auto mb-3 text-orange-600 animate-spin" />
								<div class="text-xl font-bold text-orange-600 mb-2">🎲 Spinning...</div>
								<div class="text-gray-600">Finding our lucky winner!</div>
							</div>
						{:else}
							<!-- Waiting State -->
							<div class="text-center text-gray-500">
								<Icon icon="mdi:trophy-outline" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
								<div class="text-lg">Waiting for spin...</div>
								<div class="text-sm">Winner will appear here</div>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<!-- Bottom Row: Contestants -->
			{#if currentCandidates.length > 0}
				<Card class="border-2 border-purple-200 mb-6">
					<CardHeader>
						<CardTitle class="text-center">🎯 Current Contestants</CardTitle>
						<CardDescription class="text-center">
							{currentCandidates.length} crypto animals competing for {winnerAmount.toFixed(3)} SOL
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
							{#each currentCandidates as candidate, index}
								{@const animal = animalMappings.find(m => m.walletAddress === candidate)}
								<div class="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
									<div class="flex items-center gap-3">
										<span class="text-3xl">{animal?.animal.emoji || '🎯'}</span>
										<div>
											<div class="font-bold text-purple-800">{animal?.animal.name || 'Unknown'}</div>
											<div class="text-xs text-purple-600">{animal?.animal.description || ''}</div>
										</div>
									</div>
									<div class="text-xs font-mono text-gray-600 text-right">
										<div>{candidate.slice(0, 6)}...</div>
										<div>{candidate.slice(-6)}</div>
									</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- All Winners (when multiple exist) -->
			{#if selectedWinners.length > 1}
				<Card class="border-2 border-green-200 mb-6">
					<CardHeader>
						<CardTitle class="text-center">🏆 All Selected Winners</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="flex flex-wrap gap-3 justify-center">
							{#each selectedWinners as winner, index}
								<div class="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
									<div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
										{index + 1}
									</div>
									<span class="font-bold">{winner.animal}</span>
									<span class="text-xs font-mono text-gray-600">
										{winner.address.slice(0, 4)}...{winner.address.slice(-4)}
									</span>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>
			{/if}
			
			{#if roundStatus === 'completed'}
				<div class="mt-6 text-center">
					<div class="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
						<div class="text-6xl mb-4">🎉</div>
						<h3 class="text-2xl font-bold text-green-800 mb-2">Round Complete!</h3>
						<p class="text-green-700 text-lg">All {maxSpins} winners have been selected</p>
					</div>
					<Button on:click={proceedToDistribution} class="px-8 py-4 text-lg">
						<Icon icon="mdi:cash-multiple" class="mr-3 h-6 w-6" />
						Proceed to Distribution
					</Button>
				</div>
			{/if}
		</div>
	{:else}
		<!-- Compact Layout When Not Active -->
		<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
			<!-- Spinning Wheel Section -->
			<div class="xl:col-span-2">
				<Card class="border-2 border-orange-200">
					<CardHeader>
						<div class="flex items-center justify-between">
							<div>
								<CardTitle class="flex items-center gap-2">
									<Icon icon="mdi:dice-6" class="w-5 h-5 text-orange-600" />
									Live Draw - Round #{currentDraw?.drawNumber || 'Not Started'}
								</CardTitle>
								<CardDescription>
									{#if roundStatus === 'not_started'}
										Ready to start a new drawing round
									{:else if roundStatus === 'active'}
										Spin {currentSpin + 1} of {maxSpins} - Select the next winner
									{:else}
										Round completed! All {maxSpins} winners selected
									{/if}
								</CardDescription>
							</div>
							
							{#if roundStatus === 'active'}
								<div class="text-right">
									<div class="text-2xl font-bold text-orange-600">{currentSpin}/{maxSpins}</div>
									<div class="text-sm text-gray-500">winners selected</div>
								</div>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						{#if roundStatus === 'not_started'}
							<div class="text-center py-12">
								<Icon icon="mdi:dice-6" class="w-16 h-16 mx-auto mb-4 text-gray-300" />
								<h3 class="text-lg font-medium text-gray-900 mb-2">Ready to Start Drawing</h3>
								<p class="text-gray-600 mb-6">
									Click below to begin a new lottery round with {distributionAmount} SOL
								</p>
								{#if error}
									<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
										<p class="text-red-600 text-sm">{error}</p>
									</div>
								{/if}
								<Button on:click={startNewRound} disabled={isLoading} class="px-8 py-3">
									{#if isLoading}
										<Icon icon="mdi:loading" class="mr-2 h-5 w-5 animate-spin" />
										Creating Draw...
									{:else}
										<Icon icon="mdi:play" class="mr-2 h-5 w-5" />
										Start New Round
									{/if}
								</Button>
							</div>
						{:else}
							<div class="flex justify-center">
								<SpinningWheel 
									candidates={currentCandidates}
									bind:isSpinning
									{onSpinComplete}
									size="large"
									showLegend={false}
								/>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
			
			<!-- Winners & Info Panel -->
			<div class="space-y-6">
				<!-- Round Summary -->
				<Card class="border-2 border-blue-200">
					<CardHeader>
						<CardTitle class="text-lg flex items-center gap-2">
							<Icon icon="mdi:information" class="w-5 h-5 text-blue-600" />
							Round Summary
						</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3">
						<div class="flex justify-between">
							<span class="text-gray-600">Distribution Amount:</span>
							<span class="font-bold">{distributionAmount} SOL</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Per Winner:</span>
							<span class="font-bold text-orange-600">{winnerAmount.toFixed(3)} SOL</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Holding Wallet:</span>
							<span class="font-bold text-blue-600">{holdingAmount.toFixed(2)} SOL</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">Charity:</span>
							<span class="font-bold text-green-600">{charityAmount.toFixed(2)} SOL</span>
						</div>
						<div class="pt-2 border-t flex justify-between">
							<span class="text-gray-600">Winners Selected:</span>
							<span class="font-bold">{selectedWinners.length}/{maxSpins}</span>
						</div>
					</CardContent>
				</Card>
				
				<!-- Selected Winners -->
				<Card class="border-2 border-green-200">
					<CardHeader>
						<CardTitle class="text-lg flex items-center gap-2">
							<Icon icon="mdi:trophy" class="w-5 h-5 text-green-600" />
							Selected Winners
						</CardTitle>
					</CardHeader>
					<CardContent>
						{#if selectedWinners.length === 0}
							<div class="text-center py-6 text-gray-500">
								<Icon icon="mdi:account-outline" class="w-8 h-8 mx-auto mb-2 text-gray-300" />
								<p>No winners selected yet</p>
							</div>
						{:else}
							<div class="space-y-2">
								{#each selectedWinners as winner, index}
									<div class="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
										<div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
											{index + 1}
										</div>
										<div class="flex-1">
											<div class="font-bold text-lg">{winner.animal}</div>
											<div class="font-mono text-xs text-gray-600">{winner.address.slice(0, 8)}...{winner.address.slice(-8)}</div>
										</div>
										<Icon icon="mdi:check" class="w-4 h-4 text-green-600" />
									</div>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
				
				<!-- Current Candidates -->
				{#if roundStatus === 'active' && currentCandidates.length > 0}
					<Card class="border-2 border-purple-200">
						<CardHeader>
							<CardTitle class="text-lg flex items-center gap-2">
								<Icon icon="mdi:account-group" class="w-5 h-5 text-purple-600" />
								Current Candidates
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-2">
								{#each currentCandidates as candidate}
									<div class="flex items-center gap-2 p-2 bg-purple-50 rounded text-sm font-mono">
										<Icon icon="mdi:account" class="w-4 h-4 text-purple-600" />
										{candidate.slice(0, 8)}...{candidate.slice(-8)}
									</div>
								{/each}
							</div>
						</CardContent>
					</Card>
				{/if}
			</div>
		</div>
	{/if}
</AdminLayout>