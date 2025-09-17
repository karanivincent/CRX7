<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { getDistributionText, getLotteryDescription, getTokenDisplay } from '$lib/config/client';

	// Use client-safe defaults
	const tokenDisplay = getTokenDisplay();
	const distributionText = getDistributionText();
	const lotteryDescription = getLotteryDescription();
	// Jupiter URL placeholder for now
	const jupiterUrl = `https://jup.ag/swap/SOL-CRX7`;
</script>

<svelte:head>
	<title>CRx7 - Where {tokenDisplay} HOLDERS GET LUCKY 🏃‍♂️💰</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<!-- Hero Section -->
	<div class="relative overflow-hidden bg-white">
		<div class="mx-auto max-w-7xl px-6 pb-32 pt-36 sm:pt-60 lg:px-8 lg:pt-32">
			<div class="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
				<div class="w-full max-w-xl lg:shrink-0 xl:max-w-2xl">
					<div class="mb-4 animate-bounce text-sm font-semibold text-orange-600">
						🏃‍♂️ RUN TO RICHES 🏃‍♂️
					</div>
					<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
						CRx7: Where <span class="text-orange-500">{tokenDisplay}</span> HOLDERS GET
						<span class="animate-pulse text-orange-500">LUCKY</span> 💰
					</h1>
					<p class="relative mt-6 text-lg leading-8 text-gray-600 sm:max-w-md lg:max-w-none">
						Much lottery. Such rewards. Very lucky. Wow. 🎰<br />
						Diamond hands {tokenDisplay} holders get weekly chances to moon 🌕<br />
						<span class="text-sm italic opacity-75"
							>(This is not financial advice, just vibes ✨)</span
						>
					</p>
					<div class="mt-10 flex items-center gap-x-6">
						<Button
							href="/past-draws"
							class="px-8 py-3 text-lg font-bold transition-transform hover:scale-105"
						>
							See Who Got REKT (In a Good Way) 💸
						</Button>
						<Button
							variant="outline"
							href="/how-it-works"
							class="px-8 py-3 transition-transform hover:scale-105"
						>
							How to Get Rich 📈<br /><span class="text-xs">(Not Financial Advice)</span>
						</Button>
					</div>
					<div class="mt-6 text-sm text-gray-500">
						💎🙌 Diamond hands holders only • Probably nothing... or probably EVERYTHING 👀
					</div>
				</div>
				<div
					class="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0"
				>
					<div
						class="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80"
					>
						<div class="relative">
							<div
								class="aspect-[2/3] w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 object-cover shadow-lg"
							></div>
						</div>
					</div>
					<div class="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
						<div class="relative">
							<div
								class="aspect-[2/3] w-full rounded-xl bg-gradient-to-b from-orange-400 to-orange-500 object-cover shadow-lg"
							></div>
						</div>
						<div class="relative">
							<div
								class="aspect-[2/3] w-full rounded-xl bg-gradient-to-b from-orange-300 to-orange-400 object-cover shadow-lg"
							></div>
						</div>
					</div>
					<div class="w-44 flex-none space-y-8 pt-32 sm:pt-0">
						<div class="relative">
							<div
								class="aspect-[2/3] w-full rounded-xl bg-gradient-to-b from-orange-600 to-orange-700 object-cover shadow-lg"
							></div>
						</div>
						<div class="relative">
							<div
								class="aspect-[2/3] w-full rounded-xl bg-gradient-to-b from-orange-500 to-orange-600 object-cover shadow-lg"
							></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- How it Works Section -->
	<div class="py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mx-auto max-w-2xl lg:text-center">
				<h2 class="text-base font-semibold leading-7 text-orange-600">🚀 STONKS ONLY GO UP 🚀</h2>
				<p class="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
					How to Get Rich 📈<br />
					<span class="text-lg font-normal text-gray-600">(Still not financial advice, ser)</span>
				</p>
				<p class="mt-6 text-lg leading-8 text-gray-600">
					Sir, this is basically a Wendy's... but also a lottery 🍔🎰<br />
					Hold {tokenDisplay}, get picked by our RNG gods, receive SOL, achieve enlightenment ✨
				</p>
			</div>
			<div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
				<dl
					class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-3 lg:gap-y-16"
				>
					<div class="relative pl-16 transition-transform hover:scale-105">
						<dt class="text-base font-semibold leading-7 text-gray-900">
							<div
								class="absolute left-0 top-0 flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"
							>
								<span class="text-2xl text-white">💼</span>
							</div>
							1. HODL {tokenDisplay} Like a Chad 💎🙌
						</dt>
						<dd class="mt-2 text-base leading-7 text-gray-600">
							Bag some {tokenDisplay} tokens and HODL them in your wallet like the degen you are.
							<br /><span class="text-sm font-semibold text-orange-600"
								>More tokens = more chances = more tendies</span
							>
						</dd>
					</div>
					<div class="relative pl-16 transition-transform hover:scale-105">
						<dt class="text-base font-semibold leading-7 text-gray-900">
							<div
								class="absolute left-0 top-0 flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"
							>
								<span class="text-2xl text-white">🎲</span>
							</div>
							2. RNG Gods Choose 7 Lucky Degens 🎲
						</dt>
						<dd class="mt-2 text-base leading-7 text-gray-600">
							Our totally-not-rigged™ lottery system picks 7 random {tokenDisplay} chads every week.
							<br /><span class="text-sm font-semibold text-orange-600"
								>Trust the process, trust the algorithm 🤖</span
							>
						</dd>
					</div>
					<div class="relative pl-16 transition-transform hover:scale-105">
						<dt class="text-base font-semibold leading-7 text-gray-900">
							<div
								class="absolute left-0 top-0 flex h-12 w-12 animate-pulse items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-orange-600"
							>
								<span class="text-2xl text-white">🏆</span>
							</div>
							3. Receive SOL, Achieve Nirvana 🏆
						</dt>
						<dd class="mt-2 text-base leading-7 text-gray-600">
							Winners get SOL straight to their wallets. No rugs, no waiting, just pure dopamine.
							<br /><span class="text-sm font-semibold text-orange-600"
								>{distributionText} (we're not animals)</span
							>
						</dd>
					</div>
				</dl>
			</div>
			<div class="mt-16 text-center">
				<p class="font-mono text-sm text-gray-500">
					⚠️ Warning: May cause excessive happiness, FOMO, and sudden urges to buy more {tokenDisplay}
					⚠️
				</p>
			</div>
		</div>
	</div>

	<!-- Stats Section -->
	<div class="border-y-2 border-orange-200 bg-white py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">Big Numbers That Matter 🚀</h2>
				<p class="text-gray-600">Number go up, happiness go up, simple as that 📈</p>
			</div>
			<dl class="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-3">
				<div class="mx-auto flex max-w-xs flex-col gap-y-4 transition-transform hover:scale-110">
					<dt class="text-base font-semibold leading-7 text-gray-600">SOL Sent to Degens 💸</dt>
					<dd class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
						<span class="animate-pulse text-orange-600">0</span> SOL
					</dd>
					<div class="font-mono text-xs text-gray-500">(Soon™ to be many SOL)</div>
				</div>
				<div class="mx-auto flex max-w-xs flex-col gap-y-4 transition-transform hover:scale-110">
					<dt class="text-base font-semibold leading-7 text-gray-600">Lucky Chads 🏆</dt>
					<dd class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
						<span class="animate-pulse text-orange-600">0</span> Winners
					</dd>
					<div class="font-mono text-xs text-gray-500">(Could be you next, ser)</div>
				</div>
				<div class="mx-auto flex max-w-xs flex-col gap-y-4 transition-transform hover:scale-110">
					<dt class="text-base font-semibold leading-7 text-gray-600">Lottery Rounds 🎰</dt>
					<dd class="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
						<span class="animate-pulse text-orange-600">0</span> Draws
					</dd>
					<div class="font-mono text-xs text-gray-500">(But who's counting? We are.)</div>
				</div>
			</dl>
			<div class="mt-16 text-center">
				<div
					class="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2"
				>
					<span class="animate-bounce text-orange-500">🔥</span>
					<span class="text-sm font-semibold text-orange-800"
						>Stats update in real-time (or close to it) 🔥</span
					>
					<span class="animate-bounce text-orange-500">🔥</span>
				</div>
			</div>
		</div>
	</div>

	<!-- CTA Section -->
	<div
		class="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600"
	>
		<div class="absolute inset-0 bg-black opacity-10"></div>
		<div class="relative px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
			<div class="mx-auto max-w-3xl text-center">
				<div class="mb-6 animate-bounce text-lg font-bold text-orange-100">
					🚨 LAST CHANCE TO MAKE IT 🚨
				</div>
				<h2 class="text-4xl font-bold tracking-tight text-white sm:text-5xl">
					Wen Lambo? <span class="text-orange-200">WEN NOW!</span> 🏎️💨
				</h2>
				<p class="mx-auto mt-6 max-w-2xl text-xl leading-8 text-orange-100">
					Join the degen army of {tokenDisplay} chads and get your tickets to the moon 🎫🌕<br />
					<span class="text-base italic opacity-75"
						>This could literally be the play that changes everything... or not. DYOR, ser. 📚</span
					>
				</p>
				<div class="mt-12 flex flex-col items-center justify-center gap-6 sm:flex-row">
					<Button
						variant="secondary"
						href={jupiterUrl}
						class="bg-white px-8 py-4 text-lg font-bold text-orange-600 shadow-lg transition-all hover:scale-110 hover:bg-orange-50"
					>
						🛒 Get Your Tickets to the Moon 🌕
					</Button>
					<Button
						variant="ghost"
						href="/how-it-works"
						class="border-2 border-white px-8 py-4 text-lg text-white transition-all hover:scale-105 hover:bg-orange-700"
					>
						Study the Playbook 📚<span aria-hidden="true" class="ml-2">→</span>
					</Button>
				</div>

				<!-- History Links -->
				<div class="mt-8 flex flex-wrap justify-center gap-4">
					<Button
						variant="ghost"
						href="/past-draws"
						size="sm"
						class="border border-orange-300 text-orange-200 hover:bg-orange-700 hover:text-white"
					>
						📊 View Draw History
					</Button>
					<Button
						variant="ghost"
						href="/winners"
						size="sm"
						class="border border-orange-300 text-orange-200 hover:bg-orange-700 hover:text-white"
					>
						🏆 See All Winners
					</Button>
				</div>
				<div class="mt-8 flex flex-wrap justify-center gap-4 text-sm text-orange-200">
					<span class="flex items-center gap-1">
						<span class="text-green-300">✅</span>
						No rugs here, ser
					</span>
					<span class="flex items-center gap-1">
						<span class="text-green-300">✅</span>
						100% transparent draws
					</span>
					<span class="flex items-center gap-1">
						<span class="text-green-300">✅</span>
						Diamond hands only 💎
					</span>
				</div>
				<div class="mt-6 font-mono text-xs text-orange-200 opacity-75">
					⚠️ Gambling can be addictive. Only risk what you can afford to lose. Stay based, stay
					safe. ⚠️
				</div>
			</div>
		</div>
	</div>

	<!-- Meme FAQ Section -->
	<div class="bg-gray-50 py-24">
		<div class="mx-auto max-w-4xl px-6 lg:px-8">
			<div class="mb-16 text-center">
				<h2 class="mb-4 text-3xl font-bold text-gray-900">FAQ for Smooth Brains 🧠</h2>
				<p class="text-gray-600">The questions you didn't know you needed to ask</p>
			</div>
			<div class="grid gap-8 md:grid-cols-2">
				<div
					class="rounded-lg border border-orange-200 bg-white p-6 transition-shadow hover:shadow-lg"
				>
					<div class="mb-2 font-bold text-gray-900">Q: Wen moon? 🌕</div>
					<div class="text-gray-600">
						A: Every week when the lottery hits, ser. That's literally 52 chances per year to make
						it.
					</div>
				</div>
				<div
					class="rounded-lg border border-orange-200 bg-white p-6 transition-shadow hover:shadow-lg"
				>
					<div class="mb-2 font-bold text-gray-900">Q: Is this a rugpull? 🧽</div>
					<div class="text-gray-600">
						A: Only pulling rugs to vacuum, fren. Everything's on-chain and transparent as your
						mom's cooking.
					</div>
				</div>
				<div
					class="rounded-lg border border-orange-200 bg-white p-6 transition-shadow hover:shadow-lg"
				>
					<div class="mb-2 font-bold text-gray-900">Q: What if I don't win? 😢</div>
					<div class="text-gray-600">
						A: Then you're still a {tokenDisplay} champion and get to try again next week. Plus you're
						helping build the prize pool for other degens.
					</div>
				</div>
				<div
					class="rounded-lg border border-orange-200 bg-white p-6 transition-shadow hover:shadow-lg"
				>
					<div class="mb-2 font-bold text-gray-900">
						Q: How much {tokenDisplay} should I buy? 💰
					</div>
					<div class="text-gray-600">
						A: Sir, this is a Wendy's, not financial advice. Only invest what you can afford to lose
						while eating ramen.
					</div>
				</div>
			</div>
			<div class="mt-12 text-center">
				<div
					class="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-orange-700"
				>
					<span>💬</span>
					Join the degen army on Discord (Coming Soon™)
				</div>
			</div>
		</div>
	</div>
</div>
