<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';

	export let data;

	// Use configuration from server
	const tokenDisplay = data.tokenConfig?.displayName || 'CRX7';
	const winnersPerDraw = data.tokenConfig?.winnersPerDraw || 7;
	const distributionText = data.tokenConfig ? 
		`${data.tokenConfig.distribution.winnersPercentage}% to winners • ${data.tokenConfig.distribution.holdingPercentage}% to future rounds • ${data.tokenConfig.distribution.charityPercentage}% to charity` :
		'50% to winners • 40% to future rounds • 10% to charity';

	// Stats data
	let stats: any = {};
	let statsLoading = true;

	onMount(async () => {
		try {
			const response = await fetch('/api/rounds?action=stats');
			const data = await response.json();
			if (data.success) {
				stats = data.stats;
			}
		} catch (error) {
			console.error('Failed to fetch stats:', error);
		} finally {
			statsLoading = false;
		}
	});

	function formatSOL(amount: number): string {
		if (amount >= 1000) {
			return `${(amount / 1000).toFixed(1)}K`;
		}
		return amount.toFixed(2);
	}
</script>

<svelte:head>
	<title>{tokenDisplay} - Transparent SOL Rewards for Token Holders</title>
	<meta name="description" content="Weekly SOL lottery for {tokenDisplay} token holders. Transparent, on-chain, and fair distribution system with {winnersPerDraw} winners per draw." />
</svelte:head>

<div class="min-h-screen bg-white">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-gradient-to-b from-orange-50 to-white">
		<div class="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:px-8 lg:pt-24">
			<div class="mx-auto max-w-2xl text-center lg:max-w-4xl">
				<div class="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
					<Icon icon="mdi:shield-check" class="w-4 h-4" />
					Transparent • On-Chain • Fair
				</div>
				
				<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
					Weekly SOL Rewards for 
					<span class="text-orange-600">{tokenDisplay}</span> Holders
				</h1>
				
				<p class="mt-6 text-xl leading-8 text-gray-600 max-w-3xl mx-auto">
					Hold {tokenDisplay} tokens and automatically qualify for weekly SOL distributions. 
					{winnersPerDraw} winners selected fairly through transparent, on-chain lottery draws.
				</p>

				<div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
					<Button
						href="/how-it-works"
						size="lg"
						class="px-8 py-4 text-lg font-semibold"
					>
						<Icon icon="mdi:information-outline" class="w-5 h-5 mr-2" />
						How It Works
					</Button>
					<Button
						variant="outline"
						href="/past-draws"
						size="lg"
						class="px-8 py-4 text-lg font-semibold"
					>
						<Icon icon="mdi:history" class="w-5 h-5 mr-2" />
						View Past Draws
					</Button>
				</div>

				<!-- Trust Indicators -->
				<div class="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-600">
					<div class="flex items-center gap-2">
						<Icon icon="mdi:blockchain" class="w-4 h-4 text-green-600" />
						<span>100% On-Chain</span>
					</div>
					<div class="flex items-center gap-2">
						<Icon icon="mdi:eye" class="w-4 h-4 text-blue-600" />
						<span>Fully Transparent</span>
					</div>
					<div class="flex items-center gap-2">
						<Icon icon="mdi:scale-balance" class="w-4 h-4 text-purple-600" />
						<span>Provably Fair</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Section -->
	<div class="py-16 sm:py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center mb-16">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Platform Statistics
				</h2>
				<p class="mt-4 text-lg text-gray-600">
					Real-time data from our transparent lottery system
				</p>
			</div>

			{#if statsLoading}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
					{#each Array(3) as _}
						<div class="bg-gray-100 rounded-lg h-32"></div>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<Card class="text-center border-2 hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle class="text-3xl font-bold text-green-600">
								{formatSOL(stats.totalDistributed || 0)} SOL
							</CardTitle>
							<CardDescription class="text-lg">Total Distributed</CardDescription>
						</CardHeader>
						<CardContent>
							<p class="text-sm text-gray-600">Lifetime rewards to {tokenDisplay} holders</p>
						</CardContent>
					</Card>

					<Card class="text-center border-2 hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle class="text-3xl font-bold text-blue-600">
								{stats.totalWinners || 0}
							</CardTitle>
							<CardDescription class="text-lg">Total Winners</CardDescription>
						</CardHeader>
						<CardContent>
							<p class="text-sm text-gray-600">Lucky holders who received rewards</p>
						</CardContent>
					</Card>

					<Card class="text-center border-2 hover:shadow-lg transition-shadow">
						<CardHeader>
							<CardTitle class="text-3xl font-bold text-purple-600">
								{stats.totalRounds || 0}
							</CardTitle>
							<CardDescription class="text-lg">Completed Draws</CardDescription>
						</CardHeader>
						<CardContent>
							<p class="text-sm text-gray-600">Fair and transparent lottery rounds</p>
						</CardContent>
					</Card>
				</div>
			{/if}
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="bg-gray-50 py-16 sm:py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center mb-16">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Simple & Transparent Process
				</h2>
				<p class="mt-4 text-lg text-gray-600">
					Three steps to participate in our fair lottery system
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<div class="text-center">
					<div class="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6">
						<Icon icon="mdi:wallet" class="w-8 h-8 text-orange-600" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">
						1. Hold {tokenDisplay} Tokens
					</h3>
					<p class="text-gray-600">
						Purchase and hold {tokenDisplay} tokens in your wallet. Minimum balance requirements apply for eligibility.
					</p>
				</div>

				<div class="text-center">
					<div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
						<Icon icon="mdi:dice-multiple" class="w-8 h-8 text-blue-600" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">
						2. Automatic Entry
					</h3>
					<p class="text-gray-600">
						Qualified holders are automatically entered into weekly draws. No additional action required.
					</p>
				</div>

				<div class="text-center">
					<div class="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
						<Icon icon="mdi:trophy" class="w-8 h-8 text-green-600" />
					</div>
					<h3 class="text-xl font-semibold text-gray-900 mb-4">
						3. Receive SOL Rewards
					</h3>
					<p class="text-gray-600">
						{winnersPerDraw} winners selected per draw receive SOL directly to their wallets.
					</p>
				</div>
			</div>

			<div class="mt-12 text-center">
				<div class="inline-flex items-center gap-2 bg-orange-100 px-6 py-3 rounded-full">
					<Icon icon="mdi:information" class="w-4 h-4 text-orange-600" />
					<span class="text-sm font-medium text-orange-800">
						Distribution: {distributionText}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="py-16 sm:py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center mb-16">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Why Choose {tokenDisplay}?
				</h2>
				<p class="mt-4 text-lg text-gray-600">
					Built on principles of transparency, fairness, and community reward
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:shield-check" class="w-8 h-8 text-green-600 mb-2" />
						<CardTitle>Transparent & Fair</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">All draws are conducted on-chain with verifiable randomness. No hidden algorithms or manipulation.</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:clock-outline" class="w-8 h-8 text-blue-600 mb-2" />
						<CardTitle>Regular Distributions</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">Weekly lottery draws ensure consistent opportunities for rewards. Scheduled and predictable timing.</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:account-group" class="w-8 h-8 text-purple-600 mb-2" />
						<CardTitle>Community Driven</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">Rewards flow back to the community of token holders, creating sustainable value for participants.</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:speed" class="w-8 h-8 text-orange-600 mb-2" />
						<CardTitle>Instant Payouts</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">Winners receive SOL rewards directly to their wallets immediately after each draw completion.</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:security" class="w-8 h-8 text-red-600 mb-2" />
						<CardTitle>Secure Platform</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">Built on Solana blockchain with robust security measures and auditable smart contracts.</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<Icon icon="mdi:chart-line" class="w-8 h-8 text-green-600 mb-2" />
						<CardTitle>Growing Ecosystem</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">Expanding utility and partnerships create increasing value for long-term token holders.</p>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="bg-gradient-to-r from-orange-600 to-orange-700">
		<div class="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
			<div class="mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-bold tracking-tight text-white sm:text-4xl">
					Ready to Get Started?
				</h2>
				<p class="mx-auto mt-6 max-w-xl text-lg leading-8 text-orange-100">
					Join the {tokenDisplay} community and start participating in weekly SOL distributions. 
					Fair, transparent, and rewarding.
				</p>
				<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
					<Button
						variant="secondary"
						href="/how-it-works"
						size="lg"
						class="bg-white text-orange-600 hover:bg-orange-50 px-8 py-4 text-lg font-semibold"
					>
						<Icon icon="mdi:book-open" class="w-5 h-5 mr-2" />
						Learn More
					</Button>
					<Button
						variant="outline"
						href="/winners"
						size="lg"
						class="border-white text-white hover:bg-orange-600 px-8 py-4 text-lg font-semibold"
					>
						<Icon icon="mdi:trophy" class="w-5 h-5 mr-2" />
						View Winners
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- FAQ Section -->
	<div class="py-16 sm:py-24">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center mb-16">
				<h2 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					Frequently Asked Questions
				</h2>
				<p class="mt-4 text-lg text-gray-600">
					Everything you need to know about the {tokenDisplay} lottery system
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">How are winners selected?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">
							Winners are selected using verifiable on-chain randomness. The process is transparent 
							and can be audited by anyone on the Solana blockchain.
						</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">What are the eligibility requirements?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">
							You must hold a minimum balance of {tokenDisplay} tokens in your wallet. 
							Check the current requirements on our How It Works page.
						</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">When are draws conducted?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">
							Lottery draws are conducted weekly at scheduled times. All draws are announced 
							in advance and can be tracked in real-time.
						</p>
					</CardContent>
				</Card>

				<Card class="hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">How are rewards distributed?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-600">
							SOL rewards are automatically sent to winners' wallets immediately after each draw. 
							{distributionText.replace('•', 'with')}
						</p>
					</CardContent>
				</Card>
			</div>

			<div class="mt-12 text-center">
				<p class="text-sm text-gray-500 max-w-2xl mx-auto">
					<Icon icon="mdi:information" class="inline w-4 h-4 mr-1" />
					This platform is for entertainment purposes. Please only participate with funds you can afford to lose. 
					Cryptocurrency investments carry inherent risks.
				</p>
			</div>
		</div>
	</div>
</div>