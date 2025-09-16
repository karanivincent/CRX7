import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

interface StartRoundRequest {
  prizePool: number;
  scheduledAt: string;
}

interface CompleteRoundRequest {
  roundId: string;
  winners: Array<{
    drawSequence: number; // 1-7
    sequenceNumber: number; // 1st, 2nd, 3rd overall
    walletAddress: string;
    animalName: string;
    animalEmoji: string;
    prizeAmount: number;
    wonAt: string;
  }>;
  participants: Array<{
    walletAddress: string;
    animalName: string;
    animalEmoji: string;
    tokenBalance: number;
  }>;
  metadata: {
    totalPrizePool: number;
    completedAt: string;
    roundDurationMs: number;
  };
}

// POST /api/rounds - Start new round
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'start': {
        const { prizePool, scheduledAt }: StartRoundRequest = body.data;
        
        // Get next draw number
        const { data: latestDraw } = await supabase
          .from('draw')
          .select('draw_number')
          .order('draw_number', { ascending: false })
          .limit(1)
          .single();
        
        const nextDrawNumber = latestDraw ? latestDraw.draw_number + 1 : 1;
        
        // Create new draw record
        const { data: draw, error } = await supabase
          .from('draw')
          .insert({
            id: crypto.randomUUID(),
            draw_number: nextDrawNumber,
            scheduled_at: scheduledAt,
            executed_at: new Date().toISOString(),
            status: 'active'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return json({ 
          success: true, 
          draw: {
            id: draw.id,
            drawNumber: draw.draw_number,
            status: draw.status,
            executedAt: draw.executed_at
          }
        });
      }

      case 'complete': {
        const { roundId, winners, participants, metadata }: CompleteRoundRequest = body.data;
        
        // Start transaction-like operation
        const { error: updateError } = await supabase
          .from('draw')
          .update({
            status: 'completed',
            completed_at: metadata.completedAt,
            total_prize_pool: metadata.totalPrizePool.toString(),
            round_duration_ms: metadata.roundDurationMs,
            updated_at: new Date().toISOString()
          })
          .eq('id', roundId);
        
        if (updateError) throw updateError;

        // Clear existing participants and winners for this draw
        await supabase.from('winner').delete().eq('draw_id', roundId);
        await supabase.from('participant').delete().eq('draw_id', roundId);

        // Insert participants
        if (participants.length > 0) {
          const participantData = participants.map(p => ({
            id: crypto.randomUUID(),
            draw_id: roundId,
            wallet_address: p.walletAddress,
            token_balance: p.tokenBalance.toString(),
            animal_name: p.animalName,
            animal_emoji: p.animalEmoji,
            joined_at: new Date().toISOString()
          }));

          const { error: participantError } = await supabase
            .from('participant')
            .insert(participantData);
          
          if (participantError) throw participantError;
        }

        // Insert winners
        if (winners.length > 0) {
          const winnerData = winners.map(w => ({
            id: crypto.randomUUID(),
            draw_id: roundId,
            wallet_address: w.walletAddress,
            prize_amount: w.prizeAmount.toString(),
            draw_sequence: w.drawSequence,
            sequence_number: w.sequenceNumber,
            animal_name: w.animalName,
            animal_emoji: w.animalEmoji,
            won_at: w.wonAt,
            created_at: new Date().toISOString()
          }));

          const { error: winnerError } = await supabase
            .from('winner')
            .insert(winnerData);
          
          if (winnerError) throw winnerError;
        }

        return json({ 
          success: true, 
          message: 'Round completed successfully',
          winnersCount: winners.length,
          participantsCount: participants.length
        });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in rounds API:', error);
    return json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// GET /api/rounds - Get round history and status
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'active': {
        // Get current active round (if any)
        const { data: activeDraw, error } = await supabase
          .from('draw')
          .select('*')
          .eq('status', 'active')
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return json({ 
          success: true, 
          activeDraw: activeDraw || null
        });
      }

      case 'history': {
        // Get completed rounds with winner counts and pagination
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // Get completed rounds with winner counts
        const { data: completedDraws, error } = await supabase
          .from('draw')
          .select(`
            id,
            draw_number,
            scheduled_at,
            executed_at,
            completed_at,
            total_prize_pool,
            round_duration_ms,
            winner(count)
          `)
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .range(offset, offset + limit - 1);
        
        if (error) throw error;

        // Get total count for pagination
        const { count, error: countError } = await supabase
          .from('draw')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed');
        
        if (countError) throw countError;
        
        return json({ 
          success: true, 
          draws: completedDraws || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        });
      }

      case 'latest': {
        // Get latest completed round with full details
        const { data: latestDraw, error: drawError } = await supabase
          .from('draw')
          .select('*')
          .eq('status', 'completed')
          .order('completed_at', { ascending: false })
          .limit(1)
          .single();
        
        if (drawError && drawError.code !== 'PGRST116') throw drawError;
        
        if (!latestDraw) {
          return json({ success: true, latestDraw: null });
        }

        // Get winners for the latest draw
        const { data: winners, error: winnersError } = await supabase
          .from('winner')
          .select('*')
          .eq('draw_id', latestDraw.id)
          .order('sequence_number', { ascending: true });
        
        if (winnersError) throw winnersError;

        return json({ 
          success: true, 
          latestDraw: {
            ...latestDraw,
            winners: winners || []
          }
        });
      }

      case 'details': {
        // Get specific round details with winners and participants
        const roundId = url.searchParams.get('id');
        if (!roundId) {
          return json({ error: 'Round ID is required' }, { status: 400 });
        }

        // Get round info
        const { data: round, error: roundError } = await supabase
          .from('draw')
          .select('*')
          .eq('id', roundId)
          .single();
        
        if (roundError) throw roundError;
        if (!round) {
          return json({ error: 'Round not found' }, { status: 404 });
        }

        // Get winners
        const { data: winners, error: winnersError } = await supabase
          .from('winner')
          .select('*')
          .eq('draw_id', roundId)
          .order('sequence_number', { ascending: true });
        
        if (winnersError) throw winnersError;

        // Get participants
        const { data: participants, error: participantsError } = await supabase
          .from('participant')
          .select('*')
          .eq('draw_id', roundId)
          .order('joined_at', { ascending: true });
        
        if (participantsError) throw participantsError;

        return json({ 
          success: true, 
          round: {
            ...round,
            winners: winners || [],
            participants: participants || []
          }
        });
      }

      case 'stats': {
        // Get aggregate statistics
        const { data: totalStats, error: statsError } = await supabase
          .from('draw')
          .select('total_prize_pool, winner!inner(prize_amount)')
          .eq('status', 'completed');
        
        if (statsError) throw statsError;

        // Calculate statistics
        let totalDistributed = 0;
        let biggestWin = 0;
        let totalWinners = 0;
        let totalRounds = 0;

        (totalStats || []).forEach(draw => {
          if (draw.total_prize_pool) {
            totalDistributed += parseFloat(draw.total_prize_pool);
            totalRounds++;
          }
          if (Array.isArray(draw.winner)) {
            draw.winner.forEach((winner: any) => {
              totalWinners++;
              const prizeAmount = parseFloat(winner.prize_amount || '0');
              if (prizeAmount > biggestWin) {
                biggestWin = prizeAmount;
              }
            });
          }
        });

        return json({ 
          success: true, 
          stats: {
            totalDistributed,
            biggestWin,
            totalWinners,
            totalRounds,
            averagePerWinner: totalWinners > 0 ? totalDistributed / totalWinners : 0
          }
        });
      }

      default: {
        // Get basic stats
        const { data: stats, error } = await supabase
          .from('draw')
          .select('status, count(*)')
          .in('status', ['active', 'completed']);
        
        if (error) throw error;
        
        return json({ success: true, stats: stats || [] });
      }
    }
  } catch (error) {
    console.error('Error fetching rounds:', error);
    return json({ 
      error: 'Failed to fetch rounds',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};