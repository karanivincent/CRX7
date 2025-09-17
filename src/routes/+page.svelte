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
		`${data.tokenConfig.distribution.winnersPercentage}% to winners • ${data.tokenConfig.distribution.holdingPercentage}% to team • ${data.tokenConfig.distribution.charityPercentage}% to charity` :
		'50% to winners • 40% to team • 10% to charity';

	// Stats data
	let stats: any = {};
	let statsLoading = true;
	let mounted = false;

	onMount(async () => {
		mounted = true;
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

	function animateCounter(node: HTMLElement, { target, duration = 2000 }: { target: number; duration?: number }) {
		if (!mounted) return { duration: 0 };
		
		return {
			duration,
			tick: (t: number) => {
				const value = Math.floor(t * target);
				node.textContent = target >= 1000 ? formatSOL(value) : value.toString();
			}
		};
	}
</script>

<svelte:head>
	<title>{tokenDisplay} - Daily & Weekly SOL Rewards for Token Holders</title>
	<meta name="description" content="Daily draws and weekly mega rewards for {tokenDisplay} token holders. Transparent, on-chain lottery with {winnersPerDraw} winners per draw." />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50 relative overflow-hidden">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<!-- Floating Particles -->
		<div class="absolute top-20 left-10 w-4 h-4 bg-orange-400 rounded-full opacity-20 animate-float"></div>
		<div class="absolute top-40 right-20 w-3 h-3 bg-purple-400 rounded-full opacity-30 animate-float-delay-1"></div>
		<div class="absolute top-60 left-1/3 w-2 h-2 bg-blue-400 rounded-full opacity-25 animate-float-delay-2"></div>
		<div class="absolute bottom-40 right-10 w-5 h-5 bg-emerald-400 rounded-full opacity-20 animate-float"></div>
		<div class="absolute bottom-20 left-20 w-3 h-3 bg-pink-400 rounded-full opacity-30 animate-float-delay-1"></div>
		
		<!-- Gradient Orbs -->
		<div class="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-400 to-pink-400 rounded-full opacity-10 animate-pulse"></div>
		<div class="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-purple-400 to-blue-400 rounded-full opacity-10 animate-pulse-delay"></div>
	</div>

	<!-- Hero Section -->
	<div class="relative">
		<div class="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:pb-32 lg:px-8 lg:pt-24">
			<div class="mx-auto max-w-2xl text-center lg:max-w-5xl">
				<!-- Trust Badge with Glow -->
				<div class="mb-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-100 to-purple-100 px-6 py-3 text-sm font-semibold text-orange-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
					<Icon icon="mdi:shield-check" class="w-4 h-4 animate-pulse" />
					<span class="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
						Transparent • On-Chain • Provably Fair
					</span>
				</div>
				
				<!-- Hero Title with Gradient -->
				<h1 class="text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl xl:text-8xl">
					<span class="bg-gradient-to-r from-orange-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
						Daily Draws
					</span>
					<br />
					<span class="text-gray-900">& Weekly</span>
					<br />
					<span class="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
						MEGA Rewards
					</span>
					<br />
					<span class="text-2xl sm:text-3xl lg:text-4xl text-gray-700 font-medium">
						for <span class="text-orange-600 font-bold">{tokenDisplay}</span> Holders
					</span>
				</h1>
				
				<!-- Hero Subtitle -->
				<p class="mt-8 text-xl sm:text-2xl leading-relaxed text-gray-600 max-w-4xl mx-auto">
					Hold {tokenDisplay} tokens and automatically qualify for 
					<span class="font-bold text-orange-600">daily SOL draws</span> 
					plus explosive 
					<span class="font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">weekly mega jackpots</span>. 
					{winnersPerDraw} winners selected fairly through transparent, on-chain lottery system.
				</p>

				<!-- CTA Buttons with Enhanced Styling -->
				<div class="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
					<Button
						href="/how-it-works"
						size="lg"
						class="group px-10 py-6 text-xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transform hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl"
					>
						<Icon icon="mdi:information-outline" class="w-6 h-6 mr-3 group-hover:animate-spin" />
						Discover How It Works
						<Icon icon="mdi:arrow-right" class="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
					</Button>
					<Button
						variant="outline"
						href="/past-draws"
						size="lg"
						class="group px-10 py-6 text-xl font-bold border-2 border-purple-500 text-purple-600 hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
					>
						<Icon icon="mdi:trophy" class="w-6 h-6 mr-3 group-hover:animate-bounce" />
						See Winners
					</Button>
				</div>

				<!-- Enhanced Trust Indicators -->
				<div class="mt-16 flex flex-wrap justify-center gap-8 text-sm">
					<div class="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
						<Icon icon="mdi:blockchain" class="w-5 h-5 text-green-600 animate-pulse" />
						<span class="font-semibold text-green-700">100% On-Chain</span>
					</div>
					<div class="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
						<Icon icon="mdi:eye" class="w-5 h-5 text-blue-600 animate-pulse" />
						<span class="font-semibold text-blue-700">Fully Transparent</span>
					</div>
					<div class="flex items-center gap-3 bg-white/50 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
						<Icon icon="mdi:scale-balance" class="w-5 h-5 text-purple-600 animate-pulse" />
						<span class="font-semibold text-purple-700">Provably Fair</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Stats Section with Animations -->
	<div class="py-20 sm:py-28 bg-white/30 backdrop-blur-sm">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl text-center mb-20">
				<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-6">
					<span class="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
						Live Platform Stats
					</span>
				</h2>
				<p class="text-xl text-gray-600">
					Real-time data from our transparent lottery ecosystem
				</p>
			</div>

			{#if statsLoading}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					{#each Array(3) as _}
						<div class="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-8 shadow-xl animate-pulse">
							<div class="h-16 bg-gray-200 rounded-lg mb-4"></div>
							<div class="h-8 bg-gray-200 rounded mb-2"></div>
							<div class="h-4 bg-gray-200 rounded w-3/4"></div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
					<!-- Total Distributed -->
					<div class="group bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-emerald-200">
						<div class="text-center">
							<div class="mb-4">
								<Icon icon="mdi:currency-usd" class="w-12 h-12 text-emerald-600 mx-auto group-hover:animate-spin" />
							</div>
							<div class="text-5xl font-black text-emerald-600 mb-2" use:animateCounter={{ target: stats.totalDistributed || 0 }}>
								{formatSOL(stats.totalDistributed || 0)}
							</div>
							<div class="text-lg font-bold text-emerald-800 mb-2">SOL Distributed</div>
							<p class="text-sm text-emerald-700">Lifetime rewards to {tokenDisplay} holders</p>
						</div>
					</div>

					<!-- Total Winners -->
					<div class="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-blue-200">
						<div class="text-center">
							<div class="mb-4">
								<Icon icon="mdi:account-group" class="w-12 h-12 text-blue-600 mx-auto group-hover:animate-bounce" />
							</div>
							<div class="text-5xl font-black text-blue-600 mb-2" use:animateCounter={{ target: stats.totalWinners || 0 }}>
								{stats.totalWinners || 0}
							</div>
							<div class="text-lg font-bold text-blue-800 mb-2">Lucky Winners</div>
							<p class="text-sm text-blue-700">Champions who received rewards</p>
						</div>
					</div>

					<!-- Total Rounds -->
					<div class="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-purple-200">
						<div class="text-center">
							<div class="mb-4">
								<Icon icon="mdi:dice-multiple" class="w-12 h-12 text-purple-600 mx-auto group-hover:animate-pulse" />
							</div>
							<div class="text-5xl font-black text-purple-600 mb-2" use:animateCounter={{ target: stats.totalRounds || 0 }}>
								{stats.totalRounds || 0}
							</div>
							<div class="text-lg font-bold text-purple-800 mb-2">Completed Draws</div>
							<p class="text-sm text-purple-700">Fair and transparent lottery rounds</p>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- How It Works Section -->
	<div class="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center mb-20">
				<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-6">
					<span class="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
						Simple Process,
					</span>
					<br />
					<span class="text-gray-900">Amazing Rewards</span>
				</h2>
				<p class="text-xl text-gray-600">
					Three effortless steps to join our revolutionary dual-reward system
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
				<!-- Step 1 -->
				<div class="text-center group">
					<div class="relative mb-8">
						<div class="mx-auto w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300">
							<Icon icon="mdi:wallet" class="w-12 h-12 text-white" />
						</div>
						<div class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
					</div>
					<h3 class="text-2xl font-bold text-gray-900 mb-4">
						Hold {tokenDisplay} Tokens
					</h3>
					<p class="text-gray-600 text-lg leading-relaxed">
						Purchase and hold {tokenDisplay} tokens in your wallet. Minimum balance requirements apply for both daily draws and weekly mega rewards.
					</p>
				</div>

				<!-- Step 2 -->
				<div class="text-center group">
					<div class="relative mb-8">
						<div class="mx-auto w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300">
							<Icon icon="mdi:dice-multiple" class="w-12 h-12 text-white" />
						</div>
						<div class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
					</div>
					<h3 class="text-2xl font-bold text-gray-900 mb-4">
						Automatic Dual Entry
					</h3>
					<p class="text-gray-600 text-lg leading-relaxed">
						Qualified holders are automatically entered into daily draws AND weekly mega jackpots. No additional action required.
					</p>
				</div>

				<!-- Step 3 -->
				<div class="text-center group">
					<div class="relative mb-8">
						<div class="mx-auto w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl group-hover:shadow-2xl transform group-hover:scale-110 transition-all duration-300">
							<Icon icon="mdi:trophy" class="w-12 h-12 text-white" />
						</div>
						<div class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
					</div>
					<h3 class="text-2xl font-bold text-gray-900 mb-4">
						Win Daily & Weekly
					</h3>
					<p class="text-gray-600 text-lg leading-relaxed">
						{winnersPerDraw} daily winners plus massive weekly jackpots. SOL rewards sent directly to your wallet instantly.
					</p>
				</div>
			</div>

			<!-- Reward Distribution Info -->
			<div class="mt-16 text-center">
				<div class="inline-flex items-center gap-3 bg-gradient-to-r from-orange-100 to-purple-100 px-8 py-4 rounded-full shadow-lg">
					<Icon icon="mdi:information" class="w-6 h-6 text-orange-600" />
					<span class="text-lg font-bold text-gray-800">
						Distribution: {distributionText}
					</span>
				</div>
			</div>
		</div>
	</div>

	<!-- Reward Types Section -->
	<div class="py-20 sm:py-28 bg-gradient-to-br from-purple-50 via-white to-orange-50">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center mb-20">
				<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-6">
					<span class="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
						Dual Reward System
					</span>
				</h2>
				<p class="text-xl text-gray-600">
					Two ways to win, maximum excitement every day
				</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
				<!-- Daily Rewards -->
				<div class="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-10 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-orange-200">
					<div class="text-center">
						<div class="mb-6">
							<Icon icon="mdi:calendar-today" class="w-16 h-16 text-orange-600 mx-auto group-hover:animate-bounce" />
						</div>
						<h3 class="text-3xl font-black text-orange-600 mb-4">Daily Draws</h3>
						<p class="text-lg text-orange-800 mb-6 leading-relaxed">
							Every single day, {winnersPerDraw} lucky holders win SOL rewards. 
							Consistent opportunities to earn, building your portfolio daily.
						</p>
						<div class="bg-orange-200 rounded-2xl p-6">
							<div class="text-2xl font-bold text-orange-900 mb-2">⏰ Daily at 3 PM UTC</div>
							<div class="text-orange-800">Regular rewards, guaranteed excitement</div>
						</div>
					</div>
				</div>

				<!-- Weekly Mega Rewards -->
				<div class="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl p-10 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 border border-purple-200">
					<div class="text-center">
						<div class="mb-6">
							<Icon icon="mdi:star-four-points" class="w-16 h-16 text-purple-600 mx-auto group-hover:animate-spin" />
						</div>
						<h3 class="text-3xl font-black text-purple-600 mb-4">Weekly MEGA</h3>
						<p class="text-lg text-purple-800 mb-6 leading-relaxed">
							Explosive weekly jackpots with substantially larger rewards. 
							The grand finale that makes holding {tokenDisplay} incredibly rewarding.
						</p>
						<div class="bg-purple-200 rounded-2xl p-6">
							<div class="text-2xl font-bold text-purple-900 mb-2">🎆 Sundays 8 PM UTC</div>
							<div class="text-purple-800">Life-changing jackpot potential</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Features Section -->
	<div class="py-20 sm:py-28 bg-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center mb-20">
				<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-6">
					Why <span class="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">{tokenDisplay}</span> 
					Dominates?
				</h2>
				<p class="text-xl text-gray-600">
					Built on unshakeable principles of transparency, fairness, and explosive rewards
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
				<Card class="group border-2 border-transparent hover:border-emerald-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
					<CardHeader>
						<Icon icon="mdi:shield-check" class="w-12 h-12 text-emerald-600 mb-4 group-hover:animate-pulse" />
						<CardTitle class="text-xl font-bold text-emerald-900">Transparent & Fair</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-emerald-800">All draws conducted on-chain with verifiable randomness. Zero manipulation, pure mathematics.</p>
					</CardContent>
				</Card>

				<Card class="group border-2 border-transparent hover:border-blue-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100">
					<CardHeader>
						<Icon icon="mdi:clock-outline" class="w-12 h-12 text-blue-600 mb-4 group-hover:animate-spin" />
						<CardTitle class="text-xl font-bold text-blue-900">Dual Frequency</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-blue-800">Daily consistency meets weekly explosions. Never wait long for your next chance to win big.</p>
					</CardContent>
				</Card>

				<Card class="group border-2 border-transparent hover:border-purple-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-purple-50 to-purple-100">
					<CardHeader>
						<Icon icon="mdi:account-group" class="w-12 h-12 text-purple-600 mb-4 group-hover:animate-bounce" />
						<CardTitle class="text-xl font-bold text-purple-900">Community Power</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-purple-800">Rewards flow directly back to token holders, creating sustainable value for our community.</p>
					</CardContent>
				</Card>

				<Card class="group border-2 border-transparent hover:border-orange-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-orange-50 to-orange-100">
					<CardHeader>
						<Icon icon="mdi:speed" class="w-12 h-12 text-orange-600 mb-4 group-hover:animate-pulse" />
						<CardTitle class="text-xl font-bold text-orange-900">Instant Payouts</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-orange-800">Winners receive SOL rewards instantly. No waiting, no delays, just pure excitement.</p>
					</CardContent>
				</Card>

				<Card class="group border-2 border-transparent hover:border-red-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-red-50 to-red-100">
					<CardHeader>
						<Icon icon="mdi:security" class="w-12 h-12 text-red-600 mb-4 group-hover:animate-spin" />
						<CardTitle class="text-xl font-bold text-red-900">Fort Knox Security</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-red-800">Solana blockchain security with auditable smart contracts. Your assets are protected.</p>
					</CardContent>
				</Card>

				<Card class="group border-2 border-transparent hover:border-emerald-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-emerald-50 to-emerald-100">
					<CardHeader>
						<Icon icon="mdi:chart-line" class="w-12 h-12 text-emerald-600 mb-4 group-hover:animate-bounce" />
						<CardTitle class="text-xl font-bold text-emerald-900">Growing Ecosystem</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-emerald-800">Expanding utility and partnerships multiply value for dedicated long-term holders.</p>
					</CardContent>
				</Card>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div class="relative bg-gradient-to-br from-orange-600 via-purple-600 to-pink-600 overflow-hidden">
		<!-- Background Pattern -->
		<div class="absolute inset-0 bg-black/10"></div>
		<div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
		
		<div class="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<h2 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-8">
					Ready to Win 
					<span class="text-yellow-300">Every Day?</span>
				</h2>
				<p class="mx-auto text-xl sm:text-2xl leading-relaxed text-orange-100 max-w-2xl mb-12">
					Join the {tokenDisplay} revolution. Daily opportunities, weekly explosions, lifetime rewards.
					<span class="block mt-2 text-lg font-semibold text-yellow-300">Your fortune awaits.</span>
				</p>
				<div class="flex flex-col sm:flex-row items-center justify-center gap-6">
					<Button
						variant="secondary"
						href="/how-it-works"
						size="lg"
						class="group bg-white text-purple-600 hover:bg-yellow-100 px-12 py-6 text-xl font-black shadow-2xl hover:shadow-3xl transform hover:scale-110 transition-all duration-300"
					>
						<Icon icon="mdi:book-open" class="w-6 h-6 mr-3 group-hover:animate-spin" />
						Learn The System
						<Icon icon="mdi:arrow-right" class="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
					</Button>
					<Button
						variant="outline"
						href="/winners"
						size="lg"
						class="group border-2 border-white text-white hover:bg-white hover:text-purple-600 px-12 py-6 text-xl font-black shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
					>
						<Icon icon="mdi:trophy" class="w-6 h-6 mr-3 group-hover:animate-bounce" />
						See Champions
					</Button>
				</div>
			</div>
		</div>
	</div>

	<!-- FAQ Section -->
	<div class="py-20 sm:py-28 bg-gradient-to-br from-gray-50 to-white">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-3xl text-center mb-20">
				<h2 class="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 mb-6">
					<span class="bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
						Questions?
					</span>
					<br />
					<span class="text-gray-900">We've Got Answers</span>
				</h2>
				<p class="text-xl text-gray-600">
					Everything about the {tokenDisplay} dual-reward lottery system
				</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
				<Card class="group hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-orange-50 border border-orange-200">
					<CardHeader>
						<CardTitle class="text-xl font-bold text-orange-900">How are winners selected?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-700 leading-relaxed">
							Winners selected using verifiable on-chain randomness for both daily and weekly draws. 
							100% transparent and auditable on Solana blockchain.
						</p>
					</CardContent>
				</Card>

				<Card class="group hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-purple-50 border border-purple-200">
					<CardHeader>
						<CardTitle class="text-xl font-bold text-purple-900">What's the difference between daily and weekly?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-700 leading-relaxed">
							Daily draws offer consistent smaller rewards, while weekly mega draws feature substantially larger jackpots. 
							Both are automatic for qualified holders.
						</p>
					</CardContent>
				</Card>

				<Card class="group hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-blue-50 border border-blue-200">
					<CardHeader>
						<CardTitle class="text-xl font-bold text-blue-900">What are eligibility requirements?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-700 leading-relaxed">
							Hold minimum {tokenDisplay} token balance in your wallet. 
							Same requirements for both daily and weekly draws.
						</p>
					</CardContent>
				</Card>

				<Card class="group hover:shadow-2xl transform hover:scale-105 transition-all duration-300 bg-gradient-to-br from-white to-emerald-50 border border-emerald-200">
					<CardHeader>
						<CardTitle class="text-xl font-bold text-emerald-900">When do draws happen?</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-gray-700 leading-relaxed">
							Daily draws at 3 PM UTC every day. Weekly mega draws on Sundays at 8 PM UTC. 
							All times announced and tracked publicly.
						</p>
					</CardContent>
				</Card>
			</div>

			<div class="mt-16 text-center">
				<p class="text-sm text-gray-500 max-w-3xl mx-auto leading-relaxed">
					<Icon icon="mdi:information" class="inline w-4 h-4 mr-2" />
					This platform is for entertainment. Participate responsibly with funds you can afford. 
					Cryptocurrency investments carry risks. Daily and weekly draws subject to participation requirements.
				</p>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(180deg); }
	}
	
	@keyframes float-delay-1 {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-30px) rotate(-180deg); }
	}
	
	@keyframes float-delay-2 {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-15px) rotate(90deg); }
	}
	
	@keyframes pulse-delay {
		0%, 100% { opacity: 0.1; transform: scale(1); }
		50% { opacity: 0.2; transform: scale(1.05); }
	}
	
	.animate-float {
		animation: float 6s ease-in-out infinite;
	}
	
	.animate-float-delay-1 {
		animation: float-delay-1 8s ease-in-out infinite;
	}
	
	.animate-float-delay-2 {
		animation: float-delay-2 7s ease-in-out infinite;
	}
	
	.animate-pulse-delay {
		animation: pulse-delay 4s ease-in-out infinite;
	}
</style>