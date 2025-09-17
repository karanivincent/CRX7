import { getDistributionConfig } from '$lib/config/client';
import { getDistributionWallets, validateDistributionWallets } from './solana-distribution-config';
import { supabase } from '$lib/db/index';
import { executeDistributionTransactions, validateTransactionCapabilities } from './solana-transaction-service';
import { ADMIN_WALLET_PRIVATE_KEY } from '$env/static/private';

interface DistributionResult {
  success: boolean;
  simulation: boolean;
  transactions: {
    winnersTransactionHash?: string;
    holdingTransactionHash?: string;
    charityTransactionHash?: string;
  };
  error?: string;
  winnersCount?: number;
  totalDistributed?: number;
}

/**
 * Execute distribution using real Solana transactions with MEV protection
 * Falls back to simulation mode only when private keys are not configured
 */
export async function executeDistribution(
  totalAmount: number,
  adminWalletAddress: string,
  winnersData?: Array<{ walletAddress: string; amount: number }>
): Promise<DistributionResult> {
  try {
    console.log('Starting distribution execution:', {
      totalAmount,
      adminWallet: adminWalletAddress
    });

    const distributionConfig = getDistributionConfig();
    const distributionWallets = getDistributionWallets();
    
    // Check if real wallets and private keys are configured
    const walletsConfigured = validateDistributionWallets();
    const privateKeyConfigured = !!ADMIN_WALLET_PRIVATE_KEY;
    const canExecuteRealTransactions = walletsConfigured && privateKeyConfigured;
    
    // Validate transaction capabilities if we can execute real transactions
    if (canExecuteRealTransactions) {
      const validation = await validateTransactionCapabilities();
      if (!validation.valid) {
        throw new Error(`Transaction validation failed: ${validation.error}`);
      }
    }
    
    // Calculate distribution amounts
    const winnersAmount = totalAmount * (distributionConfig.winnersPercentage / 100);
    const holdingAmount = totalAmount * (distributionConfig.holdingPercentage / 100);
    const charityAmount = totalAmount * (distributionConfig.charityPercentage / 100);

    // Get pending winners from database with draw information
    const { data: pendingWinners, error: winnersError } = await supabase
      .from('winner')
      .select(`
        *,
        draw!inner(id, draw_number)
      `)
      .is('transaction_hash', null)
      .order('won_at');

    if (winnersError) {
      throw winnersError;
    }

    console.log(`Found ${pendingWinners.length} pending winners for distribution`);

    if (pendingWinners.length === 0) {
      return {
        success: false,
        simulation: true,
        transactions: {},
        error: 'No pending winners found for distribution'
      };
    }

    // Use provided winner amounts or calculate default amount per winner
    let winnerAmountMap: Map<string, number> = new Map();
    let amountPerWinner = winnersAmount / pendingWinners.length; // Default fallback
    
    if (winnersData && winnersData.length > 0) {
      // Use manually specified amounts
      winnersData.forEach(wd => {
        winnerAmountMap.set(wd.walletAddress, wd.amount);
      });
      console.log('Using manually specified winner amounts:', winnersData);
    } else {
      // Use equal distribution as fallback
      pendingWinners.forEach(winner => {
        winnerAmountMap.set(winner.wallet_address, amountPerWinner);
      });
      console.log(`Using equal distribution: ${amountPerWinner} SOL per winner`);
    }

    // Get round information from the first pending winner (all should be from same round)
    const roundInfo = pendingWinners.length > 0 ? pendingWinners[0].draw : null;
    
    // Create distribution history record
    const historyRecord = {
      total_amount: totalAmount.toString(),
      winners_amount: winnersAmount.toString(),
      holding_amount: holdingAmount.toString(),
      charity_amount: charityAmount.toString(),
      round_id: roundInfo?.id || null,
      round_number: roundInfo?.draw_number || null,
      executed_by: adminWalletAddress,
      status: 'pending',
      notes: canExecuteRealTransactions 
        ? 'Executing real Solana transactions' 
        : `Simulation mode - ${!walletsConfigured ? 'distribution wallets not configured' : 'admin private key not configured'}`
    };
    
    // Save to database
    let historyId: string | null = null;
    try {
      const { data: savedHistory, error: historyError } = await supabase
        .from('distribution_history')
        .insert(historyRecord)
        .select()
        .single();
      
      if (historyError) {
        console.warn('Failed to save distribution history:', historyError);
        console.log('Distribution history record created locally (database unavailable):', historyRecord);
      } else {
        historyId = savedHistory.id;
        console.log('✅ Distribution history record saved to database:', savedHistory.id);
      }
    } catch (dbError) {
      console.warn('Database error saving history:', dbError);
      console.log('Distribution history record created locally (database error):', historyRecord);
    }

    let transactions;
    let isSimulation = false;
    
    if (canExecuteRealTransactions) {
      // Execute real Solana transactions
      console.log('🚀 Executing real Solana transactions with MEV protection');
      
      const winnersDataForTransaction = pendingWinners.map(winner => ({
        walletAddress: winner.wallet_address,
        amount: winnerAmountMap.get(winner.wallet_address) || amountPerWinner
      }));
      
      const result = await executeDistributionTransactions(
        winnersDataForTransaction,
        distributionWallets.holdingWallet,
        holdingAmount,
        distributionWallets.charityWallet,
        charityAmount
      );
      
      if (!result.success) {
        throw new Error(`Real transaction execution failed: ${result.error}`);
      }
      
      transactions = result.transactions;
      
      // Log transaction costs
      if (result.totalPriorityFees) {
        console.log(`💰 Total priority fees paid: ${result.totalPriorityFees} micro-lamports`);
      }
      
    } else {
      // Fall back to simulation mode
      console.log('⚠️  Falling back to simulation mode');
      isSimulation = true;
      
      transactions = {
        winnersTransactionHash: `sim-winners-${Date.now()}`,
        holdingTransactionHash: `sim-holding-${Date.now()}`,
        charityTransactionHash: `sim-charity-${Date.now()}`
      };
      
      // Simulate processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // Update winners with transaction hashes and actual distributed amounts
    for (const winner of pendingWinners) {
      const actualAmount = winnerAmountMap.get(winner.wallet_address) || amountPerWinner;
      const { error: updateError } = await supabase
        .from('winner')
        .update({
          transaction_hash: transactions.winnersTransactionHash,
          paid_at: new Date().toISOString(),
          prize_amount: actualAmount.toFixed(9) // Update with actual distributed amount
        })
        .eq('id', winner.id);

      if (updateError) {
        throw updateError;
      }
    }

    // Update distribution history with results
    const historyUpdate = {
      status: 'completed',
      winners_transaction_hash: transactions.winnersTransactionHash,
      holding_transaction_hash: transactions.holdingTransactionHash,
      charity_transaction_hash: transactions.charityTransactionHash,
      notes: `${isSimulation ? 'Simulation' : 'Real'} transactions completed - Winners: ${pendingWinners.length}, Amount per winner: ${amountPerWinner} SOL`
    };
    
    if (historyId) {
      try {
        const { error: updateError } = await supabase
          .from('distribution_history')
          .update(historyUpdate)
          .eq('id', historyId);
        
        if (updateError) {
          console.warn('Failed to update distribution history:', updateError);
        } else {
          console.log('✅ Distribution history updated in database:', historyId);
        }
      } catch (dbError) {
        console.warn('Database error updating history:', dbError);
      }
    } else {
      console.log('Distribution history updated locally:', historyUpdate);
    }

    console.log('Distribution completed:', {
      winnersCount: pendingWinners.length,
      amountPerWinner,
      totalDistributed: totalAmount,
      simulation: isSimulation,
      mode: isSimulation ? 'simulation' : 'real'
    });

    return {
      success: true,
      simulation: isSimulation,
      transactions,
      winnersCount: pendingWinners.length,
      totalDistributed: totalAmount
    };

  } catch (error) {
    console.error('Error executing distribution:', error);
    return {
      success: false,
      simulation: true, // Error cases always report as simulation for safety
      transactions: {},
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get pending winners summary
 */
export async function getPendingWinnersSummary() {
  try {
    const { data: pendingWinners, error } = await supabase
      .from('winner')
      .select('*')
      .is('transaction_hash', null);

    if (error) {
      throw error;
    }

    const totalPending = pendingWinners.reduce((sum, winner) => {
      return sum + Number(winner.prize_amount);
    }, 0);

    return {
      count: pendingWinners.length,
      totalAmount: totalPending,
      winners: pendingWinners
    };
  } catch (error) {
    console.error('Error getting pending winners summary:', error);
    return {
      count: 0,
      totalAmount: 0,
      winners: []
    };
  }
}