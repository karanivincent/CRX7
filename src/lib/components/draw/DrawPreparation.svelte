<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { drawActions, contestants } from '$lib/stores/draw-state';
  import type { AnimalMapping } from '$lib/utils/animal-mapping';
  
  export let drawNumber: number;
  export let maxDraws: number;
  export let prizeAmount: number;
  export let onGenerateContestants: () => Promise<void>;
  export let autoProgress: boolean = false;
  
  let loading = true;
  let revealedContestants: AnimalMapping[] = [];
  let revealIndex = 0;
  
  $: progressPercentage = (drawNumber / maxDraws) * 100;
  
  onMount(() => {
    generateAndRevealContestants();
  });
  
  async function generateAndRevealContestants() {
    loading = true;
    revealedContestants = [];
    revealIndex = 0;
    
    try {
      // Generate contestants via parent component
      await onGenerateContestants();
      
      // Start revealing contestants one by one
      revealContestants();
    } catch (error) {
      console.error('Error generating contestants:', error);
      drawActions.setError('Failed to generate contestants');
    }
  }
  
  function revealContestants() {
    const allContestants = $contestants;
    
    if (allContestants.length === 0) {
      loading = false;
      return;
    }
    
    const revealNext = () => {
      if (revealIndex < allContestants.length) {
        revealedContestants = [...revealedContestants, allContestants[revealIndex]];
        revealIndex++;
        
        // Reveal next contestant after delay
        setTimeout(revealNext, 300);
      } else {
        loading = false;
        
        // Auto progress if enabled
        if (autoProgress) {
          setTimeout(() => {
            drawActions.nextStage();
          }, 1500);
        }
      }
    };
    
    revealNext();
  }
  
  function proceedToSpin() {
    drawActions.nextStage();
  }
  
  function retryGeneration() {
    generateAndRevealContestants();
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
  
  {#if loading}
    <!-- Contestant Generation -->
    <div class="w-full max-w-2xl">
      <div class="text-center mb-6">
        <Icon icon="mdi:account-search" class="w-16 h-16 mx-auto text-purple-600 animate-pulse mb-4" />
        <h2 class="text-2xl font-bold text-purple-600 mb-2">
          🔄 Selecting Contestants...
        </h2>
        <p class="text-gray-600">
          Randomly choosing 7 lucky token holders from the blockchain
        </p>
      </div>
      
      <!-- Contestant Reveal Animation -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each Array(7) as _, index}
          <div class="bg-white rounded-lg p-4 border-2 {revealedContestants[index] ? 'border-purple-300 shadow-lg' : 'border-gray-200'} transition-all duration-300">
            {#if revealedContestants[index]}
              <!-- Revealed Contestant -->
              <div class="text-center animate-bounce">
                <div class="text-4xl mb-2">{revealedContestants[index].animal.emoji}</div>
                <div class="font-bold text-purple-800 text-lg">
                  {revealedContestants[index].animal.name}
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  {revealedContestants[index].walletAddress.slice(0, 6)}...{revealedContestants[index].walletAddress.slice(-4)}
                </div>
              </div>
            {:else if index === revealIndex}
              <!-- Currently Revealing -->
              <div class="text-center">
                <Icon icon="mdi:loading" class="w-12 h-12 mx-auto text-purple-600 animate-spin mb-2" />
                <div class="text-gray-500">Selecting...</div>
              </div>
            {:else}
              <!-- Not Yet Revealed -->
              <div class="text-center opacity-50">
                <div class="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:account-question" class="w-6 h-6 text-gray-400" />
                </div>
                <div class="text-gray-400 text-sm">Waiting...</div>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <!-- Ready to Spin -->
    <div class="text-center w-full max-w-2xl">
      <h2 class="text-3xl font-bold text-green-600 mb-4">
        🎯 Contestants Ready!
      </h2>
      
      <!-- Final Contestants Display -->
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
        {#each revealedContestants as contestant}
          <div class="bg-white rounded-lg p-3 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-shadow">
            <div class="text-center">
              <div class="text-3xl mb-1">{contestant.animal.emoji}</div>
              <div class="font-bold text-purple-800 text-sm">
                {contestant.animal.name}
              </div>
            </div>
          </div>
        {/each}
      </div>
      
      <p class="text-lg text-gray-700 mb-6">
        7 brave contestants enter the wheel. Only 1 will emerge victorious!
      </p>
      
      {#if !autoProgress}
        <div class="flex gap-4 justify-center">
          <Button on:click={proceedToSpin} size="lg" class="px-8 py-4 text-xl bg-green-600 hover:bg-green-700">
            <Icon icon="mdi:wheel" class="mr-2 h-6 w-6" />
            Spin the Wheel!
          </Button>
          
          <Button variant="outline" on:click={retryGeneration} size="lg" class="px-6 py-4">
            <Icon icon="mdi:refresh" class="mr-2 h-5 w-5" />
            New Contestants
          </Button>
        </div>
      {:else}
        <div class="flex items-center justify-center gap-2 text-lg text-gray-600">
          <Icon icon="mdi:timer-sand" class="w-6 h-6 animate-pulse" />
          Spinning automatically...
        </div>
      {/if}
    </div>
  {/if}
</div>