<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  
  export let eligibleHoldersCount: number = 0;
  export let onComplete: () => void;
  
  let currentPhase: 'ready' | 'scanning' | 'counting' | 'selecting' | 'complete' = 'ready';
  let displayCount = 0;
  let progress = 0;
  let isAnimating = false;
  
  async function startScanning() {
    if (isAnimating) return;
    isAnimating = true;
    currentPhase = 'scanning';
    progress = 0;
    await animateProgress(100, 1500);
    
    // Automatically show eligible holders after scanning
    currentPhase = 'counting';
    displayCount = 0;
    await animateCounter(eligibleHoldersCount, 1500);
    isAnimating = false;
  }
  
  async function showEligibleHolders() {
    if (isAnimating) return;
    isAnimating = true;
    currentPhase = 'counting';
    displayCount = 0;
    await animateCounter(eligibleHoldersCount, 1500);
    isAnimating = false;
  }
  
  async function selectContestants() {
    if (isAnimating) return;
    isAnimating = true;
    currentPhase = 'selecting';
    progress = 0;
    await animateProgress(100, 1000);
    currentPhase = 'complete';
    isAnimating = false;
  }
  
  function proceedToReveals() {
    onComplete();
  }
  
  async function animateProgress(target: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(elapsed / duration, 1);
        progress = progressPercent * target;
        
        if (progressPercent < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }
  
  async function animateCounter(target: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progressPercent = Math.min(elapsed / duration, 1);
        displayCount = Math.floor(progressPercent * target);
        
        if (progressPercent < 1) {
          requestAnimationFrame(animate);
        } else {
          displayCount = target;
          resolve();
        }
      };
      animate();
    });
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border-4 border-blue-300 p-8">
  <!-- Main Title -->
  <div class="text-center mb-8">
    <h1 class="text-5xl font-bold text-blue-600 mb-4">
      🔍 FINDING CONTESTANTS
    </h1>
    <p class="text-xl text-gray-700">
      Searching the blockchain for our lucky players...
    </p>
  </div>
  
  {#if currentPhase === 'ready'}
    <!-- Ready to Start -->
    <div class="text-center">
      <div class="mb-6">
        <Icon icon="mdi:magnify" class="w-24 h-24 mx-auto text-blue-600" />
      </div>
      <h2 class="text-3xl font-bold text-blue-700 mb-6">
        Ready to Hunt for Contestants?
      </h2>
      <p class="text-lg text-gray-600 mb-8">
        Let's scan the blockchain to find our lucky players!
      </p>
      
      <Button 
        on:click={startScanning} 
        size="lg" 
        class="px-8 py-4 text-xl bg-blue-600 hover:bg-blue-700"
        disabled={isAnimating}
      >
        <Icon icon="mdi:radar" class="mr-2 h-6 w-6" />
        Start Blockchain Scan
      </Button>
    </div>
    
  {:else if currentPhase === 'scanning'}
    <!-- Scanning Phase -->
    <div class="text-center">
      <div class="mb-6">
        <Icon icon="mdi:radar" class="w-24 h-24 mx-auto text-blue-600 animate-spin" />
      </div>
      <h2 class="text-3xl font-bold text-blue-700 mb-4">
        Scanning Blockchain...
      </h2>
      <div class="w-80 bg-gray-200 rounded-full h-6 mb-6">
        <div 
          class="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full transition-all duration-100 ease-out"
          style="width: {progress}%"
        ></div>
      </div>
      <p class="text-lg text-gray-600 mb-8">Analyzing token holders...</p>
      
    </div>
    
  {:else if currentPhase === 'counting'}
    <!-- Counting Phase -->
    <div class="text-center">
      <div class="mb-6">
        <Icon icon="mdi:account-group" class="w-24 h-24 mx-auto text-green-600 animate-pulse" />
      </div>
      <h2 class="text-3xl font-bold text-green-700 mb-4">
        Eligible Holders Found!
      </h2>
      <div class="bg-green-100 rounded-lg p-6 mb-6">
        <div class="text-6xl font-bold text-green-600 mb-2 tabular-nums">
          {displayCount.toLocaleString()}
        </div>
        <p class="text-lg text-green-700">Eligible Token Holders</p>
      </div>
      <p class="text-lg text-gray-600 mb-8">All qualified for the draw!</p>
      
      {#if displayCount >= eligibleHoldersCount && !isAnimating}
        <Button 
          on:click={selectContestants} 
          size="lg" 
          class="px-8 py-4 text-xl bg-purple-600 hover:bg-purple-700"
        >
          <Icon icon="mdi:dice-multiple" class="mr-2 h-6 w-6" />
          Select 7 Contestants
        </Button>
      {/if}
    </div>
    
  {:else if currentPhase === 'selecting'}
    <!-- Selecting Phase -->
    <div class="text-center">
      <div class="mb-6">
        <Icon icon="mdi:dice-multiple" class="w-24 h-24 mx-auto text-purple-600 animate-bounce" />
      </div>
      <h2 class="text-3xl font-bold text-purple-700 mb-4">
        Selecting 7 Lucky Contestants...
      </h2>
      <div class="w-80 bg-gray-200 rounded-full h-6 mb-6">
        <div 
          class="bg-gradient-to-r from-purple-500 to-pink-500 h-6 rounded-full transition-all duration-100 ease-out"
          style="width: {progress}%"
        ></div>
      </div>
      <p class="text-lg text-gray-600">Random selection in progress...</p>
    </div>
    
  {:else if currentPhase === 'complete'}
    <!-- Selection Complete -->
    <div class="text-center">
      <div class="mb-6">
        <Icon icon="mdi:check-circle" class="w-24 h-24 mx-auto text-green-600" />
      </div>
      <h2 class="text-3xl font-bold text-green-700 mb-4">
        🎯 Contestants Selected!
      </h2>
      <p class="text-lg text-gray-600 mb-8">
        7 lucky contestants have been chosen from the blockchain!
      </p>
      
      <Button 
        on:click={proceedToReveals} 
        size="lg" 
        class="px-8 py-4 text-xl bg-orange-600 hover:bg-orange-700"
      >
        <Icon icon="mdi:account-star" class="mr-2 h-6 w-6" />
        Reveal First Contestant
      </Button>
    </div>
  {/if}
  
  <!-- Animated Background Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    {#each Array(20) as _}
      <div 
        class="absolute w-2 h-2 bg-blue-300 rounded-full opacity-20 animate-ping"
        style="left: {Math.random() * 100}%; top: {Math.random() * 100}%; animation-delay: {Math.random() * 2}s;"
      ></div>
    {/each}
  </div>
</div>

<style>
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }
  
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
</style>