# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview

# Type checking and linting
pnpm run check         # svelte-check with TypeScript
pnpm run check:watch   # watch mode for type checking
pnpm run lint          # prettier + eslint
pnpm run format        # prettier formatting

# Database operations
pnpm run db:generate   # generate Drizzle migrations
supabase start         # start local Supabase instance
supabase db push       # deploy database schema
```

## Architecture Overview

This is a SvelteKit application with Supabase authentication and PostgreSQL database integration:

### Tech Stack
- **Frontend**: SvelteKit 2.x with Svelte 5 (next)
- **Authentication**: Supabase with GitHub OAuth
- **Database**: PostgreSQL via Supabase with Drizzle ORM
- **Styling**: Tailwind CSS with shadcn-svelte components
- **Type Safety**: TypeScript with Zod validation

### Key Directories
- `src/lib/auth/` - Authentication utilities and session management
- `src/lib/db/` - Database connection, schema, and queries
- `src/lib/components/ui/` - Reusable UI components (shadcn-svelte)
- `src/routes/` - SvelteKit routes with server-side logic
- `supabase/` - Database migrations and configuration

### Database Schema
The app uses a simple `profile` table that extends Supabase's built-in auth users:
- Managed via Drizzle ORM in `src/lib/db/schema.ts`
- Auto-creates user profiles on first login via `getOrCreateUserProfile()`

### Authentication Flow
- GitHub OAuth through Supabase Auth
- Session handling in `src/hooks.server.ts`
- Auth routes in `src/routes/auth/`

### Local Development Setup
1. Start Supabase: `supabase start` (requires Docker and Supabase CLI)
2. Copy `.env.example` to `.env.local` with local Supabase credentials
3. Run dev server: `pnpm run dev`
4. Access Supabase dashboard at `http://localhost:54323`

### Environment Variables Required
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth app
- `PUBLIC_SUPABASE_URL` / `PUBLIC_SUPABASE_ANON_KEY` - Supabase connection
- `DATABASE_URL` - PostgreSQL connection string