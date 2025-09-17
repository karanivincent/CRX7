import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  getPublicConfiguration,
  updateConfigs,
  getWalletConfig,
  getDrawConfig,
  getDistributionConfig,
  type ConfigKey
} from '$lib/server/configuration-service';

// GET /api/admin/configuration - Load all configuration
export const GET: RequestHandler = async ({ locals }) => {
  // Check authentication
  const { user } = await locals.safeGetSession();
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all configuration
    const allConfig = await getPublicConfiguration();
    
    // Also get structured configs for easier consumption
    const walletConfig = await getWalletConfig();
    const drawConfig = await getDrawConfig();
    const distributionConfig = await getDistributionConfig();

    return json({
      success: true,
      config: allConfig,
      structured: {
        wallets: walletConfig,
        draw: drawConfig,
        distribution: distributionConfig
      }
    });
  } catch (error) {
    console.error('Failed to load configuration:', error);
    return json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
};

// POST /api/admin/configuration - Update configuration
export const POST: RequestHandler = async ({ request, locals }) => {
  // Check authentication
  const { user } = await locals.safeGetSession();
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // Validate input
    if (!body.updates || typeof body.updates !== 'object') {
      return json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate configuration values
    const validationErrors: string[] = [];
    
    // Validate distribution percentages if provided
    const distKeys = [
      'distribution_winners_percent',
      'distribution_holding_percent', 
      'distribution_charity_percent'
    ];
    
    const distValues = distKeys
      .filter(key => key in body.updates)
      .map(key => Number(body.updates[key]));
    
    if (distValues.length > 0) {
      const total = distValues.reduce((sum, val) => sum + val, 0);
      
      // If all three are provided, they must sum to 100
      if (distValues.length === 3 && total !== 100) {
        validationErrors.push('Distribution percentages must sum to 100');
      }
      
      // Each value must be between 0 and 100
      for (const val of distValues) {
        if (val < 0 || val > 100) {
          validationErrors.push('Distribution percentages must be between 0 and 100');
          break;
        }
      }
    }

    // Validate wallet addresses (basic check)
    const walletKeys = [
      'holding_wallet_address',
      'charity_wallet_address',
      'admin_wallet_address',
      'creator_vault',
      'coin_creator_vault_ata'
    ];
    
    for (const key of walletKeys) {
      if (key in body.updates) {
        const address = body.updates[key];
        if (typeof address !== 'string' || address.length < 32 || address.length > 44) {
          validationErrors.push(`Invalid wallet address for ${key}`);
        }
      }
    }

    // Validate numeric values
    const numericKeys = [
      'winners_per_draw',
      'candidates_per_spin',
      'minimum_token_balance'
    ];
    
    for (const key of numericKeys) {
      if (key in body.updates) {
        const value = Number(body.updates[key]);
        if (isNaN(value) || value < 1) {
          validationErrors.push(`${key} must be a positive number`);
        }
      }
    }

    if (validationErrors.length > 0) {
      return json(
        { error: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    // Update configuration
    const success = await updateConfigs(
      body.updates as Record<ConfigKey, any>,
      user.email || user.id
    );

    if (!success) {
      return json(
        { error: 'Failed to update configuration' },
        { status: 500 }
      );
    }

    // Return updated configuration
    const updatedConfig = await getPublicConfiguration();
    
    return json({
      success: true,
      message: 'Configuration updated successfully',
      config: updatedConfig
    });
  } catch (error) {
    console.error('Failed to update configuration:', error);
    return json(
      { error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
};