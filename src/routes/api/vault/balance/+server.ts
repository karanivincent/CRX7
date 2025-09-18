import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCombinedVaultInfo, getCombinedDetailedBalance, checkServerSolanaConnection } from '$lib/server/solana-server';
import { getServerTokenConfig } from '$lib/config/token';

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Get configuration from database/environment
		const tokenConfig = await getServerTokenConfig();
		
		// Check if we should bypass cache
		const forceRefresh = url.searchParams.get('refresh') === 'true';
		const useCache = !forceRefresh;

		console.log(`Fetching combined vault balance from:`);
		console.log(`  Creator Vault: ${tokenConfig.creatorVault}`);
		console.log(`  Coin Creator Vault ATA: ${tokenConfig.coinCreatorVaultAta}`);
		console.log(`Using cache: ${useCache}`);

		// First check if Solana connection is healthy
		const connectionHealthy = await checkServerSolanaConnection();
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

		// Get combined vault information and detailed balance breakdown
		const vaultInfo = await getCombinedVaultInfo(tokenConfig.creatorVault, tokenConfig.coinCreatorVaultAta, useCache);
		const detailedBalance = await getCombinedDetailedBalance(tokenConfig.creatorVault, tokenConfig.coinCreatorVaultAta, useCache);

		// Return comprehensive vault data
		return json({
			success: true,
			vault: {
				// Use combined address info for backwards compatibility
				address: `${tokenConfig.creatorVault} + ${tokenConfig.coinCreatorVaultAta}`,
				balance: vaultInfo.combinedBalance,
				balanceFormatted: vaultInfo.combinedBalanceFormatted,
				lastUpdated: vaultInfo.lastUpdated,
				cached: vaultInfo.cached,
				breakdown: {
					solBalance: detailedBalance.solBalance,
					wsolBalance: detailedBalance.wsolBalance,
					totalBalance: detailedBalance.totalBalance,
					solFormatted: detailedBalance.solFormatted,
					wsolFormatted: detailedBalance.wsolFormatted,
					totalFormatted: detailedBalance.totalFormatted
				},
				// Add individual vault breakdown for transparency
				vaultBreakdown: {
					creatorVault: vaultInfo.vaultBreakdown.creatorVault,
					coinCreatorVaultAta: vaultInfo.vaultBreakdown.coinCreatorVaultAta
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
				creatorVaultAddress: tokenConfig.creatorVault,
				coinCreatorVaultAtaAddress: tokenConfig.coinCreatorVaultAta,
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
					address: 'Unavailable',
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
		// Get configuration from database/environment
		const tokenConfig = await getServerTokenConfig();
		
		console.log('Manual combined vault balance refresh requested');
		
		// Force refresh by bypassing cache
		const vaultInfo = await getCombinedVaultInfo(tokenConfig.creatorVault, tokenConfig.coinCreatorVaultAta, false);
		
		return json({
			success: true,
			message: 'Combined vault balance refreshed successfully',
			vault: {
				address: `${tokenConfig.creatorVault} + ${tokenConfig.coinCreatorVaultAta}`,
				balance: vaultInfo.combinedBalance,
				balanceFormatted: vaultInfo.combinedBalanceFormatted,
				lastUpdated: vaultInfo.lastUpdated,
				vaultBreakdown: vaultInfo.vaultBreakdown
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