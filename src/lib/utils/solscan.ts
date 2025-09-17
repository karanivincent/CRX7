/**
 * Utility functions for Solscan integration
 */

/**
 * Generate Solscan transaction URL
 */
export function getSolscanTxUrl(signature: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const baseUrl = cluster === 'mainnet' ? 'https://solscan.io' : 'https://solscan.io/?cluster=devnet';
  return `${baseUrl}/tx/${signature}`;
}

/**
 * Generate Solscan account URL
 */
export function getSolscanAccountUrl(address: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const baseUrl = cluster === 'mainnet' ? 'https://solscan.io' : 'https://solscan.io/?cluster=devnet';
  return `${baseUrl}/account/${address}`;
}

/**
 * Generate Solscan token URL
 */
export function getSolscanTokenUrl(address: string, cluster: 'mainnet' | 'devnet' = 'mainnet'): string {
  const baseUrl = cluster === 'mainnet' ? 'https://solscan.io' : 'https://solscan.io/?cluster=devnet';
  return `${baseUrl}/token/${address}`;
}

/**
 * Format transaction hash for display (truncated)
 */
export function formatTxHash(hash: string, start: number = 8, end: number = 8): string {
  if (hash.length <= start + end) {
    return hash;
  }
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}

/**
 * Check if a string is a valid Solana transaction signature
 */
export function isValidSolanaSignature(signature: string): boolean {
  // Solana signatures are base58 encoded and typically 87-88 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return signature.length >= 80 && signature.length <= 90 && base58Regex.test(signature);
}

/**
 * Check if a string is a valid Solana wallet address  
 */
export function isValidSolanaAddress(address: string): boolean {
  // Solana addresses are base58 encoded and typically 32-44 characters long
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return address.length >= 32 && address.length <= 44 && base58Regex.test(address);
}

/**
 * Format wallet address for display (truncated)
 */
export function formatWalletAddress(address: string, start: number = 6, end: number = 4): string {
  if (address.length <= start + end) {
    return address;
  }
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Get status info for transaction display
 */
export function getTransactionStatus(transactionHash?: string, paidAt?: string) {
  if (transactionHash) {
    return {
      status: 'paid',
      color: 'green',
      icon: 'mdi:check-circle',
      label: 'Paid',
      url: getSolscanTxUrl(transactionHash),
      tooltip: `Paid - View transaction: ${formatTxHash(transactionHash)}`
    };
  } else if (paidAt) {
    return {
      status: 'processed',
      color: 'yellow',
      icon: 'mdi:check',
      label: 'Processed',
      url: null,
      tooltip: 'Payment processed but transaction not recorded'
    };
  } else {
    return {
      status: 'pending',
      color: 'gray',
      icon: 'mdi:clock-outline',
      label: 'Pending',
      url: null,
      tooltip: 'Payment pending'
    };
  }
}

/**
 * Copy text to clipboard with error handling
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    // Fallback for older browsers
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackError) {
      console.error('Fallback copy failed:', fallbackError);
      return false;
    }
  }
}