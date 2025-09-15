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
	
	let wheelElement: HTMLElement;
	let rotation = 0;
	let spinDuration = 4000; // 4 seconds for dramatic effect
	
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
		
		// Generate random rotation (multiple full spins + random position)
		const spins = 5 + Math.random() * 5; // 5-10 full rotations
		const finalRotation = spins * 360 + Math.random() * 360;
		rotation = finalRotation;
		
		// Animate the wheel
		if (wheelElement) {
			wheelElement.style.transform = `rotate(${rotation}deg)`;
			wheelElement.style.transition = `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
		}
		
		// Determine winner after spin completes
		setTimeout(() => {
			const segmentAngle = 360 / candidates.length;
			
			// Calculate which segment is at the top (12 o'clock position)
			// The wheel rotates, so we need to find what segment ended up at the top
			const currentRotation = rotation % 360;
			
			// Since segments start at -90 degrees (top), we need to account for that
			// and find which segment is now at 0 degrees (12 o'clock)
			let adjustedRotation = (360 - currentRotation) % 360;
			
			// Find which segment index corresponds to the top position
			const winnerIndex = Math.floor(adjustedRotation / segmentAngle) % candidates.length;
			const selectedWinner = candidates[winnerIndex] || candidates[0];
			const selectedAnimal = getAnimalNameForCandidate(selectedWinner);
			
			console.log('Debug - Rotation:', rotation, 'Adjusted:', adjustedRotation, 'Winner Index:', winnerIndex, 'Winner:', selectedAnimal);
			
			winner = selectedWinner;
			winnerAnimal = selectedAnimal;
			isSpinning = false;
			onSpinComplete(selectedWinner, selectedAnimal);
		}, spinDuration);
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

<div class="flex flex-col items-center space-y-8">
	<!-- Wheel Container -->
	<div class="relative">
		<!-- Large Fixed Pointer at 12 o'clock (always visible, more prominent when winner selected) -->
		<div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 z-30">
			<!-- Large winning pointer triangle -->
			<div class="w-0 h-0 
						border-l-[{pointerSizes[size].width}px] border-r-[{pointerSizes[size].width}px] border-b-[{pointerSizes[size].height}px]
						border-l-transparent border-r-transparent 
						{winner && !isSpinning ? 'border-b-yellow-400 animate-pulse' : 'border-b-orange-600'} 
						drop-shadow-lg">
			</div>
			<!-- Pointer base circle -->
			<div class="absolute left-1/2 transform -translate-x-1/2 
						w-{pointerSizes[size].circle} h-{pointerSizes[size].circle} rounded-full border-4 drop-shadow-lg
						{winner && !isSpinning ? 'bg-yellow-400 border-yellow-500 animate-pulse' : 'bg-orange-600 border-orange-700'}"
						style="top: {pointerSizes[size].height - 15}px;">
			</div>
		</div>
		
		<!-- Spinning Wheel -->
		<div class="relative {sizeClasses[size]} rounded-full overflow-hidden shadow-2xl border-8 border-orange-300">
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
				<Icon icon="mdi:loading" class="w-8 h-8 animate-spin" />
				<span class="font-bold text-xl">🎲 Spinning the Wheel...</span>
				<div class="text-sm text-gray-600">Finding our lucky winner!</div>
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
	/* Enhanced spinning animation */
	svg {
		transition-timing-function: cubic-bezier(0.17, 0.67, 0.12, 0.99);
	}
	
	/* Wheel glow effect */
	.relative {
		filter: drop-shadow(0 0 20px rgba(255, 107, 53, 0.3));
	}
	
	/* Text shadow for better readability */
	text {
		filter: drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8));
	}
</style>