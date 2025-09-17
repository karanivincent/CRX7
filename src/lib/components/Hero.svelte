<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card/index';
	import Logo from '$lib/components/ui/logo.svelte';
</script>

<div>
	<Card.Root class="mx-auto max-w-md">
		<Card.Header>
			<Card.Title class="text-center">
				<div class="flex items-center justify-center mb-4">
					<Logo size="xl" showText={true} />
				</div>
				<div class="text-lg font-medium text-gray-600">Admin Login Portal</div>
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<Button href="/auth/login" class="group/loginButton w-full">
				<div class="flex items-center gap-2">
					<div>Login</div>
					<Icon
						icon="mdi:login"
						class="h-5 w-5 transition-all duration-300 md:group-hover/loginButton:translate-x-1"
					/>
				</div>
			</Button>
		</Card.Content>
	</Card.Root>
</div>
