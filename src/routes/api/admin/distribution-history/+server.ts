import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/connection';
import { distributionHistoryTable } from '$lib/db/schema';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Get distribution history with pagination
    const history = await db
      .select()
      .from(distributionHistoryTable)
      .orderBy(desc(distributionHistoryTable.executedAt))
      .limit(limit)
      .offset(offset);

    // Format amounts for display
    const formattedHistory = history.map(record => ({
      ...record,
      totalAmountFormatted: `${Number(record.totalAmount).toFixed(3)} SOL`,
      winnersAmountFormatted: `${Number(record.winnersAmount).toFixed(3)} SOL`,
      holdingAmountFormatted: `${Number(record.holdingAmount).toFixed(3)} SOL`,
      charityAmountFormatted: `${Number(record.charityAmount).toFixed(3)} SOL`,
      executedAtFormatted: new Date(record.executedAt).toLocaleString()
    }));

    // Get total count for pagination
    const totalCount = await db.$count(distributionHistoryTable);

    return json({
      success: true,
      data: {
        history: formattedHistory,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: (offset + limit) < totalCount
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