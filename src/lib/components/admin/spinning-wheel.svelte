<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from '@iconify/svelte';
	import { mapWalletsToAnimals, createAnimalLegend, getAnimalDisplay, type AnimalMapping } from '$lib/utils/animal-mapping';
	
	export let candidates: string[] = [];
	export let isSpinning: boolean = false;
	export let winner: string = '';
	export let winnerAnimal: string = '';
	export let onSpinComplete: (winner: string, animal: string) => void = () => {};
	export let onSpinStart: () => void = () => {};
	export let size: 'normal' | 'large' | 'xlarge' = 'large';
	export let showLegend: boolean = true;
	export let autoSpin: boolean = false; // New: Auto-spin on mount
	export let spinDelay: number = 1000; // Delay before auto-spin starts
	
	let wheelElement: HTMLElement;
	let rotation = 0;
	let spinDuration = 10000; // 10 seconds for ultra dramatic effect
	let isAccelerating = false;
	let showSparkles = false;
	let celebrationMode = false;
	let isDramaticSlowdown = false; // New state for final dramatic slowdown
	let isRecoiling = false; // New state for recoil effect
	
	// Enhanced colors for wheel segments - more vibrant
	const segmentColors = [
		'#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', 
		'#3D5A80', '#98D8C8', '#F06292', '#8B5CF6',
		'#EF4444', '#10B981', '#3B82F6', '#F59E0B'
	];
	
	// Animal mappings for current candidates
	let animalMappings: AnimalMapping[] = [];
	let animalLegend: ReturnType<typeof createAnimalLegend> = [];
	
	// Wheel sizing based on size prop
	const sizeClasses = {
		normal: 'w-80 h-80',
		large: 'w-80 h-80 md:w-96 md:h-96 lg:w-[420px] lg:h-[420px]',
		xlarge: 'w-96 h-96 md:w-[420px] md:h-[420px] lg:w-[480px] lg:h-[480px]'
	};
	
	// Pointer sizes for different wheel sizes
	const pointerSizes = {
		normal: { width: 20, height: 60, circle: 6 },
		large: { width: 25, height: 80, circle: 8 },
		xlarge: { width: 30, height: 100, circle: 10 }
	};
	
	// Update animal mappings when candidates change
	$: if (candidates.length > 0) {
		animalMappings = mapWalletsToAnimals(candidates);
		animalLegend = createAnimalLegend(animalMappings);
		
		// Auto-spin if enabled and not already spinning
		if (autoSpin && !isSpinning) {
			setTimeout(() => {
				spinWheel();
			}, spinDelay);
		}
	}
	
	function getAnimalForCandidate(address: string): string {
		const mapping = animalMappings.find(m => m.walletAddress === address);
		return mapping ? mapping.animal.emoji : '🎯';
	}
	
	function getAnimalNameForCandidate(address: string): string {
		const mapping = animalMappings.find(m => m.walletAddress === address);
		return mapping ? getAnimalDisplay(mapping.animal) : 'Unknown';
	}
	
	function spinWheel() {
		if (isSpinning || candidates.length === 0) return;
		
		onSpinStart();
		isSpinning = true;
		isAccelerating = true;
		showSparkles = true;
		celebrationMode = false;
		isDramaticSlowdown = false;
		isRecoiling = false;
		
		// Generate random rotation (more spins for more drama)
		const spins = 10 + Math.random() * 3; // 10-13 full rotations for maximum drama
		const baseRotation = spins * 360 + Math.random() * 360;
		// Slightly overshoot for the recoil effect
		const overshoot = 5 + Math.random() * 10; // 5-15 degrees overshoot
		rotation = baseRotation + overshoot;
		
		// Enhanced animation with EXTREME slowdown at the end
		if (wheelElement) {
			wheelElement.style.transform = `rotate(${rotation}deg)`;
			// Custom cubic bezier for EXTREME slowdown - almost stops at the end
			wheelElement.style.transition = `transform ${spinDuration}ms cubic-bezier(0.15, 0.85, 0.95, 0.995)`;
			
			// Add intense pulsing effect during acceleration
			wheelElement.style.filter = 'drop-shadow(0 0 30px rgba(255, 107, 53, 0.9)) brightness(1.1)';
		}
		
		// Phase 1: Acceleration phase (first 2 seconds)
		setTimeout(() => {
			isAccelerating = false;
			if (wheelElement) {
				wheelElement.style.filter = 'drop-shadow(0 0 15px rgba(255, 200, 0, 0.6))';
			}
		}, 2000);
		
		// Phase 2: Steady spin (2-7 seconds)
		setTimeout(() => {
			showSparkles = false;
			if (wheelElement) {
				wheelElement.style.filter = 'drop-shadow(0 0 10px rgba(255, 200, 0, 0.4))';
			}
		}, 7000);
		
		// Phase 3: Dramatic slowdown (7-9.5 seconds)
		setTimeout(() => {
			isDramaticSlowdown = true;
			if (wheelElement) {
				// Add dramatic pulsing shadow during final slowdown
				wheelElement.style.filter = 'drop-shadow(0 0 35px rgba(255, 200, 0, 0.9)) brightness(1.08)';
			}
		}, spinDuration - 3000);
		
		// Phase 4: Recoil effect (at 9.5 seconds - bounce back slightly)
		setTimeout(() => {
			isRecoiling = true;
			isDramaticSlowdown = false;
			
			// Apply recoil - bounce back slightly
			const recoilRotation = baseRotation - 2; // Bounce back 2 degrees
			if (wheelElement) {
				wheelElement.style.transform = `rotate(${recoilRotation}deg)`;
				wheelElement.style.transition = 'transform 500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)'; // Elastic bounce
				wheelElement.style.filter = 'drop-shadow(0 0 40px rgba(255, 100, 0, 1)) brightness(1.1)';
			}
			rotation = recoilRotation;
			
			// Small forward correction after recoil
			setTimeout(() => {
				const finalRotation = baseRotation;
				if (wheelElement) {
					wheelElement.style.transform = `rotate(${finalRotation}deg)`;
					wheelElement.style.transition = 'transform 300ms ease-out';
					wheelElement.style.filter = 'drop-shadow(0 0 20px rgba(255, 200, 0, 0.7))';
				}
				rotation = finalRotation;
			}, 500);
		}, spinDuration - 500);
		
		// Determine winner after spin completes (after recoil settles)
		setTimeout(() => {
			isDramaticSlowdown = false;
			isRecoiling = false;
			const segmentAngle = 360 / candidates.length;
			
			// Calculate which segment is at the top (12 o'clock position)
			const currentRotation = rotation % 360;
			
			// Since segments start at -90 degrees (top), we need to account for that
			let adjustedRotation = (360 - currentRotation) % 360;
			
			// Find which segment index corresponds to the top position
			const winnerIndex = Math.floor(adjustedRotation / segmentAngle) % candidates.length;
			const selectedWinner = candidates[winnerIndex] || candidates[0];
			const selectedAnimal = getAnimalNameForCandidate(selectedWinner);
			
			// Start celebration mode
			celebrationMode = true;
			
			// Add winner highlight effect with dramatic green glow
			if (wheelElement) {
				wheelElement.style.filter = 'drop-shadow(0 0 40px rgba(34, 197, 94, 0.9)) brightness(1.15)';
				setTimeout(() => {
					if (wheelElement) {
						wheelElement.style.filter = 'drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))';
					}
				}, 3000);
			}
			
			winner = selectedWinner;
			winnerAnimal = selectedAnimal;
			isSpinning = false;
			onSpinComplete(selectedWinner, selectedAnimal);
		}, spinDuration + 800); // Slightly after recoil completes
	}
	
	onMount(() => {
		// Reset wheel rotation when candidates change
		if (wheelElement) {
			wheelElement.style.transform = 'rotate(0deg)';
			wheelElement.style.transition = 'none';
		}
		rotation = 0;
		winner = '';
		winnerAnimal = '';
	});
	
	$: segmentAngle = candidates.length > 0 ? 360 / candidates.length : 0;
</script>

<div class="flex flex-col items-center space-y-8 relative">
	
	<!-- Sparkle Effects -->
	{#if showSparkles}
		{#each Array(12) as _, i}
			<div 
				class="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping"
				style="
					left: {50 + 40 * Math.cos((i * 30) * Math.PI / 180)}%; 
					top: {50 + 40 * Math.sin((i * 30) * Math.PI / 180)}%;
					animation-delay: {i * 100}ms;
				"
			></div>
		{/each}
	{/if}
	
	<!-- Celebration Confetti -->
	{#if celebrationMode}
		{#each Array(20) as _, i}
			<div 
				class="absolute w-1 h-4 animate-bounce"
				style="
					left: {Math.random() * 100}%; 
					top: {Math.random() * 100}%;
					background: linear-gradient(45deg, #ff6b35, #f7931e, #ffd23f, #06ffa5);
					animation-delay: {i * 50}ms;
					animation-duration: {1 + Math.random()}s;
				"
			></div>
		{/each}
	{/if}
	
	<!-- Wheel Container -->
	<div class="relative">
		<!-- Large Fixed Pointer Arrow at 12 o'clock (always visible, more prominent when winner selected) -->
		<div class="absolute -top-4 left-1/2 transform -translate-x-1/2 z-30 
			 {isDramaticSlowdown ? 'animate-bounce' : isRecoiling ? 'scale-125' : ''}
			 transition-transform duration-300">
			
			<!-- Main Arrow Container with glow effect -->
			<div class="relative">
				<!-- Glow effect behind arrow -->
				{#if isSpinning || winner}
					<div class="absolute inset-0 blur-md opacity-50">
						<svg width="60" height="80" viewBox="0 0 60 80">
							<path d="M 30 75 L 10 35 L 20 35 L 20 5 L 40 5 L 40 35 L 50 35 Z" 
								  fill={winner && !isSpinning ? '#facc15' : isDramaticSlowdown ? '#fbbf24' : '#ef4444'} />
						</svg>
					</div>
				{/if}
				
				<!-- Main Arrow -->
				<svg width="60" height="80" viewBox="0 0 60 80" class="relative">
					<!-- Arrow shadow -->
					<path d="M 31 76 L 11 36 L 21 36 L 21 6 L 41 6 L 41 36 L 51 36 Z" 
						  fill="rgba(0,0,0,0.3)" />
					
					<!-- Arrow body -->
					<path d="M 30 75 L 10 35 L 20 35 L 20 5 L 40 5 L 40 35 L 50 35 Z" 
						  fill={winner && !isSpinning ? '#facc15' : isDramaticSlowdown ? '#f59e0b' : isRecoiling ? '#dc2626' : '#ef4444'}
						  stroke={winner && !isSpinning ? '#f59e0b' : '#991b1b'}
						  stroke-width="2"
						  class="{winner && !isSpinning ? 'animate-pulse' : ''}" />
					
					<!-- Arrow highlight -->
					<path d="M 30 70 L 15 40 L 22 40 L 22 10 L 30 10 L 30 40 Z" 
						  fill="rgba(255,255,255,0.3)" />
				</svg>
				
				<!-- Winner indicator text -->
				{#if winner && !isSpinning}
					<div class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
						<span class="text-sm font-bold text-yellow-500 bg-white px-2 py-1 rounded shadow-lg animate-pulse">
							WINNER!
						</span>
					</div>
				{/if}
			</div>
		</div>
		
		<!-- Spinning Wheel -->
		<div class="relative {sizeClasses[size]} rounded-full overflow-hidden shadow-2xl border-8 
			{isDramaticSlowdown ? 'border-yellow-500 animate-pulse' : isSpinning ? 'border-yellow-400' : celebrationMode ? 'border-green-400' : 'border-orange-300'} 
			transition-all duration-300">
			<svg 
				bind:this={wheelElement}
				class="w-full h-full drop-shadow-lg" 
				viewBox="0 0 200 200"
				style="transform-origin: center;"
			>
				{#each candidates as candidate, index}
					{@const startAngle = (index * segmentAngle - 90) * (Math.PI / 180)}
					{@const endAngle = ((index + 1) * segmentAngle - 90) * (Math.PI / 180)}
					{@const largeArcFlag = segmentAngle > 180 ? 1 : 0}
					{@const x1 = 100 + 90 * Math.cos(startAngle)}
					{@const y1 = 100 + 90 * Math.sin(startAngle)}
					{@const x2 = 100 + 90 * Math.cos(endAngle)}
					{@const y2 = 100 + 90 * Math.sin(endAngle)}
					
					<!-- Segment -->
					<path
						d="M 100 100 L {x1} {y1} A 90 90 0 {largeArcFlag} 1 {x2} {y2} Z"
						fill={segmentColors[index % segmentColors.length]}
						stroke="white"
						stroke-width="2"
					/>
					
					<!-- Animal Emoji -->
					{@const textAngle = (index * segmentAngle + segmentAngle / 2 - 90) * (Math.PI / 180)}
					{@const textX = 100 + 60 * Math.cos(textAngle)}
					{@const textY = 100 + 60 * Math.sin(textAngle)}
					
					<!-- Large Animal Emoji -->
					<text
						x={textX}
						y={textY - 5}
						text-anchor="middle"
						dominant-baseline="middle"
						font-size="{size === 'xlarge' ? '28' : size === 'large' ? '20' : '16'}"
						transform="rotate({index * segmentAngle + segmentAngle / 2}, {textX}, {textY})"
					>
						{getAnimalForCandidate(candidate)}
					</text>
					
					<!-- Animal Name -->
					<text
						x={textX}
						y={textY + 8}
						text-anchor="middle"
						dominant-baseline="middle"
						fill="white"
						font-size="{size === 'xlarge' ? '10' : size === 'large' ? '8' : '6'}"
						font-weight="bold"
						transform="rotate({index * segmentAngle + segmentAngle / 2}, {textX}, {textY})"
						text-shadow="1px 1px 2px rgba(0,0,0,0.8)"
					>
						{animalMappings[index]?.animal.name || ''}
					</text>
				{/each}
			</svg>
		</div>
	</div>
	
	<!-- Controls -->
	<div class="text-center space-y-6">
		{#if candidates.length === 0}
			<div class="text-center py-8">
				<Icon icon="mdi:dice-6" class="w-16 h-16 mx-auto mb-4 text-gray-300" />
				<p class="text-gray-500 text-lg">No candidates loaded</p>
			</div>
		{:else if isSpinning}
			<div class="flex flex-col items-center gap-4 text-orange-600">
				{#if isRecoiling}
					<Icon icon="mdi:target" class="w-10 h-10 text-red-600 animate-bounce" />
					<span class="font-bold text-2xl text-red-600 animate-bounce">🎯 LOCKED IN! 🎯</span>
					<div class="text-sm text-gray-700 font-semibold">Winner detected!</div>
				{:else if isDramaticSlowdown}
					<Icon icon="mdi:timer-sand" class="w-8 h-8 animate-pulse text-yellow-500" />
					<span class="font-bold text-2xl text-yellow-600 animate-pulse">⚡ ALMOST THERE... ⚡</span>
					<div class="text-sm text-gray-600 animate-pulse">The wheel is crawling to a stop...</div>
				{:else}
					<Icon icon="mdi:loading" class="w-8 h-8 animate-spin" />
					<span class="font-bold text-xl">🎲 Spinning the Wheel...</span>
					<div class="text-sm text-gray-600">Finding our lucky winner!</div>
				{/if}
			</div>
		{:else}
			<button
				on:click={spinWheel}
				disabled={isSpinning || candidates.length === 0}
				class="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 
					   disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold 
					   py-4 px-12 rounded-xl transition-all duration-200 transform hover:scale-105 
					   shadow-lg hover:shadow-xl flex items-center gap-3 text-lg"
			>
				<Icon icon="mdi:dice-6" class="w-6 h-6" />
				🎯 SPIN THE WHEEL!
			</button>
		{/if}
		
		{#if candidates.length > 0 && !isSpinning}
			<div class="text-gray-600">
				<div class="font-medium">{candidates.length} crypto animals ready to compete!</div>
				<div class="text-sm">May the luckiest hodler win 🚀</div>
			</div>
		{/if}
	</div>
	
	<!-- Animal Legend -->
	{#if showLegend && animalLegend.length > 0 && !isSpinning}
		<div class="mt-8 max-w-md mx-auto">
			<h3 class="text-lg font-bold text-center mb-4 text-gray-800">🎯 Contestants</h3>
			<div class="grid grid-cols-1 gap-2">
				{#each animalLegend as legend}
					<div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
						<div class="flex items-center gap-3">
							<span class="text-2xl">{legend.animal.emoji}</span>
							<div>
								<div class="font-bold text-gray-800">{legend.animal.name}</div>
								<div class="text-xs text-gray-500">{legend.animal.description}</div>
							</div>
						</div>
						<div class="text-xs font-mono text-gray-600">{legend.shortAddress}</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Enhanced spinning animation with ULTRA extreme slowdown */
	svg {
		transition-timing-function: cubic-bezier(0.15, 0.85, 0.95, 0.995);
	}
	
	/* Wheel glow effect */
	.relative {
		filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.3));
	}
	
	/* Text shadow for better readability */
	text {
		filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
	}
	
	/* Dramatic glow animation for final slowdown - no size change */
	@keyframes dramaticGlow {
		0%, 100% { opacity: 1; filter: brightness(1); }
		50% { opacity: 0.95; filter: brightness(1.1); }
	}
	
	/* Recoil shake animation - subtle horizontal movement only */
	@keyframes recoilShake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-1px); }
		75% { transform: translateX(1px); }
	}
	
	/* Apply to wheel during dramatic slowdown - no size change */
	:global(.dramatic-slowdown) {
		animation: dramaticGlow 0.3s ease-in-out infinite;
	}
	
	/* Apply subtle shake during recoil */
	:global(.recoil-effect) {
		animation: recoilShake 0.15s ease-in-out 2;
	}
	
	/* Arrow wobble animation during dramatic slowdown */
	@keyframes arrowWobble {
		0%, 100% { transform: rotate(0deg); }
		25% { transform: rotate(-5deg); }
		75% { transform: rotate(5deg); }
	}
	
	/* Arrow glow pulsing */
	@keyframes arrowGlow {
		0%, 100% { 
			filter: drop-shadow(0 0 10px rgba(239, 68, 68, 0.8)); 
		}
		50% { 
			filter: drop-shadow(0 0 20px rgba(239, 68, 68, 1)) drop-shadow(0 0 30px rgba(245, 158, 11, 0.6)); 
		}
	}
</style>