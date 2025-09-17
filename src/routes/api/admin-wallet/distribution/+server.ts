import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerSOLBalance } from '$lib/server/solana-server';
import { getDistributionConfig } from '$lib/config/client';
import { ADMIN_WALLET_ADDRESS } from '$env/static/private';
import { executeDistribution } from '$lib/server/solana-distribution-service';

export const POST: RequestHandler = async ({ request }) => {
  try {
    if (!ADMIN_WALLET_ADDRESS) {
      return json({ 
        error: 'Admin wallet address not configured' 
      }, { status: 500 });
    }

    const body = await request.json();
    const { distributionAmount, winnersData } = body;

    // Validate distribution amount
    if (!distributionAmount || isNaN(Number(distributionAmount)) || Number(distributionAmount) <= 0) {
      return json({
        error: 'Invalid distribution amount'
      }, { status: 400 });
    }

    const amount = Number(distributionAmount);

    // Get current admin wallet balance
    const currentBalance = await getServerSOLBalance(ADMIN_WALLET_ADDRESS, false);
    const feeReserve = 0.1;
    const availableForDistribution = Math.max(0, currentBalance - feeReserve);

    // Check if requested amount is available
    if (amount > availableForDistribution) {
      return json({
        error: `Insufficient balance. Available: ${availableForDistribution.toFixed(3)} SOL, Requested: ${amount.toFixed(3)} SOL`
      }, { status: 400 });
    }

    // Execute distribution using the distribution service
    const result = await executeDistribution(amount, ADMIN_WALLET_ADDRESS, winnersData);

    if (!result.success) {
      return json({
        error: result.error || 'Failed to execute distribution'
      }, { status: 500 });
    }

    // Calculate distribution for response
    const distributionConfig = getDistributionConfig();
    const distribution = {
      total: amount,
      winners: {
        amount: amount * (distributionConfig.winnersPercentage / 100),
        percentage: distributionConfig.winnersPercentage
      },
      holding: {
        amount: amount * (distributionConfig.holdingPercentage / 100),
        percentage: distributionConfig.holdingPercentage
      },
      charity: {
        amount: amount * (distributionConfig.charityPercentage / 100),
        percentage: distributionConfig.charityPercentage
      }
    };

    return json({
      success: true,
      message: 'Distribution executed successfully',
      distribution,
      simulation: result.simulation,
      transactionIds: [
        result.transactions.winnersTransactionHash,
        result.transactions.holdingTransactionHash,
        result.transactions.charityTransactionHash
      ].filter(Boolean),
      winnersCount: result.winnersCount,
      totalDistributed: result.totalDistributed
    });

  } catch (error) {
    console.error('Error executing distribution:', error);
    return json({
      error: 'Failed to execute distribution',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};