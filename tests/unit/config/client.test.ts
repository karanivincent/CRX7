import { describe, it, expect, vi, beforeEach } from 'vitest';

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
			expect(display).toBe('$RUNNER');
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
			expect(name).toBe('$runner');
		});
	});

	describe('getTokenSymbol', () => {
		it('should return the token symbol', () => {
			const symbol = getTokenSymbol();
			expect(symbol).toBe('RUNNER');
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

			expect(display).toBe('$RUNNER');
			expect(name).toBe('$runner');
			expect(symbol).toBe('RUNNER');
			expect(typeof symbol).toBe('string');
			expect(symbol.length).toBeGreaterThan(0);
		});
	});
});