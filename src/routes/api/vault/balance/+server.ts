import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVaultInfo, getDetailedBalance, checkSolanaConnection } from '$lib/utils/solana-balance';
import { tokenConfig } from '$lib/config/token';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Check if we should bypass cache
		const forceRefresh = url.searchParams.get('refresh') === 'true';
		const useCache = !forceRefresh;

		console.log(`Fetching vault balance for: ${tokenConfig.rewardVault}`);
		console.log(`Using cache: ${useCache}`);

		// First check if Solana connection is healthy
		const connectionHealthy = await checkSolanaConnection();
		if (!connectionHealthy) {
			return json(
				{
					success: false,
					error: 'Solana connection unavailable',
					message: 'Unable to connect to Solana network'
				},
				{ status: 503 }
			);
		}

		// Get vault information and detailed balance breakdown
		const vaultInfo = await getVaultInfo(tokenConfig.rewardVault, useCache);
		const detailedBalance = await getDetailedBalance(tokenConfig.rewardVault, useCache);

		// Return comprehensive vault data
		return json({
			success: true,
			vault: {
				address: vaultInfo.address,
				balance: vaultInfo.balance,
				balanceFormatted: vaultInfo.balanceFormatted,
				lastUpdated: vaultInfo.lastUpdated,
				cached: vaultInfo.cached,
				breakdown: {
					solBalance: detailedBalance.solBalance,
					wsolBalance: detailedBalance.wsolBalance,
					totalBalance: detailedBalance.totalBalance,
					solFormatted: detailedBalance.solFormatted,
					wsolFormatted: detailedBalance.wsolFormatted,
					totalFormatted: detailedBalance.totalFormatted
				}
			},
			distribution: {
				total: vaultInfo.distribution.total,
				winners: {
					amount: vaultInfo.distribution.winners.amount,
					percentage: vaultInfo.distribution.winners.percentage,
					formatted: vaultInfo.distribution.winners.formatted,
					breakdown: {
						totalWinners: vaultInfo.winnerBreakdown.numberOfWinners,
						perWinner: vaultInfo.winnerBreakdown.perWinner,
						perWinnerFormatted: vaultInfo.winnerBreakdown.perWinnerFormatted
					}
				},
				holding: {
					amount: vaultInfo.distribution.holding.amount,
					percentage: vaultInfo.distribution.holding.percentage,
					formatted: vaultInfo.distribution.holding.formatted
				},
				charity: {
					amount: vaultInfo.distribution.charity.amount,
					percentage: vaultInfo.distribution.charity.percentage,
					formatted: vaultInfo.distribution.charity.formatted
				}
			},
			meta: {
				rewardVaultAddress: tokenConfig.rewardVault,
				holdingWalletAddress: tokenConfig.holdingWallet,
				charityWalletAddress: tokenConfig.charityWallet,
				adminWalletAddress: tokenConfig.adminWallet,
				cached: vaultInfo.cached,
				refreshUrl: '/api/vault/balance?refresh=true'
			}
		});

	} catch (error) {
		console.error('Error fetching vault balance:', error);
		
		return json(
			{
				success: false,
				error: 'Failed to fetch vault balance',
				message: error instanceof Error ? error.message : 'Unknown error occurred',
				vault: {
					address: tokenConfig.rewardVault,
					balance: 0,
					balanceFormatted: '0.00 SOL',
					lastUpdated: new Date().toISOString(),
					cached: false
				}
			},
			{ status: 500 }
		);
	}
};

// Optional POST endpoint to manually refresh vault balance
export const POST: RequestHandler = async () => {
	try {
		console.log('Manual vault balance refresh requested');
		
		// Force refresh by bypassing cache
		const vaultInfo = await getVaultInfo(tokenConfig.rewardVault, false);
		
		return json({
			success: true,
			message: 'Vault balance refreshed successfully',
			vault: {
				address: vaultInfo.address,
				balance: vaultInfo.balance,
				balanceFormatted: vaultInfo.balanceFormatted,
				lastUpdated: vaultInfo.lastUpdated
			}
		});
		
	} catch (error) {
		console.error('Error manually refreshing vault balance:', error);
		
		return json(
			{
				success: false,
				error: 'Failed to refresh vault balance',
				message: error instanceof Error ? error.message : 'Unknown error occurred'
			},
			{ status: 500 }
		);
	}
};