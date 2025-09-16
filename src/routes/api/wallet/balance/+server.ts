import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getServerSOLBalance } from '$lib/server/solana-server';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const address = url.searchParams.get('address');
    
    if (!address) {
      return json({
        error: 'Wallet address is required'
      }, { status: 400 });
    }

    // Validate address format (basic validation)
    if (address.length < 32 || address.length > 44) {
      return json({
        error: 'Invalid wallet address format'
      }, { status: 400 });
    }

    // Get SOL balance for the wallet
    const balance = await getServerSOLBalance(address, false);

    return json({
      success: true,
      address,
      balance,
      balanceFormatted: `${balance.toFixed(3)} SOL`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    return json({
      error: 'Failed to fetch wallet balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};