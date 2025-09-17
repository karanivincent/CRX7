<script lang="ts">
	export let size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md';
	export let showText: boolean = true;
	export let className: string = '';

	const sizes = {
		xs: 'h-8',
		sm: 'h-10',
		md: 'h-12',
		lg: 'h-16',
		xl: 'h-20'
	};

	const textSizes = {
		xs: 'text-sm',
		sm: 'text-base',
		md: 'text-lg',
		lg: 'text-xl',
		xl: 'text-2xl'
	};
</script>

<div class="flex items-center gap-2 {className}">
	<img 
		src="/crx7-logo.png" 
		alt="CRx7 Logo"
		class="{sizes[size]} w-auto object-contain"
	/>
	{#if showText}
		<span class="font-bold text-gray-900 {textSizes[size]}">CRx7</span>
	{/if}
</div>
