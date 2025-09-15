import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Solana web3.js
const mockConnection = {
	getBalance: vi.fn(),
	getVersion: vi.fn()
};

const mockPublicKey = vi.fn();

vi.mock('@solana/web3.js', () => ({
	Connection: vi.fn(() => mockConnection),
	PublicKey: mockPublicKey,
	LAMPORTS_PER_SOL: 1000000000
}));

// Import after mocking
const {
	getSOLBalance,
	formatSOLAmount,
	formatLamportsToSOL,
	calculateDistribution,
	calculateWinnerAmounts,
	getVaultInfo,
	clearBalanceCache,
	getCacheInfo,
	checkSolanaConnection
} = await import('../../../src/lib/utils/solana-balance.js');

describe('Solana Balance Utilities', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		clearBalanceCache(); // Clear cache before each test
	});

	afterEach(() => {
		clearBalanceCache();
	});

	describe('getSOLBalance', () => {
		const testAddress = 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi';
		const mockLamports = 5000000000; // 5 SOL in lamports
		const expectedSOL = 5;

		it('should fetch and convert lamports to SOL', async () => {
			mockConnection.getBalance.mockResolvedValue(mockLamports);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));

			const balance = await getSOLBalance(testAddress);

			expect(mockConnection.getBalance).toHaveBeenCalledWith(expect.objectContaining({}));
			expect(balance).toBe(expectedSOL);
		});

		it('should cache balance data', async () => {
			mockConnection.getBalance.mockResolvedValue(mockLamports);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));

			// First call
			await getSOLBalance(testAddress);
			
			// Second call should use cache
			const balance = await getSOLBalance(testAddress);

			expect(mockConnection.getBalance).toHaveBeenCalledTimes(1);
			expect(balance).toBe(expectedSOL);
		});

		it('should bypass cache when useCache is false', async () => {
			mockConnection.getBalance.mockResolvedValue(mockLamports);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));

			// First call
			await getSOLBalance(testAddress);
			
			// Second call with useCache=false
			await getSOLBalance(testAddress, false);

			expect(mockConnection.getBalance).toHaveBeenCalledTimes(2);
		});

		it('should handle errors and return cached data if available', async () => {
			mockConnection.getBalance.mockResolvedValueOnce(mockLamports);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));

			// First successful call
			await getSOLBalance(testAddress);

			// Second call fails, should return cached data
			mockConnection.getBalance.mockRejectedValueOnce(new Error('Network error'));
			const balance = await getSOLBalance(testAddress);

			expect(balance).toBe(expectedSOL);
		});

		it('should throw error when no cache is available and fetch fails', async () => {
			mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));

			await expect(getSOLBalance(testAddress)).rejects.toThrow('Failed to fetch SOL balance');
		});
	});

	describe('formatSOLAmount', () => {
		it('should format SOL amount with default 2 decimals', () => {
			expect(formatSOLAmount(5.123456)).toBe('5.12 SOL');
		});

		it('should format SOL amount with custom decimals', () => {
			expect(formatSOLAmount(5.123456, 4)).toBe('5.1235 SOL');
		});

		it('should handle zero amount', () => {
			expect(formatSOLAmount(0)).toBe('0.00 SOL');
		});
	});

	describe('formatLamportsToSOL', () => {
		it('should convert lamports to SOL format', () => {
			expect(formatLamportsToSOL(5000000000)).toBe('5.00 SOL');
		});

		it('should handle partial SOL amounts', () => {
			expect(formatLamportsToSOL(1500000000)).toBe('1.50 SOL');
		});
	});

	describe('calculateDistribution', () => {
		it('should calculate correct distribution percentages', () => {
			const totalSOL = 100;
			const distribution = calculateDistribution(totalSOL);

			expect(distribution.total).toBe(100);
			expect(distribution.winners.amount).toBe(50);
			expect(distribution.winners.percentage).toBe(50);
			expect(distribution.holding.amount).toBe(40);
			expect(distribution.holding.percentage).toBe(40);
			expect(distribution.charity.amount).toBe(10);
			expect(distribution.charity.percentage).toBe(10);
		});

		it('should format amounts correctly', () => {
			const distribution = calculateDistribution(123.456);

			expect(distribution.winners.formatted).toBe('61.73 SOL');
			expect(distribution.holding.formatted).toBe('49.38 SOL');
			expect(distribution.charity.formatted).toBe('12.35 SOL');
		});

		it('should handle zero amount', () => {
			const distribution = calculateDistribution(0);

			expect(distribution.winners.amount).toBe(0);
			expect(distribution.holding.amount).toBe(0);
			expect(distribution.charity.amount).toBe(0);
		});
	});

	describe('calculateWinnerAmounts', () => {
		it('should calculate per-winner amounts with default 7 winners', () => {
			const winnerAmounts = calculateWinnerAmounts(70);

			expect(winnerAmounts.total).toBe(70);
			expect(winnerAmounts.perWinner).toBe(10);
			expect(winnerAmounts.numberOfWinners).toBe(7);
			expect(winnerAmounts.perWinnerFormatted).toBe('10.000 SOL');
		});

		it('should calculate per-winner amounts with custom winner count', () => {
			const winnerAmounts = calculateWinnerAmounts(100, 5);

			expect(winnerAmounts.perWinner).toBe(20);
			expect(winnerAmounts.numberOfWinners).toBe(5);
		});

		it('should handle fractional amounts', () => {
			const winnerAmounts = calculateWinnerAmounts(100, 7);

			expect(winnerAmounts.perWinner).toBeCloseTo(14.286, 3);
			expect(winnerAmounts.perWinnerFormatted).toBe('14.286 SOL');
		});
	});

	describe('getVaultInfo', () => {
		const testAddress = 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi';
		const mockLamports = 10000000000; // 10 SOL

		beforeEach(() => {
			mockConnection.getBalance.mockResolvedValue(mockLamports);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));
		});

		it('should return comprehensive vault information', async () => {
			const vaultInfo = await getVaultInfo(testAddress);

			expect(vaultInfo.address).toBe(testAddress);
			expect(vaultInfo.balance).toBe(10);
			expect(vaultInfo.balanceFormatted).toBe('10.00 SOL');
			expect(vaultInfo.distribution.winners.amount).toBe(5);
			expect(vaultInfo.distribution.holding.amount).toBe(4);
			expect(vaultInfo.distribution.charity.amount).toBe(1);
			expect(vaultInfo.winnerBreakdown.perWinner).toBeCloseTo(0.714, 3);
			expect(vaultInfo.lastUpdated).toBeDefined();
		});

		it('should indicate cache status', async () => {
			// Clear cache first
			clearBalanceCache();
			
			// First call (not cached)
			const firstCall = await getVaultInfo(testAddress, true);
			expect(firstCall.cached).toBe(false);

			// Second call (cached)
			const secondCall = await getVaultInfo(testAddress, true);
			expect(secondCall.cached).toBe(true);
		});
	});

	describe('Cache Management', () => {
		const testAddress = 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi';

		beforeEach(() => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockPublicKey.mockImplementation(() => ({ toBase58: () => testAddress }));
		});

		it('should clear specific address cache', async () => {
			await getSOLBalance(testAddress);
			expect(getCacheInfo()).toHaveLength(1);

			clearBalanceCache(testAddress);
			expect(getCacheInfo()).toHaveLength(0);
		});

		it('should clear all cache when no address specified', async () => {
			await getSOLBalance(testAddress);
			await getSOLBalance('different-address');
			expect(getCacheInfo()).toHaveLength(2);

			clearBalanceCache();
			expect(getCacheInfo()).toHaveLength(0);
		});

		it('should provide cache information', async () => {
			await getSOLBalance(testAddress);
			const cacheInfo = getCacheInfo();

			expect(cacheInfo).toHaveLength(1);
			expect(cacheInfo[0]).toHaveProperty('address', testAddress);
			expect(cacheInfo[0]).toHaveProperty('balance', 5);
			expect(cacheInfo[0]).toHaveProperty('timestamp');
		});
	});

	describe('checkSolanaConnection', () => {
		it('should return true for healthy connection', async () => {
			mockConnection.getVersion.mockResolvedValue({ 'solana-core': '1.16.0' });

			const isHealthy = await checkSolanaConnection();
			expect(isHealthy).toBe(true);
		});

		it('should return false for unhealthy connection', async () => {
			mockConnection.getVersion.mockRejectedValue(new Error('Connection failed'));

			const isHealthy = await checkSolanaConnection();
			expect(isHealthy).toBe(false);
		});
	});

	describe('Error Handling', () => {
		it('should handle invalid address format', async () => {
			mockPublicKey.mockImplementation(() => {
				throw new Error('Invalid public key');
			});

			await expect(getSOLBalance('invalid-address')).rejects.toThrow();
		});

		it('should handle network timeouts', async () => {
			mockConnection.getBalance.mockRejectedValue(new Error('Request timeout'));
			mockPublicKey.mockImplementation(() => ({ toBase58: () => 'valid-address' }));

			await expect(getSOLBalance('valid-address')).rejects.toThrow('Failed to fetch SOL balance');
		});
	});

	describe('Edge Cases', () => {
		it('should handle very small SOL amounts', () => {
			const distribution = calculateDistribution(0.001);
			
			expect(distribution.winners.amount).toBeCloseTo(0.0005, 4);
			expect(distribution.holding.amount).toBeCloseTo(0.0004, 4);
			expect(distribution.charity.amount).toBeCloseTo(0.0001, 4);
		});

		it('should handle very large SOL amounts', () => {
			const distribution = calculateDistribution(1000000);
			
			expect(distribution.winners.amount).toBe(500000);
			expect(distribution.holding.amount).toBe(400000);
			expect(distribution.charity.amount).toBe(100000);
		});

		it('should handle zero winners', () => {
			const winnerAmounts = calculateWinnerAmounts(100, 0);
			
			expect(winnerAmounts.perWinner).toBe(Infinity);
			expect(winnerAmounts.numberOfWinners).toBe(0);
		});
	});
});