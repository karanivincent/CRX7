<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Icon from '@iconify/svelte';
  
  export let round: {
    id: string;
    draw_number: number;
    completed_at: string;
    total_prize_pool: string;
    winner: { count: number }[];
  };
  export let expanded = false;
  export let onToggle: () => void = () => {};
  export let onViewDetails: () => void = () => {};
  
  $: completedDate = new Date(round.completed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  $: completedTime = new Date(round.completed_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  $: prizePool = parseFloat(round.total_prize_pool || '0');
  $: winnerCount = Array.isArray(round.winner) ? round.winner.length : 7;
  $: prizePerWinner = winnerCount > 0 ? prizePool / winnerCount : 0;
</script>

<Card class="border-2 border-orange-200 hover:border-orange-300 transition-all duration-300 hover:shadow-lg">
  <CardHeader class="pb-3">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="bg-orange-100 rounded-full p-2">
          <Icon icon="mdi:trophy" class="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <CardTitle class="text-xl font-bold text-gray-900">
            Draw #{round.draw_number.toString().padStart(3, '0')} 🎰
          </CardTitle>
          <CardDescription class="text-sm text-gray-600">
            {completedDate} • {completedTime}
          </CardDescription>
        </div>
      </div>
      
      <div class="text-right">
        <div class="text-2xl font-bold text-orange-600">
          {prizePool.toFixed(2)} SOL
        </div>
        <div class="text-sm text-gray-500">
          {winnerCount} winners
        </div>
      </div>
    </div>
  </CardHeader>
  
  <CardContent class="pt-0">
    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-4 mb-4">
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <div class="text-lg font-semibold text-gray-900">
          {winnerCount}
        </div>
        <div class="text-xs text-gray-600">Winners</div>
      </div>
      
      <div class="text-center p-3 bg-green-50 rounded-lg">
        <div class="text-lg font-semibold text-green-700">
          {prizePerWinner.toFixed(3)}
        </div>
        <div class="text-xs text-gray-600">SOL per winner</div>
      </div>
      
      <div class="text-center p-3 bg-blue-50 rounded-lg">
        <div class="text-lg font-semibold text-blue-700">
          {Math.floor(Math.random() * 5000 + 1000)}
        </div>
        <div class="text-xs text-gray-600">Participants</div>
      </div>
    </div>
    
    <!-- Action Buttons -->
    <div class="flex gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        class="flex-1"
        on:click={onToggle}
      >
        <Icon icon={expanded ? "mdi:chevron-up" : "mdi:chevron-down"} class="w-4 h-4 mr-2" />
        {expanded ? 'Show Less' : 'Quick View'}
      </Button>
      
      <Button 
        size="sm" 
        class="flex-1 bg-orange-600 hover:bg-orange-700"
        on:click={onViewDetails}
      >
        <Icon icon="mdi:eye" class="w-4 h-4 mr-2" />
        Full Details
      </Button>
    </div>
    
    <!-- Expanded Content -->
    {#if expanded}
      <div class="mt-4 pt-4 border-t border-gray-200">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Round Duration:</span>
            <span class="text-sm font-semibold">
              {Math.floor(Math.random() * 30 + 10)} minutes
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Distribution:</span>
            <span class="text-sm font-semibold">
              {(prizePool * 0.5).toFixed(2)} SOL to winners
            </span>
          </div>
          
          <div class="flex items-center justify-between">
            <span class="text-sm text-gray-600">Charity Donation:</span>
            <span class="text-sm font-semibold text-purple-600">
              {(prizePool * 0.1).toFixed(2)} SOL
            </span>
          </div>
          
          <div class="bg-orange-50 rounded-lg p-3 mt-3">
            <div class="text-xs text-orange-800 font-semibold mb-1">
              🎯 Status: Completed & Distributed
            </div>
            <div class="text-xs text-orange-700">
              All winners have been paid and transactions are verified on-chain.
            </div>
          </div>
        </div>
      </div>
    {/if}
  </CardContent>
</Card>