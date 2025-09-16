<script lang="ts">
  import { onMount } from 'svelte';
  import ContestantHunt from './ContestantHunt.svelte';
  import ContestantReveal from './ContestantReveal.svelte';
  import FinalRoster from './FinalRoster.svelte';
  import type { AnimalMapping } from '$lib/utils/animal-mapping';
  
  export let contestants: AnimalMapping[];
  export let eligibleHoldersCount: number;
  export let onComplete: () => void;
  
  type RevealPhase = 'hunt' | 'revealing' | 'roster' | 'complete';
  
  let currentPhase: RevealPhase = 'hunt';
  let currentContestantIndex = 0;
  let revealStartTime: number;
  
  onMount(() => {
    revealStartTime = Date.now();
    console.log('🎭 RevealOrchestrator: Manual reveal sequence ready');
    console.log('🎭 Contestants to reveal:', contestants.length);
    console.log('🎭 Eligible holders:', eligibleHoldersCount);
  });
  
  function handleHuntComplete() {
    console.log('🎭 RevealOrchestrator: Hunt phase complete, starting individual reveals');
    currentPhase = 'revealing';
    currentContestantIndex = 0;
  }
  
  function handleContestantRevealComplete() {
    console.log(`🎭 RevealOrchestrator: Contestant ${currentContestantIndex + 1} reveal complete`);
    
    currentContestantIndex++;
    
    if (currentContestantIndex >= contestants.length) {
      console.log('🎭 RevealOrchestrator: All contestants revealed, showing final roster');
      currentPhase = 'roster';
    }
    // If there are more contestants, the next one will automatically show
    // due to the reactive statement in the template
  }
  
  function handleRosterComplete() {
    const totalTime = Date.now() - revealStartTime;
    console.log(`🎭 RevealOrchestrator: Complete sequence finished in ${totalTime}ms (manual control)`);
    currentPhase = 'complete';
    onComplete();
  }
  
  // Current contestant being revealed
  $: currentContestant = contestants[currentContestantIndex];
  $: isRevealingContestants = currentPhase === 'revealing' && currentContestantIndex < contestants.length;
</script>

<div class="w-full h-full">
  {#if currentPhase === 'hunt'}
    <!-- Phase 1: Hunt for contestants -->
    <ContestantHunt 
      {eligibleHoldersCount}
      onComplete={handleHuntComplete}
    />
    
  {:else if isRevealingContestants}
    <!-- Phase 2: Individual contestant reveals -->
    {#key currentContestantIndex}
      <ContestantReveal 
        contestant={currentContestant}
        contestantNumber={currentContestantIndex + 1}
        totalContestants={contestants.length}
        onComplete={handleContestantRevealComplete}
      />
    {/key}
    
  {:else if currentPhase === 'roster'}
    <!-- Phase 3: Final roster display -->
    <FinalRoster 
      {contestants}
      onComplete={handleRosterComplete}
    />
    
  {:else if currentPhase === 'complete'}
    <!-- Phase 4: Complete (this should transition away immediately) -->
    <div class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="text-6xl mb-4 animate-spin">🎯</div>
        <div class="text-2xl font-bold text-gray-600">
          Transitioning to Spinning Wheel...
        </div>
      </div>
    </div>
  {/if}
</div>

<!-- Debug Info (remove in production) -->
{#if false}
  <div class="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-sm font-mono">
    <div>Phase: {currentPhase}</div>
    <div>Contestant: {currentContestantIndex + 1}/{contestants.length}</div>
    <div>Total Time: {Math.round((Date.now() - revealStartTime) / 1000)}s</div>
  </div>
{/if}

<style>
  /* Ensure smooth transitions between phases */
  div {
    transition: all 0.3s ease-in-out;
  }
</style>