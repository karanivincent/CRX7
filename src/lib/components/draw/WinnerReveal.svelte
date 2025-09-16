<script lang="ts">
  import { onMount } from 'svelte';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import { drawActions } from '$lib/stores/draw-state';
  
  export let winner: {
    drawNumber: number;
    address: string;
    animal: string;
    prizeAmount: number;
  } = {
    drawNumber: 1,
    address: '',
    animal: 'Unknown',
    prizeAmount: 0
  };
  export let drawNumber: number = 1;
  export let autoProgress: boolean = true;
  
  let showConfetti = false;
  let showDetails = false;
  
  onMount(() => {
    // Start celebration animation
    setTimeout(() => {
      showConfetti = true;
    }, 500);
    
    // Reveal details after confetti
    setTimeout(() => {
      showDetails = true;
    }, 1500);
    
    // Auto progress if enabled
    if (autoProgress) {
      setTimeout(() => {
        drawActions.nextStage();
      }, 4000);
    }
  });
  
  function proceedNext() {
    drawActions.nextStage();
  }
  
  // Extract animal emoji and name from winner.animal string
  const animalParts = winner.animal.match(/^(.*?)\s+(.+)$/);
  const animalEmoji = animalParts?.[1] || '🎯';
  const animalName = animalParts?.[2] || winner.animal;
</script>

<div class="relative flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-4 border-green-300 p-8 overflow-hidden">
  
  <!-- Confetti Animation -->
  {#if showConfetti}
    <div class="absolute inset-0 pointer-events-none">
      {#each Array(50) as _, i}
        <div 
          class="absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce"
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%;
            animation-delay: {Math.random() * 2}s;
            animation-duration: {1 + Math.random()}s;
          "
        ></div>
      {/each}
      {#each Array(30) as _, i}
        <div 
          class="absolute w-1 h-6 bg-gradient-to-b from-pink-400 to-purple-500 animate-pulse"
          style="
            left: {Math.random() * 100}%; 
            top: {Math.random() * 100}%;
            animation-delay: {Math.random() * 2}s;
          "
        ></div>
      {/each}
    </div>
  {/if}
  
  <!-- Main Winner Display -->
  <div class="text-center z-10">
    <h1 class="text-6xl font-bold text-green-600 mb-4 animate-pulse">
      🎉 WINNER OF DRAW {drawNumber}! 🎉
    </h1>
    
    <!-- Winner Animal Display -->
    <div class="mb-6">
      <div class="text-8xl mb-4 animate-bounce">
        {animalEmoji}
      </div>
      <h2 class="text-5xl font-bold text-green-800 mb-2">
        {animalName} WINS!
      </h2>
    </div>
    
    <!-- Prize Amount -->
    <div class="bg-white rounded-xl p-8 mb-6 border-4 border-yellow-300 shadow-2xl">
      <div class="text-6xl mb-2">💰</div>
      <div class="text-4xl font-bold text-yellow-600">
        +{winner.prizeAmount.toFixed(3)} SOL
      </div>
      <div class="text-lg text-gray-600 mt-2">
        Prize Amount
      </div>
    </div>
    
    {#if showDetails}
      <!-- Winner Details -->
      <div class="bg-white rounded-lg p-6 mb-8 border-2 border-gray-200 shadow-lg max-w-md mx-auto">
        <div class="text-sm text-gray-600 mb-2">Winning Wallet Address</div>
        <div class="font-mono text-lg bg-gray-50 px-4 py-2 rounded border break-all">
          {winner.address}
        </div>
        <div class="text-xs text-gray-500 mt-2">
          Funds will be distributed automatically
        </div>
      </div>
      
      <!-- Celebration Messages -->
      <div class="text-center mb-6">
        <div class="text-2xl text-green-700 font-semibold mb-2">
          🎊 Congratulations! 🎊
        </div>
        <p class="text-lg text-gray-700">
          {animalName} has claimed victory in this draw!
        </p>
        <p class="text-gray-600 mt-2">
          Transaction will be processed at the end of the round.
        </p>
      </div>
      
      {#if !autoProgress}
        <Button on:click={proceedNext} size="lg" class="px-8 py-4 text-xl">
          <Icon icon="mdi:arrow-right-circle" class="mr-2 h-6 w-6" />
          Continue to Next Draw
        </Button>
      {:else}
        <div class="flex items-center justify-center gap-2 text-lg text-gray-600">
          <Icon icon="mdi:timer-sand" class="w-6 h-6 animate-pulse" />
          Continuing automatically...
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Sparkle Effects -->
  {#if showConfetti}
    <div class="absolute top-8 left-8 text-4xl animate-spin">✨</div>
    <div class="absolute top-12 right-12 text-3xl animate-bounce">🌟</div>
    <div class="absolute bottom-16 left-16 text-5xl animate-pulse">⭐</div>
    <div class="absolute bottom-20 right-8 text-4xl animate-spin">💫</div>
  {/if}
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
</style>