<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { gameRoundActions } from '$lib/stores/game-round';
  
  export let winners: Array<{
    drawNumber: number;
    address: string;
    animal: string;
    prizeAmount: number;
  }> = [];
  export let remainingDraws: number = 0;
  export let totalPrizeRemaining: number = 0;
  export let eligibleHoldersRemaining: number = 0;
  export let autoProgress: boolean = false;
  
  let showStats = false;
  
  onMount(() => {
    // Animate in the stats
    setTimeout(() => {
      showStats = true;
    }, 500);
  });
  
  function continueToNextDraw() {
    if (remainingDraws > 0) {
      gameRoundActions.startNextDraw();
    } else {
      gameRoundActions.advanceStage(); // Go to ROUND_COMPLETE
    }
  }
  
  // Extract animal emoji and name from winner.animal string
  function parseAnimal(animalStr: string) {
    const parts = animalStr.match(/^(.*?)\s+(.+)$/);
    return {
      emoji: parts?.[1] || '🎯',
      name: parts?.[2] || animalStr
    };
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-4 border-blue-300 p-8">
  
  <!-- Round Progress Header -->
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold text-blue-600 mb-4">
      🏁 ROUND PROGRESS 🏁
    </h1>
    
    <!-- Progress Visualization -->
    <div class="flex items-center justify-center gap-2 mb-4">
      {#each Array(7) as _, index}
        <div 
          class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all duration-300 {
            index < winners.length 
              ? 'bg-green-500 border-green-600 text-white' 
              : 'bg-gray-200 border-gray-300 text-gray-500'
          }"
        >
          {index < winners.length ? '✓' : index + 1}
        </div>
      {/each}
    </div>
    
    <div class="text-xl text-blue-700 font-semibold mb-4">
      {winners.length} of 7 draws complete
    </div>

    <!-- Next Round Button in Progress Area -->
    {#if remainingDraws > 0 && !autoProgress}
      <Button on:click={continueToNextDraw} variant="default" size="lg" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3">
        <Icon icon="mdi:arrow-right-circle" class="mr-2 h-5 w-5" />
        Next Round
      </Button>
    {/if}
  </div>
  
  {#if showStats}
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
      <div class="bg-white rounded-lg p-6 text-center border-2 border-green-200 shadow-lg">
        <div class="text-4xl mb-2">🏆</div>
        <div class="text-sm text-gray-600 mb-1">Winners Selected</div>
        <div class="text-3xl font-bold text-green-600">{winners.length}</div>
      </div>
      
      <div class="bg-white rounded-lg p-6 text-center border-2 border-orange-200 shadow-lg">
        <div class="text-4xl mb-2">🎯</div>
        <div class="text-sm text-gray-600 mb-1">Draws Remaining</div>
        <div class="text-3xl font-bold text-orange-600">{remainingDraws}</div>
      </div>
      
      <div class="bg-white rounded-lg p-6 text-center border-2 border-purple-200 shadow-lg">
        <div class="text-4xl mb-2">💰</div>
        <div class="text-sm text-gray-600 mb-1">SOL Remaining</div>
        <div class="text-3xl font-bold text-purple-600">{totalPrizeRemaining.toFixed(2)}</div>
      </div>
    </div>
    
    <!-- Winners So Far -->
    <div class="w-full max-w-4xl mb-8">
      <h2 class="text-2xl font-bold text-center text-blue-600 mb-6">
        🏆 WINNERS SO FAR
      </h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {#each winners as winner, index}
          {@const animal = parseAnimal(winner.animal || 'Unknown Animal')}
          <div class="bg-white rounded-lg p-4 border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300">
            <div class="text-center">
              <div class="flex items-center justify-between mb-2">
                <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {winner.drawNumber}
                </div>
                <div class="text-green-600 font-bold text-sm">
                  +{winner.prizeAmount.toFixed(3)} SOL
                </div>
              </div>
              <div class="text-4xl mb-2">{animal.emoji}</div>
              <div class="font-bold text-green-800 text-lg mb-1">
                {animal.name}
              </div>
              <div class="text-xs text-gray-500 font-mono break-all">
                {winner.address ? `${winner.address.slice(0, 8)}...${winner.address.slice(-6)}` : 'No address'}
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
    
    <!-- Continue Section -->
    <div class="text-center">
      {#if remainingDraws > 0}
        <div class="bg-white rounded-lg p-6 mb-6 border-2 border-blue-200 shadow-lg max-w-md mx-auto">
          <h3 class="text-xl font-bold text-blue-600 mb-2">Up Next</h3>
          <p class="text-gray-700 mb-2">
            Draw {winners.length + 1} of 7
          </p>
          <p class="text-sm text-gray-600">
            {eligibleHoldersRemaining.toLocaleString()} holders still eligible
          </p>
        </div>
        
        {#if !autoProgress}
          <Button on:click={continueToNextDraw} size="lg" class="px-8 py-4 text-xl">
            <Icon icon="mdi:play-circle" class="mr-2 h-6 w-6" />
            Continue to Draw {winners.length + 1}
          </Button>
        {:else}
          <div class="flex items-center justify-center gap-2 text-lg text-gray-600">
            <Icon icon="mdi:timer-sand" class="w-6 h-6 animate-pulse" />
            Continuing to next draw...
          </div>
        {/if}
      {:else}
        <div class="bg-green-50 rounded-lg p-6 border-2 border-green-200 mb-6">
          <div class="text-6xl mb-4">🎊</div>
          <h3 class="text-2xl font-bold text-green-600">All Draws Complete!</h3>
          <p class="text-green-700 mt-2">Ready for the grand finale...</p>
        </div>
        
        <Button on:click={continueToNextDraw} size="lg" class="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-xl">
          <Icon icon="mdi:trophy" class="mr-2 h-6 w-6" />
          Proceed to Grand Finale
        </Button>
      {/if}
    </div>
  {/if}
</div>