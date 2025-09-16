import { getDistributionConfig } from '$lib/config/client';
import { getDistributionWallets, validateDistributionWallets } from './solana-distribution-config';
import { db } from '$lib/db/connection';
import { winnerTable, distributionHistoryTable } from '$lib/db/schema';
import { eq, isNull } from 'drizzle-orm';

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
 * Execute distribution using available services
 * For now, this will simulate transactions until private keys are configured
 */
export async function executeDistribution(
  totalAmount: number,
  adminWalletAddress: string
): Promise<DistributionResult> {
  try {
    console.log('Starting distribution execution:', {
      totalAmount,
      adminWallet: adminWalletAddress
    });

    const distributionConfig = getDistributionConfig();
    const distributionWallets = getDistributionWallets();
    
    // Check if real wallets are configured
    const walletsConfigured = validateDistributionWallets();
    
    // Calculate distribution amounts
    const winnersAmount = totalAmount * (distributionConfig.winnersPercentage / 100);
    const holdingAmount = totalAmount * (distributionConfig.holdingPercentage / 100);
    const charityAmount = totalAmount * (distributionConfig.charityPercentage / 100);

    // Get pending winners from database
    const pendingWinners = await db
      .select()
      .from(winnerTable)
      .where(isNull(winnerTable.transactionHash))
      .orderBy(winnerTable.wonAt);

    console.log(`Found ${pendingWinners.length} pending winners for distribution`);

    if (pendingWinners.length === 0) {
      return {
        success: false,
        simulation: true,
        transactions: {},
        error: 'No pending winners found for distribution'
      };
    }

    // Calculate amount per winner
    const amountPerWinner = winnersAmount / pendingWinners.length;

    // Create distribution history record
    const historyRecord = await db.insert(distributionHistoryTable).values({
      totalAmount: totalAmount.toString(),
      winnersAmount: winnersAmount.toString(),
      holdingAmount: holdingAmount.toString(),
      charityAmount: charityAmount.toString(),
      executedBy: adminWalletAddress,
      status: 'pending',
      notes: walletsConfigured 
        ? 'Ready for real transaction execution' 
        : 'Simulation mode - distribution wallets not configured'
    }).returning();

    // For now, simulate the transactions
    // TODO: Replace with actual Solana transactions when private keys are configured
    
    const simulatedTransactions = {
      winnersTransactionHash: `sim-winners-${Date.now()}`,
      holdingTransactionHash: `sim-holding-${Date.now()}`,
      charityTransactionHash: `sim-charity-${Date.now()}`
    };

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update winners with simulated transaction hashes
    for (const winner of pendingWinners) {
      await db.update(winnerTable)
        .set({
          transactionHash: simulatedTransactions.winnersTransactionHash,
          paidAt: new Date()
        })
        .where(eq(winnerTable.id, winner.id));
    }

    // Update distribution history with completion
    await db.update(distributionHistoryTable)
      .set({
        status: 'completed',
        winnersTransactionHash: simulatedTransactions.winnersTransactionHash,
        holdingTransactionHash: simulatedTransactions.holdingTransactionHash,
        charityTransactionHash: simulatedTransactions.charityTransactionHash
      })
      .where(eq(distributionHistoryTable.id, historyRecord[0].id));

    console.log('Distribution completed:', {
      winnersCount: pendingWinners.length,
      amountPerWinner,
      totalDistributed: totalAmount,
      simulation: true
    });

    return {
      success: true,
      simulation: true, // Will be false when real transactions are implemented
      transactions: simulatedTransactions,
      winnersCount: pendingWinners.length,
      totalDistributed: totalAmount
    };

  } catch (error) {
    console.error('Error executing distribution:', error);
    return {
      success: false,
      simulation: true,
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
    const pendingWinners = await db
      .select()
      .from(winnerTable)
      .where(isNull(winnerTable.transactionHash));

    const totalPending = pendingWinners.reduce((sum, winner) => {
      return sum + Number(winner.prizeAmount);
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