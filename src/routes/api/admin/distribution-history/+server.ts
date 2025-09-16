import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/db/index';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // TODO: The distribution_history table doesn't exist yet in the database
    // Return empty data for now until the table is created
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

  } catch (error) {
    console.error('Error fetching distribution history:', error);
    return json({
      error: 'Failed to fetch distribution history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};