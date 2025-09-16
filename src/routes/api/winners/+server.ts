import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

// GET /api/winners - Get winners data with filtering and pagination
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action') || 'all';
    
    switch (action) {
      case 'all': {
        // Get all winners with pagination
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;
        const sortBy = url.searchParams.get('sort') || 'won_at';
        const sortOrder = url.searchParams.get('order') || 'desc';
        const drawFilter = url.searchParams.get('draw');

        // Build query - use inner join when filtering by draw
        let selectQuery = drawFilter 
          ? `
            id,
            wallet_address,
            prize_amount,
            draw_sequence,
            sequence_number,
            animal_name,
            animal_emoji,
            won_at,
            transaction_hash,
            paid_at,
            draw!inner(
              draw_number,
              completed_at,
              total_prize_pool
            )
          `
          : `
            id,
            wallet_address,
            prize_amount,
            draw_sequence,
            sequence_number,
            animal_name,
            animal_emoji,
            won_at,
            transaction_hash,
            paid_at,
            draw(
              draw_number,
              completed_at,
              total_prize_pool
            )
          `;

        let query = supabase
          .from('winner')
          .select(selectQuery);

        // Add draw filter if specified
        if (drawFilter) {
          // Filter by the joined draw table's draw_number
          query = query.filter('draw.draw_number', 'eq', parseInt(drawFilter));
        }

        const { data: winners, error } = await query
          .order(sortBy, { ascending: sortOrder === 'asc' })
          .range(offset, offset + limit - 1);
        
        if (error) throw error;

        // Get total count for pagination (with same filter)
        let countQuery = supabase
          .from('winner')
          .select('*, draw!inner(draw_number)', { count: 'exact', head: true });

        if (drawFilter) {
          // Use the same filter as the main query - filter by draw.draw_number
          countQuery = countQuery.eq('draw.draw_number', parseInt(drawFilter));
        }

        const { count, error: countError } = await countQuery;
        
        if (countError) throw countError;
        
        return json({ 
          success: true, 
          winners: winners || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit)
          }
        });
      }

      case 'leaderboard': {
        // Get top winners by total amount won
        const limit = parseInt(url.searchParams.get('limit') || '10');

        // For now, let's use a simpler approach since Supabase doesn't support aggregation well
        const { data: allWinners, error } = await supabase
          .from('winner')
          .select(`
            wallet_address,
            animal_name,
            animal_emoji,
            prize_amount,
            won_at
          `)
          .order('prize_amount', { ascending: false })
          .limit(limit * 3); // Get more data to group manually
        
        if (error) throw error;
        
        // Group by wallet address manually
        const groupedWinners = new Map();
        (allWinners || []).forEach(winner => {
          const key = winner.wallet_address;
          if (!groupedWinners.has(key)) {
            groupedWinners.set(key, {
              wallet_address: winner.wallet_address,
              animal_name: winner.animal_name,
              animal_emoji: winner.animal_emoji,
              total_won: 0,
              wins_count: 0,
              last_win: winner.won_at
            });
          }
          const group = groupedWinners.get(key);
          group.total_won += parseFloat(winner.prize_amount);
          group.wins_count += 1;
          if (new Date(winner.won_at) > new Date(group.last_win)) {
            group.last_win = winner.won_at;
          }
        });
        
        const topWinners = Array.from(groupedWinners.values())
          .sort((a, b) => b.total_won - a.total_won)
          .slice(0, limit);
        
        return json({ 
          success: true, 
          leaderboard: topWinners || []
        });
      }

      case 'recent': {
        // Get most recent winners
        const limit = parseInt(url.searchParams.get('limit') || '5');

        const { data: recentWinners, error } = await supabase
          .from('winner')
          .select(`
            wallet_address,
            prize_amount,
            animal_name,
            animal_emoji,
            won_at,
            draw!inner(draw_number)
          `)
          .order('won_at', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        
        return json({ 
          success: true, 
          recent: recentWinners || []
        });
      }

      case 'biggest': {
        // Get biggest single wins
        const limit = parseInt(url.searchParams.get('limit') || '10');

        const { data: biggestWins, error } = await supabase
          .from('winner')
          .select(`
            wallet_address,
            prize_amount,
            animal_name,
            animal_emoji,
            won_at,
            draw!inner(draw_number)
          `)
          .order('prize_amount', { ascending: false })
          .limit(limit);
        
        if (error) throw error;
        
        return json({ 
          success: true, 
          biggest: biggestWins || []
        });
      }

      case 'stats': {
        // Get winner statistics
        const { data: stats, error } = await supabase.rpc('get_winner_stats');
        
        if (error) {
          // Fallback to manual calculation if RPC doesn't exist
          const { data: allWinners, error: winnersError } = await supabase
            .from('winner')
            .select('prize_amount, won_at');
          
          if (winnersError) throw winnersError;
          
          const totalWinners = allWinners?.length || 0;
          const totalDistributed = allWinners?.reduce((sum, w) => sum + parseFloat(w.prize_amount), 0) || 0;
          const biggestWin = Math.max(...(allWinners?.map(w => parseFloat(w.prize_amount)) || [0]));
          
          return json({
            success: true,
            stats: {
              totalWinners,
              totalDistributed,
              biggestWin,
              averageWin: totalWinners > 0 ? totalDistributed / totalWinners : 0
            }
          });
        }
        
        return json({ 
          success: true, 
          stats: stats || {}
        });
      }

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in winners API:', error);
    return json({ 
      error: 'Failed to fetch winners',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};