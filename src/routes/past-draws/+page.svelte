<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
</script>

<svelte:head>
	<title>Past Draws - Who Got Lucky 🎰</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🎰 DRAW HISTORY 🎰
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				Past <span class="text-orange-500">Lottery</span> Draws 📊
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				See who got blessed by the RNG gods in previous draws. 
				Witness the legends who made it to the moon 🌕<br/>
				<span class="text-sm italic opacity-75">(Your turn could be next, ser)</span>
			</p>
		</div>

		<!-- Coming Soon Card -->
		<div class="max-w-2xl mx-auto">
			<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
				<CardHeader class="text-center pb-2">
					<div class="flex justify-center mb-4">
						<Icon icon="mdi:history" class="h-16 w-16 text-orange-500 animate-spin-slow" />
					</div>
					<CardTitle class="text-2xl font-bold text-gray-900">
						Draw History Coming Soon™ 📜
					</CardTitle>
					<CardDescription class="text-base text-gray-600">
						We're building the most transparent draw archive in crypto history
					</CardDescription>
				</CardHeader>
				<CardContent class="text-center space-y-6">
					<div class="space-y-4">
						<div class="p-4 bg-white rounded-lg border border-orange-100">
							<div class="font-semibold text-gray-900 mb-2">📋 What's Coming:</div>
							<ul class="text-sm text-gray-600 space-y-1 text-left">
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Complete draw history with dates
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Winner wallet addresses (public)
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Prize amounts distributed
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Transaction hashes for verification
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Participant count per draw
								</li>
								<li class="flex items-center gap-2">
									<Icon icon="mdi:check" class="h-4 w-4 text-green-500" />
									Charity donations tracking
								</li>
							</ul>
						</div>

						<div class="p-4 bg-orange-50 rounded-lg border border-orange-200">
							<div class="font-semibold text-orange-800 mb-2">🔍 Full Transparency:</div>
							<div class="text-sm text-orange-700 text-left">
								Every draw is recorded on-chain. Every winner is verifiable. 
								Every transaction is public. No rugs, no lies, just pure transparency.
							</div>
						</div>

						<div class="p-4 bg-green-50 rounded-lg border border-green-200">
							<div class="font-semibold text-green-800 mb-2">📊 Stats You'll See:</div>
							<div class="text-sm text-green-700 text-left">
								Total SOL distributed • Average prize per winner • Biggest single win • 
								Most frequent winners • Draw participation trends
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
						🔮 First draw coming soon. History starts when the lottery begins!
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Mock Draw Preview -->
		<div class="mt-24">
			<h3 class="text-2xl font-bold text-gray-900 text-center mb-8">
				Preview: What Draw History Will Look Like 👀
			</h3>
			<div class="space-y-4">
				<Card class="border border-gray-200 opacity-50">
					<CardContent class="p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<div class="font-bold text-lg">Draw #001 🎰</div>
								<div class="text-sm text-gray-500">March 15, 2024 • 12:00 UTC</div>
							</div>
							<div class="text-right">
								<div class="font-semibold text-orange-600">50 SOL Total Prize</div>
								<div class="text-sm text-gray-500">1,337 participants</div>
							</div>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-7 gap-2">
							{#each Array(7) as _, i}
								<div class="bg-gray-100 p-3 rounded-lg text-center">
									<div class="text-xs text-gray-500 mb-1">Winner #{i + 1}</div>
									<div class="font-mono text-xs text-gray-400">Addr...Soon</div>
									<div class="text-sm font-semibold text-gray-400">? SOL</div>
								</div>
							{/each}
						</div>
					</CardContent>
				</Card>

				<div class="text-center text-gray-400 text-sm">
					<Icon icon="mdi:dots-horizontal" class="h-6 w-6 mx-auto mb-2" />
					More draws will appear here as they happen...
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.animate-spin-slow) {
		animation: spin 3s linear infinite;
	}
</style>