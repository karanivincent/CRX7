<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { fade, scale } from 'svelte/transition';
	
	export let open = false;
	let className = '';
	export { className as class };
	
	const dispatch = createEventDispatcher<{
		openchange: boolean;
	}>();
	
	function closeDialog() {
		open = false;
		dispatch('openchange', false);
	}
	
	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			closeDialog();
		}
	}
	
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closeDialog();
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
		transition:fade={{ duration: 150 }}
		on:click={handleBackdropClick}
		on:keydown={handleKeydown}
		role="dialog"
		aria-modal="true"
	>
		<div class="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg {className}">
			<div transition:scale={{ duration: 150, start: 0.95 }}>
				<slot {closeDialog} />
			</div>
		</div>
	</div>
{/if}