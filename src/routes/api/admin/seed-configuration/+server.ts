import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { seedConfiguration } from '$lib/db/seed-configuration';

// POST /api/admin/seed-configuration - Seed the configuration table
export const POST: RequestHandler = async ({ locals }) => {
  // Check authentication
  const { user } = await locals.safeGetSession();
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const success = await seedConfiguration();
    
    if (success) {
      return json({
        success: true,
        message: 'Configuration table seeded successfully'
      });
    } else {
      return json(
        { error: 'Failed to seed configuration table' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to seed configuration:', error);
    return json(
      { error: 'Failed to seed configuration table' },
      { status: 500 }
    );
  }
};