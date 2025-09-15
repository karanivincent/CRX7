import { redirect } from '@sveltejs/kit';
import { getVaultInfo, getDetailedBalance } from '$lib/utils/solana-balance';
import { tokenConfig } from '$lib/config/token';

export const load = async ({ locals }) => {
	// Get session without requiring database for admin access
	const { session, user } = await locals.safeGetSession();
	
	if (!user) {
		redirect(302, '/auth/login');
	}

	// Fetch initial vault data
	let vaultData = null;
	try {
		const vaultInfo = await getVaultInfo(tokenConfig.rewardVault, true);
		const detailedBalance = await getDetailedBalance(tokenConfig.rewardVault, true);
		
		vaultData = {
			balance: vaultInfo.balance,
			balanceFormatted: vaultInfo.balanceFormatted,
			distribution: vaultInfo.distribution,
			winnerBreakdown: vaultInfo.winnerBreakdown,
			lastUpdated: vaultInfo.lastUpdated,
			address: vaultInfo.address,
			breakdown: {
				solBalance: detailedBalance.solBalance,
				wsolBalance: detailedBalance.wsolBalance,
				totalBalance: detailedBalance.totalBalance,
				solFormatted: detailedBalance.solFormatted,
				wsolFormatted: detailedBalance.wsolFormatted,
				totalFormatted: detailedBalance.totalFormatted
			}
		};
	} catch (error) {
		console.error('Failed to load initial vault data:', error);
		// Continue with null vault data, component will handle the error state
	}

	// For now, any logged-in user can access admin
	// Later we can add role-based access control
	return {
		user,
		session,
		vaultData
	};
};