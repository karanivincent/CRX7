import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

export const POST: RequestHandler = async () => {
  try {
    // Get count of pending winners before deletion
    const { data: pendingWinners, error: countError } = await supabase
      .from('winner')
      .select('id, prize_amount')
      .is('transaction_hash', null);

    if (countError) {
      throw countError;
    }

    const winnerCount = pendingWinners?.length || 0;
    const totalAmount = pendingWinners?.reduce((sum, winner) => 
      sum + Number(winner.prize_amount), 0) || 0;

    if (winnerCount === 0) {
      return json({
        success: true,
        message: 'No pending winners to clear',
        cleared: {
          count: 0,
          totalAmount: 0
        }
      });
    }

    // Delete all pending winners (those without transaction_hash)
    const { error: deleteError } = await supabase
      .from('winner')
      .delete()
      .is('transaction_hash', null);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ Cleared ${winnerCount} pending winners (${totalAmount.toFixed(3)} SOL)`);

    return json({
      success: true,
      message: `Successfully cleared ${winnerCount} pending winners`,
      cleared: {
        count: winnerCount,
        totalAmount: totalAmount,
        totalAmountFormatted: `${totalAmount.toFixed(3)} SOL`
      }
    });

  } catch (error) {
    console.error('Error clearing pending winners:', error);
    return json({
      success: false,
      error: 'Failed to clear pending winners',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};