import { supabase } from '$lib/db/index';

export type ConfigKey = 
  | 'winners_per_draw'
  | 'candidates_per_spin'
  | 'minimum_token_balance'
  | 'distribution_winners_percent'
  | 'distribution_holding_percent'
  | 'distribution_charity_percent'
  | 'holding_wallet_address'
  | 'charity_wallet_address'
  | 'admin_wallet_address'
  | 'creator_vault'
  | 'coin_creator_vault_ata'
  | 'token_mint_address'
  | 'token_name'
  | 'token_symbol';

export type ConfigCategory = 'wallet' | 'draw' | 'distribution' | 'token';

export interface ConfigItem {
  key: ConfigKey;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  category: ConfigCategory;
  description?: string;
  isSensitive?: boolean;
}

// In-memory cache for configuration
let configCache: Map<string, ConfigItem> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Load all configuration from database
 */
export async function loadConfiguration(forceRefresh = false): Promise<Map<string, ConfigItem>> {
  // Return cached config if still valid
  if (!forceRefresh && configCache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return configCache;
  }

  try {
    const { data: configs, error } = await supabase
      .from('configuration')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    configCache = new Map();
    for (const config of configs || []) {
      configCache.set(config.key, {
        key: config.key as ConfigKey,
        value: config.value,
        type: config.type as ConfigItem['type'],
        category: config.category as ConfigCategory,
        description: config.description || undefined,
        isSensitive: config.isSensitive || false
      });
    }
    
    cacheTimestamp = Date.now();
    return configCache;
  } catch (error) {
    console.error('Failed to load configuration:', error);
    // Return empty map if database fails
    return new Map();
  }
}

/**
 * Get a single configuration value
 */
export async function getConfig<T = string>(key: ConfigKey): Promise<T | null> {
  const configs = await loadConfiguration();
  const config = configs.get(key);
  
  if (!config) {
    return null;
  }

  // Parse value based on type
  switch (config.type) {
    case 'number':
      return Number(config.value) as T;
    case 'boolean':
      return (config.value === 'true') as T;
    case 'json':
      try {
        return JSON.parse(config.value) as T;
      } catch {
        return config.value as T;
      }
    default:
      return config.value as T;
  }
}

/**
 * Get multiple configuration values
 */
export async function getConfigs(keys: ConfigKey[]): Promise<Record<string, any>> {
  const configs = await loadConfiguration();
  const result: Record<string, any> = {};
  
  for (const key of keys) {
    const config = configs.get(key);
    if (config) {
      result[key] = await getConfig(key);
    }
  }
  
  return result;
}

/**
 * Update a configuration value
 */
export async function updateConfig(
  key: ConfigKey, 
  value: any, 
  updatedBy?: string
): Promise<boolean> {
  try {
    // Convert value to string for storage
    let stringValue: string;
    if (typeof value === 'object') {
      stringValue = JSON.stringify(value);
    } else {
      stringValue = String(value);
    }

    const { error } = await supabase
      .from('configuration')
      .update({
        value: stringValue,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy || 'system'
      })
      .eq('key', key);

    if (error) {
      throw error;
    }

    // Invalidate cache
    configCache = null;
    
    return true;
  } catch (error) {
    console.error(`Failed to update config ${key}:`, error);
    return false;
  }
}

/**
 * Update multiple configuration values
 */
export async function updateConfigs(
  updates: Record<ConfigKey, any>,
  updatedBy?: string
): Promise<boolean> {
  try {
    for (const [key, value] of Object.entries(updates)) {
      await updateConfig(key as ConfigKey, value, updatedBy);
    }
    return true;
  } catch (error) {
    console.error('Failed to update configs:', error);
    return false;
  }
}

/**
 * Get all configuration for a category
 */
export async function getConfigsByCategory(category: ConfigCategory): Promise<Record<string, any>> {
  const configs = await loadConfiguration();
  const result: Record<string, any> = {};
  
  for (const [key, config] of configs) {
    if (config.category === category) {
      result[key] = await getConfig(key as ConfigKey);
    }
  }
  
  return result;
}

/**
 * Get all non-sensitive configuration (for UI display)
 */
export async function getPublicConfiguration(): Promise<Record<string, any>> {
  const configs = await loadConfiguration();
  const result: Record<string, any> = {};
  
  for (const [key, config] of configs) {
    if (!config.isSensitive) {
      result[key] = await getConfig(key as ConfigKey);
    }
  }
  
  return result;
}

/**
 * Get wallet configuration with fallback to environment variables
 */
export async function getWalletConfig() {
  const [holdingWallet, charityWallet, adminWallet, creatorVault, coinCreatorVaultAta] = await Promise.all([
    getConfig<string>('holding_wallet_address'),
    getConfig<string>('charity_wallet_address'),
    getConfig<string>('admin_wallet_address'),
    getConfig<string>('creator_vault'),
    getConfig<string>('coin_creator_vault_ata')
  ]);

  return {
    holdingWallet: holdingWallet || process.env.HOLDING_WALLET_ADDRESS || '',
    charityWallet: charityWallet || process.env.CHARITY_WALLET_ADDRESS || '',
    adminWallet: adminWallet || process.env.ADMIN_WALLET_ADDRESS || '',
    creatorVault: creatorVault || process.env.CREATOR_VAULT || '',
    coinCreatorVaultAta: coinCreatorVaultAta || process.env.COIN_CREATOR_VAULT_ATA || ''
  };
}

/**
 * Get draw configuration
 */
export async function getDrawConfig() {
  const [winnersPerDraw, candidatesPerSpin, minimumTokenBalance] = await Promise.all([
    getConfig<number>('winners_per_draw'),
    getConfig<number>('candidates_per_spin'),
    getConfig<number>('minimum_token_balance')
  ]);

  return {
    winnersPerDraw: winnersPerDraw || 7,
    candidatesPerSpin: candidatesPerSpin || 7,
    minimumTokenBalance: minimumTokenBalance || 10000
  };
}

/**
 * Get distribution percentages
 */
export async function getDistributionConfig() {
  const [winnersPercent, holdingPercent, charityPercent] = await Promise.all([
    getConfig<number>('distribution_winners_percent'),
    getConfig<number>('distribution_holding_percent'),
    getConfig<number>('distribution_charity_percent')
  ]);

  return {
    winnersPercent: winnersPercent || 50,
    holdingPercent: holdingPercent || 40,
    charityPercent: charityPercent || 10
  };
}

/**
 * Reset configuration to defaults (useful for testing)
 */
export async function resetConfiguration(): Promise<boolean> {
  // This would reset to the default values defined in your seed script
  // For now, just invalidate cache
  configCache = null;
  return true;
}