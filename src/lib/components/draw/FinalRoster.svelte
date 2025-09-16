<script lang="ts">
  import { fly, scale, fade } from 'svelte/transition';
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import type { AnimalMapping } from '$lib/utils/animal-mapping';
  
  export let contestants: AnimalMapping[];
  export let onComplete: () => void;
  
  let rosterPhase: 'ready' | 'header' | 'revealing' | 'complete' = 'ready';
  let revealedContestants: boolean[] = new Array(contestants.length).fill(false);
  let isAnimating = false;
  
  async function showHeader() {
    if (isAnimating) return;
    rosterPhase = 'header';
  }
  
  async function revealContestants() {
    if (isAnimating) return;
    isAnimating = true;
    rosterPhase = 'revealing';
    
    // Reveal contestants one by one (staggered)
    for (let i = 0; i < contestants.length; i++) {
      revealedContestants[i] = true;
      revealedContestants = [...revealedContestants]; // Trigger reactivity
      await wait(150); // Fast stagger for final reveal
    }
    
    rosterPhase = 'complete';
    isAnimating = false;
  }
  
  function proceedToSpin() {
    onComplete();
  }
  
  function wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  function formatWallet(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  }
  
  function copyWallet(address: string) {
    navigator.clipboard.writeText(address);
  }
</script>

<div class="flex flex-col items-center justify-center min-h-[700px] bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-4 border-purple-300 p-8">
  
  {#if rosterPhase === 'ready'}
    <!-- Ready to Show Roster -->
    <div class="text-center">
      <div class="text-8xl mb-6">🏆</div>
      <h2 class="text-4xl font-bold text-purple-600 mb-6">
        Ready to Show the Final Roster?
      </h2>
      <p class="text-lg text-gray-600 mb-8">
        Let's reveal all 7 contestants together!
      </p>
      
      <Button 
        on:click={showHeader} 
        size="lg" 
        class="px-8 py-4 text-xl bg-purple-600 hover:bg-purple-700"
      >
        <Icon icon="mdi:trophy" class="mr-2 h-6 w-6" />
        Show Roster Title
      </Button>
    </div>
    
  {:else if rosterPhase === 'header'}
    <!-- Header Shown -->
    <div class="text-center mb-8" in:scale={{ duration: 800, start: 0.8 }}>
      <h1 class="text-6xl font-bold text-purple-600 mb-4">
        🏆 YOUR CONTESTANTS ARE READY! 🏆
      </h1>
      <p class="text-2xl text-purple-700 font-semibold mb-4">
        Meet the 7 lucky players for this draw
      </p>
      <div class="text-lg text-gray-600 mb-8">
        Check the list - your wallet might be here!
      </div>
      
      <Button 
        on:click={revealContestants} 
        size="lg" 
        class="px-8 py-4 text-xl bg-green-600 hover:bg-green-700"
        disabled={isAnimating}
      >
        <Icon icon="mdi:account-group" class="mr-2 h-6 w-6" />
        Reveal All Contestants
      </Button>
    </div>
    
  {:else if rosterPhase === 'revealing' || rosterPhase === 'complete'}
    <!-- Header -->
    <div class="text-center mb-8">
      <h1 class="text-6xl font-bold text-purple-600 mb-4">
        🏆 YOUR CONTESTANTS ARE READY! 🏆
      </h1>
      <p class="text-2xl text-purple-700 font-semibold mb-4">
        Meet the 7 lucky players for this draw
      </p>
      <div class="text-lg text-gray-600 mb-8">
        Check the list - your wallet might be here!
      </div>
    </div>
    
    <!-- Contestants Grid -->
    <div 
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl mb-8"
      in:fade={{ duration: 600 }}
    >
      {#each contestants as contestant, index}
        {#if revealedContestants[index]}
          <div 
            class="bg-white rounded-xl shadow-lg border-3 border-purple-200 p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
            in:fly={{ y: 50, duration: 500, delay: index * 100 }}
          >
            <!-- Contestant Number -->
            <div class="flex items-center justify-between mb-4">
              <span class="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
                #{index + 1}
              </span>
              <button 
                on:click={() => copyWallet(contestant.walletAddress)}
                class="text-gray-400 hover:text-purple-600 transition-colors duration-200"
                title="Copy wallet address"
              >
                <Icon icon="mdi:content-copy" class="w-5 h-5" />
              </button>
            </div>
            
            <!-- Animal Display -->
            <div class="text-center mb-4">
              <div class="text-6xl mb-2">
                {contestant.animal.emoji}
              </div>
              <div class="text-xl font-bold text-gray-700 uppercase">
                {contestant.animal.name}
              </div>
            </div>
            
            <!-- Wallet Address -->
            <div class="bg-gray-50 rounded-lg p-3 border-2 border-gray-200">
              <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Wallet Address
              </div>
              <div class="font-mono text-lg font-bold text-gray-800 break-all">
                {formatWallet(contestant.walletAddress)}
              </div>
              <div class="text-xs text-gray-400 mt-1 break-all">
                {contestant.walletAddress}
              </div>
            </div>
            
            <!-- Fun Stats -->
            <div class="mt-3 text-center">
              <span class="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                Lucky Draw Participant
              </span>
            </div>
          </div>
        {/if}
      {/each}
    </div>
    
    <!-- Summary Stats -->
    <div class="grid grid-cols-3 gap-6 w-full max-w-2xl mb-8">
      <div class="bg-white rounded-lg p-4 text-center border-2 border-green-200">
        <div class="text-3xl font-bold text-green-600">{contestants.length}</div>
        <div class="text-sm text-gray-600">Total Contestants</div>
      </div>
      <div class="bg-white rounded-lg p-4 text-center border-2 border-blue-200">
        <div class="text-3xl font-bold text-blue-600">1</div>
        <div class="text-sm text-gray-600">Winner Selected</div>
      </div>
      <div class="bg-white rounded-lg p-4 text-center border-2 border-purple-200">
        <div class="text-3xl font-bold text-purple-600">100%</div>
        <div class="text-sm text-gray-600">Fair & Random</div>
      </div>
    </div>
    
    <!-- Action Button -->
    {#if rosterPhase === 'complete'}
      <div class="text-center" in:scale={{ duration: 600, start: 0.8 }}>
        <div class="mb-4">
          <div class="text-4xl animate-bounce">🎮</div>
        </div>
        <Button 
          on:click={proceedToSpin}
          size="lg"
          class="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-4 text-2xl font-bold shadow-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all duration-300"
        >
          <Icon icon="mdi:play-circle" class="mr-2 w-8 h-8" />
          LET THE GAMES BEGIN!
          <Icon icon="mdi:dice-multiple" class="ml-2 w-8 h-8" />
        </Button>
        <p class="text-lg text-gray-600 mt-4">
          Time to spin the wheel and find our winner!
        </p>
      </div>
    {/if}
  {/if}
  
  <!-- Floating Animation Elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    {#each Array(12) as _, i}
      <div 
        class="absolute text-2xl opacity-20 animate-pulse"
        style="
          left: {Math.random() * 100}%; 
          top: {Math.random() * 100}%; 
          animation-delay: {Math.random() * 3}s;
          animation-duration: {2 + Math.random() * 2}s;
        "
      >
        {['🏆', '🎯', '🎪', '⭐', '🎊'][Math.floor(Math.random() * 5)]}
      </div>
    {/each}
  </div>
</div>

<style>
  .border-3 {
    border-width: 3px;
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 5px rgba(168, 85, 247, 0.4); }
    50% { box-shadow: 0 0 20px rgba(168, 85, 247, 0.6); }
  }
  
  .glow {
    animation: glow 2s ease-in-out infinite;
  }
</style>