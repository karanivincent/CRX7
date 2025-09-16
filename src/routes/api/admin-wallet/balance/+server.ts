import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerSOLBalance } from '$lib/server/solana-server';
import { ADMIN_WALLET_ADDRESS } from '$env/static/private';

export const GET: RequestHandler = async ({ url }) => {
  try {
    if (!ADMIN_WALLET_ADDRESS) {
      return json({ 
        error: 'Admin wallet address not configured' 
      }, { status: 500 });
    }

    // Get fresh balance from blockchain
    const balance = await getServerSOLBalance(ADMIN_WALLET_ADDRESS, false);
    
    // Calculate available for distribution (reserve 0.1 SOL for fees)
    const feeReserve = 0.1;
    const availableForDistribution = Math.max(0, balance - feeReserve);
    
    return json({
      success: true,
      balance: {
        total: balance,
        totalFormatted: `${balance.toFixed(3)} SOL`,
        feeReserve,
        feeReserveFormatted: `${feeReserve.toFixed(1)} SOL`,
        availableForDistribution,
        availableFormatted: `${availableForDistribution.toFixed(3)} SOL`
      },
      meta: {
        walletAddress: ADMIN_WALLET_ADDRESS,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching admin wallet balance:', error);
    return json({ 
      error: 'Failed to fetch admin wallet balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// POST to refresh balance (same as GET but explicit refresh)
export const POST: RequestHandler = async ({ request }) => {
  try {
    if (!ADMIN_WALLET_ADDRESS) {
      return json({ 
        error: 'Admin wallet address not configured' 
      }, { status: 500 });
    }

    // Force fresh balance from blockchain
    const balance = await getServerSOLBalance(ADMIN_WALLET_ADDRESS, false);
    
    const feeReserve = 0.1;
    const availableForDistribution = Math.max(0, balance - feeReserve);
    
    return json({
      success: true,
      balance: {
        total: balance,
        totalFormatted: `${balance.toFixed(3)} SOL`,
        feeReserve,
        feeReserveFormatted: `${feeReserve.toFixed(1)} SOL`,
        availableForDistribution,
        availableFormatted: `${availableForDistribution.toFixed(3)} SOL`
      },
      meta: {
        walletAddress: ADMIN_WALLET_ADDRESS,
        lastUpdated: new Date().toISOString(),
        refreshed: true
      }
    });
  } catch (error) {
    console.error('Error refreshing admin wallet balance:', error);
    return json({ 
      error: 'Failed to refresh admin wallet balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};