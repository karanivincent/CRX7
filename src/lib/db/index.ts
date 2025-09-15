import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Use Supabase client for database operations
export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);

// For now, we'll use Supabase client directly instead of Drizzle
// This avoids the connection timeout issues with postgres.js
export const db = supabase;
