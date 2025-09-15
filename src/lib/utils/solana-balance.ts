import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAccount } from '@solana/spl-token';

// Solana RPC connection configuration
const SOLANA_RPC_URL = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Wrapped SOL mint address
const WSOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');

// Cache for balance data to avoid excessive RPC calls
interface BalanceCache {
	solBalance: number;
	wsolBalance: number;
	totalBalance: number;
	timestamp: number;
	address: string;
}

const balanceCache = new Map<string, BalanceCache>();
const CACHE_DURATION = 30000; // 30 seconds in milliseconds

/**
 * Get WSOL (Wrapped SOL) balance for a given wallet address
 * @param address - Solana wallet address (base58 string)
 * @returns Promise<number> - WSOL balance in SOL units
 */
async function getWSOLBalance(address: string): Promise<number> {
	try {
		const publicKey = new PublicKey(address);
		
		// Check all token accounts owned by this address for WSOL
		// Skip the associated token account check to avoid the off-curve error
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
		
		return totalWSOL;
		
	} catch (error) {
		console.warn(`Error getting WSOL balance for ${address}:`, error);
		return 0;
	}
}

/**
 * Get SOL balance for a given wallet address
 * @param address - Solana wallet address (base58 string)
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise<number> - Balance in SOL (not lamports)
 */
export async function getSOLBalance(address: string, useCache: boolean = true): Promise<number> {
	try {
		// Check cache first
		if (useCache) {
			const cached = balanceCache.get(address);
			if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
				return cached.totalBalance;
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
 * @param address - Solana wallet address (base58 string)
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise with detailed balance breakdown
 */
export async function getDetailedBalance(address: string, useCache: boolean = true) {
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
					cached: true
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
		
		// Update cache
		balanceCache.set(address, {
			solBalance,
			wsolBalance,
			totalBalance,
			timestamp: Date.now(),
			address
		});
		
		return {
			solBalance,
			wsolBalance,
			totalBalance,
			solFormatted: formatSOLAmount(solBalance),
			wsolFormatted: formatSOLAmount(wsolBalance),
			totalFormatted: formatSOLAmount(totalBalance),
			cached: false
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
				cached: true
			};
		}
		
		throw new Error(`Failed to fetch detailed balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Format SOL amount for display
 * @param solAmount - Amount in SOL
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with SOL suffix
 */
export function formatSOLAmount(solAmount: number, decimals: number = 2): string {
	return `${solAmount.toFixed(decimals)} SOL`;
}

/**
 * Format lamports to SOL display
 * @param lamports - Amount in lamports
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with SOL suffix
 */
export function formatLamportsToSOL(lamports: number, decimals: number = 2): string {
	const solAmount = lamports / LAMPORTS_PER_SOL;
	return formatSOLAmount(solAmount, decimals);
}

/**
 * Calculate distribution amounts based on total SOL and predefined percentages
 * @param totalSOL - Total SOL amount to distribute
 * @returns Object with calculated amounts for each category
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
 * Calculate individual winner amounts based on total winners amount and number of winners
 * @param totalWinnersAmount - Total SOL allocated to winners
 * @param numberOfWinners - Number of winners (default: 7)
 * @returns Object with total and per-winner amounts
 */
export function calculateWinnerAmounts(totalWinnersAmount: number, numberOfWinners: number = 7) {
	const perWinnerAmount = totalWinnersAmount / numberOfWinners;
	
	return {
		total: totalWinnersAmount,
		perWinner: perWinnerAmount,
		numberOfWinners,
		totalFormatted: formatSOLAmount(totalWinnersAmount),
		perWinnerFormatted: formatSOLAmount(perWinnerAmount, 3) // More precision for individual amounts
	};
}

/**
 * Get comprehensive vault information including balance and distribution breakdown
 * @param vaultAddress - Reward vault address
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise with vault balance and distribution calculations
 */
export async function getVaultInfo(vaultAddress: string, useCache: boolean = true) {
	try {
		// Check if we had cached data before the call
		const hadCachedData = useCache && balanceCache.has(vaultAddress) && 
			balanceCache.get(vaultAddress)!.timestamp + CACHE_DURATION > Date.now();
		
		const balance = await getSOLBalance(vaultAddress, useCache);
		const distribution = calculateDistribution(balance);
		const winnerBreakdown = calculateWinnerAmounts(distribution.winners.amount);
		
		return {
			address: vaultAddress,
			balance,
			balanceFormatted: formatSOLAmount(balance),
			distribution,
			winnerBreakdown,
			lastUpdated: new Date().toISOString(),
			cached: hadCachedData
		};
	} catch (error) {
		console.error('Error getting vault info:', error);
		throw error;
	}
}

/**
 * Clear balance cache for a specific address or all addresses
 * @param address - Optional specific address to clear, if not provided clears all
 */
export function clearBalanceCache(address?: string): void {
	if (address) {
		balanceCache.delete(address);
	} else {
		balanceCache.clear();
	}
}

/**
 * Get cache information for debugging
 * @returns Array of cached balance information
 */
export function getCacheInfo(): BalanceCache[] {
	return Array.from(balanceCache.values());
}

/**
 * Health check for Solana connection
 * @returns Promise<boolean> - True if connection is healthy
 */
export async function checkSolanaConnection(): Promise<boolean> {
	try {
		const version = await connection.getVersion();
		return !!version;
	} catch (error) {
		console.error('Solana connection health check failed:', error);
		return false;
	}
}