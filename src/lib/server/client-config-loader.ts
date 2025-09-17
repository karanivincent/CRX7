import { getDrawConfig, getDistributionConfig, getConfig } from './configuration-service';
import type { ClientTokenConfig } from '$lib/config/client';

/**
 * Server-side function to load configuration from database and build client config
 */
export async function loadClientConfig(): Promise<ClientTokenConfig> {
  try {
    // Load configurations from database
    const [drawConfig, distributionConfig, tokenName, tokenSymbol] = await Promise.all([
      getDrawConfig(),
      getDistributionConfig(),
      getConfig<string>('token_name'),
      getConfig<string>('token_symbol')
    ]);

    return {
      displayName: tokenSymbol || 'CRX7',
      name: tokenName || 'Creator Reward X7', 
      symbol: tokenSymbol || 'CRX7',
      winnersPerDraw: drawConfig.winnersPerDraw,
      drawFrequency: 'weekly', // This could be made configurable later
      distribution: {
        winnersPercentage: distributionConfig.winnersPercent,
        holdingPercentage: distributionConfig.holdingPercent,
        charityPercentage: distributionConfig.charityPercent
      }
    };
  } catch (error) {
    console.error('Failed to load client configuration from database:', error);
    
    // Return fallback configuration
    return {
      displayName: 'CRX7',
      name: 'Creator Reward X7',
      symbol: 'CRX7', 
      winnersPerDraw: 7,
      drawFrequency: 'weekly',
      distribution: {
        winnersPercentage: 50,
        holdingPercentage: 40,
        charityPercentage: 10
      }
    };
  }
}