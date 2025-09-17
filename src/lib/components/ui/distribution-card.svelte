<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  // Props
  export let record: any;
  export let Icon: any = null;
  
  const dispatch = createEventDispatcher();
  
  // Component state
  let expanded = false;
  
  // Helper functions
  function getStatusInfo(status: string) {
    switch (status) {
      case 'completed':
        return {
          icon: 'mdi:check-circle',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          label: 'Completed'
        };
      case 'pending':
        return {
          icon: 'mdi:clock-outline',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          label: 'Processing'
        };
      case 'retrying':
        return {
          icon: 'mdi:refresh',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Retrying'
        };
      case 'partial_success':
        return {
          icon: 'mdi:alert',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          label: 'Partial Success'
        };
      case 'failed':
        return {
          icon: 'mdi:alert-circle',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Failed'
        };
      default:
        return {
          icon: 'mdi:help-circle',
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          label: 'Unknown'
        };
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
  
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  }
  
  function openSolscan(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function retryDistribution() {
    try {
      dispatch('retryStarted');
      
      const response = await fetch(`/api/admin/distribution-history?id=${record.id}`, {
        method: 'PATCH'
      });
      
      const result = await response.json();
      
      if (result.success) {
        dispatch('retryInitiated', { id: record.id, retryCount: result.retryCount });
      } else {
        throw new Error(result.error || 'Retry failed');
      }
    } catch (error) {
      console.error('Failed to retry distribution:', error);
      dispatch('retryError', { error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  $: statusInfo = getStatusInfo(record.status);
  $: hasTransactions = record.winners_transaction_hash || record.holding_transaction_hash || record.charity_transaction_hash;
  $: hasFailures = record.failedTransactions && record.failedTransactions.length > 0;
</script>

<div class="border rounded-lg {statusInfo.borderColor} {statusInfo.bgColor} overflow-hidden">
  <!-- Card Header -->
  <div class="p-4">
    <div class="flex items-start justify-between">
      <!-- Left: Status and Amount -->
      <div class="flex items-start gap-3">
        <!-- Status Icon -->
        <div class="mt-0.5">
          {#if Icon}
            <Icon icon={statusInfo.icon} class="w-5 h-5 {statusInfo.color}" />
          {/if}
        </div>
        
        <!-- Main Info -->
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-gray-900">{record.totalAmountFormatted}</span>
            <span class="text-xs px-2 py-1 rounded-full {statusInfo.bgColor} {statusInfo.color} font-medium">
              {statusInfo.label}
            </span>
          </div>
          
          <!-- Recipients Summary -->
          <div class="flex items-center gap-4 text-sm text-gray-600">
            {#if record.roundNumber}
              <span class="font-medium text-purple-600">Round #{record.roundNumber}</span>
              <span>•</span>
            {/if}
            <span>{record.estimatedWinnerCount || 7} winners</span>
            <span>•</span>
            <span>{formatDate(record.executed_at)}</span>
            {#if record.transactionCount < 3 && record.status === 'completed'}
              <span>•</span>
              <span class="text-amber-600">Partial transactions</span>
            {/if}
            {#if record.retryCount > 0}
              <span>•</span>
              <span class="text-blue-600">Retry #{record.retryCount}</span>
            {/if}
          </div>
          
          <!-- Failure Information -->
          {#if hasFailures}
            <div class="mt-2 text-sm">
              <div class="text-red-600 font-medium">Failed: {record.failedTransactions.join(', ')}</div>
              {#if record.failureReason}
                <div class="text-red-500 text-xs mt-1">{record.failureReason}</div>
              {/if}
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        {#if record.canRetry}
          <button
            on:click={retryDistribution}
            class="text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 transition-colors"
            title="Retry failed transactions"
          >
            {#if Icon}
              <Icon icon="mdi:refresh" class="w-3 h-3 inline mr-1" />
            {/if}
            Retry
          </button>
        {/if}
        {#if hasTransactions}
          <button
            on:click={() => expanded = !expanded}
            class="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded border hover:bg-gray-50 transition-colors"
          >
            {expanded ? 'Less' : 'Details'}
            {#if Icon}
              <Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="w-3 h-3 inline ml-1" />
            {/if}
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Quick Stats -->
    <div class="mt-3 grid grid-cols-3 gap-4 text-sm">
      <div>
        <span class="text-gray-500">Winners</span>
        <div class="font-medium text-green-600">{record.winnersAmountFormatted}</div>
      </div>
      <div>
        <span class="text-gray-500">Holding</span>
        <div class="font-medium text-blue-600">{record.holdingAmountFormatted}</div>
      </div>
      <div>
        <span class="text-gray-500">Charity</span>
        <div class="font-medium text-purple-600">{record.charityAmountFormatted}</div>
      </div>
    </div>
  </div>
  
  <!-- Expandable Transaction Details -->
  {#if expanded && hasTransactions}
    <div class="border-t bg-white">
      <div class="p-4 space-y-3">
        <h4 class="text-sm font-medium text-gray-900 mb-3">Transaction Details</h4>
        
        <!-- Winners Transaction -->
        {#if record.winners_transaction_hash}
          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div class="flex items-center gap-3">
              {#if Icon}
                <Icon icon="mdi:trophy" class="w-4 h-4 text-green-600" />
              {/if}
              <div>
                <div class="font-medium text-green-900 text-sm">Winners Payment</div>
                <div class="text-xs text-green-700 font-mono">
                  {record.winnersTransactionDisplay}
                </div>
              </div>
            </div>
            <div class="flex gap-1">
              <button
                on:click={() => copyToClipboard(record.winners_transaction_hash)}
                class="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="Copy transaction hash"
              >
                {#if Icon}
                  <Icon icon="mdi:content-copy" class="w-3.5 h-3.5" />
                {/if}
              </button>
              <button
                on:click={() => openSolscan(record.winnersTransactionUrl)}
                class="p-1.5 text-green-600 hover:bg-green-100 rounded transition-colors"
                title="View on Solscan"
              >
                {#if Icon}
                  <Icon icon="mdi:open-in-new" class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>
          </div>
        {/if}
        
        <!-- Holding Transaction -->
        {#if record.holding_transaction_hash}
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div class="flex items-center gap-3">
              {#if Icon}
                <Icon icon="mdi:bank" class="w-4 h-4 text-blue-600" />
              {/if}
              <div>
                <div class="font-medium text-blue-900 text-sm">Holding Wallet</div>
                <div class="text-xs text-blue-700 font-mono">
                  {record.holdingTransactionDisplay}
                </div>
              </div>
            </div>
            <div class="flex gap-1">
              <button
                on:click={() => copyToClipboard(record.holding_transaction_hash)}
                class="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="Copy transaction hash"
              >
                {#if Icon}
                  <Icon icon="mdi:content-copy" class="w-3.5 h-3.5" />
                {/if}
              </button>
              <button
                on:click={() => openSolscan(record.holdingTransactionUrl)}
                class="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                title="View on Solscan"
              >
                {#if Icon}
                  <Icon icon="mdi:open-in-new" class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>
          </div>
        {/if}
        
        <!-- Charity Transaction -->
        {#if record.charity_transaction_hash}
          <div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div class="flex items-center gap-3">
              {#if Icon}
                <Icon icon="mdi:heart" class="w-4 h-4 text-purple-600" />
              {/if}
              <div>
                <div class="font-medium text-purple-900 text-sm">Charity Wallet</div>
                <div class="text-xs text-purple-700 font-mono">
                  {record.charityTransactionDisplay}
                </div>
              </div>
            </div>
            <div class="flex gap-1">
              <button
                on:click={() => copyToClipboard(record.charity_transaction_hash)}
                class="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                title="Copy transaction hash"
              >
                {#if Icon}
                  <Icon icon="mdi:content-copy" class="w-3.5 h-3.5" />
                {/if}
              </button>
              <button
                on:click={() => openSolscan(record.charityTransactionUrl)}
                class="p-1.5 text-purple-600 hover:bg-purple-100 rounded transition-colors"
                title="View on Solscan"
              >
                {#if Icon}
                  <Icon icon="mdi:open-in-new" class="w-3.5 h-3.5" />
                {/if}
              </button>
            </div>
          </div>
        {/if}
        
        <!-- Notes (if any) -->
        {#if record.notes}
          <div class="text-xs text-gray-600 p-3 bg-gray-50 rounded-lg border">
            <div class="font-medium mb-1">Notes:</div>
            {record.notes}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>