import { beforeEach, describe, expect, it, vi } from 'vitest';

// Import functions and types after mocking
const {
	getTokenDisplay,
	getTokenName,
	getTokenSymbol,
	defaultClientConfig
} = await import('../../../src/lib/config/client.js');

describe('Client Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('getTokenDisplay', () => {
		it('should return the default display name', () => {
			const display = getTokenDisplay();
			expect(display).toBe('$CRX7');
		});

		it('should be consistent across multiple calls', () => {
			const display1 = getTokenDisplay();
			const display2 = getTokenDisplay();
			expect(display1).toBe(display2);
		});
	});

	describe('getTokenName', () => {
		it('should return the token name', () => {
			const name = getTokenName();
			expect(name).toBe('$crx7');
		});
	});

	describe('getTokenSymbol', () => {
		it('should return the token symbol', () => {
			const symbol = getTokenSymbol();
			expect(symbol).toBe('CRX7');
		});
	});

	describe('defaultClientConfig', () => {
		it('should have all required properties', () => {
			expect(defaultClientConfig).toHaveProperty('displayName');
			expect(defaultClientConfig).toHaveProperty('name');
			expect(defaultClientConfig).toHaveProperty('symbol');
			expect(defaultClientConfig).toHaveProperty('winnersPerDraw');
			expect(defaultClientConfig).toHaveProperty('drawFrequency');
			expect(defaultClientConfig).toHaveProperty('distribution');
		});

		it('should have valid distribution percentages', () => {
			const { distribution } = defaultClientConfig;
			expect(distribution.winnersPercentage + distribution.holdingPercentage + distribution.charityPercentage).toBe(100);
		});
	});

	describe('Integration', () => {
		it('should provide consistent token configuration', () => {
			// These should all be related and consistent
			const display = getTokenDisplay();
			const name = getTokenName();
			const symbol = getTokenSymbol();

			expect(display).toBe('$CRX7');
			expect(name).toBe('$crx7');
			expect(symbol).toBe('CRX7');
			expect(typeof symbol).toBe('string');
			expect(symbol.length).toBeGreaterThan(0);
		});
	});
});