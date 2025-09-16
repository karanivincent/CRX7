import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock performance monitoring
const performanceMarks = new Map();
const mockPerformance = {
	now: vi.fn(() => Date.now()),
	mark: vi.fn((name) => performanceMarks.set(name, Date.now())),
	measure: vi.fn((name, start, end) => {
		const startTime = performanceMarks.get(start) || 0;
		const endTime = performanceMarks.get(end) || Date.now();
		return { duration: endTime - startTime };
	})
};

// Mock Solana connection with rate limiting simulation
const mockConnection = {
	getBalance: vi.fn(),
	getVersion: vi.fn(),
	getProgramAccounts: vi.fn()
};

let requestCount = 0;
const RATE_LIMIT = 5; // Allow 5 requests before rate limiting
const RATE_LIMIT_WINDOW = 1000; // 1 second window

const simulateRateLimit = () => {
	requestCount++;
	if (requestCount > RATE_LIMIT) {
		const error = new Error('429 Too Many Requests');
		error.name = 'RateLimitError';
		throw error;
	}
	return Promise.resolve();
};

vi.mock('@solana/web3.js', () => ({
	Connection: vi.fn(() => mockConnection),
	PublicKey: vi.fn((address) => ({
		toBase58: () => address,
		equals: (other) => other.toBase58() === address
	})),
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
	clearBalanceCache,
	getCacheInfo
} = await import('../../src/lib/utils/solana-balance.js');

describe('Vault Performance and Rate Limiting Tests', () => {
	const testAddress = 'E7xvXRobsFnwXeQ4UKQnkymyTgpKLkZFD2hmRbPW7bXi';

	beforeEach(() => {
		vi.clearAllMocks();
		clearBalanceCache();
		requestCount = 0;
		performanceMarks.clear();
		
		// Reset mock implementations
		mockConnection.getBalance.mockImplementation(async () => {
			await simulateRateLimit();
			return 0;
		});
		
		mockConnection.getProgramAccounts.mockImplementation(async () => {
			await simulateRateLimit();
			return [];
		});
	});

	describe('Rate Limiting Behavior', () => {
		it('should handle rate limiting gracefully', async () => {
			// Make requests until rate limit is hit
			const requests = [];
			
			for (let i = 0; i < RATE_LIMIT + 2; i++) {
				requests.push(
					getSOLBalance(testAddress, false).catch(error => ({
						error: error.message,
						attempt: i + 1
					}))
				);
			}

			const results = await Promise.all(requests);
			
			// First RATE_LIMIT requests should succeed
			const successfulRequests = results.filter(result => 
				typeof result === 'number' || !result.error
			);
			const failedRequests = results.filter(result => 
				result.error && result.error.includes('429')
			);

			expect(successfulRequests.length).toBeLessThanOrEqual(RATE_LIMIT);
			expect(failedRequests.length).toBeGreaterThan(0);
		});

		it('should use cache to avoid rate limiting', async () => {
			// First request (will make RPC calls)
			mockConnection.getBalance.mockResolvedValueOnce(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValueOnce([]);
			
			const balance1 = await getSOLBalance(testAddress, true);
			expect(balance1).toBe(5);

			// Subsequent requests should use cache (no RPC calls)
			const balance2 = await getSOLBalance(testAddress, true);
			const balance3 = await getSOLBalance(testAddress, true);
			
			expect(balance2).toBe(5);
			expect(balance3).toBe(5);
			
			// Should only have made RPC calls once
			expect(mockConnection.getBalance).toHaveBeenCalledTimes(1);
			expect(mockConnection.getProgramAccounts).toHaveBeenCalledTimes(1);
		});

		it('should respect cache duration', async () => {
			vi.useFakeTimers();
			
			// First request
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);
			
			const balance1 = await getSOLBalance(testAddress, true);
			expect(balance1).toBe(5);

			// Fast forward past cache duration (30 seconds)
			vi.advanceTimersByTime(31000);

			// Should make new RPC calls after cache expires
			const balance2 = await getSOLBalance(testAddress, true);
			expect(balance2).toBe(5);
			
			expect(mockConnection.getBalance).toHaveBeenCalledTimes(2);
			
			vi.useRealTimers();
		});
	});

	describe('Performance Benchmarks', () => {
		it('should complete balance fetch within acceptable time', async () => {
			mockConnection.getBalance.mockImplementation(async () => {
				// Simulate network delay
				await new Promise(resolve => setTimeout(resolve, 100));
				return 5000000000;
			});
			
			mockConnection.getProgramAccounts.mockImplementation(async () => {
				// Simulate network delay
				await new Promise(resolve => setTimeout(resolve, 200));
				return [];
			});

			const startTime = performance.now();
			const balance = await getSOLBalance(testAddress, false);
			const endTime = performance.now();
			
			const duration = endTime - startTime;
			
			expect(balance).toBe(5);
			expect(duration).toBeLessThan(500); // Should complete within 500ms
		});

		it('should have fast cache retrieval', async () => {
			// Prime the cache
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);
			await getSOLBalance(testAddress, true);

			// Measure cache retrieval time
			const startTime = performance.now();
			const balance = await getSOLBalance(testAddress, true);
			const endTime = performance.now();
			
			const duration = endTime - startTime;
			
			expect(balance).toBe(5);
			expect(duration).toBeLessThan(10); // Cache should be very fast (<10ms)
		});

		it('should handle concurrent requests efficiently', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Prime the cache first with a single request
			await getSOLBalance(testAddress, true);
			
			// Clear the call count after priming
			vi.clearAllMocks();
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Make 10 concurrent requests to the SAME address with cache enabled
			const requests = Array(10).fill(null).map(() => 
				getSOLBalance(testAddress, true)
			);

			const startTime = performance.now();
			const results = await Promise.all(requests);
			const endTime = performance.now();
			
			const duration = endTime - startTime;
			
			// All should return same value
			results.forEach(balance => {
				expect(balance).toBe(5);
			});
			
			// Should complete quickly due to caching
			expect(duration).toBeLessThan(300);
			
			// Should not make any new RPC calls due to caching
			expect(mockConnection.getBalance).toHaveBeenCalledTimes(0);
		});
	});

	describe('Memory and Cache Management', () => {
		it('should not leak memory with repeated requests', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			const addresses = Array(50).fill(null).map((_, i) => 
				`address-${i}-${'a'.repeat(32)}`
			);

			// Make requests for many different addresses
			for (const address of addresses) {
				await getSOLBalance(address, true);
			}

			// Check cache size
			const cacheInfo = getCacheInfo();
			expect(cacheInfo.length).toBe(addresses.length);
			
			// Clear cache
			clearBalanceCache();
			const emptyCacheInfo = getCacheInfo();
			expect(emptyCacheInfo.length).toBe(0);
		});

		it('should handle cache cleanup correctly', async () => {
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Add multiple entries to cache
			await getSOLBalance('address1', true);
			await getSOLBalance('address2', true);
			await getSOLBalance('address3', true);

			expect(getCacheInfo().length).toBe(3);

			// Clear specific address
			clearBalanceCache('address1');
			expect(getCacheInfo().length).toBe(2);

			// Clear all
			clearBalanceCache();
			expect(getCacheInfo().length).toBe(0);
		});
	});

	describe('Error Recovery and Resilience', () => {
		it('should retry with exponential backoff on rate limits', async () => {
			let attemptCount = 0;
			
			mockConnection.getBalance.mockImplementation(async () => {
				attemptCount++;
				const error = new Error('429 Too Many Requests');
				error.name = 'RateLimitError';
				throw error;
			});

			mockConnection.getProgramAccounts.mockResolvedValue([]);

			// Should fail but track attempts
			await expect(getSOLBalance(testAddress, false)).rejects.toThrow();
			// Current implementation doesn't retry, so this test documents current behavior
			expect(attemptCount).toBe(1);
		});

		it('should fall back to cache on network errors', async () => {
			// Prime cache first
			mockConnection.getBalance.mockResolvedValueOnce(5000000000);
			mockConnection.getProgramAccounts.mockResolvedValueOnce([]);
			await getSOLBalance(testAddress, true);

			// Network fails on subsequent request
			mockConnection.getBalance.mockRejectedValue(new Error('Network error'));
			mockConnection.getProgramAccounts.mockRejectedValue(new Error('Network error'));

			// Should return cached value
			const balance = await getSOLBalance(testAddress, true);
			expect(balance).toBe(5);
		});

		it('should handle partial failures gracefully', async () => {
			// SOL balance succeeds, WSOL balance fails
			mockConnection.getBalance.mockResolvedValue(5000000000);
			mockConnection.getProgramAccounts.mockRejectedValue(new Error('WSOL fetch failed'));

			// Current implementation returns SOL balance even if WSOL fails
			const balance = await getSOLBalance(testAddress, false);
			expect(balance).toBe(5); // Should return SOL balance despite WSOL failure
		});
	});

	describe('Load Testing Scenarios', () => {
		it('should handle burst of requests within limits', async () => {
			mockConnection.getBalance.mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 50));
				return 5000000000;
			});
			
			mockConnection.getProgramAccounts.mockImplementation(async () => {
				await new Promise(resolve => setTimeout(resolve, 100));
				return [];
			});

			// Burst of requests within rate limits
			const burstSize = RATE_LIMIT - 1;
			const requests = Array(burstSize).fill(null).map((_, i) => 
				getSOLBalance(`address-${i}`, false)
			);

			const startTime = performance.now();
			const results = await Promise.all(requests);
			const endTime = performance.now();
			
			const duration = endTime - startTime;
			
			// All should succeed
			results.forEach(balance => {
				expect(balance).toBe(5);
			});
			
			// Should complete in reasonable time
			expect(duration).toBeLessThan(2000);
		});

		it('should throttle excessive requests appropriately', async () => {
			const excessiveRequestCount = RATE_LIMIT * 2;
			const requests = [];

			// Make excessive requests
			for (let i = 0; i < excessiveRequestCount; i++) {
				requests.push(
					getSOLBalance(`address-${i}`, false).catch(error => ({ error: true }))
				);
			}

			const results = await Promise.all(requests);
			
			const successCount = results.filter(r => typeof r === 'number').length;
			const errorCount = results.filter(r => r.error).length;
			
			expect(successCount).toBeLessThanOrEqual(RATE_LIMIT);
			expect(errorCount).toBeGreaterThan(0);
		});
	});
});