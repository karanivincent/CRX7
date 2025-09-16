import { json } from '@sveltejs/kit';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import type { RequestHandler } from './$types';
import { TOKEN_MINT_ADDRESS, TOKEN_NAME, TOKEN_SYMBOL, HELIUS_API_KEY } from '$env/static/private';

export const GET: RequestHandler = async () => {
	try {
		// Connect to Helius RPC
		const rpcUrl = HELIUS_API_KEY 
			? `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
			: 'https://api.mainnet-beta.solana.com';
		const connection = new Connection(rpcUrl, 'confirmed');
		
		const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);
		
		// Fetch all token accounts for this mint
		console.log('Fetching token accounts for mint:', TOKEN_MINT_ADDRESS);
		
		const tokenAccounts = await connection.getProgramAccounts(
			TOKEN_PROGRAM_ID,
			{
				filters: [
					{
						dataSize: 165, // Size of token account
					},
					{
						memcmp: {
							offset: 0, // Mint address is at offset 0
							bytes: mintPublicKey.toBase58(),
						},
					},
				],
			}
		);

		console.log(`Found ${tokenAccounts.length} token accounts`);

		// Parse token account data and filter out zero balances
		const holders = tokenAccounts
			.map((account) => {
				try {
					// Parse token account data
					const data = account.account.data;
					
					// Token account structure:
					// - mint: 32 bytes (0-31)
					// - owner: 32 bytes (32-63) 
					// - amount: 8 bytes (64-71)
					
					const owner = new PublicKey(data.slice(32, 64));
					const amountBuffer = data.slice(64, 72);
					const amount = Number(amountBuffer.readBigUInt64LE(0));
					
					return {
						address: owner.toBase58(),
						balance: amount,
						decimals: 6, // Most tokens use 6 decimals, adjust if needed
						balanceFormatted: (amount / Math.pow(10, 6)).toFixed(2)
					};
				} catch (error) {
					console.error('Error parsing token account:', error);
					return null;
				}
			})
			.filter((holder): holder is NonNullable<typeof holder> => holder !== null && holder.balance > 0) // Filter out null and zero balance
			.sort((a, b) => b.balance - a.balance); // Sort by balance descending

		return json({
			success: true,
			holders: holders,
			totalHolders: holders.length,
			tokenMint: TOKEN_MINT_ADDRESS,
			tokenName: TOKEN_NAME,
			tokenSymbol: TOKEN_SYMBOL,
			message: `Fetched ${holders.length} real token holders from blockchain`
		});
		
	} catch (error) {
		console.error('Error fetching token holders:', error);
		return json(
			{
				success: false,
				error: 'Failed to fetch token holders',
				message: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};