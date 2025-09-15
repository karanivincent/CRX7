import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDrawWinners, markWinnerPaid } from '$lib/db/queries';

// This will be implemented after SOL distribution system is created
// For now, we'll create the API structure

// GET /api/payments - Get payment status for a draw
export const GET: RequestHandler = async ({ url }) => {
  try {
    const drawId = url.searchParams.get('drawId');
    
    if (!drawId) {
      return json({ error: 'drawId parameter is required' }, { status: 400 });
    }

    const winners = await getDrawWinners(drawId);
    
    // Add payment status information
    const winnersWithPaymentStatus = winners.map(winner => ({
      ...winner,
      paymentStatus: winner.transactionHash ? 'paid' : 'pending',
      explorerUrl: winner.transactionHash ? 
        `https://solscan.io/tx/${winner.transactionHash}` : null
    }));

    return json({ winners: winnersWithPaymentStatus });
  } catch (error) {
    console.error('Error fetching payment status:', error);
    return json({ error: 'Failed to fetch payment status' }, { status: 500 });
  }
};

// POST /api/payments - Execute SOL payments
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'execute':
        const { drawId, totalAmount } = data;
        
        // TODO: Implement SOL distribution system
        // This will be implemented in Phase 2
        
        // For now, return a placeholder response
        return json({ 
          error: 'SOL distribution system not yet implemented',
          message: 'This will be implemented in Phase 2 of the development plan'
        }, { status: 501 });

      case 'retry':
        const { winnerId } = data;
        
        // TODO: Implement retry logic for failed payments
        return json({ 
          error: 'Payment retry not yet implemented',
          message: 'This will be implemented in Phase 2 of the development plan'
        }, { status: 501 });

      case 'mark_paid':
        // Manual marking of payment as completed (for testing)
        const { winnerId: markWinnerId, transactionHash } = data;
        const updatedWinner = await markWinnerPaid(markWinnerId, transactionHash);
        return json({ winner: updatedWinner });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    return json({ error: 'Failed to process payment' }, { status: 500 });
  }
};