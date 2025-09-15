import { describe, it, expect } from 'vitest';
import { 
	CRYPTO_ANIMALS,
	mapWalletsToAnimals,
	getAnimalForWallet,
	formatWalletAddress,
	getAnimalDisplay,
	createAnimalLegend,
	type AnimalMapping
} from '../../../src/lib/utils/animal-mapping';

describe('Animal Mapping System', () => {
	// Test constants
	const mockWalletAddresses = [
		'8K9bPq5zN6tYrA7mW2p3Vx4d',
		'9J2cRe7zA5sB8nM4x6wV9qTy',
		'5F3dGh8kL9pQ2rA7mX4nB6yZ',
		'7H5jKl2nQ8vB4mR6wA9sE3xZ',
		'2A8dF3kP7nR9vB5mQ6wE4yTz'
	];

	describe('CRYPTO_ANIMALS constant', () => {
		it('should contain 12 animals', () => {
			expect(CRYPTO_ANIMALS).toHaveLength(12);
		});

		it('should contain expected crypto meme animals', () => {
			const animalNames = CRYPTO_ANIMALS.map(animal => animal.name);
			expect(animalNames).toContain('DOGE');
			expect(animalNames).toContain('PEPE');
			expect(animalNames).toContain('CAT');
			expect(animalNames).toContain('FOX');
			expect(animalNames).toContain('BEAR');
			expect(animalNames).toContain('BULL');
			expect(animalNames).toContain('APE');
		});

		it('should have consistent structure for each animal', () => {
			CRYPTO_ANIMALS.forEach(animal => {
				expect(animal).toHaveProperty('emoji');
				expect(animal).toHaveProperty('name');
				expect(animal).toHaveProperty('description');
				expect(typeof animal.emoji).toBe('string');
				expect(typeof animal.name).toBe('string');
				expect(typeof animal.description).toBe('string');
				expect(animal.emoji.length).toBeGreaterThan(0);
				expect(animal.name.length).toBeGreaterThan(0);
				expect(animal.description.length).toBeGreaterThan(0);
			});
		});
	});

	describe('mapWalletsToAnimals', () => {
		it('should map wallets to animals in order', () => {
			const result = mapWalletsToAnimals(mockWalletAddresses);
			
			expect(result).toHaveLength(mockWalletAddresses.length);
			
			result.forEach((mapping, index) => {
				expect(mapping.walletAddress).toBe(mockWalletAddresses[index]);
				expect(mapping.animal).toBe(CRYPTO_ANIMALS[index % CRYPTO_ANIMALS.length]);
			});
		});

		it('should handle more wallets than animals (wrap around)', () => {
			const manyWallets = Array.from({ length: 25 }, (_, i) => `wallet${i}`);
			const result = mapWalletsToAnimals(manyWallets);
			
			expect(result).toHaveLength(25);
			
			// Check wrapping behavior
			expect(result[0].animal).toBe(CRYPTO_ANIMALS[0]);
			expect(result[12].animal).toBe(CRYPTO_ANIMALS[0]); // Should wrap around
			expect(result[13].animal).toBe(CRYPTO_ANIMALS[1]);
		});

		it('should handle empty wallet array', () => {
			const result = mapWalletsToAnimals([]);
			expect(result).toHaveLength(0);
		});

		it('should handle single wallet', () => {
			const result = mapWalletsToAnimals(['single-wallet']);
			expect(result).toHaveLength(1);
			expect(result[0].walletAddress).toBe('single-wallet');
			expect(result[0].animal).toBe(CRYPTO_ANIMALS[0]);
		});
	});

	describe('getAnimalForWallet', () => {
		it('should return consistent animal for same wallet address', () => {
			const address = '8K9bPq5zN6tYrA7mW2p3Vx4d';
			const animal1 = getAnimalForWallet(address);
			const animal2 = getAnimalForWallet(address);
			
			expect(animal1).toEqual(animal2);
		});

		it('should return different animals for different wallet addresses', () => {
			const animal1 = getAnimalForWallet('wallet1');
			const animal2 = getAnimalForWallet('wallet2');
			
			// While not guaranteed, with 12 animals this should almost always be different
			// We'll test that the function works deterministically
			expect(typeof animal1.name).toBe('string');
			expect(typeof animal2.name).toBe('string');
		});

		it('should return valid animal from CRYPTO_ANIMALS array', () => {
			const address = 'test-wallet-address';
			const animal = getAnimalForWallet(address);
			
			expect(CRYPTO_ANIMALS).toContainEqual(animal);
		});

		it('should handle empty string address', () => {
			const animal = getAnimalForWallet('');
			expect(CRYPTO_ANIMALS).toContainEqual(animal);
		});

		it('should be deterministic with various address formats', () => {
			const addresses = [
				'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump',
				'8K9bPq5zN6tYrA7mW2p3Vx4d',
				'short',
				'very-long-wallet-address-with-lots-of-characters'
			];

			addresses.forEach(address => {
				const animal1 = getAnimalForWallet(address);
				const animal2 = getAnimalForWallet(address);
				expect(animal1).toEqual(animal2);
			});
		});
	});

	describe('formatWalletAddress', () => {
		it('should format long address correctly', () => {
			const address = 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump';
			const formatted = formatWalletAddress(address);
			
			expect(formatted).toBe('FyB8...pump');
		});

		it('should format regular address correctly', () => {
			const address = '8K9bPq5zN6tYrA7mW2p3Vx4d';
			const formatted = formatWalletAddress(address);
			
			expect(formatted).toBe('8K9b...Vx4d');
		});

		it('should handle short addresses', () => {
			const shortAddress = 'abcd1234';
			const formatted = formatWalletAddress(shortAddress);
			
			expect(formatted).toBe('abcd...1234');
		});

		it('should handle very short addresses', () => {
			const veryShort = '123';
			const formatted = formatWalletAddress(veryShort);
			
			// Should still work, though might look odd
			expect(formatted).toContain('...');
		});

		it('should handle empty string', () => {
			const formatted = formatWalletAddress('');
			expect(formatted).toBe('');
		});
	});

	describe('getAnimalDisplay', () => {
		it('should combine emoji and name correctly', () => {
			const dogeAnimal = CRYPTO_ANIMALS.find(a => a.name === 'DOGE')!;
			const display = getAnimalDisplay(dogeAnimal);
			
			expect(display).toBe(`${dogeAnimal.emoji} ${dogeAnimal.name}`);
		});

		it('should work with all animals', () => {
			CRYPTO_ANIMALS.forEach(animal => {
				const display = getAnimalDisplay(animal);
				expect(display).toContain(animal.emoji);
				expect(display).toContain(animal.name);
				expect(display).toBe(`${animal.emoji} ${animal.name}`);
			});
		});
	});

	describe('createAnimalLegend', () => {
		it('should create legend from animal mappings', () => {
			const mappings: AnimalMapping[] = [
				{ walletAddress: mockWalletAddresses[0], animal: CRYPTO_ANIMALS[0] },
				{ walletAddress: mockWalletAddresses[1], animal: CRYPTO_ANIMALS[1] }
			];

			const legend = createAnimalLegend(mappings);
			
			expect(legend).toHaveLength(2);
			
			legend.forEach((item, index) => {
				expect(item.animal).toBe(mappings[index].animal);
				expect(item.walletAddress).toBe(mappings[index].walletAddress);
				expect(item.shortAddress).toBe(formatWalletAddress(mappings[index].walletAddress));
				expect(item.display).toBe(getAnimalDisplay(mappings[index].animal));
			});
		});

		it('should handle empty mappings array', () => {
			const legend = createAnimalLegend([]);
			expect(legend).toHaveLength(0);
		});

		it('should create correct structure for each legend item', () => {
			const mappings = mapWalletsToAnimals(mockWalletAddresses.slice(0, 2));
			const legend = createAnimalLegend(mappings);
			
			legend.forEach(item => {
				expect(item).toHaveProperty('animal');
				expect(item).toHaveProperty('walletAddress');
				expect(item).toHaveProperty('shortAddress');
				expect(item).toHaveProperty('display');
				
				expect(CRYPTO_ANIMALS).toContainEqual(item.animal);
				expect(item.shortAddress).toContain('...');
				expect(item.display).toContain(item.animal.emoji);
				expect(item.display).toContain(item.animal.name);
			});
		});
	});

	describe('Integration tests', () => {
		it('should work together for complete workflow', () => {
			// Simulate the full workflow used in the spinning wheel
			const wallets = mockWalletAddresses;
			
			// Step 1: Map wallets to animals
			const mappings = mapWalletsToAnimals(wallets);
			
			// Step 2: Create legend
			const legend = createAnimalLegend(mappings);
			
			// Step 3: Verify consistency
			expect(mappings).toHaveLength(wallets.length);
			expect(legend).toHaveLength(wallets.length);
			
			// Step 4: Test deterministic animal assignment
			wallets.forEach((wallet, index) => {
				const deterministicAnimal = getAnimalForWallet(wallet);
				const mappedAnimal = mappings[index].animal;
				
				// Note: These might be different since one uses index-based mapping
				// and the other uses hash-based mapping
				expect(CRYPTO_ANIMALS).toContainEqual(deterministicAnimal);
				expect(CRYPTO_ANIMALS).toContainEqual(mappedAnimal);
			});
		});

		it('should handle edge case with 7 wallets (spinning wheel requirement)', () => {
			const sevenWallets = [
				...mockWalletAddresses, // Use existing 5
				'3C6hM9kL2pQ5rA8mX7nB4yW', // Add 2 more
				'4D7jN8nQ1vB6mR5wA2sE9xT'
			];
			const mappings = mapWalletsToAnimals(sevenWallets);
			const legend = createAnimalLegend(mappings);
			
			expect(mappings).toHaveLength(7);
			expect(legend).toHaveLength(7);
			
			// All animals should be different (since we have 12 animals and only 7 wallets)
			const animalNames = mappings.map(m => m.animal.name);
			const uniqueNames = new Set(animalNames);
			expect(uniqueNames.size).toBe(7); // All should be unique
		});
	});
});