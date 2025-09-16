import { writable, derived } from 'svelte/store';
import type { AnimalMapping } from '$lib/utils/animal-mapping';

export type DrawStage = 
  | 'IDLE'
  | 'ROUND_START'
  | 'DRAW_PREP'
  | 'SPINNING' 
  | 'WINNER_REVEAL'
  | 'INTERMISSION'
  | 'ROUND_COMPLETE'
  | 'DISTRIBUTION';

export interface Winner {
  drawNumber: number; // Which draw (1-7) this winner came from
  sequenceNumber: number; // Overall order (1st, 2nd, 3rd winner)
  address: string;
  animal: string;
  prizeAmount: number;
  wonAt: Date;
}

export interface GameRoundState {
  // Round identification
  roundId: string | null;
  status: 'idle' | 'active' | 'completed';
  
  // Current position in round
  currentDraw: number; // 1-7, manually controlled
  stage: DrawStage;
  stageStartTime: number | null;
  
  // Round metadata
  startedAt: Date | null;
  prizePool: number;
  maxDraws: number;
  
  // Active round data
  contestants: AnimalMapping[];
  winners: Winner[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // External data (cached, not persisted to round)
  eligibleHoldersCount: number;
  vaultBalance: number;
}

// Default state
const defaultState: GameRoundState = {
  roundId: null,
  status: 'idle',
  currentDraw: 1,
  stage: 'IDLE',
  stageStartTime: null,
  startedAt: null,
  prizePool: 0,
  maxDraws: 7,
  contestants: [],
  winners: [],
  isLoading: false,
  error: null,
  eligibleHoldersCount: 0,
  vaultBalance: 0
};

// Main store
export const gameRound = writable<GameRoundState>(defaultState);

// Derived stores for easy component access
export const currentStage = derived(gameRound, (state) => state.stage);
export const currentDrawNumber = derived(gameRound, (state) => state.currentDraw);
export const contestants = derived(gameRound, (state) => state.contestants);
export const winners = derived(gameRound, (state) => state.winners);
export const isLoading = derived(gameRound, (state) => state.isLoading);

export const roundProgress = derived(gameRound, (state) => ({
  completed: state.winners.length,
  remaining: state.maxDraws - state.winners.length,
  percentage: (state.winners.length / state.maxDraws) * 100,
  total: state.maxDraws
}));

export const isRoundActive = derived(gameRound, (state) => state.status === 'active');

// Stage configuration for auto-progression
export const stageConfig = {
  IDLE: { duration: 0, autoProgress: false },
  ROUND_START: { duration: 0, autoProgress: false },
  DRAW_PREP: { duration: 0, autoProgress: false },
  SPINNING: { duration: 4000, autoProgress: true }, // Only spinning wheel auto-progresses
  WINNER_REVEAL: { duration: 0, autoProgress: false },
  INTERMISSION: { duration: 0, autoProgress: false },
  ROUND_COMPLETE: { duration: 0, autoProgress: false },
  DISTRIBUTION: { duration: 0, autoProgress: false }
};

// Store actions - replaces database-dependent actions
export const gameRoundActions = {
  // Recovery function for existing active rounds
  recoverActiveRound: (roundId: string, drawNumber: number = 1) => {
    console.log(`🔄 Recovering active round ${roundId} at draw ${drawNumber}`);
    gameRound.update(() => ({
      ...defaultState,
      roundId,
      status: 'active',
      stage: 'ROUND_START',
      currentDraw: drawNumber,
      startedAt: new Date(),
      stageStartTime: Date.now()
    }));
  },

  // Round lifecycle
  startNewRound: (roundId: string, prizePool: number) => {
    gameRound.update(() => ({
      ...defaultState,
      roundId,
      status: 'active' as const,
      stage: 'ROUND_START' as const,
      startedAt: new Date(),
      prizePool,
      stageStartTime: Date.now()
    }));
  },

  completeRound: async () => {
    // This will trigger the API call to persist everything
    return new Promise<void>((resolve, reject) => {
      gameRound.update(state => {
        if (state.status !== 'active') {
          reject(new Error('No active round to complete'));
          return state;
        }
        
        // Mark as completed - API call will be handled externally
        resolve();
        return {
          ...state,
          status: 'completed',
          stage: 'DISTRIBUTION'
        };
      });
    });
  },

  resetRound: () => {
    gameRound.set(defaultState);
  },

  // Stage management
  advanceStage: () => {
    gameRound.update(state => {
      if (!state?.stage) {
        console.warn('⚠️ Invalid state in advanceStage');
        return state;
      }
      
      let nextStage: DrawStage = state.stage;
      
      switch (state.stage) {
        case 'ROUND_START':
          nextStage = 'DRAW_PREP';
          break;
        case 'DRAW_PREP':
          nextStage = 'SPINNING';
          break;
        case 'SPINNING':
          nextStage = 'WINNER_REVEAL';
          break;
        case 'WINNER_REVEAL':
          nextStage = state.winners.length < state.maxDraws ? 'INTERMISSION' : 'ROUND_COMPLETE';
          break;
        case 'INTERMISSION':
          nextStage = state.winners.length >= state.maxDraws ? 'ROUND_COMPLETE' : 'DRAW_PREP';
          break;
        case 'ROUND_COMPLETE':
          nextStage = 'DISTRIBUTION';
          break;
        default:
          console.warn(`⚠️ Unknown stage: ${state.stage}`);
          return state;
      }

      return {
        ...state,
        stage: nextStage,
        stageStartTime: Date.now()
      };
    });
  },

  goToStage: (stage: DrawStage) => {
    gameRound.update(state => ({
      ...state,
      stage,
      stageStartTime: Date.now()
    }));
  },

  // Draw management
  startNextDraw: () => {
    gameRound.update(state => ({
      ...state,
      currentDraw: Math.min(state.currentDraw + 1, state.maxDraws),
      stage: 'DRAW_PREP',
      contestants: [], // Clear previous contestants
      stageStartTime: Date.now()
    }));
  },

  setContestants: (contestants: AnimalMapping[]) => {
    gameRound.update(state => ({
      ...state,
      contestants,
      isLoading: false
    }));
  },

  addWinner: (winner: Omit<Winner, 'drawNumber' | 'sequenceNumber' | 'wonAt'>) => {
    gameRound.update(state => ({
      ...state,
      winners: [
        ...state.winners,
        {
          ...winner,
          drawNumber: state.currentDraw,
          sequenceNumber: state.winners.length + 1,
          wonAt: new Date()
        }
      ]
    }));
  },

  // Utilities
  setLoading: (loading: boolean) => {
    gameRound.update(state => {
      // Prevent unnecessary updates that cause reactive loops
      if (state.isLoading === loading) return state;
      
      return {
        ...state,
        isLoading: loading
      };
    });
  },

  setError: (error: string | null) => {
    gameRound.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  },

  // External data updates (not persisted to round)
  updateExternalData: (data: { eligibleHoldersCount?: number; vaultBalance?: number }) => {
    gameRound.update(state => ({
      ...state,
      ...data
    }));
  }
};

// Auto-progression helper (same logic but using new store)
export function startAutoProgression() {
  let unsubscribe: (() => void) | null = null;
  
  unsubscribe = gameRound.subscribe(state => {
    if (!state?.stage || typeof state.stage !== 'string') {
      return;
    }
    
    const config = stageConfig[state.stage as DrawStage];
    
    if (!config || typeof config.autoProgress !== 'boolean') {
      return;
    }
    
    if (config.autoProgress && state.stageStartTime) {
      const elapsed = Date.now() - state.stageStartTime;
      
      if (elapsed >= config.duration) {
        gameRoundActions.advanceStage();
      }
    }
  });

  return unsubscribe;
}

// Helper to get current round data for API calls
export function getCurrentRoundData(): GameRoundState | null {
  let currentState: GameRoundState | null = null;
  
  const unsubscribe = gameRound.subscribe(state => {
    currentState = state;
  });
  
  unsubscribe();
  return currentState;
}