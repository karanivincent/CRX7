import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get distribution history with pagination
    const { data: history, error } = await supabase
      .from('distribution_history')
      .select('*')
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Format amounts for display
    const formattedHistory = history.map(record => ({
      ...record,
      totalAmountFormatted: `${Number(record.total_amount).toFixed(3)} SOL`,
      winnersAmountFormatted: `${Number(record.winners_amount).toFixed(3)} SOL`,
      holdingAmountFormatted: `${Number(record.holding_amount).toFixed(3)} SOL`,
      charityAmountFormatted: `${Number(record.charity_amount).toFixed(3)} SOL`,
      executedAtFormatted: new Date(record.executed_at).toLocaleString()
    }));

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('distribution_history')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw countError;
    }

    return json({
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          total: totalCount || 0,
          limit,
          offset,
          hasMore: (offset + limit) < (totalCount || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching distribution history:', error);
    return json({
      error: 'Failed to fetch distribution history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};