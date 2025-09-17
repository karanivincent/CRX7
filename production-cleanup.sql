-- ============================================================================
-- CRX7 PRODUCTION DATABASE CLEANUP SCRIPT
-- ============================================================================
-- This script will clean all test/development data for production launch
-- Run this script on your production database to start with a clean slate
-- 
-- ⚠️  WARNING: This will permanently delete ALL lottery data
-- ⚠️  Make sure to backup your database before running this script
-- ============================================================================

-- Start transaction to ensure all-or-nothing execution
BEGIN;

-- ===========================================
-- STEP 1: Clear all lottery/draw related data
-- ===========================================

-- Delete in order to respect foreign key constraints
TRUNCATE TABLE "distribution_history" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "winner" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "participant" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "draw" RESTART IDENTITY CASCADE;

-- ===========================================
-- STEP 2: Reset sequences and auto-increment values
-- ===========================================

-- Reset draw numbering to start from 1
-- This ensures your first production draw will be Draw #1
-- (Sequences are automatically reset by RESTART IDENTITY above)

-- ===========================================
-- STEP 3: Clear Supabase Auth data (optional)
-- ===========================================

-- ⚠️  UNCOMMENT THE FOLLOWING SECTION ONLY if you want to remove all user accounts
-- This will delete all users from Supabase Auth
-- You'll need to run this in Supabase dashboard SQL editor, not in your app

/*
-- Clear auth data (run in Supabase SQL editor)
DELETE FROM auth.audit_log_entries;
DELETE FROM auth.refresh_tokens;
DELETE FROM auth.instances;
DELETE FROM auth.sessions;
DELETE FROM auth.mfa_factors;
DELETE FROM auth.mfa_challenges;
DELETE FROM auth.mfa_amr_claims;
DELETE FROM auth.users;
*/

-- ===========================================
-- STEP 4: Verify cleanup
-- ===========================================

-- Check that all tables are empty
SELECT 'draw' as table_name, COUNT(*) as record_count FROM "draw"
UNION ALL
SELECT 'participant', COUNT(*) FROM "participant"
UNION ALL
SELECT 'winner', COUNT(*) FROM "winner"
UNION ALL
SELECT 'distribution_history', COUNT(*) FROM "distribution_history";

-- ===========================================
-- STEP 5: Insert production-ready initial data (optional)
-- ===========================================

-- You can uncomment and modify this section to insert any initial data
-- For example, create your first scheduled draw if needed

/*
-- Example: Insert first scheduled draw
INSERT INTO "draw" (id, draw_number, scheduled_at, status)
VALUES (
    gen_random_uuid(),
    1,
    NOW() + INTERVAL '1 week',
    'scheduled'
);
*/

-- Commit all changes
COMMIT;

-- ===========================================
-- SUCCESS MESSAGE
-- ===========================================
SELECT 'Database cleanup completed successfully! 🚀' as status;
SELECT 'Your CRX7 application is ready for production launch!' as message;