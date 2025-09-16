// Test wallet configuration for development and testing
// These are real wallets owned by the developer for safe testing

export interface TestWallet {
  name: string;
  address: string;
  animal: {
    name: string;
    emoji: string;
  };
  description: string;
}

// Test wallets from environment variables with animal mappings
export const TEST_WALLETS: TestWallet[] = [
  {
    name: "BONKBOT",
    address: "J23vSnmEEqrxMHgbHgA3239xct99A2UbB94q3eaRo3kB",
    animal: {
      name: "BonkBot",
      emoji: "🤖"
    },
    description: "Primary test wallet - BonkBot"
  },
  {
    name: "OLDBULLX", 
    address: "HLMmrzytq2vC8j5ceUgyPrgCQw8JMkodRhUUnzi8gexw",
    animal: {
      name: "Old Bull",
      emoji: "🐂"
    },
    description: "Secondary test wallet - Old BullX"
  },
  {
    name: "NEO16DEC",
    address: "3fQxcChzz6qZTkm79zBSqfRTxZnmbZossLHqCQmTYoyL", 
    animal: {
      name: "Neo December",
      emoji: "🦅"
    },
    description: "Neo wallet from December 16"
  },
  {
    name: "NEOCURRENT",
    address: "HzNsaiyUHAvw7idSyRm85c2xuUvQAM1kjdX333zncMzj",
    animal: {
      name: "Neo Current",
      emoji: "🚀"
    },
    description: "Current Neo wallet"
  },
  {
    name: "W7NEO",
    address: "D3Btk8AqkGdErkbpuuQeZpXDvKrXPXz4PCh1te4UMbNF",
    animal: {
      name: "Neo Seven",
      emoji: "🎯"
    },
    description: "Wallet 7 Neo"
  },
  {
    name: "W5NEO", 
    address: "DMHiyMoKKchuW9bBT2N7anef1NKHYPgPZd6idXkXmjTC",
    animal: {
      name: "Neo Five",
      emoji: "🌟"
    },
    description: "Wallet 5 Neo"
  },
  {
    name: "W2NEO",
    address: "4cDPw3Ge259XUVQTg34t4FL4mDeYgx6zi2kmT5URs49d",
    animal: {
      name: "Neo Two", 
      emoji: "⭐"
    },
    description: "Wallet 2 Neo"
  }
];

// Helper functions for working with test wallets
export function getTestWalletByAddress(address: string): TestWallet | undefined {
  return TEST_WALLETS.find(wallet => wallet.address === address);
}

export function getTestWalletAddresses(): string[] {
  return TEST_WALLETS.map(wallet => wallet.address);
}

export function createTestWinners(prizeAmount: number) {
  return TEST_WALLETS.map((wallet, index) => ({
    address: wallet.address,
    animal: `${wallet.animal.emoji} ${wallet.animal.name}`,
    prizeAmount: prizeAmount,
    testWallet: {
      name: wallet.name,
      description: wallet.description
    }
  }));
}

// Validate that all test wallet addresses are valid Solana addresses
export function validateTestWallets(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const wallet of TEST_WALLETS) {
    try {
      // Basic validation - Solana addresses should be 32-44 characters
      if (wallet.address.length < 32 || wallet.address.length > 44) {
        errors.push(`Invalid address length for ${wallet.name}: ${wallet.address}`);
      }
      
      // Check for valid base58 characters
      const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
      if (!base58Regex.test(wallet.address)) {
        errors.push(`Invalid base58 characters in ${wallet.name}: ${wallet.address}`);
      }
    } catch (error) {
      errors.push(`Error validating ${wallet.name}: ${error}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Get test mode status
export function isTestMode(): boolean {
  // In development, we're always in test mode
  // In production, this could be controlled by an environment variable
  return true; // For now, always test mode during development
}