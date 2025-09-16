import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables for token config
vi.mock('$env/static/private', () => ({
	TOKEN_MINT_ADDRESS: 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump',
	TOKEN_NAME: '$runner',
	TOKEN_SYMBOL: 'RUNNER',
	TOKEN_DECIMALS: '6',
	ADMIN_WALLET_ADDRESS: 'AdminWalletAddress123456789',
	HOLDING_WALLET_ADDRESS: 'HoldingWalletAddress123456789',
	CHARITY_WALLET_ADDRESS: 'CharityWalletAddress123456789',
	REWARD_VAULT_ADDRESS: 'RewardVaultAddress123456789',
	HELIUS_API_KEY: 'test-helius-api-key'
}));

// Import after mocking
const { tokenConfig: getTokenConfig } = await import('../../../src/lib/config/token.js');

describe('Token Configuration', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('tokenConfig', () => {
		it('should have complete token configuration', () => {
			expect(getTokenConfig).toHaveProperty('mintAddress');
			expect(getTokenConfig).toHaveProperty('name');
			expect(getTokenConfig).toHaveProperty('symbol');
			expect(getTokenConfig).toHaveProperty('distribution');
		});

		it('should have correct token mint address', () => {
			expect(getTokenConfig.mintAddress).toBe('FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump');
		});

		it('should have correct token name', () => {
			expect(getTokenConfig.name).toBe('$runner');
		});

		it('should have correct token symbol', () => {
			expect(getTokenConfig.symbol).toBe('RUNNER');
		});

		it('should have correct display name format', () => {
			expect(getTokenConfig.displayName).toBe('$RUNNER');
		});

		it('should be consistent object', () => {
			expect(typeof getTokenConfig).toBe('object');
			expect(getTokenConfig).toBeDefined();
		});

		it('should have valid mint address format', () => {
			// Should be a valid Solana address format (base58, ~44 characters)
			expect(getTokenConfig.mintAddress).toMatch(/^[A-HJ-NP-Za-km-z1-9]{32,44}$/);
		});

		it('should have valid token symbol format', () => {
			// Token symbol should be uppercase letters
			expect(getTokenConfig.symbol).toMatch(/^[A-Z]+$/);
			expect(getTokenConfig.symbol.length).toBeGreaterThan(0);
			expect(getTokenConfig.symbol.length).toBeLessThanOrEqual(10); // Reasonable limit
		});

		it('should have valid distribution percentages', () => {
			const { distribution } = getTokenConfig;
			expect(distribution.winnersPercentage + distribution.holdingPercentage + distribution.charityPercentage).toBe(100);
		});
	});

	describe('Token Config Structure', () => {
		it('should match expected TypeScript interface', () => {
			// Verify the structure matches our expected interface
			expect(typeof getTokenConfig.mintAddress).toBe('string');
			expect(typeof getTokenConfig.name).toBe('string');
			expect(typeof getTokenConfig.symbol).toBe('string');
			expect(typeof getTokenConfig.distribution).toBe('object');
		});

		it('should not contain any undefined or null values', () => {
			const basicValues = [
				getTokenConfig.mintAddress,
				getTokenConfig.name,
				getTokenConfig.symbol,
				getTokenConfig.displayName
			];
			
			basicValues.forEach(value => {
				expect(value).not.toBeUndefined();
				expect(value).not.toBeNull();
			});
		});

		it('should not contain empty strings', () => {
			expect(getTokenConfig.mintAddress.length).toBeGreaterThan(0);
			expect(getTokenConfig.name.length).toBeGreaterThan(0);
			expect(getTokenConfig.symbol.length).toBeGreaterThan(0);
		});
	});
});