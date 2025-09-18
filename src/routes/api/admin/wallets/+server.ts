import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDistributionWallets } from '$lib/server/solana-distribution-config';
import { getWalletConfig } from '$lib/server/configuration-service';

export const GET: RequestHandler = async () => {
  try {
    // Get wallet configuration from the unified configuration service
    const [walletConfig, distributionWallets] = await Promise.all([
      getWalletConfig(),
      getDistributionWallets()
    ]);
    
    return json({
      success: true,
      wallets: {
        admin: walletConfig.adminWallet,
        holding: distributionWallets.holdingWallet,
        charity: distributionWallets.charityWallet,
        creatorVault: walletConfig.creatorVault,
        coinCreatorVaultAta: walletConfig.coinCreatorVaultAta
      },
      meta: {
        testMode: distributionWallets.testMode,
        holdingWalletName: distributionWallets.holdingWalletName,
        charityWalletName: distributionWallets.charityWalletName,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching wallet configuration:', error);
    return json({ 
      error: 'Failed to fetch wallet configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};