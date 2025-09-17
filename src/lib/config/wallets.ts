// Client-side wallet configuration for display purposes
import { isTestMode, TEST_WALLETS } from './test-wallets';

export const PRODUCTION_WALLETS = {
  HOLDING_WALLET: 'EgFrJidrBi89nXA8qbBnZ1PMWUPRunX8bA7CWJFhbdEt',
  CHARITY_WALLET: '3ebPj68nRbKQwpRUoHRdZypxKb6b5SHL5vYmAuqf9Bo8'
};

export function getWalletAddresses() {
  // In test mode, use test wallets for holding and charity
  if (isTestMode() && TEST_WALLETS.length >= 2) {
    return {
      holdingWallet: TEST_WALLETS[0].address,
      charityWallet: TEST_WALLETS[1].address,
      holdingWalletName: `${TEST_WALLETS[0].animal.emoji} ${TEST_WALLETS[0].animal.name}`,
      charityWalletName: `${TEST_WALLETS[1].animal.emoji} ${TEST_WALLETS[1].animal.name}`,
      testMode: true
    };
  }
  
  // Production mode - use configured wallets
  return {
    holdingWallet: PRODUCTION_WALLETS.HOLDING_WALLET,
    charityWallet: PRODUCTION_WALLETS.CHARITY_WALLET,
    holdingWalletName: 'Holding Wallet',
    charityWalletName: 'Charity Wallet',
    testMode: false
  };
}

export function truncateWalletAddress(address: string, start = 8, end = 8): string {
  if (address.length <= start + end) {
    return address;
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}