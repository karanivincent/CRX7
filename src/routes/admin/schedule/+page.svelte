<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import Icon from '@iconify/svelte';
	import { getTokenDisplay } from '$lib/config/client';
	import AdminLayout from '$lib/components/admin/admin-layout.svelte';
	
	export let data;
	const { user } = data;
	
	const tokenDisplay = getTokenDisplay();
	
	// Schedule data
	let selectedDate = '';
	let selectedTime = '';
	let timezone = 'UTC';
	let drawType = 'regular'; // regular or special
	let description = '';
	
	// Mock scheduled draws
	let scheduledDraws = [
		{
			id: 1,
			date: '2025-09-16',
			time: '17:00',
			timezone: 'UTC',
			type: 'regular',
			status: 'scheduled',
			description: 'Weekly draw #1'
		},
		{
			id: 2,
			date: '2025-09-23',
			time: '17:00',
			timezone: 'UTC',
			type: 'regular',
			status: 'scheduled',
			description: 'Weekly draw #2'
		}
	];
	
	function scheduleNewDraw() {
		if (!selectedDate || !selectedTime) return;
		
		const newDraw = {
			id: Date.now(),
			date: selectedDate,
			time: selectedTime,
			timezone: timezone,
			type: drawType,
			status: 'scheduled',
			description: description || `${drawType === 'regular' ? 'Weekly' : 'Special'} draw`
		};
		
		scheduledDraws = [...scheduledDraws, newDraw];
		
		// Clear form
		selectedDate = '';
		selectedTime = '';
		description = '';
	}
	
	function cancelDraw(id: number) {
		scheduledDraws = scheduledDraws.map(draw => 
			draw.id === id ? { ...draw, status: 'cancelled' } : draw
		);
	}
	
	function formatDateTime(date: string, time: string, tz: string) {
		const dateTime = new Date(`${date}T${time}`);
		return `${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ${tz}`;
	}
</script>

<svelte:head>
	<title>Schedule Draws - {tokenDisplay} Admin</title>
</svelte:head>

<AdminLayout title="Draw Scheduling" description="Set dates and times for upcoming lottery draws" {user}>

	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
		<!-- Schedule New Draw -->
		<Card class="border-2 border-orange-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:calendar-plus" class="w-5 h-5 text-orange-600" />
					Schedule New Draw
				</CardTitle>
				<CardDescription>Set up the next lottery drawing</CardDescription>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Date</label>
						<input 
							type="date" 
							bind:value={selectedDate}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
							min={new Date().toISOString().split('T')[0]}
						/>
					</div>
					
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Time</label>
						<input 
							type="time" 
							bind:value={selectedTime}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						/>
					</div>
				</div>
				
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Timezone</label>
						<select 
							bind:value={timezone}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						>
							<option value="UTC">UTC</option>
							<option value="EST">EST</option>
							<option value="PST">PST</option>
							<option value="GMT">GMT</option>
						</select>
					</div>
					
					<div class="space-y-2">
						<label class="text-sm font-medium text-gray-700">Draw Type</label>
						<select 
							bind:value={drawType}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
						>
							<option value="regular">Regular Draw</option>
							<option value="special">Special Event</option>
						</select>
					</div>
				</div>
				
				<div class="space-y-2">
					<label class="text-sm font-medium text-gray-700">Description (Optional)</label>
					<input 
						type="text" 
						bind:value={description}
						placeholder="e.g., Weekly draw #5, Special holiday draw"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
					/>
				</div>
				
				{#if selectedDate && selectedTime}
					<div class="bg-orange-50 p-3 rounded-lg">
						<div class="text-sm font-medium text-orange-800">Preview:</div>
						<div class="text-sm text-orange-700">
							Draw scheduled for {formatDateTime(selectedDate, selectedTime, timezone)}
						</div>
					</div>
				{/if}
				
				<Button 
					on:click={scheduleNewDraw}
					disabled={!selectedDate || !selectedTime}
					class="w-full"
				>
					<Icon icon="mdi:calendar-plus" class="mr-2 h-4 w-4" />
					Schedule Draw
				</Button>
			</CardContent>
		</Card>
		
		<!-- Current Schedule -->
		<Card class="border-2 border-blue-200">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Icon icon="mdi:calendar-clock" class="w-5 h-5 text-blue-600" />
					Upcoming Draws
				</CardTitle>
				<CardDescription>Scheduled lottery drawings</CardDescription>
			</CardHeader>
			<CardContent>
				{#if scheduledDraws.length === 0}
					<div class="text-center py-8 text-gray-500">
						<Icon icon="mdi:calendar-blank" class="w-12 h-12 mx-auto mb-2 text-gray-300" />
						<p>No draws scheduled</p>
						<p class="text-sm">Use the form to schedule your first draw</p>
					</div>
				{:else}
					<div class="space-y-3">
						{#each scheduledDraws as draw (draw.id)}
							<div class="border rounded-lg p-4 {draw.status === 'cancelled' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'}">
								<div class="flex items-center justify-between">
									<div class="flex-1">
										<div class="font-medium {draw.status === 'cancelled' ? 'text-gray-500 line-through' : 'text-gray-900'}">
											{draw.description}
										</div>
										<div class="text-sm text-gray-600">
											{formatDateTime(draw.date, draw.time, draw.timezone)}
										</div>
										<div class="flex items-center gap-2 mt-1">
											{#if draw.type === 'special'}
												<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
													<Icon icon="mdi:star" class="w-3 h-3 mr-1" />
													Special
												</span>
											{/if}
											<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium 
												{draw.status === 'scheduled' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
												{draw.status === 'scheduled' ? 'Scheduled' : 'Cancelled'}
											</span>
										</div>
									</div>
									{#if draw.status === 'scheduled'}
										<div class="flex items-center gap-2">
											<Button variant="outline" size="sm" on:click={() => cancelDraw(draw.id)}>
												<Icon icon="mdi:cancel" class="w-4 h-4" />
											</Button>
										</div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
	
	<!-- Quick Actions -->
	<div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
		<Card class="border-2 border-green-200">
			<CardContent class="p-4 text-center">
				<Icon icon="mdi:calendar-today" class="w-8 h-8 mx-auto mb-2 text-green-600" />
				<div class="font-medium text-gray-900">Quick Schedule</div>
				<div class="text-sm text-gray-600 mb-3">Schedule for this Sunday 5PM UTC</div>
				<Button variant="outline" size="sm" class="w-full">
					Schedule Now
				</Button>
			</CardContent>
		</Card>
		
		<Card class="border-2 border-purple-200">
			<CardContent class="p-4 text-center">
				<Icon icon="mdi:repeat" class="w-8 h-8 mx-auto mb-2 text-purple-600" />
				<div class="font-medium text-gray-900">Recurring</div>
				<div class="text-sm text-gray-600 mb-3">Set up weekly recurring draws</div>
				<Button variant="outline" size="sm" class="w-full" disabled>
					Coming Soon
				</Button>
			</CardContent>
		</Card>
		
		<Card class="border-2 border-yellow-200">
			<CardContent class="p-4 text-center">
				<Icon icon="mdi:clock-alert" class="w-8 h-8 mx-auto mb-2 text-yellow-600" />
				<div class="font-medium text-gray-900">Notifications</div>
				<div class="text-sm text-gray-600 mb-3">Set reminder alerts</div>
				<Button variant="outline" size="sm" class="w-full" disabled>
					Configure
				</Button>
			</CardContent>
		</Card>
	</div>
</AdminLayout>