import { supabase } from '$lib/db/index';
import { getDistributionWallets } from './solana-distribution-config';
import { executeDistributionTransactions } from './solana-transaction-service';

/**
 * Retry specific failed transactions from a distribution
 */
export async function retryFailedDistribution(
  distributionId: string,
  failedTransactionTypes: string[]
): Promise<void> {
  try {
    console.log(`🔄 Starting retry for distribution ${distributionId}`, failedTransactionTypes);

    // Get distribution details
    const { data: distribution, error: fetchError } = await supabase
      .from('distribution_history')
      .select('*')
      .eq('id', distributionId)
      .single();

    if (fetchError || !distribution) {
      throw new Error('Distribution not found');
    }

    // Get pending winners if we need to retry winners transaction
    let winnersData: Array<{ walletAddress: string; amount: number }> = [];
    if (failedTransactionTypes.includes('winners')) {
      const { data: pendingWinners, error: winnersError } = await supabase
        .from('winner')
        .select('*')
        .is('transaction_hash', null)
        .order('won_at');

      if (winnersError) {
        throw winnersError;
      }

      if (pendingWinners && pendingWinners.length > 0) {
        const winnersAmount = Number(distribution.winners_amount);
        const amountPerWinner = winnersAmount / pendingWinners.length;
        
        winnersData = pendingWinners.map(winner => ({
          walletAddress: winner.wallet_address,
          amount: amountPerWinner
        }));
      }
    }

    // Get distribution wallets
    const distributionWallets = getDistributionWallets();

    // Prepare transaction parameters, but only for failed transactions
    const holdingAmount = failedTransactionTypes.includes('holding') ? Number(distribution.holding_amount) : 0;
    const charityAmount = failedTransactionTypes.includes('charity') ? Number(distribution.charity_amount) : 0;

    // Execute only the failed transactions
    const result = await executeDistributionTransactions(
      failedTransactionTypes.includes('winners') ? winnersData : [],
      distributionWallets.holdingWallet,
      holdingAmount,
      distributionWallets.charityWallet,
      charityAmount
    );

    // Update distribution record with retry results
    let finalStatus = 'completed';
    let remainingFailures: string[] = [];
    let failureReason = '';

    // Check which transactions are still failing
    if (failedTransactionTypes.includes('winners') && !result.transactions.winnersTransactionHash) {
      remainingFailures.push('winners');
    }
    if (failedTransactionTypes.includes('holding') && !result.transactions.holdingTransactionHash) {
      remainingFailures.push('holding');
    }
    if (failedTransactionTypes.includes('charity') && !result.transactions.charityTransactionHash) {
      remainingFailures.push('charity');
    }

    // Determine final status
    if (remainingFailures.length === 0) {
      finalStatus = 'completed';
    } else if (remainingFailures.length < failedTransactionTypes.length) {
      finalStatus = 'partial_success';
      failureReason = 'Some retry transactions still failed';
    } else {
      finalStatus = 'failed';
      failureReason = 'All retry transactions failed';
    }

    // Update distribution history
    const updateFields: any = {
      status: finalStatus,
      failure_reason: failureReason || null,
      failed_transactions: remainingFailures.length > 0 ? JSON.stringify(remainingFailures) : null
    };

    // Update successful transaction hashes (merge with existing ones)
    if (result.transactions.winnersTransactionHash) {
      updateFields.winners_transaction_hash = result.transactions.winnersTransactionHash;
    }
    if (result.transactions.holdingTransactionHash) {
      updateFields.holding_transaction_hash = result.transactions.holdingTransactionHash;
    }
    if (result.transactions.charityTransactionHash) {
      updateFields.charity_transaction_hash = result.transactions.charityTransactionHash;
    }

    const { error: updateError } = await supabase
      .from('distribution_history')
      .update(updateFields)
      .eq('id', distributionId);

    if (updateError) {
      throw updateError;
    }

    // Update winners table if winners transaction succeeded
    if (result.transactions.winnersTransactionHash && winnersData.length > 0) {
      const { data: pendingWinners, error: winnersError } = await supabase
        .from('winner')
        .select('*')
        .is('transaction_hash', null)
        .order('won_at');

      if (!winnersError && pendingWinners) {
        for (const winner of pendingWinners) {
          const actualAmount = winnersData.find(w => w.walletAddress === winner.wallet_address)?.amount || 0;
          await supabase
            .from('winner')
            .update({
              transaction_hash: result.transactions.winnersTransactionHash,
              paid_at: new Date().toISOString(),
              prize_amount: actualAmount.toFixed(9)
            })
            .eq('id', winner.id);
        }
      }
    }

    console.log(`✅ Retry completed for distribution ${distributionId}`, {
      finalStatus,
      remainingFailures,
      successfulTransactions: Object.keys(result.transactions).length
    });

  } catch (error) {
    console.error(`❌ Retry failed for distribution ${distributionId}:`, error);
    
    // Update distribution to failed status
    await supabase
      .from('distribution_history')
      .update({
        status: 'failed',
        failure_reason: error instanceof Error ? error.message : 'Retry execution failed'
      })
      .eq('id', distributionId);

    throw error;
  }
}