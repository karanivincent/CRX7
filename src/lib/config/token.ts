import { 
	TOKEN_MINT_ADDRESS, 
	TOKEN_NAME, 
	TOKEN_SYMBOL,
	ADMIN_WALLET_ADDRESS,
	HOLDING_WALLET_ADDRESS,
	CHARITY_WALLET_ADDRESS,
	CREATOR_VAULT,
	COIN_CREATOR_VAULT_ATA
} from '$env/static/private';

export interface TokenConfig {
	// Token Details
	mintAddress: string;
	name: string;
	symbol: string;
	displayName: string; // For UI display (e.g., "$RUNNER")
	
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

export const tokenConfig: TokenConfig = {
	// Token Details
	mintAddress: TOKEN_MINT_ADDRESS,
	name: TOKEN_NAME,
	symbol: TOKEN_SYMBOL,
	displayName: `$${TOKEN_SYMBOL}`, // Creates $RUNNER or $CRx7 dynamically
	
	// Wallet Configuration
	adminWallet: ADMIN_WALLET_ADDRESS,
	holdingWallet: HOLDING_WALLET_ADDRESS,
	charityWallet: CHARITY_WALLET_ADDRESS,
	creatorVault: CREATOR_VAULT,
	coinCreatorVaultAta: COIN_CREATOR_VAULT_ATA,
	
	// Distribution Settings
	distribution: {
		winnersPercentage: 50,
		holdingPercentage: 40,
		charityPercentage: 10
	},
	
	// Lottery Settings
	winnersPerDraw: 7,
	drawFrequency: 'weekly',
	
	// Jupiter Swap URL - dynamically constructed
	jupiterSwapUrl: `https://jup.ag/swap/SOL-${TOKEN_MINT_ADDRESS}`
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

// Create client-safe config (no sensitive data)
export const getClientConfig = () => ({
	displayName: tokenConfig.displayName,
	name: tokenConfig.name,
	symbol: tokenConfig.symbol,
	winnersPerDraw: tokenConfig.winnersPerDraw,
	drawFrequency: tokenConfig.drawFrequency,
	distribution: tokenConfig.distribution
});

export default tokenConfig;