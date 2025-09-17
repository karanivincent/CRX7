<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import Icon from '@iconify/svelte';

  export let type: 'success' | 'error' | 'info' | 'warning' = 'info';
  export let title: string = '';
  export let message: string = '';
  export let duration: number = 5000; // Auto-dismiss after 5 seconds
  export let details: string[] = []; // Array of detail lines
  export let showDetails: boolean = false;

  const dispatch = createEventDispatcher();
  
  let visible = false;
  let expanded = false;
  
  const typeConfig = {
    success: {
      icon: 'mdi:check-circle',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      titleColor: 'text-green-800'
    },
    error: {
      icon: 'mdi:alert-circle',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      titleColor: 'text-red-800'
    },
    warning: {
      icon: 'mdi:alert',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      iconColor: 'text-orange-600',
      titleColor: 'text-orange-800'
    },
    info: {
      icon: 'mdi:information',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-800'
    }
  };

  $: config = typeConfig[type];

  onMount(() => {
    visible = true;
    
    if (duration > 0) {
      setTimeout(() => {
        dismiss();
      }, duration);
    }
  });

  function dismiss() {
    visible = false;
    setTimeout(() => {
      dispatch('dismiss');
    }, 300);
  }
</script>

<div 
  class="fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-out {visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}"
>
  <div class="rounded-lg shadow-lg border-2 {config.bgColor} {config.borderColor} p-4">
    <div class="flex items-start">
      <!-- Icon -->
      <div class="flex-shrink-0 mt-0.5">
        <Icon icon={config.icon} class="w-5 h-5 {config.iconColor}" />
      </div>
      
      <!-- Content -->
      <div class="ml-3 flex-1">
        <!-- Title and message -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            {#if title}
              <h3 class="text-sm font-medium {config.titleColor} mb-1">{title}</h3>
            {/if}
            {#if message}
              <p class="text-sm text-gray-700">{message}</p>
            {/if}
          </div>
          
          <!-- Close button -->
          <button
            on:click={dismiss}
            class="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Icon icon="mdi:close" class="w-4 h-4" />
          </button>
        </div>
        
        <!-- Details section -->
        {#if details && details.length > 0}
          <div class="mt-3">
            <button
              on:click={() => expanded = !expanded}
              class="text-xs font-medium {config.titleColor} hover:underline flex items-center"
            >
              <Icon icon={expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="w-3 h-3 mr-1" />
              {expanded ? 'Hide' : 'Show'} Details
            </button>
            
            {#if expanded}
              <div class="mt-2 p-2 bg-white bg-opacity-50 rounded text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                {#each details as detail}
                  <div class="break-all">{detail}</div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>