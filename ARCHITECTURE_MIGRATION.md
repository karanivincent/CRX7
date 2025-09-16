# Architecture Migration: Store-First Approach

## Overview

This migration transforms the CRX7 Game Show from a database-sync heavy architecture to a **store-first** approach with **end-of-round persistence**.

## Problems Solved

✅ **No More Phantom Winners** - Single source of truth eliminates race conditions  
✅ **Consistent Draw Numbers** - Manual progression prevents auto-increments  
✅ **Simplified Logic** - Store-only during round eliminates sync complexity  
✅ **Better Performance** - No constant DB reads/writes  
✅ **Predictable Behavior** - Clear state ownership and lifecycle  

## New Architecture

### **During Active Round: Store-Only**
- All state lives in `src/lib/stores/game-round.ts`
- No intermediate database writes
- Components read only from store
- Page refresh = lose progress (acceptable for live shows)

### **Round Completion: Single Persistence**
- All data saved in one atomic transaction
- Winners, participants, and metadata
- Database becomes historical record only

### **Key Files Created/Updated**

#### New Store System
- `src/lib/stores/game-round.ts` - Centralized store (replaces draw-state.ts)
- Store actions: `gameRoundActions` (replaces `drawActions`)
- Derived stores: `currentStage`, `currentDrawNumber`, `winners`, etc.

#### New API Endpoints  
- `src/routes/api/rounds/+server.ts` - Simplified round management
- `POST /api/rounds` with actions: `start`, `complete`
- `GET /api/rounds` with actions: `active`, `history`, `latest`

#### New Database Operations
- `src/lib/db/round-operations.ts` - Store-compatible DB functions
- `startNewRound()` - Creates DB record, returns ID
- `completeRound()` - Saves all data atomically

#### Updated Components
- All draw components now use `gameRoundActions` instead of `drawActions`
- `IntermissionProgress` now calls `startNextDraw()` for proper progression
- Components have safety defaults for all props

### **Database Schema Changes**

#### Removed Fields (draw table)
- `current_stage` - No longer needed
- `current_draw_number` - No longer needed  
- `total_participants` - Calculate from participants
- `winners_count` - Calculate from winners

#### Added Fields (draw table)
- `completed_at` - When round was finished
- `round_duration_ms` - How long round took

#### Enhanced Winner Tracking (winner table)
- `draw_sequence` - Which draw (1-7) winner came from
- `sequence_number` - Overall order (1st, 2nd, 3rd winner)
- `animal_name` - Winner's animal name
- `animal_emoji` - Winner's animal emoji  
- `won_at` - When winner was selected
- `participant_id` - Now optional

### **Migration Steps**

#### For Production (Remote Supabase)
1. **Apply Database Migration**: Run `supabase/migrations/001_restructure_for_store_architecture.sql`
2. **Deploy New Code**: The new system is backward compatible
3. **Test**: Verify round creation, progression, and completion

#### What Was Backed Up
- `src/routes/admin/draw-old/` - Original admin page
- `src/lib/stores/draw-state-old.ts` - Original store
- `src/routes/api/draws-old/` - Original API endpoints

## Usage

### Starting a Round
```typescript
// Creates DB record + initializes store
await startNewRound(prizePool);
gameRoundActions.startNewRound(roundId, prizePool);
```

### During Round  
```typescript
// All operations work on store only
gameRoundActions.setContestants(contestants);
gameRoundActions.addWinner(winner);
gameRoundActions.advanceStage();
gameRoundActions.startNextDraw(); // Manual progression
```

### Completing Round
```typescript
// Single atomic save to database  
const currentState = getCurrentRoundData();
await completeRound({
  roundId: currentState.roundId,
  winners: currentState.winners,
  participants: currentState.contestants,
  metadata: { totalPrizePool, completedAt, roundDurationMs }
});
```

## Benefits

- **Reliable**: No race conditions or phantom data
- **Fast**: No constant DB sync during round
- **Simple**: Single source of truth
- **Robust**: Clean error boundaries and recovery
- **Scalable**: Memory-only state during active round

## Trade-offs

- **Session-based**: Browser refresh loses active round progress
- **No cross-tab sync**: Multiple tabs won't sync during round
- **Network dependency**: Round completion requires successful API call

## Testing

The new system maintains the same UI/UX but with much more reliable state management. Test the complete flow:

1. Start Round → ROUND_START → DRAW_PREP
2. Generate Contestants → SPINNING  
3. Spin Winner → WINNER_REVEAL → INTERMISSION
4. Continue to Next Draw (repeat 2-3 for draws 2-7)
5. After 7 draws → ROUND_COMPLETE → DISTRIBUTION
6. Complete Round → All data persisted to database

## Rollback Plan

If issues occur, rollback is simple:
1. Restore original files from `*-old` directories
2. Revert database schema (if migration was applied)
3. Restart application

The old system files are preserved and can be restored quickly.