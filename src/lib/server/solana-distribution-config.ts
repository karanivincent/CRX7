// Distribution configuration for Solana transactions
import { TEST_WALLETS, isTestMode } from '../config/test-wallets';

export const DISTRIBUTION_WALLETS = {
  // Production wallet addresses (to be configured)
  HOLDING_WALLET: 'PLACEHOLDER_HOLDING_WALLET_ADDRESS', // 40% of distribution
  CHARITY_WALLET: 'PLACEHOLDER_CHARITY_WALLET_ADDRESS'  // 10% of distribution
};

// Get distribution wallets based on current mode (test vs production)
export function getDistributionWallets() {
  // In test mode, use test wallets for holding and charity
  if (isTestMode() && TEST_WALLETS.length >= 2) {
    return {
      holdingWallet: TEST_WALLETS[0].address, // Use BonkBot for holding
      charityWallet: TEST_WALLETS[1].address, // Use OldBullX for charity
      testMode: true,
      holdingWalletName: TEST_WALLETS[0].name,
      charityWalletName: TEST_WALLETS[1].name
    };
  }
  
  // Production mode - use configured wallets
  return {
    holdingWallet: DISTRIBUTION_WALLETS.HOLDING_WALLET,
    charityWallet: DISTRIBUTION_WALLETS.CHARITY_WALLET,
    testMode: false
  };
}

// Validate that distribution wallets are configured
export function validateDistributionWallets() {
  const wallets = getDistributionWallets();
  
  // In test mode, always valid if we have test wallets
  if (wallets.testMode) {
    console.log('✅ Using test mode distribution wallets:', {
      holding: wallets.holdingWalletName,
      charity: wallets.charityWalletName
    });
    return true;
  }
  
  // Production mode validation
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