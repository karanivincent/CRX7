# CRx7 Token Platform - MVP Specification

## MVP Philosophy
**Launch Fast, Learn, Iterate** - Get the core lottery mechanism working with basic UI, then enhance based on real user feedback.

---

## 🎯 MVP Core Features (Week 1-2)

### 1. Admin Dashboard (Basic)
```
Essential Functions:
✅ Simple login (email/password - no 2FA yet)
✅ Start new round button
✅ Manual input for reward amount
✅ Fetch token holders from Helius
✅ Basic spinning wheel (7 segments)
✅ Display 7 winners after selection
✅ Manual distribution trigger
✅ View transaction status
```

### 2. Holder Selection System
```
✅ Helius integration to fetch holders
✅ Random selection of 7 wallets
✅ No duplicate winners in same round
✅ Fixed minimum balance (100 tokens initially)
❌ Skip: Exchange wallet filtering (add later)
❌ Skip: Configurable parameters (hardcode for now)
```

### 3. Spinning Wheel
```
✅ Basic wheel with 7 segments
✅ Simple CSS animation
✅ Click to spin functionality
✅ Display winner clearly
❌ Skip: Sound effects
❌ Skip: Fancy animations
❌ Skip: Elimination effects
```

### 4. Distribution System
```
✅ Send SOL to 7 winners (equal split of 50%)
✅ Send 40% to holding wallet
✅ Send 10% to charity wallet
✅ Basic retry on failure (manual)
❌ Skip: Automatic retry logic
❌ Skip: Complex error handling
```

### 5. Public Landing Page
```
✅ Simple explanation of platform
✅ Display last round winners
✅ Show total distributed amount
❌ Skip: Next draw countdown
❌ Skip: Live viewer count
❌ Skip: Eligibility checker
```

### 6. Database (Minimal Schema)
```sql
-- Only essential tables for MVP
draw_rounds (id, round_number, total_amount, status, created_at)
winners (id, round_id, wallet_address, amount, tx_hash)
config (key, value) -- for wallet addresses and min balance
```

---

## 🚀 MVP Tech Stack (Simplified)

### Frontend
- **SvelteKit** - Single framework for everything
- **Tailwind CSS** - Rapid styling
- **No complex state management** - Use Svelte stores

### Backend
- **SvelteKit API routes** - No separate backend
- **Helius SDK** - For blockchain interaction
- **Direct RPC calls** - For sending SOL

### Database
- **Supabase** - Database + Auth in one
- **3 tables only** - Minimal schema

### Deployment
- **Vercel** - One-click deploy
- **Environment variables** - For secrets

---

## 📋 MVP Development Plan

### Week 1: Core Functionality
**Day 1-2: Setup & Database**
```
- Initialize SvelteKit project
- Setup Supabase with basic schema
- Configure environment variables
- Basic auth implementation
```

**Day 3-4: Blockchain Integration**
```
- Helius connection setup
- Fetch token holders function
- Random selection algorithm
- SOL transfer function
```

**Day 5-7: Admin Dashboard**
```
- Login page
- Start round interface
- Basic wheel component
- Winner display
- Distribution trigger
```

### Week 2: Public Interface & Testing
**Day 8-9: Public Pages**
```
- Simple landing page
- Winners display
- Basic styling with Tailwind
```

**Day 10-11: Integration & Testing**
```
- Connect all components
- Test on devnet
- Fix critical bugs only
```

**Day 12-14: Launch Prep**
```
- Deploy to Vercel
- Switch to mainnet
- Run test round with small amount
- Basic documentation
```

---

## 📊 MVP Success Metrics

### Must Track (Day 1)
- ✅ Successful draw completion
- ✅ All 7 winners receive SOL
- ✅ Charity receives 10%
- ✅ No duplicate winners

### Nice to Track (Can Add Later)
- ❌ User engagement metrics
- ❌ Page load times
- ❌ Social media reach

---

## 🎨 MVP UI/UX Approach

### Design Principles
1. **Function over form** - It works first, looks pretty later
2. **Mobile responsive** - But optimize for desktop
3. **Clear CTAs** - Make admin actions obvious
4. **Minimal clicks** - Streamline the draw process

### Page Structure
```
/              → Landing page (public)
/admin         → Login
/admin/dashboard → Run draws
/winners       → Show last round (public)
```

---

## ⚠️ What We're NOT Building (Yet)

### Skip for V1.1
- ❌ Leaderboard
- ❌ History page with search
- ❌ Live draw viewing
- ❌ Social media auto-posting
- ❌ WebSocket real-time updates
- ❌ Countdown timers

### Skip for V2.0
- ❌ Email notifications
- ❌ Advanced analytics
- ❌ Multiple wheel themes
- ❌ Referral system
- ❌ Mobile app

---

## 🔧 MVP Configuration

### Hardcoded Values (Change Later)
```javascript
const MVP_CONFIG = {
  MIN_BALANCE: 100,  // tokens
  WINNERS_PER_ROUND: 7,
  WINNER_SHARE: 0.50,  // 50%
  HOLDING_SHARE: 0.40,  // 40%
  CHARITY_SHARE: 0.10,  // 10%
  CHARITY_WALLET: "CHARITY_WALLET_ADDRESS",
  HOLDING_WALLET: "YOUR_WALLET_ADDRESS",
  TOKEN_MINT: "CRx7_TOKEN_MINT_ADDRESS"
}
```

---

## 🚦 Launch Checklist

### Before First Draw
- [ ] Admin can login
- [ ] Can fetch token holders
- [ ] Wheel spins and selects winner
- [ ] Can complete 7 draws
- [ ] Distribution sends SOL correctly
- [ ] Winners saved to database
- [ ] Public can see results

### Nice to Have for Launch
- [ ] Error messages display
- [ ] Loading states
- [ ] Mobile works adequately
- [ ] Basic rate limiting

---

## 📈 Post-MVP Roadmap

### Version 1.1 (Week 3-4)
After running 5-10 successful draws:
- Add history page
- Implement leaderboard
- Improve wheel animations
- Add countdown timer
- Social media manual posting

### Version 1.2 (Month 2)
After community feedback:
- Live draw viewing
- WebSocket updates
- Eligibility checker
- Better error handling
- Automated X posting

### Version 2.0 (Month 3+)
Scale based on success:
- Multiple draw modes
- Advanced analytics
- Referral system
- Mobile optimization
- Governance features

---

## 💻 Sample Code Structure

### Project Structure (MVP)
```
crx7-platform/
├── src/
│   ├── routes/
│   │   ├── +page.svelte           (landing)
│   │   ├── winners/+page.svelte   (public winners)
│   │   ├── admin/
│   │   │   ├── +page.svelte       (login)
│   │   │   └── dashboard/
│   │   │       └── +page.svelte   (main admin)
│   │   └── api/
│   │       ├── holders/+server.js (fetch holders)
│   │       ├── draw/+server.js    (run draw)
│   │       └── distribute/+server.js (send SOL)
│   ├── lib/
│   │   ├── helius.js             (blockchain)
│   │   ├── supabase.js           (database)
│   │   └── components/
│   │       └── Wheel.svelte      (spin wheel)
│   └── app.html
├── static/
├── .env
└── package.json
```

---

## 🎯 MVP Definition of Done

The MVP is complete when:

1. **Admin can run a complete draw round**
   - Login → Start → Spin 7 times → Distribute → Verify

2. **Winners receive their SOL**
   - All 7 get equal shares of 50%
   - Transactions are on-chain

3. **Public can see results**
   - Simple page showing last winners
   - No errors or broken pages

4. **One successful mainnet round**
   - Real tokens, real winners
   - No critical failures

---

## 💡 MVP Development Tips

### Keep It Simple
```javascript
// DON'T: Over-engineer
const complexWheelAnimation = () => {
  // 200 lines of animation code
}

// DO: Start basic
const spinWheel = () => {
  const winner = candidates[Math.floor(Math.random() * 7)];
  return winner;
}
```

### Fail Gracefully
```javascript
// Always have fallbacks
try {
  await sendSOL(winner, amount);
} catch (error) {
  console.error("Distribution failed:", error);
  alert("Distribution failed - try manually");
}
```

### Log Everything
```javascript
// You'll need this for debugging
console.log(`Draw ${roundId}: Selected ${winner} from ${candidates}`);
await saveToDatabase({ action: 'DRAW', data: { roundId, winner, timestamp }});
```

---

## 🎬 Go-Live Strategy

### Soft Launch (Day 1)
1. Run one test draw with 0.1 SOL
2. Verify all systems work
3. Check transactions on Solscan
4. Get feedback from team

### Public Launch (Day 2-3)
1. Announce on X/Twitter
2. Run first real draw with modest amount
3. Post winners publicly
4. Monitor for issues

### Iteration (Week 2+)
1. Fix critical bugs only
2. Note feature requests
3. Plan V1.1 based on feedback
4. Keep running draws to maintain momentum

---

## ✅ Why This MVP Works

1. **Delivers core value** - Random selection and reward distribution
2. **Builds trust** - Transparent, on-chain, verifiable
3. **Creates excitement** - Live draws are engaging
4. **Technically feasible** - 2 weeks with one developer
5. **Low risk** - Manual controls prevent disasters
6. **Expandable** - Clean foundation for features

---

## 🚨 Critical Success Factors

**Must Have:**
- Reliable Helius connection
- Correct SOL distribution math
- No duplicate winners
- Public proof of fairness

**Can Compromise On:**
- Beautiful UI
- Real-time updates
- Historical data
- Advanced features

---

*Remember: Ship fast, learn from real users, iterate based on data. Your first version doesn't need to be perfect, it needs to work and provide value.*