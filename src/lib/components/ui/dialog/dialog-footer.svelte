<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 {className}">
	<slot />
</div>