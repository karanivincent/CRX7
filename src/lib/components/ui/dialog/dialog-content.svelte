<script lang="ts">
	let className = '';
	export { className as class };
</script>

<div class="grid gap-4 py-4 {className}">
	<slot />
</div>