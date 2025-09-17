import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';
import { getSolscanTxUrl, getSolscanAccountUrl, formatTxHash } from '$lib/utils/solscan';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Try to fetch from distribution_history table
    const { data: historyData, error } = await supabase
      .from('distribution_history')
      .select('*')
      .order('executed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Distribution history table error:', error);
      // If table doesn't exist, return empty data
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        console.log('Distribution history table not found, returning empty data');
        return json({
          success: true,
          data: {
            history: [],
            pagination: {
              total: 0,
              limit,
              offset,
              hasMore: false
            }
          }
        });
      }
      throw error;
    }

    // Get total count for pagination
    const { count } = await supabase
      .from('distribution_history')
      .select('*', { count: 'exact', head: true });

    // Format history data with Solscan links and formatted amounts/dates
    const formattedHistory = (historyData || []).map(record => ({
      ...record,
      // Add Solscan links for transactions
      winnersTransactionUrl: record.winners_transaction_hash 
        ? getSolscanTxUrl(record.winners_transaction_hash)
        : null,
      holdingTransactionUrl: record.holding_transaction_hash
        ? getSolscanTxUrl(record.holding_transaction_hash) 
        : null,
      charityTransactionUrl: record.charity_transaction_hash
        ? getSolscanTxUrl(record.charity_transaction_hash)
        : null,
      // Add wallet Solscan link
      executedByUrl: getSolscanAccountUrl(record.executed_by),
      // Format transaction hashes for display
      winnersTransactionDisplay: record.winners_transaction_hash
        ? formatTxHash(record.winners_transaction_hash)
        : null,
      holdingTransactionDisplay: record.holding_transaction_hash
        ? formatTxHash(record.holding_transaction_hash)
        : null,
      charityTransactionDisplay: record.charity_transaction_hash
        ? formatTxHash(record.charity_transaction_hash)
        : null,
      // Format amounts for display
      totalAmountFormatted: `${Number(record.total_amount).toFixed(3)} SOL`,
      winnersAmountFormatted: `${Number(record.winners_amount).toFixed(3)} SOL`,
      holdingAmountFormatted: `${Number(record.holding_amount).toFixed(3)} SOL`,
      charityAmountFormatted: `${Number(record.charity_amount).toFixed(3)} SOL`,
      // Format executed date
      executedAtFormatted: new Date(record.executed_at).toLocaleString(),
      // Calculate estimated winner count (assuming equal distribution)
      estimatedWinnerCount: record.winners_amount > 0 ? 
        Math.round(Number(record.winners_amount) / (Number(record.total_amount) * 0.5 / 7)) || 7 : 0,
      // Add status info
      isCompleted: record.status === 'completed',
      isPending: record.status === 'pending',
      isFailed: record.status === 'failed',
      // Add transaction status summary
      hasAllTransactions: !!(record.winners_transaction_hash && record.holding_transaction_hash && record.charity_transaction_hash),
      transactionCount: [record.winners_transaction_hash, record.holding_transaction_hash, record.charity_transaction_hash].filter(Boolean).length
    }));
    
    return json({
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit
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

// POST endpoint to create distribution history records
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    const { data, error } = await supabase
      .from('distribution_history')
      .insert(body)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Error creating distribution history record:', error);
    return json({
      error: 'Failed to create distribution history record',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};