<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	
	export let data;
	const { userProfile } = data;
	
	// Cache config values
	const tokenDisplay = getTokenDisplay();
</script>

<svelte:head>
	<title>Admin Dashboard - {tokenDisplay} Lottery</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
	<div class="mx-auto max-w-7xl px-6 py-24 lg:px-8">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="mb-4 text-sm font-semibold text-orange-600 animate-bounce">
				🛠️ ADMIN PANEL 🛠️
			</div>
			<h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
				{tokenDisplay} <span class="text-orange-500">Admin</span> Dashboard 🎛️
			</h1>
			<p class="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
				Welcome back, {userProfile.email || 'Admin'}! 
				Control the lottery, manage draws, and watch the magic happen 🪄
			</p>
		</div>

		<!-- Quick Stats -->
		<div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
			<Card class="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-white">
				<CardContent class="p-6 text-center">
					<div class="text-2xl font-bold text-orange-600 mb-2">0</div>
					<div class="text-sm font-medium text-gray-700">Active Holders</div>
				</CardContent>
			</Card>
			<Card class="border-2 border-green-200 bg-gradient-to-r from-green-50 to-white">
				<CardContent class="p-6 text-center">
					<div class="text-2xl font-bold text-green-600 mb-2">0 SOL</div>
					<div class="text-sm font-medium text-gray-700">Prize Pool</div>
				</CardContent>
			</Card>
			<Card class="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white">
				<CardContent class="p-6 text-center">
					<div class="text-2xl font-bold text-blue-600 mb-2">0</div>
					<div class="text-sm font-medium text-gray-700">Total Draws</div>
				</CardContent>
			</Card>
			<Card class="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-white">
				<CardContent class="p-6 text-center">
					<div class="text-2xl font-bold text-purple-600 mb-2">0</div>
					<div class="text-sm font-medium text-gray-700">Total Winners</div>
				</CardContent>
			</Card>
		</div>

		<!-- Admin Actions -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Lottery Management -->
			<Card class="border-2 border-orange-200">
				<CardHeader>
					<div class="flex items-center gap-3">
						<Icon icon="mdi:dice-6" class="h-8 w-8 text-orange-500" />
						<div>
							<CardTitle>Lottery Management 🎲</CardTitle>
							<CardDescription>Run draws and manage the lottery system</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button class="w-full" disabled>
						<Icon icon="mdi:play" class="mr-2 h-4 w-4" />
						Run Weekly Draw (Coming Soon)
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:history" class="mr-2 h-4 w-4" />
						View Draw History
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:cog" class="mr-2 h-4 w-4" />
						Lottery Settings
					</Button>
				</CardContent>
			</Card>

			<!-- Token Holder Management -->
			<Card class="border-2 border-blue-200">
				<CardHeader>
					<div class="flex items-center gap-3">
						<Icon icon="mdi:account-group" class="h-8 w-8 text-blue-500" />
						<div>
							<CardTitle>Token Holders 👥</CardTitle>
							<CardDescription>Monitor and manage {tokenDisplay} holders</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button href="/test-holders" variant="outline" class="w-full">
						<Icon icon="mdi:eye" class="mr-2 h-4 w-4" />
						View Current Holders
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:refresh" class="mr-2 h-4 w-4" />
						Refresh Holder Data
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:download" class="mr-2 h-4 w-4" />
						Export Holder List
					</Button>
				</CardContent>
			</Card>

			<!-- Financial Management -->
			<Card class="border-2 border-green-200">
				<CardHeader>
					<div class="flex items-center gap-3">
						<Icon icon="mdi:currency-usd" class="h-8 w-8 text-green-500" />
						<div>
							<CardTitle>Financial Management 💰</CardTitle>
							<CardDescription>Manage SOL distribution and charity funds</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:wallet" class="mr-2 h-4 w-4" />
						Check Wallet Balances
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:heart" class="mr-2 h-4 w-4" />
						Charity Donations
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:chart-line" class="mr-2 h-4 w-4" />
						Financial Reports
					</Button>
				</CardContent>
			</Card>

			<!-- System Monitoring -->
			<Card class="border-2 border-purple-200">
				<CardHeader>
					<div class="flex items-center gap-3">
						<Icon icon="mdi:monitor-dashboard" class="h-8 w-8 text-purple-500" />
						<div>
							<CardTitle>System Monitoring 📊</CardTitle>
							<CardDescription>Monitor app health and performance</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:server" class="mr-2 h-4 w-4" />
						System Health
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:bug" class="mr-2 h-4 w-4" />
						Error Logs
					</Button>
					<Button variant="outline" class="w-full" disabled>
						<Icon icon="mdi:backup-restore" class="mr-2 h-4 w-4" />
						Database Backup
					</Button>
				</CardContent>
			</Card>
		</div>

		<!-- Development Status -->
		<Card class="mt-12 border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white">
			<CardHeader>
				<CardTitle class="text-center">🚧 Development Status 🚧</CardTitle>
			</CardHeader>
			<CardContent>
				<div class="text-center space-y-4">
					<p class="text-gray-600">
						This admin dashboard is currently in development. Most features are placeholders 
						that will be implemented as we build out the lottery system.
					</p>
					<div class="flex justify-center gap-4">
						<Button href="/" variant="outline">
							🏠 Back to Home
						</Button>
						<Button href="/auth/logout" variant="ghost">
							🚪 Logout
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>
</div>