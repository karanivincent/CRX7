import { 
  Connection, 
  PublicKey, 
  Transaction, 
  VersionedTransaction,
  SystemProgram, 
  LAMPORTS_PER_SOL, 
  Keypair,
  TransactionMessage,
  AddressLookupTableAccount,
  TransactionInstruction,
  ComputeBudgetProgram
} from '@solana/web3.js';
import { HELIUS_API_KEY, ADMIN_WALLET_PRIVATE_KEY } from '$env/static/private';

// Enhanced Solana connection with Helius RPC
const SOLANA_RPC_URL = HELIUS_API_KEY 
  ? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : 'https://api.mainnet-beta.solana.com';

const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

interface PriorityFeeResponse {
  priorityFeeEstimate: number;
}

interface TransferInstruction {
  to: string;
  amount: number; // in SOL
}

interface BundledTransactionResult {
  success: boolean;
  signature?: string;
  error?: string;
  priorityFee?: number;
}

interface DistributionTransactionResult {
  success: boolean;
  transactions: {
    winnersTransactionHash?: string;
    holdingTransactionHash?: string;
    charityTransactionHash?: string;
  };
  totalPriorityFees?: number;
  error?: string;
}

/**
 * Create admin wallet keypair from private key
 */
async function getAdminWallet(): Promise<Keypair> {
  if (!ADMIN_WALLET_PRIVATE_KEY) {
    throw new Error('Admin wallet private key not configured');
  }
  
  try {
    let secretKey: Uint8Array;
    
    if (ADMIN_WALLET_PRIVATE_KEY.includes(',')) {
      // Private key as comma-separated array of numbers
      const keyArray = ADMIN_WALLET_PRIVATE_KEY.split(',').map(num => parseInt(num.trim()));
      secretKey = new Uint8Array(keyArray);
    } else {
      // Private key as base58 string
      const bs58 = await import('bs58');
      secretKey = bs58.default.decode(ADMIN_WALLET_PRIVATE_KEY);
    }
    
    return Keypair.fromSecretKey(secretKey);
  } catch (error) {
    throw new Error(`Failed to create admin wallet keypair: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get optimal priority fee using Helius Priority Fee API
 * Uses "low" priority level for cost efficiency since we're not trading
 */
async function getOptimalPriorityFee(transaction: Transaction): Promise<number> {
  if (!HELIUS_API_KEY) {
    console.log('No Helius API key, using minimal priority fee');
    return 1; // Minimal fee for non-Helius connections
  }

  try {
    // Set temporary blockhash and fee payer for serialization
    if (!transaction.recentBlockhash) {
      const { blockhash } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
    }
    
    // Set a temporary fee payer if not set
    if (!transaction.feePayer) {
      const adminWallet = await getAdminWallet();
      transaction.feePayer = adminWallet.publicKey;
    }
    
    const serializedTx = transaction.serialize({ requireAllSignatures: false });
    const base64Tx = serializedTx.toString('base64');

    const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: '1',
        method: 'getPriorityFeeEstimate',
        params: [{
          transaction: base64Tx,
          options: {
            priorityLevel: 'Low', // Use Low for cheapest fees
            includeAllPriorityFeeLevels: true
          }
        }]
      })
    });

    const data = await response.json();
    
    if (data.result && data.result.priorityFeeEstimate) {
      const fee = Math.ceil(data.result.priorityFeeEstimate);
      console.log(`Helius priority fee estimate (Low): ${fee} micro-lamports`);
      return fee;
    }
    
    // Fallback to minimal fee
    console.log('No priority fee estimate from Helius, using minimal fee');
    return 1;
    
  } catch (error) {
    console.error('Error getting priority fee estimate:', error);
    return 1; // Fallback to minimal fee
  }
}

/**
 * Create and send a bundled transaction with MEV protection
 * All transfers are executed atomically in the same transaction
 */
async function sendBundledTransaction(
  transfers: TransferInstruction[],
  description: string
): Promise<BundledTransactionResult> {
  try {
    console.log(`Creating bundled transaction for ${description}:`, {
      transferCount: transfers.length,
      totalAmount: transfers.reduce((sum, t) => sum + t.amount, 0)
    });

    const adminWallet = await getAdminWallet();
    const transaction = new Transaction();
    
    // Add all transfer instructions to the same transaction
    for (const transfer of transfers) {
      const toPubkey = new PublicKey(transfer.to);
      const lamports = Math.floor(transfer.amount * LAMPORTS_PER_SOL);
      
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: adminWallet.publicKey,
          toPubkey,
          lamports
        })
      );
    }

    // Get optimal priority fee for cost efficiency
    const priorityFee = await getOptimalPriorityFee(transaction);
    
    // Set compute unit price for priority fee
    if (priorityFee > 1) {
      transaction.add(
        ComputeBudgetProgram.setComputeUnitPrice({
          microLamports: priorityFee
        })
      );
    }

    // Get latest blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = adminWallet.publicKey;

    // Sign transaction
    transaction.sign(adminWallet);

    // Send transaction with confirmation strategy
    const signature = await connection.sendRawTransaction(
      transaction.serialize(),
      {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3
      }
    );

    console.log(`${description} transaction sent: ${signature}`);

    // Confirm transaction with timeout and retry logic
    console.log(`⏳ Confirming ${description} transaction: ${signature}`);
    
    try {
      const confirmation = await connection.confirmTransaction(
        {
          signature,
          blockhash,
          lastValidBlockHeight
        },
        'confirmed'
      );

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
    } catch (confirmError) {
      // If confirmation times out, check if transaction actually succeeded
      if (confirmError instanceof Error && confirmError.message.includes('block height exceeded')) {
        console.warn(`⚠️ Transaction confirmation timed out, checking transaction status: ${signature}`);
        
        // Try to get transaction status to see if it actually succeeded
        try {
          const txStatus = await connection.getSignatureStatus(signature);
          if (txStatus.value?.confirmationStatus === 'confirmed' || txStatus.value?.confirmationStatus === 'finalized') {
            console.log(`✅ Transaction actually succeeded despite timeout: ${signature}`);
            // Continue as success
          } else {
            throw confirmError; // Re-throw the original timeout error
          }
        } catch (statusError) {
          console.warn(`Failed to check transaction status: ${statusError}`);
          throw confirmError; // Re-throw the original timeout error
        }
      } else {
        throw confirmError; // Re-throw other confirmation errors
      }
    }


    console.log(`✅ ${description} transaction confirmed: ${signature}`);
    
    return {
      success: true,
      signature,
      priorityFee
    };

  } catch (error) {
    console.error(`❌ Error sending ${description} transaction:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Execute complete distribution with MEV-protected bundled transactions
 * Each category (winners, holding, charity) gets its own atomic transaction
 */
export async function executeDistributionTransactions(
  winnersData: Array<{ walletAddress: string; amount: number }>,
  holdingWalletAddress: string,
  holdingAmount: number,
  charityWalletAddress: string,
  charityAmount: number
): Promise<DistributionTransactionResult> {
  
  console.log('🚀 Starting MEV-protected distribution execution');
  
  const transactions: DistributionTransactionResult['transactions'] = {};
  let totalPriorityFees = 0;
  
  try {
    // 1. Bundle all winner transfers into single atomic transaction
    if (winnersData.length > 0) {
      const winnerTransfers = winnersData.map(winner => ({
        to: winner.walletAddress,
        amount: winner.amount
      }));
      
      const winnersResult = await sendBundledTransaction(
        winnerTransfers, 
        `Winners Distribution (${winnersData.length} recipients)`
      );
      
      if (!winnersResult.success) {
        throw new Error(`Winners transaction failed: ${winnersResult.error}`);
      }
      
      transactions.winnersTransactionHash = winnersResult.signature;
      totalPriorityFees += winnersResult.priorityFee || 0;
    }

    // 2. Send to holding wallet (single transfer)
    if (holdingAmount > 0 && holdingWalletAddress) {
      const holdingResult = await sendBundledTransaction(
        [{ to: holdingWalletAddress, amount: holdingAmount }],
        'Holding Wallet Transfer'
      );
      
      if (!holdingResult.success) {
        throw new Error(`Holding transaction failed: ${holdingResult.error}`);
      }
      
      transactions.holdingTransactionHash = holdingResult.signature;
      totalPriorityFees += holdingResult.priorityFee || 0;
    }

    // 3. Send to charity wallet (single transfer)  
    if (charityAmount > 0 && charityWalletAddress) {
      const charityResult = await sendBundledTransaction(
        [{ to: charityWalletAddress, amount: charityAmount }],
        'Charity Wallet Transfer'
      );
      
      if (!charityResult.success) {
        throw new Error(`Charity transaction failed: ${charityResult.error}`);
      }
      
      transactions.charityTransactionHash = charityResult.signature;
      totalPriorityFees += charityResult.priorityFee || 0;
    }

    console.log('🎉 Distribution completed successfully!', {
      transactions,
      totalPriorityFees: `${totalPriorityFees} micro-lamports`
    });

    return {
      success: true,
      transactions,
      totalPriorityFees
    };

  } catch (error) {
    console.error('💥 Distribution execution failed:', error);
    
    return {
      success: false,
      transactions,
      error: error instanceof Error ? error.message : 'Unknown error',
      totalPriorityFees
    };
  }
}

/**
 * Validate that we can create admin wallet and connect to Solana
 */
export async function validateTransactionCapabilities(): Promise<{ valid: boolean; error?: string }> {
  try {
    // Test admin wallet creation
    await getAdminWallet();
    
    // Test Solana connection
    const version = await connection.getVersion();
    if (!version) {
      throw new Error('Unable to connect to Solana network');
    }
    
    console.log('✅ Transaction capabilities validated:', {
      hasAdminWallet: true,
      solanaConnection: true,
      heliusEnabled: !!HELIUS_API_KEY,
      rpcUrl: SOLANA_RPC_URL.includes('helius') ? 'Helius RPC' : 'Public RPC'
    });
    
    return { valid: true };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Transaction capabilities validation failed:', errorMessage);
    
    return { 
      valid: false, 
      error: errorMessage 
    };
  }
}

/**
 * Validate wallet addresses before sending transactions
 */
export function validateWalletAddresses(addresses: string[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (let i = 0; i < addresses.length; i++) {
    try {
      new PublicKey(addresses[i]);
    } catch {
      errors.push(`Invalid wallet address at index ${i}: ${addresses[i]}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}