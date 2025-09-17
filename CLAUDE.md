# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
pnpm run dev           # runs on localhost:5173

# Build for production
pnpm run build
pnpm run preview       # preview production build

# Type checking and linting
pnpm run check         # svelte-check with TypeScript
pnpm run check:watch   # watch mode for type checking
pnpm run lint          # prettier + eslint
pnpm run format        # prettier formatting

# Testing
pnpm run test          # run vitest
pnpm run test:run      # run tests once
pnpm run test:ui       # open vitest UI

# Database operations
pnpm run db:generate   # generate Drizzle migrations
pnpm drizzle-kit push  # push schema changes to database
supabase start         # start local Supabase (requires Docker)
supabase db push       # deploy database schema

# Wallet consolidation scripts
pnpm run consolidate       # consolidate test wallets
pnpm run consolidate:dry   # dry run consolidation
```

## Architecture Overview

CRX7 (Creator Reward x 7) is a Solana-based lottery system where token holders can win SOL rewards through weekly draws. Built with SvelteKit, Supabase, and Solana Web3.

### Core Features

- **Lottery System**: 7 random token holders selected per draw
- **SOL Distribution**: 50% winners, 40% holding, 10% charity
- **Vault Management**: Combined Creator Vault + Coin Creator Vault ATA
- **Admin Dashboard**: Draw management, distribution, scheduling
- **Analytics**: Vercel Analytics integration

### Tech Stack

- **Frontend**: SvelteKit 2.x with TypeScript
- **Authentication**: Supabase Auth (hidden signup, 2FA support)
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Blockchain**: Solana Web3.js, SPL Token
- **Styling**: Tailwind CSS with shadcn-svelte components
- **Deployment**: Vercel with Node 20 runtime

### Key Directories

- `src/lib/auth/` - MFA components and authentication
- `src/lib/db/` - Database schema (draw, participant, winner, distribution_history)
- `src/lib/components/` - UI components including draw animations
- `src/lib/server/` - Server-side Solana integration
- `src/lib/config/` - Token and wallet configuration
- `src/routes/admin/` - Protected admin routes
- `src/routes/api/` - API endpoints for vault, holders, distribution
- `scripts/` - Utility scripts for wallet consolidation

### Database Schema

Main tables managed via Drizzle ORM:

- `draw` - Lottery draw scheduling and execution
- `participant` - Token holders in each draw
- `winner` - Selected winners and prize amounts
- `distribution_history` - SOL distribution tracking

### Authentication & Security

- **Hidden Signup**: Access via `/auth/login?signup=true`
- **2FA Implementation**: TOTP-based MFA with Supabase
- **Admin Access**: Direct URL only (`/auth/login`), no nav links
- **Unauthenticated Redirects**: Admin routes redirect to home `/`

### Solana Integration

- **Token**: Configurable via environment
- **Vaults**: Creator Vault + Coin Creator Vault ATA (combined balance)
- **RPC**: Helius API for blockchain queries
- **Distribution**: Automated SOL transfers to winners/wallets
- **Holder Detection**: Fetches token holders > 0 balance

### Environment Variables Required

```
# Supabase
DATABASE_URL
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY

# Helius RPC
HELIUS_API_KEY

# Token Configuration
TOKEN_MINT_ADDRESS
TOKEN_NAME
TOKEN_SYMBOL

# Wallet Configuration
ADMIN_WALLET_ADDRESS
ADMIN_WALLET_PRIVATE_KEY
HOLDING_WALLET_ADDRESS
HOLDING_PRIVATE_KEY
CHARITY_WALLET_ADDRESS
CHARITY_PRIVATE_KEY

# Vaults
CREATOR_VAULT
COIN_CREATOR_VAULT_ATA
```

### Production Launch

1. Backup database before cleanup
2. Run `production-cleanup.sql` to clear test data
3. Verify with `production-verification.sql`
4. Update all environment variables for production
5. Deploy to Vercel

### Testing Mode

Developer panel and testing features can be toggled via `/admin/configuration`. Testing mode uses separate distribution wallets for safety.

### Important Routes

- `/` - Public homepage
- `/past-draws` - Draw history
- `/winners` - Winner listings
- `/how-it-works` - User guide
- `/auth/login` - Admin login (hidden)
- `/admin/*` - Admin dashboard (protected)
