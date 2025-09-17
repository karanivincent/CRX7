// Client-safe configuration that can be used in Svelte components
// This file only contains non-sensitive data that can be public

export interface ClientTokenConfig {
	displayName: string; 
	name: string;
	symbol: string;
	winnersPerDraw: number;
	drawFrequency: string;
	distribution: {
		winnersPercentage: number;
		holdingPercentage: number;
		charityPercentage: number;
	};
}

// Default configuration - fallback values
export const defaultClientConfig: ClientTokenConfig = {
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

// Helper functions for common use cases
export const getTokenDisplay = (config: ClientTokenConfig = defaultClientConfig) => config.displayName;
export const getTokenName = (config: ClientTokenConfig = defaultClientConfig) => config.name;
export const getTokenSymbol = (config: ClientTokenConfig = defaultClientConfig) => config.symbol;

// Distribution helpers
export const getDistributionConfig = (config: ClientTokenConfig = defaultClientConfig) => config.distribution;

export const getDistributionText = (config: ClientTokenConfig = defaultClientConfig) => {
	const { winnersPercentage, holdingPercentage, charityPercentage } = config.distribution;
	return `${winnersPercentage}% to winners • ${holdingPercentage}% to future rounds • ${charityPercentage}% to charity`;
};

// Lottery helpers
export const getLotteryDescription = (config: ClientTokenConfig = defaultClientConfig) => {
	return `Every ${config.drawFrequency}, ${config.winnersPerDraw} ${config.displayName} holders are randomly selected to win SOL rewards.`;
};