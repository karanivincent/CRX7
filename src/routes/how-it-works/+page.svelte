<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay, getDistributionText, getLotteryDescription } from '$lib/config/client';
	
	// Cache the config values
	const tokenDisplay = getTokenDisplay();
	const distributionText = getDistributionText();
	const lotteryDescription = getLotteryDescription();
</script>

<svelte:head>
	<title>How It Works - {tokenDisplay} Lottery Guide 📖</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				📖 LOTTERY GUIDE 📖
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				How The <span class="text-orange-500">{tokenDisplay}</span> Lottery Works 🎲
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				Simple, fair, transparent. Hold {tokenDisplay} tokens, get a chance to win SOL. 
				No complex rules, no hidden fees, just pure lottery magic ✨
			</p>
		</div>

		<!-- How It Works Steps -->
		<div class="space-y-8 mb-16">
			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Step 1 -->
				<Card class="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
					<CardHeader class="text-center">
						<div class="flex justify-center mb-4">
							<div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
								1
							</div>
						</div>
						<CardTitle class="text-xl">Hold {tokenDisplay} Tokens 💎</CardTitle>
					</CardHeader>
					<CardContent class="text-center">
						<p class="text-gray-600">
							Buy and hold {tokenDisplay} tokens in your wallet. 
							The more you hold, the more entries you get!
						</p>
					</CardContent>
				</Card>

				<!-- Step 2 -->
				<Card class="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
					<CardHeader class="text-center">
						<div class="flex justify-center mb-4">
							<div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
								2
							</div>
						</div>
						<CardTitle class="text-xl">Weekly Draws 🎰</CardTitle>
					</CardHeader>
					<CardContent class="text-center">
						<p class="text-gray-600">
							Every week, 7 random {tokenDisplay} holders are selected 
							to win SOL rewards automatically!
						</p>
					</CardContent>
				</Card>

				<!-- Step 3 -->
				<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
					<CardHeader class="text-center">
						<div class="flex justify-center mb-4">
							<div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
								3
							</div>
						</div>
						<CardTitle class="text-xl">Get Paid! 💰</CardTitle>
					</CardHeader>
					<CardContent class="text-center">
						<p class="text-gray-600">
							Winners receive SOL directly to their wallets. 
							No claiming, no hassle - just automatic riches!
						</p>
					</CardContent>
				</Card>
			</div>
		</div>

		<!-- Lottery Details -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
			<!-- Lottery Rules -->
			<Card class="border-2 border-purple-200">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Icon icon="mdi:gavel" class="h-6 w-6 text-purple-500" />
						Lottery Rules 📜
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="space-y-3">
						<div class="flex items-start gap-3">
							<Icon icon="mdi:clock" class="h-5 w-5 text-blue-500 mt-1" />
							<div>
								<div class="font-semibold">Weekly Draws</div>
								<div class="text-sm text-gray-600">{lotteryDescription}</div>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Icon icon="mdi:account-multiple" class="h-5 w-5 text-green-500 mt-1" />
							<div>
								<div class="font-semibold">Eligibility</div>
								<div class="text-sm text-gray-600">Must hold {tokenDisplay} tokens in your wallet during draw time</div>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Icon icon="mdi:shuffle" class="h-5 w-5 text-orange-500 mt-1" />
							<div>
								<div class="font-semibold">Selection</div>
								<div class="text-sm text-gray-600">Random selection weighted by token holdings</div>
							</div>
						</div>
						<div class="flex items-start gap-3">
							<Icon icon="mdi:cash" class="h-5 w-5 text-purple-500 mt-1" />
							<div>
								<div class="font-semibold">Payouts</div>
								<div class="text-sm text-gray-600">Automatic SOL distribution to winner wallets</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Prize Distribution -->
			<Card class="border-2 border-green-200">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Icon icon="mdi:chart-pie" class="h-6 w-6 text-green-500" />
						Prize Distribution 💰
					</CardTitle>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="text-sm text-gray-600 mb-4">
						{distributionText}
					</div>
					<div class="space-y-3">
						<div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
							<span class="font-semibold text-green-800">🏆 Winners</span>
							<span class="text-green-600 font-bold">50%</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
							<span class="font-semibold text-blue-800">🔄 Future Rounds</span>
							<span class="text-blue-600 font-bold">40%</span>
						</div>
						<div class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
							<span class="font-semibold text-purple-800">❤️ Charity</span>
							<span class="text-purple-600 font-bold">10%</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- FAQ Section -->
		<Card class="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white">
			<CardHeader>
				<CardTitle class="text-center">Frequently Asked Questions 🤔</CardTitle>
			</CardHeader>
			<CardContent class="space-y-6">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
					<div>
						<div class="font-semibold mb-2">Q: How do I enter the lottery?</div>
						<div class="text-sm text-gray-600">A: Just hold {tokenDisplay} tokens in your wallet. No manual entry required!</div>
					</div>
					<div>
						<div class="font-semibold mb-2">Q: When are draws held?</div>
						<div class="text-sm text-gray-600">A: Every week at a randomly selected time to ensure fairness.</div>
					</div>
					<div>
						<div class="font-semibold mb-2">Q: How do I claim winnings?</div>
						<div class="text-sm text-gray-600">A: You don't! SOL is automatically sent to your wallet.</div>
					</div>
					<div>
						<div class="font-semibold mb-2">Q: Are the draws fair?</div>
						<div class="text-sm text-gray-600">A: 100% transparent and verifiable on-chain. No manipulation possible!</div>
					</div>
				</div>

				<div class="text-center pt-6 border-t border-yellow-200">
					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button href="/" class="px-6 py-3">
							🏠 Back to Home
						</Button>
						<Button href="/past-draws" variant="outline" class="px-6 py-3">
							📊 View Past Draws
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>