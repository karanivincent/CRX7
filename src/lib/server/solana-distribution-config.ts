// Distribution configuration for Solana transactions
// This will be moved to environment variables once wallets are configured

export const DISTRIBUTION_WALLETS = {
  // TODO: Set these to actual wallet addresses
  HOLDING_WALLET: 'PLACEHOLDER_HOLDING_WALLET_ADDRESS', // 40% of distribution
  CHARITY_WALLET: 'PLACEHOLDER_CHARITY_WALLET_ADDRESS'  // 10% of distribution
};

// For now, we'll use placeholder addresses that can be easily identified
// In production, these should be actual Solana wallet addresses
export function getDistributionWallets() {
  return {
    holdingWallet: DISTRIBUTION_WALLETS.HOLDING_WALLET,
    charityWallet: DISTRIBUTION_WALLETS.CHARITY_WALLET
  };
}

// Validate that distribution wallets are configured
export function validateDistributionWallets() {
  const wallets = getDistributionWallets();
  
  if (wallets.holdingWallet.includes('PLACEHOLDER')) {
    console.warn('⚠️  Holding wallet is not configured (using placeholder)');
    return false;
  }
  
  if (wallets.charityWallet.includes('PLACEHOLDER')) {
    console.warn('⚠️  Charity wallet is not configured (using placeholder)');
    return false;
  }
  
  return true;
}