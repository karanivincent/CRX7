<script lang="ts">
  import { fly, scale, fade } from 'svelte/transition';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import type { AnimalMapping } from '$lib/utils/animal-mapping';
  
  export let contestant: AnimalMapping;
  export let contestantNumber: number;
  export let totalContestants: number;
  export let onComplete: () => void;
  
  let revealPhase: 'ready' | 'wallet' | 'animal-spinning' | 'animal-revealed' = 'ready';
  let isAnimating = false;
  
  // Format wallet address for display
  $: walletDisplay = `${contestant.walletAddress.slice(0, 6)}...${contestant.walletAddress.slice(-6)}`;
  $: fullWallet = contestant.walletAddress;
  
  async function revealWallet() {
    if (isAnimating) return;
    revealPhase = 'wallet';
  }
  
  async function startAnimalAssignment() {
    if (isAnimating) return;
    isAnimating = true;
    revealPhase = 'animal-spinning';
    
    // Spin for a dramatic effect
    await wait(800);
    
    revealPhase = 'animal-revealed';
    isAnimating = false;
  }
  
  function proceedNext() {
    onComplete();
  }
  
  function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function copyWallet() {
    navigator.clipboard.writeText(fullWallet);
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[600px] bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-4 border-orange-300 p-8">
  
  <!-- Contestant Number Header -->
  <div class="text-center mb-6" in:fly={{ y: -50, duration: 600 }}>
    <div class="inline-flex items-center gap-3 bg-orange-100 px-6 py-3 rounded-full border-2 border-orange-300">
      <Icon icon="mdi:account-star" class="w-8 h-8 text-orange-600" />
      <span class="text-2xl font-bold text-orange-700">
        CONTESTANT #{contestantNumber} of {totalContestants}
      </span>
    </div>
  </div>
  
  <!-- Main Reveal Area -->
  <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl border-4 border-orange-200">
    
    {#if revealPhase === 'ready'}
      <!-- Ready to Reveal -->
      <div class="text-center" in:scale={{ duration: 800, start: 0.5 }}>
        <div class="text-8xl mb-6 animate-pulse">🎯</div>
        <h2 class="text-4xl font-bold text-gray-700 mb-6">
          CONTESTANT #{contestantNumber} FOUND!
        </h2>
        <p class="text-lg text-gray-600 mb-8">
          Ready to reveal this lucky contestant?
        </p>
        
        <Button 
          on:click={revealWallet} 
          size="lg" 
          class="px-8 py-4 text-xl bg-blue-600 hover:bg-blue-700"
        >
          <Icon icon="mdi:account" class="mr-2 h-6 w-6" />
          Reveal Wallet Address
        </Button>
      </div>
      
    {:else if revealPhase === 'wallet'}
      <!-- Wallet Reveal Phase -->
      <div class="text-center">
        <div class="text-6xl mb-6">👤</div>
        <h3 class="text-2xl font-bold text-gray-600 mb-6">Wallet Address:</h3>
        
        <div 
          class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl mb-6 transform transition-all duration-500"
          in:fly={{ x: -200, duration: 800 }}
        >
          <!-- Abbreviated Address -->
          <div class="text-4xl font-mono font-bold mb-2 tracking-wider">
            {walletDisplay}
          </div>
          
          <!-- Full Address (smaller) -->
          <div class="text-sm font-mono opacity-75 mb-3 break-all">
            {fullWallet}
          </div>
          
          <!-- Copy Button -->
          <button 
            on:click={copyWallet}
            class="bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Icon icon="mdi:content-copy" class="w-4 h-4" />
            Copy Full Address
          </button>
        </div>
        
        <p class="text-lg text-gray-600 mb-8">
          Check if this is your wallet!
        </p>
        
        <Button 
          on:click={startAnimalAssignment} 
          size="lg" 
          class="px-8 py-4 text-xl bg-purple-600 hover:bg-purple-700"
          disabled={isAnimating}
        >
          <Icon icon="mdi:dice-multiple" class="mr-2 h-6 w-6" />
          Assign Animal
        </Button>
      </div>
      
    {:else if revealPhase === 'animal-spinning'}
      <!-- Animal Assignment Spinning -->
      <div class="text-center">
        <div class="text-4xl font-bold text-gray-700 mb-6">
          Assigning Animal...
        </div>
        
        <div class="relative" in:scale={{ duration: 400 }}>
          <!-- Spinning Animal Icons -->
          <div class="w-40 h-40 mx-auto mb-6 relative border-4 border-purple-300 rounded-full bg-purple-50">
            <div class="absolute inset-4 flex items-center justify-center">
              <div class="text-6xl animate-spin">
                🎲
              </div>
            </div>
          </div>
          
          <!-- Spinning Text -->
          <div class="text-xl font-semibold text-purple-600 animate-pulse">
            🎪 Magical Assignment in Progress... 🎪
          </div>
        </div>
      </div>
      
    {:else if revealPhase === 'animal-revealed'}
      <!-- Animal Reveal -->
      <div class="text-center">
        <div class="text-3xl font-bold text-gray-700 mb-4">
          You are...
        </div>
        
        <div 
          class="transform transition-all duration-700" 
          in:scale={{ duration: 800, start: 0.3 }}
        >
          <!-- Animal Display -->
          <div class="bg-gradient-to-br from-green-400 to-blue-500 text-white p-8 rounded-2xl shadow-xl mb-8">
            <div class="text-8xl mb-4">
              {contestant.animal.emoji}
            </div>
            <div class="text-4xl font-bold uppercase tracking-wider">
              THE {contestant.animal.name}
            </div>
          </div>
        </div>
        
        <Button 
          on:click={proceedNext} 
          size="lg" 
          class="px-8 py-4 text-xl bg-orange-600 hover:bg-orange-700"
        >
          <Icon icon="mdi:arrow-right" class="mr-2 h-6 w-6" />
          {contestantNumber < totalContestants ? `Next Contestant` : `Show Final Roster`}
        </Button>
      </div>
      
    {/if}
  </div>
  
  <!-- Progress Indicator -->
  <div class="mt-6 w-full max-w-md">
    <div class="bg-gray-200 rounded-full h-2">
      <div 
        class="bg-gradient-to-r from-orange-400 to-red-400 h-2 rounded-full transition-all duration-300"
        style="width: {(contestantNumber / totalContestants) * 100}%"
      ></div>
    </div>
    <p class="text-center text-sm text-gray-600 mt-2">
      Contestant {contestantNumber} of {totalContestants}
    </p>
  </div>
  
</div>

<style>
  @keyframes shimmer {
    0% { background-position: -200px 0; }
    100% { background-position: calc(200px + 100%) 0; }
  }
  
  .shimmer {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    background-size: 200px 100%;
    animation: shimmer 2s infinite;
  }
</style>