// Crypto meme community animals for wallet address mapping
export const CRYPTO_ANIMALS = [
	{ emoji: '🐶', name: 'DOGE', description: 'The original crypto dog' },
	{ emoji: '🐸', name: 'PEPE', description: 'Rare Pepe the Frog' },
	{ emoji: '🐱', name: 'CAT', description: 'Meme cat vibes' },
	{ emoji: '🦊', name: 'FOX', description: 'MetaMask fox energy' },
	{ emoji: '🐻', name: 'BEAR', description: 'Bear market survivor' },
	{ emoji: '🐂', name: 'BULL', description: 'Bull run champion' },
	{ emoji: '🦍', name: 'APE', description: 'Diamond hands ape' },
	{ emoji: '🐺', name: 'WOLF', description: 'Wolf of Crypto Street' },
	{ emoji: '🦁', name: 'LION', description: 'King of the jungle' },
	{ emoji: '🐸', name: 'FROG', description: 'Hopeful green candles' },
	{ emoji: '🦄', name: 'UNICORN', description: 'Mythical gains' },
	{ emoji: '🐙', name: 'OCTOPUS', description: 'Eight-armed trader' },
] as const;

export type AnimalMapping = {
	walletAddress: string;
	animal: typeof CRYPTO_ANIMALS[number];
};

/**
 * Maps wallet addresses to crypto meme animals
 * Creates consistent mapping for the same addresses
 */
export function mapWalletsToAnimals(walletAddresses: string[]): AnimalMapping[] {
	return walletAddresses.map((address, index) => ({
		walletAddress: address,
		animal: CRYPTO_ANIMALS[index % CRYPTO_ANIMALS.length]
	}));
}

/**
 * Gets a deterministic animal for a wallet address
 * Same address will always get the same animal
 */
export function getAnimalForWallet(walletAddress: string): typeof CRYPTO_ANIMALS[number] {
	// Create a simple hash from the wallet address
	let hash = 0;
	for (let i = 0; i < walletAddress.length; i++) {
		const char = walletAddress.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash; // Convert to 32-bit integer
	}
	
	const index = Math.abs(hash) % CRYPTO_ANIMALS.length;
	return CRYPTO_ANIMALS[index];
}

/**
 * Creates a shortened wallet display
 */
export function formatWalletAddress(address: string): string {
	if (!address) return '';
	return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/**
 * Gets animal emoji and name for display
 */
export function getAnimalDisplay(animal: typeof CRYPTO_ANIMALS[number]): string {
	return `${animal.emoji} ${animal.name}`;
}

/**
 * Creates a legend mapping for display
 */
export function createAnimalLegend(mappings: AnimalMapping[]): Array<{
	animal: typeof CRYPTO_ANIMALS[number];
	walletAddress: string;
	shortAddress: string;
	display: string;
}> {
	return mappings.map(mapping => ({
		animal: mapping.animal,
		walletAddress: mapping.walletAddress,
		shortAddress: formatWalletAddress(mapping.walletAddress),
		display: getAnimalDisplay(mapping.animal)
	}));
}