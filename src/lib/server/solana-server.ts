import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { HELIUS_API_KEY } from '$env/static/private';

// Server-side Solana connection with Helius RPC
const SOLANA_RPC_URL = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

console.log(`🔗 Using Solana RPC: ${HELIUS_API_KEY ? 'Helius (with API key)' : 'Public (fallback)'}`);

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Wrapped SOL mint address
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Server-side cache for balance data
interface BalanceCache {
	solBalance: number;
	wsolBalance: number;
	totalBalance: number;
	timestamp: number;
	address: string;
}

const balanceCache = new Map<string, BalanceCache>();
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Get WSOL (Wrapped SOL) balance for a given wallet address
 * Server-side only function
 */
async function getWSOLBalance(address: string): Promise<number> {
	try {
		const publicKey = new PublicKey(address);
		
		console.log(`Fetching WSOL balance for: ${address}`);
		
		// Get all token accounts owned by this address for WSOL
		const tokenAccounts = await connection.getProgramAccounts(TOKEN_PROGRAM_ID, {
			filters: [
				{ dataSize: 165 }, // Size of token account
				{
					memcmp: {
						offset: 32, // Owner is at offset 32
						bytes: publicKey.toBase58()
					}
				}
			]
		});
		
		let totalWSOL = 0;
		
		for (const account of tokenAccounts) {
			try {
				const data = account.account.data;
				if (data.length < 72) continue;
				
				// Check if this is a WSOL token account (mint at offset 0)
				const mintBytes = data.slice(0, 32);
				const mint = new PublicKey(mintBytes);
				
				if (mint.equals(WSOL_MINT)) {
					const amountBuffer = data.slice(64, 72);
					const amount = Number(amountBuffer.readBigUInt64LE(0));
					totalWSOL += amount / LAMPORTS_PER_SOL;
				}
			} catch (error) {
				// Skip invalid token accounts
				continue;
			}
		}
		
		console.log(`WSOL balance for ${address}: ${totalWSOL} SOL`);
		return totalWSOL;
		
	} catch (error) {
		console.error(`Error getting WSOL balance for ${address}:`, error);
		return 0;
	}
}

/**
 * Get SOL balance for a given wallet address
 * Server-side function with Helius RPC access
 */
export async function getServerSOLBalance(address: string, useCache: boolean = true): Promise<number> {
	try {
		console.log(`Fetching vault balance for: ${address}`);
		console.log(`Using cache: ${useCache}`);
		
		// Check cache first
		if (useCache) {
			const cached = balanceCache.get(address);
			if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
				console.log(`Using cached balance: ${cached.totalBalance} SOL`);
				return cached.totalBalance;
			}
		}

		// Create PublicKey object
		const publicKey = new PublicKey(address);
		
		// Fetch native SOL balance in lamports
		const balanceInLamports = await connection.getBalance(publicKey);
		const solBalance = balanceInLamports / LAMPORTS_PER_SOL;
		
		console.log(`Native SOL balance: ${solBalance} SOL`);
		
		// Fetch WSOL balance
		const wsolBalance = await getWSOLBalance(address);
		
		// Total balance is SOL + WSOL
		const totalBalance = solBalance + wsolBalance;
		
		console.log(`Total balance (SOL + WSOL): ${totalBalance} SOL`);
		
		// Update cache
		balanceCache.set(address, {
			solBalance,
			wsolBalance,
			totalBalance,
			timestamp: Date.now(),
			address
		});
		
		return totalBalance;
		
	} catch (error) {
		console.error(`Error fetching SOL balance for ${address}:`, error);
		
		// Return cached data if available, otherwise throw
		const cached = balanceCache.get(address);
		if (cached) {
			console.warn(`Using cached balance data for ${address}`);
			return cached.totalBalance;
		}
		
		throw new Error(`Failed to fetch SOL balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Get detailed balance breakdown including SOL and WSOL
 * Server-side function
 */
export async function getServerDetailedBalance(address: string, useCache: boolean = true) {
	try {
		// Check cache first
		if (useCache) {
			const cached = balanceCache.get(address);
			if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
				return {
					solBalance: cached.solBalance,
					wsolBalance: cached.wsolBalance,
					totalBalance: cached.totalBalance,
					solFormatted: formatSOLAmount(cached.solBalance),
					wsolFormatted: formatSOLAmount(cached.wsolBalance),
					totalFormatted: formatSOLAmount(cached.totalBalance),
					cached: true,
					timestamp: cached.timestamp
				};
			}
		}

		// Create PublicKey object
		const publicKey = new PublicKey(address);
		
		// Fetch native SOL balance in lamports
		const balanceInLamports = await connection.getBalance(publicKey);
		const solBalance = balanceInLamports / LAMPORTS_PER_SOL;
		
		// Fetch WSOL balance
		const wsolBalance = await getWSOLBalance(address);
		
		// Total balance is SOL + WSOL
		const totalBalance = solBalance + wsolBalance;
		
		const timestamp = Date.now();
		
		// Update cache
		balanceCache.set(address, {
			solBalance,
			wsolBalance,
			totalBalance,
			timestamp,
			address
		});
		
		return {
			solBalance,
			wsolBalance,
			totalBalance,
			solFormatted: formatSOLAmount(solBalance),
			wsolFormatted: formatSOLAmount(wsolBalance),
			totalFormatted: formatSOLAmount(totalBalance),
			cached: false,
			timestamp
		};
		
	} catch (error) {
		console.error(`Error fetching detailed balance for ${address}:`, error);
		
		// Return cached data if available, otherwise throw
		const cached = balanceCache.get(address);
		if (cached) {
			console.warn(`Using cached detailed balance data for ${address}`);
			return {
				solBalance: cached.solBalance,
				wsolBalance: cached.wsolBalance,
				totalBalance: cached.totalBalance,
				solFormatted: formatSOLAmount(cached.solBalance),
				wsolFormatted: formatSOLAmount(cached.wsolBalance),
				totalFormatted: formatSOLAmount(cached.totalBalance),
				cached: true,
				timestamp: cached.timestamp
			};
		}
		
		throw new Error(`Failed to fetch detailed balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Format SOL amount for display
 */
function formatSOLAmount(solAmount: number, decimals: number = 2): string {
	return `${solAmount.toFixed(decimals)} SOL`;
}

/**
 * Calculate distribution amounts based on total SOL and predefined percentages
 */
export function calculateDistribution(totalSOL: number) {
	const winnersAmount = totalSOL * 0.5;  // 50% to winners
	const holdingAmount = totalSOL * 0.4;  // 40% to holding wallet
	const charityAmount = totalSOL * 0.1;  // 10% to charity
	
	return {
		total: totalSOL,
		winners: {
			amount: winnersAmount,
			percentage: 50,
			formatted: formatSOLAmount(winnersAmount)
		},
		holding: {
			amount: holdingAmount,
			percentage: 40,
			formatted: formatSOLAmount(holdingAmount)
		},
		charity: {
			amount: charityAmount,
			percentage: 10,
			formatted: formatSOLAmount(charityAmount)
		}
	};
}

/**
 * Get comprehensive vault information including balance and distribution breakdown
 * Server-side function with Helius RPC access
 */
export async function getServerVaultInfo(vaultAddress: string, useCache: boolean = true) {
	try {
		const balance = await getServerSOLBalance(vaultAddress, useCache);
		const distribution = calculateDistribution(balance);
		
		// Calculate winner amounts (7 winners by default)
		const winnersAmount = distribution.winners.amount;
		const perWinnerAmount = winnersAmount / 7;
		
		return {
			address: vaultAddress,
			balance,
			balanceFormatted: formatSOLAmount(balance),
			distribution,
			winnerBreakdown: {
				total: winnersAmount,
				perWinner: perWinnerAmount,
				numberOfWinners: 7,
				totalFormatted: formatSOLAmount(winnersAmount),
				perWinnerFormatted: formatSOLAmount(perWinnerAmount, 3)
			},
			lastUpdated: new Date().toISOString(),
			usingHelius: !!HELIUS_API_KEY
		};
	} catch (error) {
		console.error('Error getting server vault info:', error);
		throw error;
	}
}

/**
 * Health check for Solana connection
 */
export async function checkServerSolanaConnection(): Promise<boolean> {
	try {
		const version = await connection.getVersion();
		return !!version;
	} catch (error) {
		console.error('Server Solana connection health check failed:', error);
		return false;
	}
}

/**
 * Clear server-side balance cache
 */
export function clearServerBalanceCache(address?: string): void {
	if (address) {
		balanceCache.delete(address);
	} else {
		balanceCache.clear();
	}
}