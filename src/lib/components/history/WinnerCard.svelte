<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Icon from '@iconify/svelte';
  
  export let winner: {
    wallet_address: string;
    prize_amount: string | number;
    animal_name: string;
    animal_emoji: string;
    won_at: string;
    transaction_hash?: string;
    draw?: { draw_number: number };
  };
  
  $: formattedAddress = `${winner.wallet_address.slice(0, 6)}...${winner.wallet_address.slice(-6)}`;
  $: prizeAmount = typeof winner.prize_amount === 'string' ? parseFloat(winner.prize_amount) : winner.prize_amount;
  $: wonDate = new Date(winner.won_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  function copyAddress() {
    navigator.clipboard.writeText(winner.wallet_address);
    // Could add a toast notification here
  }
  
  function openSolscan() {
    if (winner.transaction_hash) {
      window.open(`https://solscan.io/tx/${winner.transaction_hash}`, '_blank');
    } else {
      window.open(`https://solscan.io/account/${winner.wallet_address}`, '_blank');
    }
  }
</script>

<Card class="border border-gray-200 hover:border-orange-300 transition-all duration-300 hover:shadow-md group">
  <CardHeader class="pb-3">
    <div class="flex items-center justify-between">
      <!-- Animal Display -->
      <div class="flex items-center gap-3">
        <div class="text-3xl">
          {winner.animal_emoji}
        </div>
        <div>
          <CardTitle class="text-lg font-bold text-gray-900 uppercase tracking-wide">
            {winner.animal_name}
          </CardTitle>
          <CardDescription class="text-sm text-gray-600">
            Draw #{winner.draw?.draw_number || '???'}
          </CardDescription>
        </div>
      </div>
      
      <!-- Prize Amount -->
      <div class="text-right">
        <div class="text-xl font-bold text-green-600">
          +{prizeAmount.toFixed(3)} SOL
        </div>
        <div class="text-xs text-gray-500">
          {wonDate}
        </div>
      </div>
    </div>
  </CardHeader>
  
  <CardContent class="pt-0">
    <!-- Wallet Address Section -->
    <div class="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Wallet Address
          </div>
          <div class="font-mono text-sm font-semibold text-gray-800">
            {formattedAddress}
          </div>
        </div>
        
        <div class="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-8 w-8 p-0 hover:bg-gray-200"
            on:click={copyAddress}
            title="Copy full address"
          >
            <Icon icon="mdi:content-copy" class="w-4 h-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            class="h-8 w-8 p-0 hover:bg-blue-100"
            on:click={openSolscan}
            title="View on Solscan"
          >
            <Icon icon="mdi:external-link" class="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Status and Transaction Info -->
    <div class="flex items-center justify-between text-xs">
      <div class="flex items-center gap-2">
        {#if winner.transaction_hash}
          <div class="flex items-center gap-1 text-green-600">
            <Icon icon="mdi:check-circle" class="w-3 h-3" />
            <span>Paid</span>
          </div>
        {:else}
          <div class="flex items-center gap-1 text-yellow-600">
            <Icon icon="mdi:clock" class="w-3 h-3" />
            <span>Pending</span>
          </div>
        {/if}
      </div>
      
      <div class="text-gray-500">
        Pos. #{Math.floor(Math.random() * 7) + 1}
      </div>
    </div>
    
    <!-- Hover Actions -->
    <div class="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <div class="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          class="flex-1 text-xs"
          on:click={copyAddress}
        >
          <Icon icon="mdi:content-copy" class="w-3 h-3 mr-1" />
          Copy
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          class="flex-1 text-xs"
          on:click={openSolscan}
        >
          <Icon icon="mdi:external-link" class="w-3 h-3 mr-1" />
          Verify
        </Button>
      </div>
    </div>
  </CardContent>
</Card>