import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, Keypair } from '@solana/web3.js';
import { HELIUS_API_KEY, ADMIN_WALLET_ADDRESS, ADMIN_WALLET_PRIVATE_KEY } from '$env/static/private';
import { getDistributionConfig } from '$lib/config/client';

// Server-side Solana connection with Helius RPC
const SOLANA_RPC_URL = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Create admin wallet keypair from private key
async function getAdminWallet(): Promise<Keypair> {
  if (!ADMIN_WALLET_PRIVATE_KEY) {
    throw new Error('Admin wallet private key not configured');
  }
  
  try {
    // Assume private key is a base58 encoded string or comma-separated array of numbers
    let secretKey: Uint8Array;
    
    if (ADMIN_WALLET_PRIVATE_KEY.includes(',')) {
      // Private key as comma-separated array of numbers
      const keyArray = ADMIN_WALLET_PRIVATE_KEY.split(',').map(num => parseInt(num.trim()));
      secretKey = new Uint8Array(keyArray);
    } else {
      // Private key as base58 string - import bs58 dynamically
      const bs58 = await import('bs58');
      secretKey = bs58.default.decode(ADMIN_WALLET_PRIVATE_KEY);
    }
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error(`Failed to create admin wallet keypair: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

interface DistributionParams {
  totalAmount: number;
  holdingWalletAddress: string;
  charityWalletAddress: string;
  winnersData: Array<{
    walletAddress: string;
    amount: number;
  }>;
}

interface DistributionResult {
  success: boolean;
  transactions: {
    winnersTransactionHash?: string;
    holdingTransactionHash?: string;
    charityTransactionHash?: string;
  };
  error?: string;
}

/**
 * Execute SOL distribution using Helius RPC
 */
export async function executeSOLDistribution(params: DistributionParams): Promise<DistributionResult> {
  try {
    console.log('Starting SOL distribution:', {
      totalAmount: params.totalAmount,
      winnersCount: params.winnersData.length,
      holdingWallet: params.holdingWalletAddress,
      charityWallet: params.charityWalletAddress
    });

    const adminWallet = await getAdminWallet();
    const distributionConfig = getDistributionConfig();
    
    // Calculate distribution amounts
    const winnersAmount = params.totalAmount * (distributionConfig.winnersPercentage / 100);
    const holdingAmount = params.totalAmount * (distributionConfig.holdingPercentage / 100);
    const charityAmount = params.totalAmount * (distributionConfig.charityPercentage / 100);

    const transactions: DistributionResult['transactions'] = {};

    // 1. Send SOL to winners
    if (params.winnersData.length > 0) {
      console.log(`Sending ${winnersAmount} SOL to ${params.winnersData.length} winners`);
      
      const winnersTransaction = new Transaction();
      
      // Add transfer instruction for each winner
      for (const winner of params.winnersData) {
        const winnerPubkey = new PublicKey(winner.walletAddress);
        const lamports = Math.floor(winner.amount * LAMPORTS_PER_SOL);
        
        winnersTransaction.add(
          SystemProgram.transfer({
            fromPubkey: adminWallet.publicKey,
            toPubkey: winnerPubkey,
            lamports
          })
        );
      }

      // Get recent blockhash and send transaction
      const { blockhash } = await connection.getLatestBlockhash();
      winnersTransaction.recentBlockhash = blockhash;
      winnersTransaction.feePayer = adminWallet.publicKey;

      // Sign and send winners transaction
      winnersTransaction.sign(adminWallet);
      const winnersSignature = await connection.sendRawTransaction(winnersTransaction.serialize());
      await connection.confirmTransaction(winnersSignature);
      
      transactions.winnersTransactionHash = winnersSignature;
      console.log('Winners transaction confirmed:', winnersSignature);
    }

    // 2. Send SOL to holding wallet
    if (holdingAmount > 0 && params.holdingWalletAddress) {
      console.log(`Sending ${holdingAmount} SOL to holding wallet`);
      
      const holdingTransaction = new Transaction();
      const holdingPubkey = new PublicKey(params.holdingWalletAddress);
      const lamports = Math.floor(holdingAmount * LAMPORTS_PER_SOL);
      
      holdingTransaction.add(
        SystemProgram.transfer({
          fromPubkey: adminWallet.publicKey,
          toPubkey: holdingPubkey,
          lamports
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      holdingTransaction.recentBlockhash = blockhash;
      holdingTransaction.feePayer = adminWallet.publicKey;

      holdingTransaction.sign(adminWallet);
      const holdingSignature = await connection.sendRawTransaction(holdingTransaction.serialize());
      await connection.confirmTransaction(holdingSignature);
      
      transactions.holdingTransactionHash = holdingSignature;
      console.log('Holding transaction confirmed:', holdingSignature);
    }

    // 3. Send SOL to charity wallet
    if (charityAmount > 0 && params.charityWalletAddress) {
      console.log(`Sending ${charityAmount} SOL to charity wallet`);
      
      const charityTransaction = new Transaction();
      const charityPubkey = new PublicKey(params.charityWalletAddress);
      const lamports = Math.floor(charityAmount * LAMPORTS_PER_SOL);
      
      charityTransaction.add(
        SystemProgram.transfer({
          fromPubkey: adminWallet.publicKey,
          toPubkey: charityPubkey,
          lamports
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      charityTransaction.recentBlockhash = blockhash;
      charityTransaction.feePayer = adminWallet.publicKey;

      charityTransaction.sign(adminWallet);
      const charitySignature = await connection.sendRawTransaction(charityTransaction.serialize());
      await connection.confirmTransaction(charitySignature);
      
      transactions.charityTransactionHash = charitySignature;
      console.log('Charity transaction confirmed:', charitySignature);
    }

    console.log('Distribution completed successfully:', transactions);

    return {
      success: true,
      transactions
    };

  } catch (error) {
    console.error('Error executing SOL distribution:', error);
    return {
      success: false,
      transactions: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate wallet addresses before distribution
 */
export function validateDistributionAddresses(params: DistributionParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate admin wallet
  try {
    new PublicKey(ADMIN_WALLET_ADDRESS);
  } catch {
    errors.push('Invalid admin wallet address');
  }

  // Validate holding wallet
  if (params.holdingWalletAddress) {
    try {
      new PublicKey(params.holdingWalletAddress);
    } catch {
      errors.push('Invalid holding wallet address');
    }
  }

  // Validate charity wallet
  if (params.charityWalletAddress) {
    try {
      new PublicKey(params.charityWalletAddress);
    } catch {
      errors.push('Invalid charity wallet address');
    }
  }

  // Validate winner addresses
  for (let i = 0; i < params.winnersData.length; i++) {
    try {
      new PublicKey(params.winnersData[i].walletAddress);
    } catch {
      errors.push(`Invalid winner wallet address at index ${i}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}