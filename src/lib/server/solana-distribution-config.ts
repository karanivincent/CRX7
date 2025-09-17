// Distribution configuration for Solana transactions
import { TEST_WALLETS, isTestMode, useTestDistributionWallets } from '../config/test-wallets';

export const DISTRIBUTION_WALLETS = {
  // Production wallet addresses from environment variables
  HOLDING_WALLET: 'EgFrJidrBi89nXA8qbBnZ1PMWUPRunX8bA7CWJFhbdEt', // 40% of distribution
  CHARITY_WALLET: '3ebPj68nRbKQwpRUoHRdZypxKb6b5SHL5vYmAuqf9Bo8'  // 10% of distribution
};

// Get distribution wallets based on current mode (test vs production)
export function getDistributionWallets() {
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
  
  // Use real distribution wallets (default behavior)
  console.log('💰 Using real holding and charity wallets');
  return {
    holdingWallet: DISTRIBUTION_WALLETS.HOLDING_WALLET,
    charityWallet: DISTRIBUTION_WALLETS.CHARITY_WALLET,
    testMode: false,
    holdingWalletName: 'Holding Wallet',
    charityWalletName: 'Charity Wallet'
  };
}

// Validate that distribution wallets are configured
export function validateDistributionWallets() {
  const wallets = getDistributionWallets();
  
  // In test distribution mode, always valid if we have test wallets
  if (wallets.testMode) {
    console.log('✅ Using test mode distribution wallets:', {
      holding: wallets.holdingWalletName,
      charity: wallets.charityWalletName
    });
    return true;
  }
  
  // Real wallet validation
  if (wallets.holdingWallet.includes('PLACEHOLDER')) {
    console.warn('⚠️  Holding wallet is not configured (using placeholder)');
    return false;
  }
  
  if (wallets.charityWallet.includes('PLACEHOLDER')) {
    console.warn('⚠️  Charity wallet is not configured (using placeholder)');
    return false;
  }
  
  console.log('✅ Using real distribution wallets:', {
    holding: `${wallets.holdingWallet.slice(0, 8)}...${wallets.holdingWallet.slice(-8)}`,
    charity: `${wallets.charityWallet.slice(0, 8)}...${wallets.charityWallet.slice(-8)}`
  });
  
  return true;
}