import {
	TOKEN_MINT_ADDRESS,
	TOKEN_NAME,
	TOKEN_SYMBOL
} from '$env/static/private';

export interface TokenConfig {
	// Token Details
	mintAddress: string;
	name: string;
	symbol: string;
	displayName: string; // For UI display (e.g., "$CRX7")

	// Wallet Configuration
	adminWallet: string;
	holdingWallet: string;
	charityWallet: string;
	creatorVault: string;
	coinCreatorVaultAta: string;

	// Distribution Settings
	distribution: {
		winnersPercentage: number;
		holdingPercentage: number;
		charityPercentage: number;
	};

	// Lottery Settings
	winnersPerDraw: number;
	drawFrequency: string;

	// Jupiter Swap URL
	jupiterSwapUrl: string;
}

// Base token configuration (environment variables only)
const baseTokenConfig = {
	// Token Details
	mintAddress: TOKEN_MINT_ADDRESS,
	name: TOKEN_NAME,
	symbol: TOKEN_SYMBOL,
	displayName: `$${TOKEN_SYMBOL}`, // Creates $CRX7 or $CRx7 dynamically

	// Default Distribution Settings (can be overridden by configuration service)
	distribution: {
		winnersPercentage: 50,
		holdingPercentage: 40,
		charityPercentage: 10
	},

	// Default Lottery Settings (can be overridden by configuration service)
	winnersPerDraw: 7,
	drawFrequency: 'weekly',

	// Jupiter Swap URL - dynamically constructed
	jupiterSwapUrl: `https://jup.ag/swap/SOL-${TOKEN_MINT_ADDRESS}`
};

// Legacy export for backward compatibility (use only on server-side with caution)
export const tokenConfig: TokenConfig = {
	...baseTokenConfig,
	// These will be empty strings - use getServerTokenConfig() instead for server-side operations
	adminWallet: '',
	holdingWallet: '',
	charityWallet: '',
	creatorVault: '',
	coinCreatorVaultAta: ''
};

// Helper functions for common use cases (server-only)
export const getTokenDisplay = () => tokenConfig.displayName;
export const getTokenName = () => tokenConfig.name;
export const getTokenSymbol = () => tokenConfig.symbol;
export const getMintAddress = () => tokenConfig.mintAddress;
export const getJupiterUrl = () => tokenConfig.jupiterSwapUrl;

// Distribution helpers (server-only)
export const getDistributionText = () => {
	const { winnersPercentage, holdingPercentage, charityPercentage } = tokenConfig.distribution;
	return `${winnersPercentage}% to winners • ${holdingPercentage}% to future rounds • ${charityPercentage}% to charity`;
};

// Lottery helpers (server-only)
export const getLotteryDescription = () => {
	return `Every ${tokenConfig.drawFrequency}, ${tokenConfig.winnersPerDraw} ${tokenConfig.displayName} holders are randomly selected to win SOL rewards.`;
};

// Server-side function to get complete token config with wallet addresses from configuration service
export async function getServerTokenConfig(): Promise<TokenConfig> {
	// Only import on server-side to avoid build issues
	if (typeof window !== 'undefined') {
		throw new Error('getServerTokenConfig() can only be used on the server side');
	}
	
	try {
		const { getWalletConfig, getDistributionConfig, getDrawConfig } = await import('../server/configuration-service');
		
		const [walletConfig, distributionConfig, drawConfig] = await Promise.all([
			getWalletConfig(),
			getDistributionConfig(),
			getDrawConfig()
		]);

		return {
			...baseTokenConfig,
			// Wallet addresses from configuration service (database -> environment fallback)
			adminWallet: walletConfig.adminWallet,
			holdingWallet: walletConfig.holdingWallet,
			charityWallet: walletConfig.charityWallet,
			creatorVault: walletConfig.creatorVault,
			coinCreatorVaultAta: walletConfig.coinCreatorVaultAta,
			// Distribution settings from configuration service
			distribution: {
				winnersPercentage: distributionConfig.winnersPercent,
				holdingPercentage: distributionConfig.holdingPercent,
				charityPercentage: distributionConfig.charityPercent
			},
			// Draw settings from configuration service
			winnersPerDraw: drawConfig.winnersPerDraw,
		};
	} catch (error) {
		console.warn('Failed to load server token config from database, using defaults:', error);
		// Fallback to environment variables if configuration service fails
		const { 
			ADMIN_WALLET_ADDRESS,
			CHARITY_WALLET_ADDRESS,
			COIN_CREATOR_VAULT_ATA,
			CREATOR_VAULT,
			HOLDING_WALLET_ADDRESS
		} = await import('$env/static/private');
		
		return {
			...baseTokenConfig,
			adminWallet: ADMIN_WALLET_ADDRESS || '',
			holdingWallet: HOLDING_WALLET_ADDRESS || '',
			charityWallet: CHARITY_WALLET_ADDRESS || '',
			creatorVault: CREATOR_VAULT || '',
			coinCreatorVaultAta: COIN_CREATOR_VAULT_ATA || ''
		};
	}
}

// Create client-safe config (no sensitive data)
export const getClientConfig = () => ({
	displayName: baseTokenConfig.displayName,
	name: baseTokenConfig.name,
	symbol: baseTokenConfig.symbol,
	winnersPerDraw: baseTokenConfig.winnersPerDraw,
	drawFrequency: baseTokenConfig.drawFrequency,
	distribution: baseTokenConfig.distribution
});

export default tokenConfig;