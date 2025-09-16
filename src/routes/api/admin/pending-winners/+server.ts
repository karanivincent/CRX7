import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

export const GET: RequestHandler = async () => {
  try {
    // Get pending winners (those without transaction hashes)
    const { data: pendingWinners, error } = await supabase
      .from('winners')
      .select(`
        id,
        draw_id,
        wallet_address,
        prize_amount,
        draw_sequence,
        sequence_number,
        animal_name,
        animal_emoji,
        won_at,
        transaction_hash,
        draws!inner(
          draw_number,
          completed_at
        )
      `)
      .is('transaction_hash', null)
      .order('won_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Transform data structure to match expected format
    const formattedWinners = pendingWinners.map(winner => ({
      id: winner.id,
      drawId: winner.draw_id,
      walletAddress: winner.wallet_address,
      prizeAmount: winner.prize_amount,
      drawSequence: winner.draw_sequence,
      sequenceNumber: winner.sequence_number,
      animalName: winner.animal_name,
      animalEmoji: winner.animal_emoji,
      wonAt: winner.won_at,
      drawNumber: winner.draws.draw_number,
      drawCompletedAt: winner.draws.completed_at
    }));

    // Calculate total pending amount
    const totalPending = formattedWinners.reduce((sum, winner) => {
      return sum + Number(winner.prizeAmount);
    }, 0);

    // Group by draw for better organization
    const winnersByDraw = formattedWinners.reduce((acc, winner) => {
      const drawKey = `Draw ${winner.drawNumber}`;
      if (!acc[drawKey]) {
        acc[drawKey] = [];
      }
      acc[drawKey].push(winner);
      return acc;
    }, {} as Record<string, typeof formattedWinners>);

    return json({
      success: true,
      data: {
        pendingWinners: formattedWinners,
        winnersByDraw,
        totalPending,
        totalPendingFormatted: `${totalPending.toFixed(3)} SOL`,
        count: formattedWinners.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending winners:', error);
    return json({
      error: 'Failed to fetch pending winners',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};