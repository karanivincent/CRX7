import { supabase } from './index';

/**
 * Seed the configuration table with default values
 * This populates the database with the initial configuration
 */
export async function seedConfiguration() {
  console.log('🌱 Seeding configuration table...');
  
  const defaultConfigs = [
    // Draw configuration
    {
      key: 'winners_per_draw',
      value: '7',
      type: 'number',
      category: 'draw',
      description: 'Number of winners selected per draw',
      isSensitive: false
    },
    {
      key: 'candidates_per_spin',
      value: '7', 
      type: 'number',
      category: 'draw',
      description: 'Number of candidates shown on the spinning wheel',
      isSensitive: false
    },
    {
      key: 'minimum_token_balance',
      value: '10000',
      type: 'number', 
      category: 'draw',
      description: 'Minimum token balance required for lottery eligibility',
      isSensitive: false
    },
    
    // Distribution configuration
    {
      key: 'distribution_winners_percent',
      value: '50',
      type: 'number',
      category: 'distribution',
      description: 'Percentage of SOL distributed to winners',
      isSensitive: false
    },
    {
      key: 'distribution_holding_percent', 
      value: '40',
      type: 'number',
      category: 'distribution',
      description: 'Percentage of SOL held for future operations',
      isSensitive: false
    },
    {
      key: 'distribution_charity_percent',
      value: '10',
      type: 'number',
      category: 'distribution', 
      description: 'Percentage of SOL donated to charity',
      isSensitive: false
    },
    
    // Wallet configuration
    {
      key: 'holding_wallet_address',
      value: process.env.HOLDING_WALLET_ADDRESS || '',
      type: 'string',
      category: 'wallet',
      description: 'Wallet address for holding funds',
      isSensitive: false
    },
    {
      key: 'charity_wallet_address',
      value: process.env.CHARITY_WALLET_ADDRESS || '',
      type: 'string',
      category: 'wallet',
      description: 'Wallet address for charity donations',
      isSensitive: false
    },
    {
      key: 'admin_wallet_address',
      value: process.env.ADMIN_WALLET_ADDRESS || '',
      type: 'string',
      category: 'wallet',
      description: 'Admin wallet address for signing transactions',
      isSensitive: false
    },
    {
      key: 'creator_vault',
      value: process.env.CREATOR_VAULT || '',
      type: 'string',
      category: 'wallet',
      description: 'Token creator vault address',
      isSensitive: false
    },
    {
      key: 'coin_creator_vault_ata',
      value: process.env.COIN_CREATOR_VAULT_ATA || '',
      type: 'string',
      category: 'wallet',
      description: 'Coin creator vault associated token account',
      isSensitive: false
    },
    
    // Token configuration
    {
      key: 'token_mint_address',
      value: process.env.PUBLIC_TOKEN_MINT_ADDRESS || '',
      type: 'string',
      category: 'token',
      description: 'Token mint address',
      isSensitive: false
    },
    {
      key: 'token_name',
      value: 'Creator Reward X7',
      type: 'string', 
      category: 'token',
      description: 'Token display name',
      isSensitive: false
    },
    {
      key: 'token_symbol',
      value: 'CRX7',
      type: 'string',
      category: 'token', 
      description: 'Token symbol',
      isSensitive: false
    }
  ];

  try {
    // Insert all configurations
    for (const config of defaultConfigs) {
      const { error } = await supabase
        .from('configuration')
        .upsert({
          key: config.key,
          value: config.value,
          type: config.type,
          category: config.category,
          description: config.description,
          is_sensitive: config.isSensitive,
          updated_by: 'system'
        }, {
          onConflict: 'key',
          ignoreDuplicates: true
        });
      
      if (error && !error.message.includes('duplicate key')) {
        console.error(`Failed to insert config ${config.key}:`, error);
      }
    }
    
    console.log('✅ Configuration table seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to seed configuration table:', error);
    return false;
  }
}

// Allow running this script directly
if (import.meta.url.includes('seed-configuration')) {
  seedConfiguration().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}