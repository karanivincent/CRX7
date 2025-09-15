<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/token';
	
	// Cache the config values
	const tokenDisplay = getTokenDisplay();
</script>

<svelte:head>
	<title>Leaderboard - Top {tokenDisplay} Chads 🏆</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🏆 HALL OF FAME 🏆
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Top <span class="text-orange-500">{tokenDisplay}</span> Chads 💎
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				These absolute legends are HODLing the most {tokenDisplay} tokens. 
				Bow down to the whale overlords 🐋<br/>
				<span class="text-sm italic opacity-75">(Rankings update faster than your ex's Instagram stories)</span>
			</p>
		</div>

		<!-- Coming Soon Card -->
		<div class="max-w-2xl mx-auto">
			<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
				<CardHeader class="text-center pb-2">
					<div class="flex justify-center mb-4">
						<Icon icon="mdi:trophy" class="h-16 w-16 text-orange-500 animate-bounce" />
					</div>
					<CardTitle class="text-2xl font-bold text-gray-900">
						Leaderboard Coming Soon™ 🚧
					</CardTitle>
					<CardDescription class="text-base text-gray-600">
						We're still building the most epic leaderboard system known to mankind
					</CardDescription>
				</CardHeader>
				<CardContent class="text-center space-y-6">
					<div class="space-y-4">
						<div class="p-4 bg-white rounded-lg border border-orange-100">
							<div class="font-semibold text-gray-900 mb-2">🥇 What's Coming:</div>
							<ul class="text-sm text-gray-600 space-y-1 text-left">
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Top {tokenDisplay} holders by bag size
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Total winnings leaderboard
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Longest diamond hands streak
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Most lottery participations
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Whale vs retail rankings
								</li>
							</ul>
						</div>

						<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
							<div class="font-semibold text-orange-800 mb-2">🎯 Why You'll Love It:</div>
							<div class="text-sm text-orange-700 text-left">
								See where you rank among the {tokenDisplay} elite. Compare your diamond hands strength 
								with other degens. Flex on your friends. Standard stuff.
							</div>
						</div>
					</div>

					<div class="flex flex-col sm:flex-row gap-4 justify-center">
						<Button 
							href="/"
							class="px-6 py-3 hover:scale-105 transition-transform"
						>
							🏠 Back to Home
						</Button>
						<Button 
							variant="outline"
							href="/past-draws"
							class="px-6 py-3 hover:scale-105 transition-transform"
						>
							📊 Check Past Draws
						</Button>
					</div>

					<div class="text-xs text-gray-500 font-mono pt-4 border-t border-orange-100">
						💡 Pro tip: The bigger your bag, the higher you'll rank. Not financial advice, just facts.
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Placeholder Stats -->
		<div class="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="text-center p-8 bg-white rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
				<div class="text-3xl font-bold text-orange-600 mb-2 animate-pulse">???</div>
				<div class="font-semibold text-gray-900">Biggest Chad</div>
				<div class="text-sm text-gray-500">Most {tokenDisplay} held</div>
			</div>
			<div class="text-center p-8 bg-white rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
				<div class="text-3xl font-bold text-orange-600 mb-2 animate-pulse">???</div>
				<div class="font-semibold text-gray-900">Luckiest Degen</div>
				<div class="text-sm text-gray-500">Most lottery wins</div>
			</div>
			<div class="text-center p-8 bg-white rounded-lg border border-orange-200 hover:shadow-lg transition-shadow">
				<div class="text-3xl font-bold text-orange-600 mb-2 animate-pulse">???</div>
				<div class="font-semibold text-gray-900">Diamond Hands</div>
				<div class="text-sm text-gray-500">Longest hold time</div>
			</div>
		</div>
	</div>
</div>