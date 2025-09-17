<script lang="ts">
	export let onClick: () => void;
	export let open: boolean;
	export let disabled = false;
	
	let className = '';
	export { className as class };
</script>

<button
	class="flex w-full items-center justify-between p-0 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 {className}"
	data-state={open ? 'open' : 'closed'}
	on:click={onClick}
	{disabled}
	type="button"
>
	<slot />
	<svg
		class="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
	>
		<path d="m6 9 6 6 6-6" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
</button>