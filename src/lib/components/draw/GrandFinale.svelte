<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { drawActions } from '$lib/stores/draw-state-old';
  
  export let round: any;
  export let winners: Array<{
    drawNumber: number;
    address: string;
    animal: string;
    prizeAmount: number;
  }>;
  export let vaultBalance: number;
  export let onProceedToDistribution: () => void;
  
  let showCelebration = false;
  let showWinners = false;
  let showBreakdown = false;
  let showActions = false;
  
  const totalWinnersPrize = winners.reduce((sum, w) => sum + w.prizeAmount, 0);
  const holdingsAmount = vaultBalance * 0.4;
  const charityAmount = vaultBalance * 0.1;
  
  onMount(() => {
    // Animated reveal sequence
    setTimeout(() => showCelebration = true, 500);
    setTimeout(() => showWinners = true, 1500);
    setTimeout(() => showBreakdown = true, 3000);
    setTimeout(() => showActions = true, 4000);
  });
  
  function proceedToDistribution() {
    drawActions.nextStage();
    onProceedToDistribution();
  }
  
  function shareResults() {
    // Social sharing functionality
    const text = `🎉 Round #${round?.drawNumber} Complete! 7 lucky winners just won ${totalWinnersPrize.toFixed(2)} SOL in the CRX7 Lottery! 🚀`;
    if (navigator.share) {
      navigator.share({
        title: 'CRX7 Lottery Results',
        text,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
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

<div class="relative flex flex-col items-center justify-center min-h-[800px] bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 rounded-xl border-4 border-yellow-300 p-8 overflow-hidden">
  
  <!-- Celebration Background Effects -->
  {#if showCelebration}
    <div class="absolute inset-0 pointer-events-none">
      <!-- Fireworks Effect -->
      {#each Array(100) as _, i}
        <div 
          class="absolute w-1 h-1 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%;
            animation: firework {2 + Math.random() * 3}s ease-out infinite;
            animation-delay: {Math.random() * 4}s;
          "
        ></div>
      {/each}
    </div>
  {/if}
  
  {#if showCelebration}
    <!-- Main Title -->
    <div class="text-center mb-8 z-10">
      <h1 class="text-7xl font-bold text-yellow-600 mb-4 animate-pulse">
        🎊 ROUND #{round?.drawNumber || '?'} COMPLETE! 🎊
      </h1>
      <p class="text-2xl text-orange-700 font-semibold">
        All 7 winners have been selected!
      </p>
    </div>
  {/if}
  
  {#if showWinners}
    <!-- Winners Showcase -->
    <div class="w-full max-w-6xl mb-8 z-10">
      <h2 class="text-3xl font-bold text-center text-orange-600 mb-6">
        🏆 THE MAGNIFICENT SEVEN 🏆
      </h2>
      
      <div class="bg-white rounded-xl p-6 border-4 border-yellow-300 shadow-2xl">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {#each winners as winner, index}
            {@const animal = parseAnimal(winner.animal)}
            <div 
              class="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200 shadow-lg text-center"
              style="animation-delay: {index * 0.2}s"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="w-8 h-8 bg-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {winner.drawNumber}
                </div>
                <div class="text-xs text-yellow-600 font-bold bg-yellow-100 px-2 py-1 rounded-full">
                  WINNER
                </div>
              </div>
              
              <div class="text-5xl mb-2">{animal.emoji}</div>
              <div class="font-bold text-yellow-800 text-xl mb-1">
                {animal.name}
              </div>
              <div class="text-2xl font-bold text-green-600 mb-2">
                +{winner.prizeAmount.toFixed(3)} SOL
              </div>
              <div class="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded break-all">
                {winner.address}
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
  
  {#if showBreakdown}
    <!-- Distribution Breakdown -->
    <div class="w-full max-w-4xl mb-8 z-10">
      <h3 class="text-2xl font-bold text-center text-blue-600 mb-6">
        💸 FULL DISTRIBUTION BREAKDOWN 💸
      </h3>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg p-6 text-center border-4 border-green-300 shadow-xl">
          <div class="text-5xl mb-3">🏆</div>
          <div class="text-sm text-gray-600 mb-1">Winners Total</div>
          <div class="text-3xl font-bold text-green-600 mb-2">
            {totalWinnersPrize.toFixed(3)} SOL
          </div>
          <div class="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
            50% of vault
          </div>
        </div>
        
        <div class="bg-white rounded-lg p-6 text-center border-4 border-blue-300 shadow-xl">
          <div class="text-5xl mb-3">🏪</div>
          <div class="text-sm text-gray-600 mb-1">Holdings Wallet</div>
          <div class="text-3xl font-bold text-blue-600 mb-2">
            {holdingsAmount.toFixed(3)} SOL
          </div>
          <div class="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            40% of vault
          </div>
        </div>
        
        <div class="bg-white rounded-lg p-6 text-center border-4 border-purple-300 shadow-xl">
          <div class="text-5xl mb-3">❤️</div>
          <div class="text-sm text-gray-600 mb-1">Charity Donation</div>
          <div class="text-3xl font-bold text-purple-600 mb-2">
            {charityAmount.toFixed(3)} SOL
          </div>
          <div class="text-xs text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
            10% of vault
          </div>
        </div>
      </div>
      
      <div class="mt-6 text-center">
        <div class="bg-gray-100 rounded-lg p-4 border-2 border-gray-300">
          <div class="text-lg font-bold text-gray-700">
            Total Vault: {vaultBalance.toFixed(3)} SOL
          </div>
          <div class="text-sm text-gray-600">
            Ready for distribution to {winners.length + 2} recipients
          </div>
        </div>
      </div>
    </div>
  {/if}
  
  {#if showActions}
    <!-- Action Buttons -->
    <div class="text-center z-10">
      <div class="bg-white rounded-lg p-6 border-2 border-gray-200 shadow-lg mb-6">
        <h4 class="text-xl font-bold text-gray-800 mb-2">
          🚀 Distribution Status: Ready
        </h4>
        <p class="text-gray-600 mb-4">
          All winners selected. Ready to send transactions to the blockchain.
        </p>
        <div class="text-sm text-gray-500">
          This will create {winners.length + 2} separate transactions for full transparency.
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <Button on:click={proceedToDistribution} size="lg" class="px-8 py-4 text-xl bg-green-600 hover:bg-green-700">
          <Icon icon="mdi:cash-multiple" class="mr-2 h-6 w-6" />
          Proceed to Distribution
        </Button>
        
        <Button variant="outline" on:click={shareResults} size="lg" class="px-6 py-4">
          <Icon icon="mdi:share" class="mr-2 h-5 w-5" />
          Share Results
        </Button>
      </div>
      
      <div class="mt-4 text-sm text-gray-500">
        Transaction hashes will be available immediately after distribution
      </div>
    </div>
  {/if}
  
  <!-- Corner Decorations -->
  {#if showCelebration}
    <div class="absolute top-4 left-4 text-6xl animate-spin">🎆</div>
    <div class="absolute top-4 right-4 text-5xl animate-bounce">🎊</div>
    <div class="absolute bottom-4 left-4 text-7xl animate-pulse">🏆</div>
    <div class="absolute bottom-4 right-4 text-6xl animate-spin">✨</div>
  {/if}
</div>

<style>
  @keyframes firework {
    0% {
      transform: scale(0) rotate(0deg);
      opacity: 1;
    }
    50% {
      transform: scale(1) rotate(180deg);
      opacity: 0.8;
    }
    100% {
      transform: scale(0.5) rotate(360deg);
      opacity: 0;
    }
  }
</style>