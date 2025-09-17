<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div class="flex flex-col space-y-1.5 text-center sm:text-left {className}">
	<slot />
</div>