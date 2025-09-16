<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import Icon from '@iconify/svelte';
  
  export let searchTerm = '';
  export let sortBy = 'completed_at';
  export let sortOrder = 'desc';
  export let dateFrom = '';
  export let dateTo = '';
  export let minPrize = '';
  export let maxPrize = '';
  export let onFiltersChange: () => void = () => {};
  export let showAdvanced = false;
  export let type: 'rounds' | 'winners' = 'rounds';
  
  function resetFilters() {
    searchTerm = '';
    sortBy = type === 'rounds' ? 'completed_at' : 'won_at';
    sortOrder = 'desc';
    dateFrom = '';
    dateTo = '';
    minPrize = '';
    maxPrize = '';
    onFiltersChange();
  }
  
  function toggleAdvanced() {
    showAdvanced = !showAdvanced;
  }
  
  // Reactive updates
  $: sortBy, sortOrder, dateFrom, dateTo, minPrize, maxPrize, onFiltersChange();
</script>

<div class="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm">
  <!-- Basic Filters Row -->
  <div class="flex flex-col sm:flex-row gap-4 mb-4">
    <!-- Search Input -->
    <div class="flex-1">
      <div class="relative">
        <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          bind:value={searchTerm}
          placeholder={type === 'rounds' ? "Search by draw number..." : "Search by wallet address..."}
          class="pl-10"
          on:input={onFiltersChange}
        />
      </div>
    </div>
    
    <!-- Sort Controls -->
    <div class="flex gap-2">
      <select 
        bind:value={sortBy}
        class="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
      >
        {#if type === 'rounds'}
          <option value="completed_at">Date Completed</option>
          <option value="draw_number">Draw Number</option>
          <option value="total_prize_pool">Prize Pool</option>
        {:else}
          <option value="won_at">Date Won</option>
          <option value="prize_amount">Prize Amount</option>
          <option value="draw_sequence">Draw Number</option>
        {/if}
      </select>
      
      <Button
        variant="outline"
        size="sm"
        class="px-3"
        on:click={() => { sortOrder = sortOrder === 'asc' ? 'desc' : 'asc'; }}
      >
        <Icon 
          icon={sortOrder === 'asc' ? 'mdi:sort-ascending' : 'mdi:sort-descending'} 
          class="w-4 h-4" 
        />
      </Button>
    </div>
    
    <!-- Advanced Toggle -->
    <Button
      variant="outline"
      size="sm"
      on:click={toggleAdvanced}
      class="px-3"
    >
      <Icon icon="mdi:filter-variant" class="w-4 h-4 mr-2" />
      Filters
      <Icon 
        icon={showAdvanced ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
        class="w-4 h-4 ml-2" 
      />
    </Button>
  </div>
  
  <!-- Advanced Filters -->
  {#if showAdvanced}
    <div class="border-t border-gray-200 pt-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Date Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <Input
            type="date"
            bind:value={dateFrom}
            class="text-sm"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <Input
            type="date"
            bind:value={dateTo}
            class="text-sm"
          />
        </div>
        
        <!-- Prize Range -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Min Prize (SOL)
          </label>
          <Input
            type="number"
            step="0.001"
            placeholder="0.000"
            bind:value={minPrize}
            class="text-sm"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Max Prize (SOL)
          </label>
          <Input
            type="number"
            step="0.001"
            placeholder="999.999"
            bind:value={maxPrize}
            class="text-sm"
          />
        </div>
      </div>
      
      <!-- Filter Actions -->
      <div class="flex justify-end gap-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          on:click={resetFilters}
        >
          <Icon icon="mdi:refresh" class="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
    </div>
  {/if}
  
  <!-- Active Filters Summary -->
  {#if searchTerm || dateFrom || dateTo || minPrize || maxPrize}
    <div class="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
      <span class="text-sm text-gray-600">Active filters:</span>
      
      {#if searchTerm}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
          Search: {searchTerm}
          <button on:click={() => { searchTerm = ''; onFiltersChange(); }}>
            <Icon icon="mdi:close" class="w-3 h-3" />
          </button>
        </span>
      {/if}
      
      {#if dateFrom || dateTo}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
          Date: {dateFrom || '∞'} - {dateTo || '∞'}
          <button on:click={() => { dateFrom = ''; dateTo = ''; onFiltersChange(); }}>
            <Icon icon="mdi:close" class="w-3 h-3" />
          </button>
        </span>
      {/if}
      
      {#if minPrize || maxPrize}
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
          Prize: {minPrize || '0'} - {maxPrize || '∞'} SOL
          <button on:click={() => { minPrize = ''; maxPrize = ''; onFiltersChange(); }}>
            <Icon icon="mdi:close" class="w-3 h-3" />
          </button>
        </span>
      {/if}
    </div>
  {/if}
</div>