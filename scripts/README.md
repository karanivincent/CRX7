# Test Wallet Consolidation Script

This script consolidates SOL from multiple test wallets into a single target wallet for easier testing.

## Usage

### Dry Run (Safe - Shows what would happen)
```bash
pnpm consolidate:dry
```

### Actual Execution
```bash
pnpm consolidate
```

## Configuration

Edit the `CONFIG` object in `scripts/consolidate-test-wallets.ts` to customize:

- **TARGET_WALLET**: Wallet address to consolidate funds to (default: admin wallet)
- **MIN_BALANCE_TO_LEAVE**: SOL to leave in each account for rent exemption (default: 0.002 SOL)
- **MIN_TRANSFER_AMOUNT**: Minimum amount worth transferring (default: 0.001 SOL)
- **SOURCE_WALLETS**: Add/remove wallets and their private keys

## Features

- 🔒 **Safe**: Leaves rent exemption amount in each account
- 💰 **Efficient**: Uses minimal transaction fees
- 🔍 **Transparent**: Shows detailed analysis before executing
- 🏃 **Fast**: Uses Helius RPC for better performance
- 🔗 **Trackable**: Provides Solscan links for all transactions
- 🧪 **Testable**: Dry run mode to preview actions

## Security Notes

- Private keys are only used locally and never transmitted
- Script connects directly to Solana mainnet via Helius
- Each wallet retains minimum balance for rent exemption
- Transactions are signed locally with your private keys

## Example Output

```
🪙 Test Wallet Consolidation Script
=====================================

⚙️ Configuration:
  Target wallet: 97oyn1LiiTRdRmK2Ut1S4YpfmS4RdWYieRNYpkS1Znfs
  Min balance to leave: 0.002 SOL
  Min transfer amount: 0.001 SOL
  Dry run mode: ENABLED
  Source wallets: 7

🔍 Analyzing wallet balances...

HOLDING_WALLET:
  Address: EgFrJidrBi89nXA8qbBnZ1PMWUPRunX8bA7CWJFhbdEt
  Balance: 0.045000 SOL
  Will transfer: 0.043000 SOL
  Will keep: 0.002000 SOL (rent)

💰 Total to consolidate: 0.125000 SOL
📍 Target wallet: 97oyn1LiiTRdRmK2Ut1S4YpfmS4RdWYieRNYpkS1Znfs

🔍 DRY RUN MODE - No actual transfers will be executed
✅ Consolidation complete!
```