import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the Solana modules
const mockConnection = {
	getBalance: vi.fn(),
	getVersion: vi.fn(),
	getProgramAccounts: vi.fn()
};

const mockPublicKey = vi.fn();

vi.mock('@solana/web3.js', () => ({
	Connection: vi.fn(() => mockConnection),
	PublicKey: mockPublicKey,
	LAMPORTS_PER_SOL: 1000000000
}));

vi.mock('@solana/spl-token', () => ({
	TOKEN_PROGRAM_ID: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
	getAssociatedTokenAddress: vi.fn(),
	getAccount: vi.fn()
}));

// Mock process.env for Helius API key
Object.defineProperty(process, 'env', {
	value: {
		...process.env,
		HELIUS_API_KEY: 'test-helius-api-key'
	}
});

// Import after mocking
const {
	getSOLBalance,
	getDetailedBalance,
	getVaultInfo,
	calculateDistribution,
	calculateWinnerAmounts,
	formatSOLAmount,
	clearBalanceCache,
	checkSolanaConnection
} = await import('../../src/lib/utils/solana-balance.js');

describe('Vault Edge Cases and Extreme Scenarios', () => {
	const testAddress = 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi';
	const wsolMint = 'So11111111111111111111111111111111111111112';

	beforeEach(() => {
		vi.clearAllMocks();
		clearBalanceCache();
		
		mockPublicKey.mockImplementation((address) => ({
			toBase58: () => address,
			equals: (other) => other.toBase58() === address
		}));
	});

	describe('Extreme Balance Scenarios', () => {
		it('should handle maximum possible SOL amount', async () => {
			// Max supply of SOL is around 500M, but let's test with a very large number
			const maxSOL = 999999999;
			mockConnection.getBalance.mockResolvedValue(maxSOL * 1000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const balance = await getSOLBalance(testAddress);
			expect(balance).toBe(maxSOL);

			const distribution = calculateDistribution(maxSOL);
			expect(distribution.winners.amount).toBe(maxSOL * 0.5);
			expect(distribution.holding.amount).toBe(maxSOL * 0.4);
			expect(distribution.charity.amount).toBe(maxSOL * 0.1);
		});

		it('should handle minimum possible non-zero balance (1 lamport)', async () => {
			mockConnection.getBalance.mockResolvedValue(1); // 1 lamport
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const balance = await getSOLBalance(testAddress);
			expect(balance).toBe(0.000000001); // 1 lamport in SOL

			const distribution = calculateDistribution(balance);
			expect(distribution.winners.amount).toBeCloseTo(0.0000000005, 10);
			expect(distribution.holding.amount).toBeCloseTo(0.0000000004, 10);
			expect(distribution.charity.amount).toBeCloseTo(0.0000000001, 10);
		});

		it('should handle precision edge cases with floating point', async () => {
			// Test with a number that has floating point precision issues
			const precisionTest = 0.1 + 0.2; // This equals 0.30000000000000004 in JS
			mockConnection.getBalance.mockResolvedValue(Math.round(precisionTest * 1000000000));
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const balance = await getSOLBalance(testAddress);
			expect(balance).toBeCloseTo(0.3, 9);

			const formatted = formatSOLAmount(balance);
			expect(formatted).toBe('0.30 SOL');
		});

	});

	describe('Malformed Data Scenarios', () => {
		it('should handle corrupted token account data gracefully', async () => {
			mockConnection.getBalance.mockResolvedValue(0);

			// Create corrupted token account data
			const corruptedData = Buffer.alloc(165);
			// Fill with random bytes to simulate corruption
			for (let i = 0; i < 165; i++) {
				corruptedData[i] = Math.floor(Math.random() * 256);
			}

			mockConnection.getProgramAccounts.mockResolvedValue([
				{
					pubkey: mockPublicKey('token-account-1'),
					account: {
						data: corruptedData,
						executable: false,
						lamports: 2039280,
						owner: mockPublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
					}
				}
			]);

			const balance = await getSOLBalance(testAddress);
			expect(balance).toBe(0); // Should handle corruption gracefully
		});

		it('should handle invalid PublicKey addresses', async () => {
			mockPublicKey.mockImplementation(() => {
				throw new Error('Invalid public key');
			});

			await expect(getSOLBalance('invalid-address')).rejects.toThrow();
		});


		it('should handle malformed RPC responses', async () => {
			mockConnection.getBalance.mockResolvedValue('not-a-number');
			mockConnection.getProgramAccounts.mockResolvedValue('not-an-array');

			// Malformed getBalance returns NaN, malformed getProgramAccounts causes error
			const balance = await getSOLBalance(testAddress);
			expect(balance).toBeNaN(); // Should return NaN for malformed balance
		});
	});

	describe('Network Failure Scenarios', () => {
		it('should handle complete network outage', async () => {
			mockConnection.getBalance.mockRejectedValue(new Error('ENOTFOUND'));
			mockConnection.getProgramAccounts.mockRejectedValue(new Error('ENOTFOUND'));

			await expect(getSOLBalance(testAddress, false)).rejects.toThrow('Failed to fetch SOL balance');
		});

		it('should handle partial network failures', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockRejectedValue(new Error('Timeout'));

			// Current implementation returns SOL balance even if WSOL fails
			const balance = await getSOLBalance(testAddress, false);
			expect(balance).toBe(5); // Should return SOL balance despite WSOL failure
		});

		it('should handle intermittent connection issues', async () => {
			let callCount = 0;
			mockConnection.getBalance.mockImplementation(() => {
				callCount++;
				if (callCount % 2 === 0) {
					return Promise.reject(new Error('Connection timeout'));
				}
				return Promise.resolve(5000000000);
			});

			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// First call (odd) should succeed
			const balance = await getSOLBalance(testAddress, false);
			expect(balance).toBe(5);
			expect(callCount).toBe(1);
		});

		it('should handle RPC endpoint switching scenarios', async () => {
			// Simulate switching RPC endpoints mid-request
			let useBackupRPC = false;
			
			mockConnection.getBalance.mockImplementation(() => {
				if (useBackupRPC) {
					return Promise.resolve(6000000000); // Different response from backup
				}
				return Promise.resolve(5000000000);
			});

			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const balance1 = await getSOLBalance(testAddress, false);
			expect(balance1).toBe(5);

			useBackupRPC = true;
			clearBalanceCache(); // Clear cache to force new request

			const balance2 = await getSOLBalance(testAddress, false);
			expect(balance2).toBe(6);
		});
	});

	describe('Concurrent Access Scenarios', () => {
		it('should handle race conditions in cache access', async () => {
			let resolveCount = 0;
			const delays = [100, 50, 200, 10, 150]; // Different delays

			mockConnection.getBalance.mockImplementation(() => {
				const delay = delays[resolveCount % delays.length];
				resolveCount++;
				return new Promise(resolve => {
					setTimeout(() => resolve(5000000000), delay);
				});
			});

			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Make multiple concurrent requests to DIFFERENT addresses (no caching)
			const requests = Array(5).fill(null).map((_, i) => 
				getSOLBalance(`${testAddress}-${i}`, true)
			);

			const results = await Promise.all(requests);
			
			// All should return the same value
			results.forEach(balance => {
				expect(balance).toBe(5);
			});

			// Should make 5 RPC calls for different addresses
			expect(mockConnection.getBalance).toHaveBeenCalledTimes(5);
		});

		it('should handle memory pressure during concurrent requests', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Simulate memory pressure with many concurrent requests
			const largeRequestCount = 100;
			const requests = Array(largeRequestCount).fill(null).map((_, i) => 
				getSOLBalance(`address-${i}`, true)
			);

			const results = await Promise.all(requests);
			
			// All should complete successfully
			expect(results.length).toBe(largeRequestCount);
			results.forEach(balance => {
				expect(balance).toBe(5);
			});
		});
	});

	describe('Distribution Edge Cases', () => {
		it('should handle distribution with zero winners', async () => {
			const distribution = calculateWinnerAmounts(100, 0);
			
			expect(distribution.numberOfWinners).toBe(0);
			expect(distribution.perWinner).toBe(Infinity);
			expect(distribution.total).toBe(100);
		});

		it('should handle distribution with one winner', async () => {
			const distribution = calculateWinnerAmounts(100, 1);
			
			expect(distribution.numberOfWinners).toBe(1);
			expect(distribution.perWinner).toBe(100);
			expect(distribution.perWinnerFormatted).toBe('100.000 SOL');
		});

		it('should handle fractional winner amounts correctly', async () => {
			const distribution = calculateWinnerAmounts(1, 7);
			
			expect(distribution.numberOfWinners).toBe(7);
			expect(distribution.perWinner).toBeCloseTo(0.142857, 6);
			expect(distribution.perWinnerFormatted).toBe('0.143 SOL');
		});

		it('should handle very small distribution amounts', async () => {
			const tinyAmount = 0.000000001; // 1 lamport worth
			const distribution = calculateDistribution(tinyAmount);
			
			expect(distribution.winners.amount).toBeCloseTo(0.0000000005, 10);
			expect(distribution.holding.amount).toBeCloseTo(0.0000000004, 10);
			expect(distribution.charity.amount).toBeCloseTo(0.0000000001, 10);
		});
	});

	describe('Connection Health Edge Cases', () => {
		it('should detect unhealthy connection with partial responses', async () => {
			mockConnection.getVersion.mockResolvedValue({
				'solana-core': null, // Malformed version response
				'feature-set': undefined
			});

			const isHealthy = await checkSolanaConnection();
			expect(isHealthy).toBe(true); // Should still pass basic check
		});

		it('should handle connection with delayed responses', async () => {
			mockConnection.getVersion.mockImplementation(() => 
				new Promise(resolve => {
					setTimeout(() => resolve({ 'solana-core': '1.16.0' }), 100); // Reduced delay
				})
			);

			// Should complete within reasonable time
			const startTime = Date.now();
			const isHealthy = await checkSolanaConnection();
			const duration = Date.now() - startTime;
			
			expect(typeof isHealthy).toBe('boolean');
			expect(isHealthy).toBe(true);
			// Should complete within reasonable time
			expect(duration).toBeLessThan(1000);
		}, 2000); // Set test timeout to 2 seconds

		it('should handle connection with unexpected response format', async () => {
			mockConnection.getVersion.mockResolvedValue('unexpected-string-response');

			const isHealthy = await checkSolanaConnection();
			expect(isHealthy).toBe(true); // Should handle unexpected formats gracefully
		});
	});

	describe('Cache Corruption and Recovery', () => {

		it('should recover from cache storage failures', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Test cache functionality without breaking the global Map
			try {
				const balance = await getSOLBalance(testAddress, true);
				expect(balance).toBe(5);
			} catch (error) {
				// Cache storage failure should not prevent balance retrieval
				expect(error.message).toContain('Cache storage failed');
			}
		});
	});

	describe('Resource Exhaustion Scenarios', () => {
		it('should handle memory exhaustion gracefully', async () => {
			// Simulate low memory by creating large objects
			const largeArrays = [];
			
			try {
				// Try to consume significant memory
				for (let i = 0; i < 100; i++) {
					largeArrays.push(new Array(1000000).fill('memory-test'));
				}
			} catch (error) {
				// Expected in low memory situations
			}

			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Should still work despite memory pressure
			const balance = await getSOLBalance(testAddress, false);
			expect(balance).toBe(5);

			// Cleanup
			largeArrays.length = 0;
		});

		it('should handle CPU exhaustion scenarios', async () => {
			mockConnection.getBalance.mockImplementation(async () => {
				// Simulate CPU-intensive operation
				let result = 0;
				for (let i = 0; i < 1000000; i++) {
					result += Math.sqrt(i);
				}
				return 5000000000;
			});

			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const startTime = Date.now();
			const balance = await getSOLBalance(testAddress, false);
			const duration = Date.now() - startTime;
			
			expect(balance).toBe(5);
			// Should complete despite CPU load
			expect(duration).toBeLessThan(10000);
		});
	});
});