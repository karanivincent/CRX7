<script lang="ts">
  import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
  import Icon from '@iconify/svelte';
  import { onMount } from 'svelte';
  
  export let stats: {
    totalDistributed?: number;
    biggestWin?: number;
    totalWinners?: number;
    totalRounds?: number;
    averagePerWinner?: number;
  } = {};
  
  let loading = true;
  
  onMount(async () => {
    if (Object.keys(stats).length === 0) {
      // Fetch stats if not provided
      try {
        const response = await fetch('/api/rounds?action=stats');
        const data = await response.json();
        if (data.success) {
          stats = data.stats;
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }
    loading = false;
  });
  
  function formatSOL(amount: number): string {
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
  <!-- Total Distributed -->
  <Card class="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-green-800">
          Total Distributed
        </CardTitle>
        <Icon icon="mdi:currency-usd" class="w-4 h-4 text-green-600" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      {#if loading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-20 mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-green-600">
          {formatSOL(stats.totalDistributed || 0)} SOL
        </div>
        <CardDescription class="text-xs text-green-700">
          All-time rewards
        </CardDescription>
      {/if}
    </CardContent>
  </Card>
  
  <!-- Biggest Win -->
  <Card class="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-white">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-yellow-800">
          Biggest Win
        </CardTitle>
        <Icon icon="mdi:trophy" class="w-4 h-4 text-yellow-600" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      {#if loading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-20 mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-yellow-600">
          {formatSOL(stats.biggestWin || 0)} SOL
        </div>
        <CardDescription class="text-xs text-yellow-700">
          Single largest prize
        </CardDescription>
      {/if}
    </CardContent>
  </Card>
  
  <!-- Total Winners -->
  <Card class="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-blue-800">
          Total Winners
        </CardTitle>
        <Icon icon="mdi:account-group" class="w-4 h-4 text-blue-600" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      {#if loading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-16 mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-12"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-blue-600">
          {stats.totalWinners || 0}
        </div>
        <CardDescription class="text-xs text-blue-700">
          Lucky winners
        </CardDescription>
      {/if}
    </CardContent>
  </Card>
  
  <!-- Total Rounds -->
  <Card class="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-purple-800">
          Completed Rounds
        </CardTitle>
        <Icon icon="mdi:dice-multiple" class="w-4 h-4 text-purple-600" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      {#if loading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-12 mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-purple-600">
          {stats.totalRounds || 0}
        </div>
        <CardDescription class="text-xs text-purple-700">
          Draw sessions
        </CardDescription>
      {/if}
    </CardContent>
  </Card>
  
  <!-- Average Per Winner -->
  <Card class="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
    <CardHeader class="pb-2">
      <div class="flex items-center justify-between">
        <CardTitle class="text-sm font-medium text-orange-800">
          Average Win
        </CardTitle>
        <Icon icon="mdi:chart-line" class="w-4 h-4 text-orange-600" />
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      {#if loading}
        <div class="animate-pulse">
          <div class="h-8 bg-gray-200 rounded w-20 mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-16"></div>
        </div>
      {:else}
        <div class="text-2xl font-bold text-orange-600">
          {formatSOL(stats.averagePerWinner || 0)} SOL
        </div>
        <CardDescription class="text-xs text-orange-700">
          Per winner
        </CardDescription>
      {/if}
    </CardContent>
  </Card>
</div>

<!-- Additional Stats Row -->
{#if !loading && stats.totalRounds && stats.totalRounds > 0}
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
    <!-- Winners per Round -->
    <Card class="border border-gray-200">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">Winners per Round</div>
            <div class="text-xl font-bold text-gray-900">
              {((stats.totalWinners || 0) / (stats.totalRounds || 1)).toFixed(1)}
            </div>
          </div>
          <Icon icon="mdi:account-multiple" class="w-6 h-6 text-gray-400" />
        </div>
      </CardContent>
    </Card>
    
    <!-- Distribution Rate -->
    <Card class="border border-gray-200">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">SOL per Round</div>
            <div class="text-xl font-bold text-gray-900">
              {formatSOL((stats.totalDistributed || 0) / (stats.totalRounds || 1))}
            </div>
          </div>
          <Icon icon="mdi:speedometer" class="w-6 h-6 text-gray-400" />
        </div>
      </CardContent>
    </Card>
    
    <!-- Success Metric -->
    <Card class="border border-gray-200">
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm text-gray-600">Transparency</div>
            <div class="text-xl font-bold text-green-600">
              100%
            </div>
          </div>
          <Icon icon="mdi:shield-check" class="w-6 h-6 text-green-400" />
        </div>
      </CardContent>
    </Card>
  </div>
{/if}