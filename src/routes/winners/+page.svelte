<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	
	// Cache the config values
	const tokenDisplay = getTokenDisplay();
</script>

<svelte:head>
	<title>Winners - {tokenDisplay} Champions 🏆</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🎉 WINNER'S CIRCLE 🎉
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				{tokenDisplay} <span class="text-orange-500">Winners</span> Hall of Fame 🏆
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				Celebrate the lucky legends who struck SOL with their {tokenDisplay} bags! 
				These are the chosen ones who made it rain 🌧️💰
			</p>
		</div>

		<!-- Coming Soon Card -->
		<div class="max-w-2xl mx-auto">
			<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
				<CardHeader class="text-center pb-2">
					<div class="flex justify-center mb-4">
						<Icon icon="mdi:trophy-award" class="h-16 w-16 text-orange-500 animate-pulse" />
					</div>
					<CardTitle class="text-2xl font-bold text-gray-900">
						Winners Gallery Coming Soon™ 🎊
					</CardTitle>
					<CardDescription class="text-base text-gray-600">
						Soon you'll see every lucky winner who got blessed by the lottery gods
					</CardDescription>
				</CardHeader>
				<CardContent class="text-center space-y-6">
					<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
						<div class="font-semibold text-orange-800 mb-2">🏆 What You'll See:</div>
						<div class="text-sm text-orange-700 text-left space-y-1">
							<div class="flex items-center gap-2">
								<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
								Complete winner history with amounts won
							</div>
							<div class="flex items-center gap-2">
								<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
								Public wallet addresses for transparency
							</div>
							<div class="flex items-center gap-2">
								<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
								Transaction links for verification
							</div>
							<div class="flex items-center gap-2">
								<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
								Biggest wins and lucky streaks
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
							href="/leaderboard"
							class="px-6 py-3 hover:scale-105 transition-transform"
						>
							🏆 Check Leaderboard
						</Button>
					</div>

					<div class="text-xs text-gray-500 font-mono pt-4 border-t border-orange-100">
						🎯 First lottery draw = first winners. History starts when magic begins!
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
</div>