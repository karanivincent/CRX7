<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	
	export let data;
	const { user } = data;
	
	const tokenDisplay = getTokenDisplay();
	
	// Configuration settings
	let minimumBalance = 10000; // Minimum token balance for eligibility
	let holdingWallet = 'EgFrJidrBi89nXA8qbBnZ1PMWUPRunX8bA7CWJFhbdEt';
	let charityWallet = '3ebPj68nRbKQwpRUoHRdZypxKb6b5SHL5vYmAuqf9Bo8';
	let adminWallet = '3mkD7ShsqbjpFcu1VWnCcoM6mTAt272qemLK4xBqKQJx';
	
	// Draw parameters
	let winnersPerDraw = 7;
	let candidatesPerSpin = 7;
	let distributionSplit = {
		winners: 50,
		holding: 40,
		charity: 10
	};
	
	// Token settings
	let tokenMintAddress = 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump';
	let tokenName = '$runner';
	let tokenSymbol = 'RUNNER';
	
	// Testing mode settings
	let testingMode = false;
	let useTestDistributionWallets = false;
	
	// Developer panel visibility
	let showDeveloperPanel = false;
	
	// Save status
	let saving = false;
	let lastSaved = '';
	
	// Load current testing mode status on component mount
	import { onMount } from 'svelte';
	
	onMount(async () => {
		// Load testing mode configuration
		try {
			const response = await fetch('/api/admin/testing-mode');
			if (response.ok) {
				const result = await response.json();
				testingMode = result.testingMode || false;
				useTestDistributionWallets = result.useTestDistributionWallets || false;
				showDeveloperPanel = result.showDeveloperPanel || false;
			}
		} catch (error) {
			console.error('Failed to load testing mode status:', error);
		}
	});
	
	async function toggleTestingMode() {
		try {
			const response = await fetch('/api/admin/testing-mode', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					testingMode,
					useTestDistributionWallets,
					showDeveloperPanel
				})
			});
			
			if (response.ok) {
				const result = await response.json();
				console.log('Testing mode updated:', result);
			} else {
				throw new Error('Failed to update testing mode');
			}
		} catch (error) {
			console.error('Failed to update testing mode:', error);
			// Revert the toggle on error
			testingMode = !testingMode;
		}
	}
	
	async function saveConfiguration() {
		saving = true;
		
		// Simulate API call
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		saving = false;
		lastSaved = new Date().toLocaleString();
	}
	
	function validateWalletAddress(address: string) {
		// Basic Solana address validation (simplified)
		return address.length >= 32 && address.length <= 44 && /^[A-Za-z0-9]+$/.test(address);
	}
	
	async function toggleDeveloperPanel() {
		showDeveloperPanel = !showDeveloperPanel;
		await toggleTestingMode(); // Save the state
	}
	
	$: isValidConfig = validateWalletAddress(holdingWallet) && 
		validateWalletAddress(charityWallet) && 
		validateWalletAddress(adminWallet) &&
		minimumBalance > 0 &&
		winnersPerDraw > 0 &&
		candidatesPerSpin > 0;
</script>

<svelte:head>
	<title>Configuration - {tokenDisplay} Admin</title>
</svelte:head>

<AdminLayout title="Configuration" description="Configure wallets, draw parameters, and system settings" {user}>


	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Wallet Configuration -->
		<Card class="border-2 border-orange-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:wallet" class="w-5 h-5 text-orange-600" />
					Wallet Addresses
				</CardTitle>
				<CardDescription>Configure distribution and admin wallet addresses</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Admin Wallet</label>
					<input 
						type="text" 
						bind:value={adminWallet}
						placeholder="Your admin wallet address"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
					/>
					<div class="text-xs text-gray-500">Used for signing transactions and administrative functions</div>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Holding Wallet (40% distribution)</label>
					<input 
						type="text" 
						bind:value={holdingWallet}
						placeholder="Wallet for future operations"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
					/>
					<div class="text-xs text-gray-500">Receives 40% of each distribution for future use</div>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Charity Wallet (10% distribution)</label>
					<input 
						type="text" 
						bind:value={charityWallet}
						placeholder="Charitable organization wallet"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
					/>
					<div class="text-xs text-gray-500">Receives 10% of each distribution for charity</div>
				</div>
			</CardContent>
		</Card>
		
		<!-- Draw Parameters -->
		<Card class="border-2 border-blue-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:cog" class="w-5 h-5 text-blue-600" />
					Draw Parameters
				</CardTitle>
				<CardDescription>Configure lottery drawing settings</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Winners per Draw</label>
						<input 
							type="number" 
							bind:value={winnersPerDraw}
							min="1"
							max="20"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<div class="text-xs text-gray-500">Number of winners selected each round</div>
					</div>
					
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Candidates per Spin</label>
						<input 
							type="number" 
							bind:value={candidatesPerSpin}
							min="3"
							max="20"
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<div class="text-xs text-gray-500">Number of candidates shown on wheel</div>
					</div>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Minimum Token Balance</label>
					<div class="flex items-center gap-2">
						<input 
							type="number" 
							bind:value={minimumBalance}
							min="1"
							class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						/>
						<span class="text-sm text-gray-500">{tokenSymbol}</span>
					</div>
					<div class="text-xs text-gray-500">Minimum balance required for lottery eligibility</div>
				</div>
			</CardContent>
		</Card>
		
		<!-- Distribution Settings -->
		<Card class="border-2 border-green-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:chart-pie" class="w-5 h-5 text-green-600" />
					Distribution Split
				</CardTitle>
				<CardDescription>Configure how SOL is distributed</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-3">
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Winners</label>
						<div class="flex items-center gap-2">
							<input 
								type="number" 
								bind:value={distributionSplit.winners}
								min="1"
								max="100"
								class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
							/>
							<span class="text-sm text-gray-500">%</span>
						</div>
					</div>
					
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Holding Wallet</label>
						<div class="flex items-center gap-2">
							<input 
								type="number" 
								bind:value={distributionSplit.holding}
								min="0"
								max="100"
								class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
							/>
							<span class="text-sm text-gray-500">%</span>
						</div>
					</div>
					
					<div class="flex items-center justify-between">
						<label class="text-sm font-medium text-gray-700">Charity</label>
						<div class="flex items-center gap-2">
							<input 
								type="number" 
								bind:value={distributionSplit.charity}
								min="0"
								max="100"
								class="w-16 px-2 py-1 border border-gray-300 rounded text-center"
							/>
							<span class="text-sm text-gray-500">%</span>
						</div>
					</div>
				</div>
				
				<div class="pt-3 border-t">
					<div class="flex justify-between font-medium">
						<span>Total:</span>
						<span class="{(distributionSplit.winners + distributionSplit.holding + distributionSplit.charity) === 100 ? 'text-green-600' : 'text-red-600'}">
							{distributionSplit.winners + distributionSplit.holding + distributionSplit.charity}%
						</span>
					</div>
					{#if (distributionSplit.winners + distributionSplit.holding + distributionSplit.charity) !== 100}
						<div class="text-xs text-red-600 mt-1">Total must equal 100%</div>
					{/if}
				</div>
			</CardContent>
		</Card>
		
		<!-- Token Information -->
		<Card class="border-2 border-purple-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:coin" class="w-5 h-5 text-purple-600" />
					Token Information
				</CardTitle>
				<CardDescription>Current token configuration</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Token Name</label>
					<input 
						type="text" 
						bind:value={tokenName}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Token Symbol</label>
					<input 
						type="text" 
						bind:value={tokenSymbol}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
					/>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Mint Address</label>
					<input 
						type="text" 
						bind:value={tokenMintAddress}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
						readonly
					/>
					<div class="text-xs text-gray-500">Read-only: Set in environment variables</div>
				</div>
			</CardContent>
		</Card>
		
		<!-- Testing Mode Configuration -->
		{#if showDeveloperPanel}
		<Card class="border-2 border-yellow-200 lg:col-span-2">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:flask" class="w-5 h-5 text-yellow-600" />
					Testing Mode Configuration
				</CardTitle>
				<CardDescription>Enable testing features for development and debugging</CardDescription>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<!-- Testing Mode Toggle -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<label class="text-sm font-medium text-gray-700">Testing Mode</label>
								<div class="text-xs text-gray-500">Enable test wallets for lottery participants</div>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									bind:checked={testingMode}
									on:change={toggleTestingMode}
									class="sr-only peer"
								/>
								<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
							</label>
						</div>
						
						{#if testingMode}
							<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-start gap-2">
									<Icon icon="mdi:information" class="w-4 h-4 text-yellow-600 mt-0.5" />
									<div class="text-sm text-yellow-800">
										<div class="font-medium">Testing Mode Active</div>
										<div class="mt-1">Test wallets will be used as lottery participants instead of real token holders.</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
					
					<!-- Test Distribution Wallets Toggle -->
					<div class="space-y-4">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<label class="text-sm font-medium text-gray-700">Test Distribution Wallets</label>
								<div class="text-xs text-gray-500">Use test wallets for holding and charity destinations</div>
							</div>
							<label class="relative inline-flex items-center cursor-pointer">
								<input 
									type="checkbox" 
									bind:checked={useTestDistributionWallets}
									on:change={toggleTestingMode}
									class="sr-only peer"
								/>
								<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"></div>
							</label>
						</div>
						
						{#if useTestDistributionWallets}
							<div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
								<div class="flex items-start gap-2">
									<Icon icon="mdi:shield-alert" class="w-4 h-4 text-yellow-600 mt-0.5" />
									<div class="text-sm text-yellow-800">
										<div class="font-medium">Test Distribution Active</div>
										<div class="mt-1">SOL distributions will go to test wallets instead of production wallets.</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
				
				<!-- Current Test Wallets Display -->
				{#if testingMode}
					<div class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
						<div class="flex items-center gap-2 mb-3">
							<Icon icon="mdi:wallet-outline" class="w-4 h-4 text-gray-600" />
							<span class="text-sm font-medium text-gray-700">Test Wallets Available</span>
						</div>
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
							<div class="text-xs">
								<div class="font-medium text-gray-700">🤖 BonkBot</div>
								<div class="font-mono text-gray-600">J23v...o3kB</div>
							</div>
							<div class="text-xs">
								<div class="font-medium text-gray-700">🐂 Old Bull</div>
								<div class="font-mono text-gray-600">HLMm...gexw</div>
							</div>
							<div class="text-xs">
								<div class="font-medium text-gray-700">🦅 Neo December</div>
								<div class="font-mono text-gray-600">3fQx...yoyL</div>
							</div>
							<div class="text-xs">
								<div class="font-medium text-gray-700">🚀 Neo Current</div>
								<div class="font-mono text-gray-600">HzNs...cMzj</div>
							</div>
							<div class="text-xs">
								<div class="font-medium text-gray-700">🎯 Neo Seven</div>
								<div class="font-mono text-gray-600">D3Bt...MbNF</div>
							</div>
							<div class="text-xs">
								<div class="font-medium text-gray-700">🌟 Neo Five</div>
								<div class="font-mono text-gray-600">DMHi...mjTC</div>
							</div>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>
		{/if}
	</div>
	
	<!-- Save Configuration -->
	<Card class="mt-6 border-2 border-gray-200">
		<CardContent class="p-6">
			<div class="flex items-center justify-between">
				<div>
					<div class="font-medium text-gray-900">Save Configuration</div>
					{#if lastSaved}
						<div class="text-sm text-gray-500">Last saved: {lastSaved}</div>
					{:else}
						<div class="text-sm text-gray-500">No changes saved yet</div>
					{/if}
				</div>
				<div class="flex gap-3 items-center">
					<!-- Developer Panel Toggle -->
					<div class="flex items-center gap-2">
						<label class="text-sm text-gray-600">Developer Panel</label>
						<label class="relative inline-flex items-center cursor-pointer">
							<input 
								type="checkbox" 
								bind:checked={showDeveloperPanel}
								on:change={toggleDeveloperPanel}
								class="sr-only peer"
							/>
							<div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
						</label>
					</div>
					<Button variant="outline" disabled={saving}>
						<Icon icon="mdi:refresh" class="mr-2 h-4 w-4" />
						Reset to Defaults
					</Button>
					<Button 
						on:click={saveConfiguration}
						disabled={!isValidConfig || saving}
						class="px-6"
					>
						{#if saving}
							<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />
							Saving...
						{:else}
							<Icon icon="mdi:content-save" class="mr-2 h-4 w-4" />
							Save Configuration
						{/if}
					</Button>
				</div>
			</div>
			
			{#if !isValidConfig}
				<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
					<div class="flex items-start gap-2">
						<Icon icon="mdi:alert" class="w-4 h-4 text-red-600 mt-0.5" />
						<div class="text-sm text-red-800">
							Please fix the following issues before saving:
							<ul class="list-disc list-inside mt-1 space-y-1">
								{#if !validateWalletAddress(holdingWallet)}
									<li>Invalid holding wallet address</li>
								{/if}
								{#if !validateWalletAddress(charityWallet)}
									<li>Invalid charity wallet address</li>
								{/if}
								{#if !validateWalletAddress(adminWallet)}
									<li>Invalid admin wallet address</li>
								{/if}
								{#if minimumBalance <= 0}
									<li>Minimum balance must be greater than 0</li>
								{/if}
								{#if (distributionSplit.winners + distributionSplit.holding + distributionSplit.charity) !== 100}
									<li>Distribution percentages must total 100%</li>
								{/if}
							</ul>
						</div>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</AdminLayout>