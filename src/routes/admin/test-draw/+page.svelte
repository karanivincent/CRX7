<script lang="ts">
  import { Button } from '$lib/components/ui/button';
  import Icon from '@iconify/svelte';
  import AdminLayout from '$lib/components/admin/admin-layout.svelte';
  
  // Simple test of our stores
  import { drawState, drawActions } from '$lib/stores/draw-state-old';
  
  export let data;
  const { user } = data;
  
  let currentState = 'IDLE';
  
  $: currentState = $drawState.stage;
  
  function testStartRound() {
    drawActions.startRound({ drawNumber: 1, id: 'test' });
  }
</script>

<svelte:head>
  <title>Test Draw - CRX7 Admin</title>
</svelte:head>

<AdminLayout title="Test Draw" description="Testing our new components" {user}>
  
  <div class="text-center py-16">
    <h1 class="text-4xl font-bold text-orange-600 mb-4">
      Draw State Test
    </h1>
    <p class="text-xl text-gray-600 mb-8">
      Current Stage: <code>{currentState}</code>
    </p>
    
    <Button on:click={testStartRound} size="lg" class="px-8 py-4 text-xl">
      <Icon icon="mdi:play" class="mr-2 h-6 w-6" />
      Test Start Round
    </Button>
    
    <div class="mt-8">
      <pre class="bg-gray-100 p-4 rounded text-left text-sm">
{JSON.stringify($drawState, null, 2)}
      </pre>
    </div>
  </div>
  
</AdminLayout>