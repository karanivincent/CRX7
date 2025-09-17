import { redirect } from '@sveltejs/kit';
import { getVaultInfo } from '$lib/utils/solana-balance';
import { tokenConfig } from '$lib/config/token';

export const load = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	if (!user) {
		redirect(302, '/');
	}

	// Fetch live vault balance for distribution calculations
	let vaultBalance = 0;
	let vaultError = null;
	
	try {
		const vaultInfo = await getVaultInfo(tokenConfig.rewardVault, true);
		vaultBalance = vaultInfo.balance;
	} catch (error) {
		console.error('Failed to fetch vault balance for draw page:', error);
		vaultError = error instanceof Error ? error.message : 'Unknown error';
	}

	return {
		user,
		session,
		vaultBalance,
		vaultError
	};
};