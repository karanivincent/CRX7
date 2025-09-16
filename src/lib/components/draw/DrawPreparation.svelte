<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { gameRoundActions, contestants } from '$lib/stores/game-round';
  import RevealOrchestrator from './RevealOrchestrator.svelte';
  import type { AnimalMapping } from '$lib/utils/animal-mapping';
  
  export let drawNumber: number = 1;
  export let maxDraws: number = 7;
  export let prizeAmount: number = 0;
  export let onGenerateContestants: () => Promise<void>;
  export let autoProgress: boolean = false;
  export let eligibleHoldersCount: number = 0;
  
  let revealPhase: 'generating' | 'revealing' | 'complete' = 'generating';
  let generatedContestants: AnimalMapping[] = [];
  
  $: progressPercentage = (drawNumber / maxDraws) * 100;
  
  onMount(() => {
    console.log('🎯 DrawPreparation: onMount() called, contestants:', $contestants.length);
    
    // Check if we already have contestants
    if ($contestants.length > 0) {
      console.log('🎯 DrawPreparation: Contestants already exist, starting animated reveal');
      generatedContestants = $contestants;
      revealPhase = 'revealing';
    } else {
      console.log('🎯 DrawPreparation: No contestants found, generating...');
      generateContestants();
    }
  });
  
  async function generateContestants() {
    revealPhase = 'generating';
    
    try {
      console.log('🎯 DrawPreparation: Generating contestants...');
      await onGenerateContestants();
      
      // Get the generated contestants
      generatedContestants = $contestants;
      
      if (generatedContestants.length > 0) {
        console.log('🎯 DrawPreparation: Contestants generated, starting animated reveal');
        console.log('🎯 Generated contestants:', generatedContestants);
        revealPhase = 'revealing';
      } else {
        console.error('🎯 DrawPreparation: No contestants were generated');
        console.error('🎯 Store contestants:', $contestants);
        gameRoundActions.setError('Failed to generate contestants');
      }
    } catch (error) {
      console.error('🎯 DrawPreparation: Error generating contestants:', error);
      gameRoundActions.setError('Failed to generate contestants');
    }
  }
  
  function handleRevealComplete() {
    console.log('🎯 DrawPreparation: Animated reveal sequence complete');
    // Go directly to spinning wheel
    gameRoundActions.advanceStage();
  }
  
  function proceedToSpin() {
    console.log('🎯 DrawPreparation: Proceeding to spin wheel');
    gameRoundActions.advanceStage();
  }
  
  function retryGeneration() {
    console.log('🎯 DrawPreparation: Retrying contestant generation');
    generateContestants();
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-4 border-purple-300 p-8">
  <!-- Draw Header -->
  <div class="text-center mb-8">
    <h1 class="text-5xl font-bold text-purple-600 mb-2">
      DRAW {drawNumber} OF {maxDraws}
    </h1>
    <div class="w-full max-w-md mx-auto mb-4">
      <div class="bg-white rounded-full h-4 border-2 border-purple-200 shadow-inner">
        <div 
          class="bg-gradient-to-r from-purple-500 to-blue-500 h-full rounded-full transition-all duration-500" 
          style="width: {progressPercentage}%"
        ></div>
      </div>
      <div class="text-sm text-purple-600 mt-1 font-semibold">Round Progress: {drawNumber}/{maxDraws}</div>
    </div>
  </div>
  
  <!-- Prize Display -->
  <div class="bg-white rounded-lg p-6 mb-8 border-2 border-yellow-300 shadow-lg">
    <div class="text-center">
      <div class="text-4xl mb-2">💎</div>
      <div class="text-lg text-gray-600 mb-1">Prize for this draw</div>
      <div class="text-4xl font-bold text-yellow-600">{prizeAmount.toFixed(3)} SOL</div>
    </div>
  </div>
  
  {#if revealPhase === 'generating'}
    <!-- Simple Loading State -->
    <div class="text-center">
      <Icon icon="mdi:loading" class="w-16 h-16 mx-auto text-purple-600 animate-spin mb-4" />
      <h2 class="text-2xl font-bold text-purple-600 mb-2">
        Preparing Contestants...
      </h2>
      <p class="text-gray-600">
        Fetching eligible token holders from the blockchain
      </p>
    </div>
    
  {:else if revealPhase === 'revealing'}
    <!-- Animated Reveal Sequence -->
    <RevealOrchestrator 
      contestants={generatedContestants}
      {eligibleHoldersCount}
      onComplete={handleRevealComplete}
    />
    
  {/if}
</div>