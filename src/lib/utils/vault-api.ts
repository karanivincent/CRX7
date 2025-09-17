/**
 * Client-side API wrapper for vault balance operations
 * This replaces direct Solana RPC calls with server-side API calls
 */

export interface VaultInfo {
	address: string;
	balance: number;
	balanceFormatted: string;
	lastUpdated: string;
	cached: boolean;
	breakdown: {
		solBalance: number;
		wsolBalance: number;
		totalBalance: number;
		solFormatted: string;
		wsolFormatted: string;
		totalFormatted: string;
	};
	// Optional vault breakdown for combined vaults
	vaultBreakdown?: {
		creatorVault: {
			address: string;
			balance: number;
			balanceFormatted: string;
		};
		coinCreatorVaultAta: {
			address: string;
			balance: number;
			balanceFormatted: string;
		};
	};
}

export interface VaultDistribution {
	total: number;
	winners: {
		amount: number;
		percentage: number;
		formatted: string;
		breakdown: {
			totalWinners: number;
			perWinner: number;
			perWinnerFormatted: string;
		};
	};
	holding: {
		amount: number;
		percentage: number;
		formatted: string;
	};
	charity: {
		amount: number;
		percentage: number;
		formatted: string;
	};
}

export interface VaultApiResponse {
	success: boolean;
	vault: VaultInfo;
	distribution: VaultDistribution;
	meta: {
		creatorVaultAddress?: string;
		coinCreatorVaultAtaAddress?: string;
		// Keep for backwards compatibility
		rewardVaultAddress?: string;
		holdingWalletAddress: string;
		charityWalletAddress: string;
		adminWalletAddress: string;
		cached: boolean;
		refreshUrl: string;
	};
	error?: string;
	message?: string;
}

/**
 * Fetch vault balance and distribution info from server-side API
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise<VaultApiResponse>
 */
export async function fetchVaultInfo(useCache: boolean = true): Promise<VaultApiResponse> {
	try {
		const url = `/api/vault/balance${useCache ? '' : '?refresh=true'}`;
		
		const response = await fetch(url);
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			throw new Error(data.message || data.error || 'Failed to fetch vault info');
		}
		
		return data;
	} catch (error) {
		console.error('Error fetching vault info:', error);
		throw new Error(`Failed to fetch vault balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Refresh vault balance by forcing a new fetch from the blockchain
 * @returns Promise<VaultApiResponse>
 */
export async function refreshVaultInfo(): Promise<VaultApiResponse> {
	try {
		const response = await fetch('/api/vault/balance', {
			method: 'POST'
		});
		
		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}
		
		const data = await response.json();
		
		if (!data.success) {
			throw new Error(data.message || data.error || 'Failed to refresh vault info');
		}
		
		// Convert POST response format to match GET response format
		return {
			success: true,
			vault: data.vault,
			distribution: {} as VaultDistribution, // POST doesn't return distribution
			meta: {} as any // POST doesn't return meta
		};
	} catch (error) {
		console.error('Error refreshing vault info:', error);
		throw new Error(`Failed to refresh vault balance: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Get just the balance amount (for compatibility with existing code)
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise<number> - Balance in SOL
 */
export async function getVaultBalance(useCache: boolean = true): Promise<number> {
	const vaultInfo = await fetchVaultInfo(useCache);
	return vaultInfo.vault.balance;
}

/**
 * Get distribution amounts based on current vault balance
 * @param useCache - Whether to use cached data (default: true)
 * @returns Promise with distribution breakdown
 */
export async function getVaultDistribution(useCache: boolean = true) {
	const vaultInfo = await fetchVaultInfo(useCache);
	return vaultInfo.distribution;
}

/**
 * Format SOL amount for display (utility function)
 * @param solAmount - Amount in SOL
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with SOL suffix
 */
export function formatSOLAmount(solAmount: number, decimals: number = 2): string {
	return `${solAmount.toFixed(decimals)} SOL`;
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