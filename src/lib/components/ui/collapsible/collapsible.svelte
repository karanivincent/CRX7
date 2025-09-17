<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { slide } from 'svelte/transition';
	
	export let open = false;
	export let disabled = false;
	
	const dispatch = createEventDispatcher<{
		openchange: boolean;
	}>();
	
	function toggleOpen() {
		if (disabled) return;
		open = !open;
		dispatch('openchange', open);
	}
</script>

<div class="collapsible" data-state={open ? 'open' : 'closed'}>
	<slot name="trigger" {toggleOpen} {open} {disabled} />
	{#if open}
		<div transition:slide={{ duration: 200 }} class="collapsible-content">
			<slot name="content" />
		</div>
	{/if}
</div>

<style>
	.collapsible {
		@apply w-full;
	}
	
	.collapsible-content {
		@apply overflow-hidden;
	}
</style>