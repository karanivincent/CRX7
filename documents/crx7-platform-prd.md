# Product Requirements Document (PRD)

## CRx7 Token Holder Reward Platform

**Version:** v1.0  
**Owner:** Vincent  
**Created:** 2025-09-15  
**Last Updated:** 2025-09-15  
**Status:** In Development

---

## Executive Summary

The CRx7 Reward Platform is a web-based lottery system that rewards token holders through an engaging, transparent, and gamified experience. Using live drawings with a spinning wheel mechanism, the platform randomly selects winners from eligible token holders and distributes rewards from the Pump.fun creator vault. The system emphasizes community engagement, fairness, and charitable giving while maintaining complete transparency through on-chain verification.

---

## 1. Product Overview

### 1.1 Vision
Create an exciting and fair reward distribution system that strengthens the CRx7 token community through regular live drawings, transparent winner selection, and meaningful charitable contributions.

### 1.2 Mission
To build trust and engagement within the CRx7 token ecosystem by providing equal opportunities for all eligible holders to win rewards while supporting charitable causes.

### 1.3 Success Metrics
- Number of unique participants per round
- Total SOL distributed to winners
- Community engagement on social media
- Retention rate of token holders
- Charitable impact (total donations)
- System uptime and reliability

---

## 2. Goals & Objectives

### Primary Goals
- **Fair Distribution**: Reward holders transparently using verifiable on-chain data
- **Community Engagement**: Boost participation through gamified live drawings
- **Manual Control**: Maintain admin control over timing to ensure quality and prevent automation issues
- **Charitable Impact**: Direct 10% of all rewards to charity
- **Historical Transparency**: Store and display all historical winner data publicly

### Secondary Goals
- Build brand awareness through social media posting
- Create anticipation and excitement around draw events
- Establish trust through transparent operations
- Grow token holder base through engaging reward mechanics

---

## 3. User Personas

### 3.1 Admin (Vincent - Token Creator)
**Needs:**
- Simple interface to manage draws
- Clear visibility of vault balance
- Reliable distribution mechanism
- Audit trail of all actions

**Actions:**
- Manually claim rewards from Pump.fun
- Initiate live drawings
- Spin the wheel 7 times per round
- Trigger reward distributions
- Configure system parameters

### 3.2 Token Holders
**Needs:**
- Fair chance to win
- Transparency in selection process
- Quick reward receipt
- Historical verification

**Actions:**
- Hold minimum token balance
- Watch live drawings
- Check eligibility status
- View winner history
- Verify on-chain transactions

### 3.3 Public Viewers
**Needs:**
- Entertainment value
- Understanding of the process
- Proof of fairness

**Actions:**
- Watch live drawings
- View historical results
- Share on social media
- Consider purchasing tokens

---

## 4. Core Features

### 4.1 Admin Dashboard

#### 4.1.1 Draw Management
- **Start New Round**: Initiate a new drawing session
- **Live Draw Interface**: 
  - Display current round number
  - Show draw progress (X of 7 winners selected)
  - Spinning wheel visualization
  - Selected winners list
- **Vault Balance Display**: 
  - Current unclaimed balance from Pump.fun
  - Recommended distribution amount
  - Manual input field for distribution amount

#### 4.1.2 Configuration Panel
- **Minimum Balance Setting**: Configurable threshold for eligibility
- **Wallet Addresses**:
  - Holding wallet address (40% distribution)
  - Charity wallet address (10% distribution)
- **Draw Parameters**:
  - Number of candidates per spin (default: 7)
  - Number of total winners (default: 7)

#### 4.1.3 Distribution Management
- **Manual Distribution Trigger**: Button to initiate payouts after all winners selected
- **Distribution Status**: 
  - Pending/Processing/Completed/Failed states
  - Transaction hash display
  - Retry mechanism for failed transactions
- **Distribution Preview**: Show exact amounts before sending

### 4.2 Token Holder Selection System

#### 4.2.1 Eligibility Rules
- Minimum token balance (configurable)
- One entry per wallet per round
- No duplicate winners within the same round
- Exchange/smart contract filtering

#### 4.2.2 Random Selection Process
1. Fetch total holder count via Helius API
2. Generate 7 unique random indices
3. Retrieve specific wallet addresses
4. Validate eligibility (balance, type)
5. Display on spinning wheel

#### 4.2.3 Fairness Mechanisms
- Equal probability for all eligible wallets
- No advantage for larger holders (whale protection)
- Transparent randomization process
- On-chain verification capability

### 4.3 Spinning Wheel Interface

#### 4.3.1 Visual Design
- 7 segments with truncated wallet addresses
- Smooth spinning animation
- Elimination-style or winner-selection mode
- Sound effects (optional)
- Celebration animation for winner

#### 4.3.2 Live Interaction
- Admin-controlled spin trigger
- Variable spin duration for suspense
- Clear winner highlight
- Automatic progression to next draw

### 4.4 Pump.fun Integration

#### 4.4.1 Creator Vault Monitoring
- Real-time balance fetching
- Display matching Pump.fun frontend
- Track dynamic fee percentage based on market cap
- Historical vault balance logging

#### 4.4.2 Manual Claiming Process
- Admin manually claims from Pump.fun
- Input claimed amount into system
- Automatic calculation of distribution splits

### 4.5 Database Schema

#### 4.5.1 Core Tables

**draw_rounds**
```sql
- id: UUID
- round_number: INTEGER
- status: ENUM (active, completed, cancelled)
- total_reward_amount: DECIMAL
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
- admin_id: UUID (FK)
```

**draw_selections**
```sql
- id: UUID
- round_id: UUID (FK)
- draw_number: INTEGER (1-7)
- candidates: JSONB (7 wallet addresses)
- winner_address: TEXT
- spin_timestamp: TIMESTAMP
- animation_seed: TEXT
```

**distribution_logs**
```sql
- id: UUID
- round_id: UUID (FK)
- recipient_address: TEXT
- amount: DECIMAL
- type: ENUM (winner, holding, charity)
- status: ENUM (pending, processing, completed, failed)
- transaction_hash: TEXT
- error_message: TEXT
- created_at: TIMESTAMP
- completed_at: TIMESTAMP
```

**system_config**
```sql
- id: UUID
- key: TEXT (minimum_balance, holding_wallet, charity_wallet)
- value: TEXT
- updated_at: TIMESTAMP
- updated_by: UUID (FK)
```

**token_metrics**
```sql
- id: UUID
- timestamp: TIMESTAMP
- holder_count: INTEGER
- eligible_count: INTEGER
- vault_balance: DECIMAL
- token_price: DECIMAL
- market_cap: DECIMAL
```

**audit_logs**
```sql
- id: UUID
- admin_id: UUID (FK)
- action: TEXT
- details: JSONB
- ip_address: TEXT
- timestamp: TIMESTAMP
```

### 4.6 Public Interface

#### 4.6.1 Live Draw Page
- Real-time wheel spinning display
- Current round information
- Winners list (updating live)
- Viewer count
- Chat/reactions (future)

#### 4.6.2 History Page
- All past rounds with:
  - Round number and date
  - Winners and amounts
  - Total distributed
  - Charity amount
  - Transaction links
- Search by wallet address
- Statistics dashboard

#### 4.6.3 Eligibility Checker
- Input wallet address
- Display current balance
- Show eligibility status
- Next draw information

### 4.7 Social Media Integration

#### 4.7.1 X (Twitter) Posting
- Individual winner announcements
- Round completion summary
- Include:
  - Winner addresses
  - Amount won per winner
  - Total distributed
  - Charity contribution
  - Transaction hashes

---

## 5. Technical Architecture

### 5.1 Tech Stack

**Frontend**
- Framework: SvelteKit
- Styling: TailwindCSS
- Animations: Framer Motion / CSS
- State Management: Svelte Stores
- WebSocket: Socket.io (for live updates)

**Backend**
- Runtime: Supabase Edge Functions (Deno)
- API: RESTful + WebSocket
- Caching: Redis (optional)

**Database**
- Primary: Supabase (PostgreSQL)
- Real-time: Supabase Realtime

**Blockchain**
- RPC Provider: Helius
- Network: Solana Mainnet
- Token Program: SPL Token

**Authentication**
- Admin: Supabase Auth + 2FA
- Public: No auth required

**Hosting**
- Frontend: Vercel
- Backend: Supabase
- CDN: Cloudflare

### 5.2 API Endpoints

**Admin Endpoints** (Protected)
- `POST /api/admin/rounds/start` - Start new round
- `POST /api/admin/draws/spin` - Execute wheel spin
- `POST /api/admin/distributions/execute` - Trigger distribution
- `GET /api/admin/vault/balance` - Get vault balance
- `PUT /api/admin/config` - Update configuration

**Public Endpoints**
- `GET /api/rounds` - List all rounds
- `GET /api/rounds/:id` - Get round details
- `GET /api/rounds/next` - Get next scheduled draw info
- `GET /api/eligibility/:wallet` - Check eligibility
- `GET /api/stats` - Platform statistics
- `GET /api/leaderboard` - Get top winners
- `GET /api/leaderboard/:timeframe` - Get leaders by timeframe (all/monthly/weekly)
- `GET /api/history` - Paginated draw history
- `GET /api/history/search/:wallet` - Search history by wallet
- `WS /api/live` - WebSocket for live updates

### 5.3 Security Measures

**Authentication & Authorization**
- Admin login with email/password
- Two-factor authentication (TOTP)
- Session management with timeout
- IP whitelist for admin access

**Rate Limiting**
- API endpoint rate limits
- Maximum 1 round per 10 minutes
- Failed login attempt limits

**Audit & Monitoring**
- All admin actions logged
- Transaction verification
- Error tracking (Sentry)
- Uptime monitoring

**Data Protection**
- HTTPS everywhere
- Encrypted database
- No storage of private keys
- CORS configuration

---

## 6. Reward Distribution Logic

### 6.1 Distribution Breakdown
- **Winners (50%)**: Split equally among 7 winners
- **Holding Wallet (40%)**: For future operations and marketing
- **Charity Wallet (10%)**: Fixed charitable organization

### 6.2 Distribution Process
1. Admin completes all 7 draws
2. System calculates amounts based on input
3. Admin reviews distribution preview
4. Admin triggers distribution
5. System sends transactions via Helius
6. Status tracking and retry logic
7. Public announcement of results

### 6.3 Failed Transaction Handling
- Automatic retry (3 attempts)
- Failed amounts remain in wallet
- Carried forward to next round
- Manual intervention option
- Detailed error logging

---

## 7. User Experience Flow

### 7.1 Admin Flow
```
1. Login → Dashboard
2. Check Pump.fun vault balance
3. Claim rewards manually (external)
4. Input amount in system
5. Start new round
6. System fetches eligible holders
7. Spin wheel 7 times
8. Review 7 winners
9. Trigger distribution
10. Verify transactions
11. Post to social media
```

### 7.2 Token Holder Flow
```
1. Hold minimum CRx7 tokens
2. Receive notification of draw (social media)
3. Watch live drawing (optional)
4. Check if won
5. Receive SOL automatically
6. Verify on blockchain
```

### 7.3 Public Viewer Flow
```
1. Visit website
2. Watch live draw
3. View history
4. Check eligibility
5. Consider buying tokens
```

---

## 8. Communication Strategy

### 8.1 Pre-Draw
- Announce draw time on X/Twitter
- Build anticipation with countdown
- Remind holders of minimum balance

### 8.2 During Draw
- Live streaming on platform
- Real-time updates on X
- Engage with community comments

### 8.3 Post-Draw
- Individual winner announcements
- Complete round summary
- Thank participants
- Highlight charity contribution
- Share transaction proofs

---

## 9. Launch Strategy

### 9.1 Phase 1: Development (Sep 15-28)
- Core infrastructure setup
- Smart contract integration
- Admin dashboard completion
- Basic public interface

### 9.2 Phase 2: Testing (Sep 28-30)
- Devnet testing
- Security audit
- Load testing
- UI/UX refinement

### 9.3 Phase 3: Soft Launch (Oct 1-7)
- Small test round with limited rewards
- Community feedback gathering
- Bug fixes and optimizations
- Documentation completion

### 9.4 Phase 4: Public Launch (Oct 8+)
- Full public announcement
- First official round
- Marketing campaign
- Regular drawing schedule

---

## 10. Success Metrics & KPIs

### 10.1 Engagement Metrics
- Active participants per round
- Live viewer count
- Social media engagement rate
- Website traffic during draws

### 10.2 Financial Metrics
- Total SOL distributed
- Average reward per winner
- Charity contributions total
- Vault growth rate

### 10.3 Technical Metrics
- System uptime (target: 99.9%)
- Transaction success rate
- Page load times
- API response times

### 10.4 Growth Metrics
- New token holders after each round
- Repeat participation rate
- Community growth rate
- Brand mention frequency

---

## 11. Risk Analysis & Mitigation

### 11.1 Technical Risks
**Risk**: Transaction failures
**Mitigation**: Retry logic, manual intervention capability

**Risk**: RPC node downtime
**Mitigation**: Multiple Helius endpoints, fallback providers

**Risk**: Database corruption
**Mitigation**: Regular backups, point-in-time recovery

### 11.2 Security Risks
**Risk**: Admin account compromise
**Mitigation**: 2FA, IP whitelist, audit logs

**Risk**: Manipulation attempts
**Mitigation**: On-chain verification, transparent process

### 11.3 Regulatory Risks
**Risk**: Gambling regulations
**Mitigation**: Legal review, terms of service, geographic restrictions

### 11.4 Community Risks
**Risk**: Perception of unfairness
**Mitigation**: Complete transparency, regular audits, open communication

---

## 12. Future Roadmap (v2.0+)

### 12.1 Q4 2025
- Mobile app development
- NFT avatar integration for winners
- Automated X/Twitter posting
- Multi-language support

### 12.2 Q1 2026
- Referral reward system
- Multiple wheel themes
- DAO governance for charity selection
- Tiered reward system

### 12.3 Q2 2026
- Cross-chain expansion
- Partnership integrations
- Advanced analytics dashboard
- Prediction markets for draws

### 12.4 Long-term Vision
- Fully decentralized drawing mechanism
- Community-run draws
- Integration with other DeFi protocols
- Branded mini-games

---

## 13. Budget & Resources

### 13.1 Development Costs
- Frontend Development: 40 hours
- Backend Development: 60 hours
- Smart Contract Integration: 20 hours
- Testing & QA: 20 hours
- Design & UX: 15 hours

### 13.2 Operational Costs
- Hosting (Vercel): $20/month
- Supabase: $25/month
- Helius RPC: $49/month
- Domain: $15/year

### 13.3 Team Requirements
- Product Owner: Vincent
- Full-stack Developer: 1
- UI/UX Designer: 1 (part-time)
- Community Manager: 1 (future)

---

## 14. Acceptance Criteria

### 14.1 Functional Requirements
- [ ] Admin can start and complete draws
- [ ] 7 unique winners selected per round
- [ ] Rewards distributed correctly (50/40/10 split)
- [ ] All transactions verifiable on-chain
- [ ] Historical data properly stored and displayed

### 14.2 Performance Requirements
- [ ] Page load under 2 seconds
- [ ] Wheel spin animation at 60fps
- [ ] Distribution completion under 30 seconds
- [ ] Support 10,000+ concurrent viewers

### 14.3 Security Requirements
- [ ] Admin authentication functioning
- [ ] All sensitive actions logged
- [ ] No unauthorized access possible
- [ ] Transaction validation in place

---

## 15. Appendices

### Appendix A: Glossary
- **CRx7 Token**: The Solana-based token being rewarded
- **Pump.fun**: Platform where token was created and vault exists
- **Creator Vault**: Pool of fees collected from trading
- **Helius**: Solana RPC provider for blockchain interaction
- **Draw Round**: Complete cycle of selecting 7 winners

### Appendix B: Legal Considerations
- No purchase necessary to participate
- Must comply with local lottery/sweepstakes laws
- Age restriction: 18+ only
- Not available in restricted jurisdictions
- Not financial advice

### Appendix C: Contact Information
- Product Owner: Vincent
- Technical Support: [support-email]
- Community: [X/Twitter handle]
- Website: [platform-url]

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|---------|
| 1.0 | 2025-09-15 | Initial PRD creation | Vincent |

---

*This document is a living document and will be updated as the product evolves.*