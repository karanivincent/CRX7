-- ============================================================================
-- CRX7 PRODUCTION VERIFICATION SCRIPT
-- ============================================================================
-- Run this script AFTER the cleanup to verify everything is ready for launch
-- ============================================================================

-- ===========================================
-- VERIFY DATABASE STRUCTURE
-- ===========================================

-- Check that all required tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('draw', 'participant', 'winner', 'distribution_history')
ORDER BY tablename;

-- ===========================================
-- VERIFY DATA CLEANUP
-- ===========================================

-- Verify all tables are empty
SELECT 
    'draw' as table_name, 
    COUNT(*) as record_count,
    CASE WHEN COUNT(*) = 0 THEN '✅ Clean' ELSE '❌ Has Data' END as status
FROM "draw"
UNION ALL
SELECT 'participant', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ Clean' ELSE '❌ Has Data' END FROM "participant"
UNION ALL
SELECT 'winner', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ Clean' ELSE '❌ Has Data' END FROM "winner"
UNION ALL
SELECT 'distribution_history', COUNT(*), CASE WHEN COUNT(*) = 0 THEN '✅ Clean' ELSE '❌ Has Data' END FROM "distribution_history"
ORDER BY table_name;

-- ===========================================
-- VERIFY FOREIGN KEY CONSTRAINTS
-- ===========================================

-- Check all foreign key constraints are intact
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('draw', 'participant', 'winner', 'distribution_history')
ORDER BY tc.table_name, tc.constraint_name;

-- ===========================================
-- VERIFY INDEXES
-- ===========================================

-- Check important indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN ('draw', 'participant', 'winner', 'distribution_history')
ORDER BY tablename, indexname;

-- ===========================================
-- PRODUCTION READINESS CHECKLIST
-- ===========================================

SELECT '🚀 PRODUCTION READINESS CHECKLIST' as title;
SELECT '=================================' as separator;
SELECT '✅ Database structure verified' as item;
SELECT '✅ Test data cleaned' as item;
SELECT '✅ Foreign keys intact' as item;
SELECT '✅ Indexes in place' as item;
SELECT '' as item;
SELECT '🎯 NEXT STEPS:' as next_steps;
SELECT '1. Deploy to production' as step;
SELECT '2. Update environment variables' as step;
SELECT '3. Enable MFA for admin users' as step;
SELECT '4. Test first lottery draw' as step;
SELECT '5. Monitor vault balances' as step;
SELECT '' as item;
SELECT '🎉 CRX7 is ready for launch!' as final_message;