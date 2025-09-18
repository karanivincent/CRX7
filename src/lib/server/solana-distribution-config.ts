// Distribution configuration for Solana transactions
import { TEST_WALLETS, useTestDistributionWallets } from '../config/test-wallets';
import { getWalletConfig } from './configuration-service';

// Get distribution wallets based on current mode (test vs production)
export async function getDistributionWallets() {
  // Check if we should use test wallets for distribution destinations
  if (useTestDistributionWallets() && TEST_WALLETS.length >= 2) {
    console.log('🧪 Using test wallets for holding/charity distribution');
    return {
      holdingWallet: TEST_WALLETS[0].address, // Use BonkBot for holding
      charityWallet: TEST_WALLETS[1].address, // Use OldBullX for charity
      testMode: true,
      holdingWalletName: TEST_WALLETS[0].name,
      charityWalletName: TEST_WALLETS[1].name
    };
  }

  // Use real distribution wallets from configuration service (database -> env fallback)
  console.log('💰 Using configured holding and charity wallets from database/environment');
  const walletConfig = await getWalletConfig();
  
  return {
    holdingWallet: walletConfig.holdingWallet,
    charityWallet: walletConfig.charityWallet,
    testMode: false,
    holdingWalletName: 'Holding Wallet',
    charityWalletName: 'Charity Wallet'
  };
}

// Validate that distribution wallets are configured
export async function validateDistributionWallets() {
  const wallets = await getDistributionWallets();

  // In test distribution mode, always valid if we have test wallets
  if (wallets.testMode) {
    console.log('✅ Using test mode distribution wallets:', {
      holding: wallets.holdingWalletName,
      charity: wallets.charityWalletName
    });
    return true;
  }

  // Real wallet validation
  if (wallets.holdingWallet.includes('PLACEHOLDER') || !wallets.holdingWallet.trim()) {
    console.warn('⚠️  Holding wallet is not configured (missing or placeholder)');
    return false;
  }

  if (wallets.charityWallet.includes('PLACEHOLDER') || !wallets.charityWallet.trim()) {
    console.warn('⚠️  Charity wallet is not configured (missing or placeholder)');
    return false;
  }

  console.log('✅ Using real distribution wallets:', {
    holding: `${wallets.holdingWallet.slice(0, 8)}...${wallets.holdingWallet.slice(-8)}`,
    charity: `${wallets.charityWallet.slice(0, 8)}...${wallets.charityWallet.slice(-8)}`
  });

  return true;
}