import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the vault utilities
const mockGetVaultInfo = vi.fn();
const mockCheckSolanaConnection = vi.fn();

vi.mock('../../../src/lib/utils/solana-balance', () => ({
	getVaultInfo: mockGetVaultInfo,
	checkSolanaConnection: mockCheckSolanaConnection
}));

// Mock the token config
const mockTokenConfig = {
	rewardVault: 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi',
	holdingWallet: 'EgFrJidrBi89nXA8qbBnZ1PMWUPRunX8bA7CWJFhbdEt',
	charityWallet: '3ebPj68nRbKQwpRUoHRdZypxKb6b5SHL5vYmAuqf9Bo8',
	adminWallet: '3mkD7ShsqbjpFcu1VWnCcoM6mTAt272qemLK4xBqKQJx'
};

vi.mock('../../../src/lib/config/token', () => ({
	tokenConfig: mockTokenConfig
}));

// Import the server handler after mocking
const { GET, POST } = await import('../../../src/routes/api/vault/balance/+server.js');

// Mock SvelteKit functions
const mockUrl = {
	searchParams: {
		get: vi.fn()
	}
};

describe('Vault Balance API', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockCheckSolanaConnection.mockResolvedValue(true);
	});

	describe('GET /api/vault/balance', () => {
		const mockVaultInfo = {
			address: mockTokenConfig.rewardVault,
			balance: 127.5,
			balanceFormatted: '127.50 SOL',
			lastUpdated: '2024-01-01T12:00:00.000Z',
			cached: false,
			distribution: {
				total: 127.5,
				winners: {
					amount: 63.75,
					percentage: 50,
					formatted: '63.75 SOL'
				},
				holding: {
					amount: 51.0,
					percentage: 40,
					formatted: '51.00 SOL'
				},
				charity: {
					amount: 12.75,
					percentage: 10,
					formatted: '12.75 SOL'
				}
			},
			winnerBreakdown: {
				numberOfWinners: 7,
				perWinner: 9.107,
				perWinnerFormatted: '9.107 SOL'
			}
		};

		it('should return vault balance and distribution data', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.vault.balance).toBe(127.5);
			expect(data.vault.balanceFormatted).toBe('127.50 SOL');
			expect(data.distribution.winners.amount).toBe(63.75);
			expect(data.distribution.holding.amount).toBe(51.0);
			expect(data.distribution.charity.amount).toBe(12.75);
			expect(data.meta.rewardVaultAddress).toBe(mockTokenConfig.rewardVault);
		});

		it('should use cache by default', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			await GET({ url: mockUrl });

			expect(mockGetVaultInfo).toHaveBeenCalledWith(mockTokenConfig.rewardVault, true);
		});

		it('should bypass cache when refresh=true', async () => {
			mockUrl.searchParams.get.mockReturnValue('true');
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			await GET({ url: mockUrl });

			expect(mockGetVaultInfo).toHaveBeenCalledWith(mockTokenConfig.rewardVault, false);
		});

		it('should return error when Solana connection is unhealthy', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockCheckSolanaConnection.mockResolvedValue(false);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(response.status).toBe(503);
			expect(data.success).toBe(false);
			expect(data.error).toBe('Solana connection unavailable');
		});

		it('should handle vault info fetch errors', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockRejectedValue(new Error('Network error'));

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.success).toBe(false);
			expect(data.error).toBe('Failed to fetch vault balance');
			expect(data.message).toBe('Network error');
			expect(data.vault.balance).toBe(0);
		});

		it('should include all wallet addresses in meta', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(data.meta.rewardVaultAddress).toBe(mockTokenConfig.rewardVault);
			expect(data.meta.holdingWalletAddress).toBe(mockTokenConfig.holdingWallet);
			expect(data.meta.charityWalletAddress).toBe(mockTokenConfig.charityWallet);
			expect(data.meta.adminWalletAddress).toBe(mockTokenConfig.adminWallet);
			expect(data.meta.refreshUrl).toBe('/api/vault/balance?refresh=true');
		});

		it('should include winner breakdown in distribution', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(data.distribution.winners.breakdown.totalWinners).toBe(7);
			expect(data.distribution.winners.breakdown.perWinner).toBe(9.107);
			expect(data.distribution.winners.breakdown.perWinnerFormatted).toBe('9.107 SOL');
		});
	});

	describe('POST /api/vault/balance', () => {
		const mockVaultInfo = {
			address: mockTokenConfig.rewardVault,
			balance: 150.0,
			balanceFormatted: '150.00 SOL',
			lastUpdated: '2024-01-01T12:30:00.000Z'
		};

		it('should force refresh vault balance', async () => {
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await POST();
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.message).toBe('Vault balance refreshed successfully');
			expect(data.vault.balance).toBe(150.0);
			expect(mockGetVaultInfo).toHaveBeenCalledWith(mockTokenConfig.rewardVault, false);
		});

		it('should handle manual refresh errors', async () => {
			mockGetVaultInfo.mockRejectedValue(new Error('Refresh failed'));

			const response = await POST();
			const data = await response.json();

			expect(response.status).toBe(500);
			expect(data.success).toBe(false);
			expect(data.error).toBe('Failed to refresh vault balance');
			expect(data.message).toBe('Refresh failed');
		});
	});

	describe('Response Format Validation', () => {
		const mockVaultInfo = {
			address: mockTokenConfig.rewardVault,
			balance: 100.0,
			balanceFormatted: '100.00 SOL',
			lastUpdated: '2024-01-01T12:00:00.000Z',
			cached: true,
			distribution: {
				total: 100.0,
				winners: { amount: 50.0, percentage: 50, formatted: '50.00 SOL' },
				holding: { amount: 40.0, percentage: 40, formatted: '40.00 SOL' },
				charity: { amount: 10.0, percentage: 10, formatted: '10.00 SOL' }
			},
			winnerBreakdown: {
				numberOfWinners: 7,
				perWinner: 7.143,
				perWinnerFormatted: '7.143 SOL'
			}
		};

		it('should have consistent response structure', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			// Check main structure
			expect(data).toHaveProperty('success');
			expect(data).toHaveProperty('vault');
			expect(data).toHaveProperty('distribution');
			expect(data).toHaveProperty('meta');

			// Check vault structure
			expect(data.vault).toHaveProperty('address');
			expect(data.vault).toHaveProperty('balance');
			expect(data.vault).toHaveProperty('balanceFormatted');
			expect(data.vault).toHaveProperty('lastUpdated');
			expect(data.vault).toHaveProperty('cached');

			// Check distribution structure
			expect(data.distribution).toHaveProperty('total');
			expect(data.distribution).toHaveProperty('winners');
			expect(data.distribution).toHaveProperty('holding');
			expect(data.distribution).toHaveProperty('charity');

			// Check winners breakdown
			expect(data.distribution.winners).toHaveProperty('breakdown');
			expect(data.distribution.winners.breakdown).toHaveProperty('totalWinners');
			expect(data.distribution.winners.breakdown).toHaveProperty('perWinner');
			expect(data.distribution.winners.breakdown).toHaveProperty('perWinnerFormatted');
		});

		it('should maintain data types', async () => {
			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(mockVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(typeof data.vault.balance).toBe('number');
			expect(typeof data.vault.balanceFormatted).toBe('string');
			expect(typeof data.vault.cached).toBe('boolean');
			expect(typeof data.distribution.total).toBe('number');
			expect(typeof data.distribution.winners.percentage).toBe('number');
		});
	});

	describe('Edge Cases', () => {
		it('should handle zero vault balance', async () => {
			const zeroVaultInfo = {
				address: mockTokenConfig.rewardVault,
				balance: 0,
				balanceFormatted: '0.00 SOL',
				lastUpdated: '2024-01-01T12:00:00.000Z',
				cached: false,
				distribution: {
					total: 0,
					winners: { amount: 0, percentage: 50, formatted: '0.00 SOL' },
					holding: { amount: 0, percentage: 40, formatted: '0.00 SOL' },
					charity: { amount: 0, percentage: 10, formatted: '0.00 SOL' }
				},
				winnerBreakdown: {
					numberOfWinners: 7,
					perWinner: 0,
					perWinnerFormatted: '0.000 SOL'
				}
			};

			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(zeroVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.vault.balance).toBe(0);
			expect(data.distribution.winners.amount).toBe(0);
		});

		it('should handle very large vault balance', async () => {
			const largeVaultInfo = {
				address: mockTokenConfig.rewardVault,
				balance: 1000000,
				balanceFormatted: '1000000.00 SOL',
				lastUpdated: '2024-01-01T12:00:00.000Z',
				cached: false,
				distribution: {
					total: 1000000,
					winners: { amount: 500000, percentage: 50, formatted: '500000.00 SOL' },
					holding: { amount: 400000, percentage: 40, formatted: '400000.00 SOL' },
					charity: { amount: 100000, percentage: 10, formatted: '100000.00 SOL' }
				},
				winnerBreakdown: {
					numberOfWinners: 7,
					perWinner: 71428.571,
					perWinnerFormatted: '71428.571 SOL'
				}
			};

			mockUrl.searchParams.get.mockReturnValue(null);
			mockGetVaultInfo.mockResolvedValue(largeVaultInfo);

			const response = await GET({ url: mockUrl });
			const data = await response.json();

			expect(data.success).toBe(true);
			expect(data.vault.balance).toBe(1000000);
			expect(data.distribution.winners.amount).toBe(500000);
		});
	});
});