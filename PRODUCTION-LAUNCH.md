# 🚀 CRX7 Production Launch Guide

## Database Cleanup Instructions

### Step 1: Backup Current Database
```bash
# Create a backup before cleanup (adjust connection details)
pg_dump -h your-supabase-host -U postgres -d postgres > crx7-backup-$(date +%Y%m%d).sql
```

### Step 2: Run Database Cleanup
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Run the `production-cleanup.sql` script

**OR via command line:**
```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f production-cleanup.sql
```

### Step 3: Verify Cleanup
Run the `production-verification.sql` script to ensure everything is clean:
```bash
psql "postgresql://postgres:[password]@[host]:5432/postgres" -f production-verification.sql
```

## What Gets Cleaned

### ✅ Data Removed
- All test lottery draws
- All test participants 
- All test winners
- All test distribution history
- Optionally: test user accounts

### ✅ Data Preserved
- Database structure (tables, indexes, constraints)
- Admin user accounts (if you choose to keep them)
- Application configuration

## Pre-Launch Checklist

### 🔧 Environment Variables
- [ ] Update `DATABASE_URL` to production database
- [ ] Update `PUBLIC_SUPABASE_URL` to production Supabase
- [ ] Update `PUBLIC_SUPABASE_ANON_KEY` to production key
- [ ] Verify wallet addresses in production environment:
  - [ ] `ADMIN_WALLET_ADDRESS` 
  - [ ] `HOLDING_WALLET_ADDRESS`
  - [ ] `CHARITY_WALLET_ADDRESS`
  - [ ] `CREATOR_VAULT` 
  - [ ] `COIN_CREATOR_VAULT_ATA`

### 🔒 Security Setup
- [ ] Enable 2FA for all admin accounts
- [ ] Test signup restriction (should only work with `?signup=true`)
- [ ] Verify MFA flows work correctly
- [ ] Test admin panel access

### 🎰 Lottery System
- [ ] Verify vault balance endpoints work
- [ ] Test draw creation (without executing)
- [ ] Verify participant loading works
- [ ] Test distribution simulation mode
- [ ] Validate Solana transaction signing

### 📊 Analytics & Monitoring
- [ ] Verify Vercel Analytics is tracking
- [ ] Test all admin dashboard functions
- [ ] Check error handling and logging
- [ ] Monitor vault balance updates

## Post-Launch Monitoring

### Day 1-7: Critical Monitoring
- [ ] Monitor vault balances
- [ ] Watch for signup attempts
- [ ] Check draw scheduling works
- [ ] Verify participant detection
- [ ] Test distribution functions

### Week 1-4: System Validation
- [ ] Execute first real lottery draw
- [ ] Validate all transaction flows
- [ ] Monitor user engagement
- [ ] Check analytics data collection
- [ ] Verify backup systems

## Emergency Procedures

### If Issues Arise
1. **Database Problems**: Restore from backup created in Step 1
2. **Transaction Failures**: Check vault balances and retry mechanisms
3. **Authentication Issues**: Verify Supabase settings and environment variables
4. **Frontend Issues**: Check Vercel deployment and build logs

### Support Contacts
- Database: Supabase Dashboard → Project Settings
- Hosting: Vercel Dashboard → Project Settings
- Blockchain: Check Solana status and RPC endpoints

## Success Metrics

### Week 1 Goals
- [ ] Clean database deployment
- [ ] First successful lottery draw
- [ ] Zero security incidents
- [ ] Positive user feedback

### Month 1 Goals
- [ ] Multiple successful draws
- [ ] Growing participant base
- [ ] Stable vault management
- [ ] Analytics showing engagement

---

🎉 **Ready to launch CRX7 and make some holders lucky!** 🏃‍♂️💰