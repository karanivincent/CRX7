import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Path to store testing mode configuration
const CONFIG_FILE = join(process.cwd(), '.testing-mode.json');

interface TestingConfig {
  testingMode: boolean;
  useTestDistributionWallets: boolean;
  showDeveloperPanel: boolean;
  lastModified: string;
}

function loadTestingConfig(): TestingConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      const configData = readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(configData);
    }
  } catch (error) {
    console.warn('Failed to load testing config:', error);
  }
  
  // Default configuration
  return {
    testingMode: process.env.NODE_ENV === 'development',
    useTestDistributionWallets: false,
    showDeveloperPanel: false,
    lastModified: new Date().toISOString()
  };
}

function saveTestingConfig(config: TestingConfig): void {
  try {
    config.lastModified = new Date().toISOString();
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    
    // Also update environment variables in the current process
    process.env.USE_TEST_MODE = config.testingMode.toString();
    process.env.USE_TEST_DISTRIBUTION_WALLETS = config.useTestDistributionWallets.toString();
    
    console.log('Testing mode configuration updated:', config);
  } catch (error) {
    console.error('Failed to save testing config:', error);
    throw error;
  }
}

export const GET: RequestHandler = async () => {
  try {
    const config = loadTestingConfig();
    
    return json({
      success: true,
      testingMode: config.testingMode,
      useTestDistributionWallets: config.useTestDistributionWallets,
      showDeveloperPanel: config.showDeveloperPanel,
      lastModified: config.lastModified
    });
  } catch (error) {
    console.error('Error getting testing mode status:', error);
    return json({
      error: 'Failed to get testing mode status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { testingMode, useTestDistributionWallets, showDeveloperPanel } = body;
    
    // Validate input
    if (typeof testingMode !== 'boolean' || 
        typeof useTestDistributionWallets !== 'boolean' ||
        typeof showDeveloperPanel !== 'boolean') {
      return json({
        error: 'Invalid input: testingMode, useTestDistributionWallets, and showDeveloperPanel must be boolean values'
      }, { status: 400 });
    }
    
    // Load current config and update
    const config = loadTestingConfig();
    config.testingMode = testingMode;
    config.useTestDistributionWallets = useTestDistributionWallets;
    config.showDeveloperPanel = showDeveloperPanel;
    
    // Save the updated configuration
    saveTestingConfig(config);
    
    return json({
      success: true,
      message: 'Testing mode configuration updated successfully',
      testingMode: config.testingMode,
      useTestDistributionWallets: config.useTestDistributionWallets,
      showDeveloperPanel: config.showDeveloperPanel,
      lastModified: config.lastModified
    });
    
  } catch (error) {
    console.error('Error updating testing mode:', error);
    return json({
      error: 'Failed to update testing mode',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};