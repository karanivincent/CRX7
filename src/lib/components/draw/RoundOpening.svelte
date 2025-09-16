<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { drawActions } from '$lib/stores/draw-state';
  
  export let round: any;
  export let vaultBalance: number;
  export let eligibleHolders: number = 0;
  export let autoProgress: boolean = true;
  
  let loading = true;
  let progress = 0;
  let statusText = "Preparing the stage...";
  
  const winnerPool = vaultBalance * 0.5;
  const prizePerWinner = winnerPool / 7;
  
  const loadingMessages = [
    "Connecting to blockchain...",
    "Fetching eligible token holders...",
    "Preparing the lottery wheel...",
    "Setting up prize distribution...",
    "Ready to begin!"
  ];
  
  onMount(() => {
    simulateLoading();
  });
  
  async function simulateLoading() {
    for (let i = 0; i < loadingMessages.length; i++) {
      statusText = loadingMessages[i];
      progress = ((i + 1) / loadingMessages.length) * 100;
      
      // Add some realistic timing
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    loading = false;
    
    if (autoProgress) {
      setTimeout(() => {
        drawActions.nextStage();
      }, 1500);
    }
  }
  
  function proceedManually() {
    drawActions.nextStage();
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border-4 border-orange-300 p-8">
  <!-- Main Title -->
  <div class="text-center mb-8">
    <h1 class="text-6xl font-bold text-orange-600 mb-4 animate-pulse">
      🎉 ROUND #{round?.drawNumber || '?'} BEGINS! 🎉
    </h1>
    <p class="text-2xl text-orange-700 font-semibold">
      The CRX7 Lottery Show
    </p>
  </div>
  
  <!-- Prize Pool Spotlight -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full max-w-4xl">
    <div class="bg-white rounded-lg p-6 text-center border-2 border-green-200 shadow-lg">
      <div class="text-4xl mb-2">💰</div>
      <div class="text-sm text-gray-600 mb-1">Total Prize Pool</div>
      <div class="text-3xl font-bold text-green-600">{winnerPool.toFixed(2)} SOL</div>
    </div>
    
    <div class="bg-white rounded-lg p-6 text-center border-2 border-blue-200 shadow-lg">
      <div class="text-4xl mb-2">🏆</div>
      <div class="text-sm text-gray-600 mb-1">Winners This Round</div>
      <div class="text-3xl font-bold text-blue-600">7</div>
    </div>
    
    <div class="bg-white rounded-lg p-6 text-center border-2 border-purple-200 shadow-lg">
      <div class="text-4xl mb-2">👥</div>
      <div class="text-sm text-gray-600 mb-1">Eligible Holders</div>
      <div class="text-3xl font-bold text-purple-600">{eligibleHolders.toLocaleString()}</div>
    </div>
  </div>
  
  <!-- Prize Breakdown -->
  <div class="bg-white rounded-lg p-6 mb-8 w-full max-w-2xl border-2 border-gray-200 shadow-lg">
    <h3 class="text-xl font-bold text-center mb-4 text-gray-800">Prize Breakdown</h3>
    <div class="grid grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-2xl font-bold text-green-600">{prizePerWinner.toFixed(3)}</div>
        <div class="text-sm text-gray-600">SOL per winner</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-blue-600">{(vaultBalance * 0.4).toFixed(2)}</div>
        <div class="text-sm text-gray-600">SOL to holdings</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-purple-600">{(vaultBalance * 0.1).toFixed(2)}</div>
        <div class="text-sm text-gray-600">SOL to charity</div>
      </div>
    </div>
  </div>
  
  {#if loading}
    <!-- Loading Animation -->
    <div class="w-full max-w-md">
      <div class="bg-white rounded-lg p-6 border-2 border-orange-200 shadow-lg">
        <div class="text-center mb-4">
          <Icon icon="mdi:loading" class="w-12 h-12 mx-auto text-orange-600 animate-spin mb-2" />
          <div class="text-lg font-semibold text-gray-800">{statusText}</div>
        </div>
        
        <!-- Progress Bar -->
        <div class="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            class="bg-gradient-to-r from-orange-500 to-amber-500 h-4 rounded-full transition-all duration-300" 
            style="width: {progress}%"
          ></div>
        </div>
        <div class="text-center text-sm text-gray-600">{Math.round(progress)}% complete</div>
      </div>
    </div>
  {:else}
    <!-- Ready State -->
    <div class="text-center">
      <div class="text-6xl mb-4 animate-bounce">🚀</div>
      <h2 class="text-3xl font-bold text-green-600 mb-4">Ready to Begin!</h2>
      <p class="text-lg text-gray-700 mb-6">
        All systems go! Let's find our lucky winners.
      </p>
      
      {#if !autoProgress}
        <Button on:click={proceedManually} size="lg" class="px-8 py-4 text-xl">
          <Icon icon="mdi:play-circle" class="mr-2 h-6 w-6" />
          Start the Show!
        </Button>
      {:else}
        <div class="flex items-center justify-center gap-2 text-lg text-gray-600">
          <Icon icon="mdi:timer-sand" class="w-6 h-6 animate-pulse" />
          Starting automatically...
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  @keyframes sparkle {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.1); }
  }
  
  .animate-sparkle {
    animation: sparkle 2s ease-in-out infinite;
  }
</style>