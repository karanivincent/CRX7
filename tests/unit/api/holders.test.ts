import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing the handler
vi.mock('@solana/web3.js', () => ({
	Connection: vi.fn(),
	PublicKey: vi.fn().mockImplementation((key: string) => ({ toBase58: () => key }))
}));

vi.mock('@solana/spl-token', () => ({
	TOKEN_PROGRAM_ID: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' }
}));

vi.mock('$env/static/private', () => ({
	TOKEN_MINT_ADDRESS: 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump',
	TOKEN_NAME: '$runner',
	TOKEN_SYMBOL: 'RUNNER'
}));

// Import after mocking
const { GET } = await import('../../../src/routes/api/holders/+server.js');
const { Connection } = await import('@solana/web3.js');

describe('Token Holders API', () => {
	let mockConnection: any;
	let mockEvent: any;

	beforeEach(() => {
		vi.clearAllMocks();
		
		// Mock Connection instance
		mockConnection = {
			getProgramAccounts: vi.fn()
		};
		
		// Make Connection constructor return our mock
		(Connection as any).mockImplementation(() => mockConnection);
		
		// Create minimal mock event object
		mockEvent = {
			request: new Request('http://localhost/api/holders')
		};
	});

	it('should return success response with environment variables', async () => {
		// Mock empty token accounts array
		mockConnection.getProgramAccounts.mockResolvedValue([]);

		const response = await GET(mockEvent);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.holders).toEqual([]);
		expect(data.totalHolders).toBe(0);
		expect(data.tokenMint).toBe('FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump');
		expect(data.tokenName).toBe('$runner');
		expect(data.tokenSymbol).toBe('RUNNER');
		expect(data.message).toContain('Fetched 0 real token holders from blockchain');
	});

	it('should handle connection errors gracefully', async () => {
		mockConnection.getProgramAccounts.mockRejectedValue(new Error('Network error'));

		const response = await GET(mockEvent);
		const data = await response.json();

		expect(response.status).toBe(500);
		expect(data.success).toBe(false);
		expect(data.error).toBe('Failed to fetch token holders');
		expect(data.message).toBe('Network error');
	});

	it('should call getProgramAccounts with correct filters', async () => {
		mockConnection.getProgramAccounts.mockResolvedValue([]);

		await GET(mockEvent);

		expect(mockConnection.getProgramAccounts).toHaveBeenCalledWith(
			expect.anything(), // TOKEN_PROGRAM_ID
			{
				filters: [
					{ dataSize: 165 },
					{
						memcmp: {
							offset: 0,
							bytes: 'FyB8VxxYAaVVchAgbB1kvjWdw26ovaD4ipwV1j8epump'
						}
					}
				]
			}
		);
	});

	it('should process token accounts with valid data', async () => {
		// Create mock token account with proper structure
		const mockAccountData = Buffer.alloc(165);
		// Fill first 32 bytes with mint address (mocked)
		Buffer.from('mint-address-placeholder').copy(mockAccountData, 0);
		// Fill next 32 bytes with owner address
		Buffer.from('owner-address-placeholder').copy(mockAccountData, 32);
		// Fill amount (8 bytes at offset 64) with 1000000 (representing 1 token with 6 decimals)
		mockAccountData.writeBigUInt64LE(BigInt(1000000), 64);

		const mockTokenAccounts = [{
			account: { data: mockAccountData }
		}];

		mockConnection.getProgramAccounts.mockResolvedValue(mockTokenAccounts);

		const response = await GET(mockEvent);
		const data = await response.json();

		expect(response.status).toBe(200);
		expect(data.success).toBe(true);
		expect(data.holders).toHaveLength(1);
		expect(data.totalHolders).toBe(1);
		expect(data.holders[0]).toHaveProperty('address');
		expect(data.holders[0]).toHaveProperty('balance');
		expect(data.holders[0]).toHaveProperty('balanceFormatted');
	});
});