<script lang="ts">
	let holders: any[] = [];
	let loading = false;
	let error = '';
	let tokenInfo: any = {};
	
	async function fetchHolders() {
		loading = true;
		error = '';
		
		try {
			const response = await fetch('/api/holders');
			const data = await response.json();
			
			if (data.success) {
				holders = data.holders;
				tokenInfo = {
					mint: data.tokenMint,
					name: data.tokenName,
					symbol: data.tokenSymbol
				};
			} else {
				error = data.message || 'Failed to fetch holders';
			}
		} catch (err) {
			error = 'Network error: ' + (err instanceof Error ? err.message : 'Unknown error');
		} finally {
			loading = false;
		}
	}
</script>

<div class="p-8">
	<h1 class="text-2xl font-bold mb-6">Token Holders Test</h1>
	
	{#if tokenInfo.name}
		<div class="mb-4 p-3 bg-blue-50 rounded border">
			<h2 class="font-semibold text-blue-800">Token Info</h2>
			<div class="text-sm text-blue-700">
				<div><strong>Name:</strong> {tokenInfo.name}</div>
				<div><strong>Symbol:</strong> {tokenInfo.symbol}</div>
				<div class="font-mono text-xs mt-1"><strong>Mint:</strong> {tokenInfo.mint}</div>
			</div>
		</div>
	{/if}
	
	<button 
		on:click={fetchHolders}
		disabled={loading}
		class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
	>
		{loading ? 'Fetching...' : 'Fetch Token Holders'}
	</button>
	
	{#if error}
		<div class="mt-4 p-4 bg-red-100 text-red-700 rounded">
			<strong>Error:</strong> {error}
		</div>
	{/if}
	
	{#if holders.length > 0}
		<div class="mt-6">
			<h2 class="text-lg font-semibold mb-4">Token Holders ({holders.length})</h2>
			<div class="space-y-2">
				{#each holders as holder}
					<div class="border p-3 rounded bg-gray-50">
						<div class="font-mono text-sm text-blue-600">{holder.address}</div>
						<div class="text-sm text-gray-600">
							Balance: {holder.balanceFormatted || holder.balance} tokens
							{#if holder.balance !== holder.balanceFormatted}
								<span class="text-xs text-gray-400">({holder.balance} raw)</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
	
	{#if holders.length === 0 && !loading && !error}
		<div class="mt-4 text-gray-600">
			Click the button above to fetch token holders
		</div>
	{/if}
</div>