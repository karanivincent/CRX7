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

export interface DrawState {
  stage: DrawStage;
  currentRound: any | null;
  currentDraw: number; // 1-7
  maxDraws: number;
  contestants: AnimalMapping[];
  selectedWinners: Array<{
    drawNumber: number;
    address: string;
    animal: string;
    prizeAmount: number;
    id?: string;
  }>;
  isLoading: boolean;
  error: string | null;
  autoProgressEnabled: boolean;
  stageStartTime: number | null;
}

// Default state
const defaultState: DrawState = {
  stage: 'IDLE',
  currentRound: null,
  currentDraw: 0,
  maxDraws: 7,
  contestants: [],
  selectedWinners: [],
  isLoading: false,
  error: null,
  autoProgressEnabled: true,
  stageStartTime: null
};

// Main store
export const drawState = writable<DrawState>(defaultState);

// Derived stores for easy access
export const currentStage = derived(drawState, ($state) => $state.stage);
export const currentDraw = derived(drawState, ($state) => $state.currentDraw);
export const contestants = derived(drawState, ($state) => $state.contestants);
export const winners = derived(drawState, ($state) => $state.selectedWinners);
export const isLoading = derived(drawState, ($state) => $state.isLoading);
export const roundProgress = derived(drawState, ($state) => ({
  current: $state.selectedWinners.length,
  total: $state.maxDraws,
  percentage: ($state.selectedWinners.length / $state.maxDraws) * 100
}));

// Stage management actions
export const drawActions = {
  // Initialize new round
  startRound: (round: any) => {
    drawState.update(state => ({
      ...state,
      stage: 'ROUND_START',
      currentRound: round,
      currentDraw: 1,
      selectedWinners: [],
      contestants: [],
      error: null,
      stageStartTime: Date.now()
    }));
    
    // Auto-save stage to database
    saveStageToDatabase('ROUND_START', 1);
  },

  // Move to next stage
  nextStage: () => {
    drawState.update(state => {
      // Safety check: ensure state and stage are valid
      if (!state || !state.stage) {
        console.warn('⚠️ Invalid state in nextStage, resetting to IDLE');
        return { ...defaultState, stage: 'IDLE' as DrawStage };
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
          // If we have more draws to do, go to intermission, otherwise complete
          nextStage = state.selectedWinners.length < state.maxDraws ? 'INTERMISSION' : 'ROUND_COMPLETE';
          break;
        case 'INTERMISSION':
          // If all draws are complete, go to ROUND_COMPLETE, otherwise continue to next draw
          nextStage = state.selectedWinners.length >= state.maxDraws ? 'ROUND_COMPLETE' : 'DRAW_PREP';
          break;
        case 'ROUND_COMPLETE':
          nextStage = 'DISTRIBUTION';
          break;
        default:
          console.warn(`⚠️ Unknown stage: ${state.stage}, staying in current stage`);
          nextStage = state.stage;
      }

      // Only increment draw number when transitioning from INTERMISSION to DRAW_PREP
      const newDrawNumber = (nextStage === 'DRAW_PREP' && state.stage === 'INTERMISSION') 
        ? state.currentDraw + 1 
        : state.currentDraw;
        
      // Auto-save stage to database
      saveStageToDatabase(nextStage, newDrawNumber);
      
      return {
        ...state,
        stage: nextStage,
        currentDraw: newDrawNumber,
        stageStartTime: Date.now()
      };
    });
  },

  // Set contestants for current draw
  setContestants: (contestants: AnimalMapping[]) => {
    drawState.update(state => ({
      ...state,
      contestants,
      isLoading: false
    }));
  },

  // Add winner from current draw
  addWinner: (winner: { address: string; animal: string; prizeAmount: number; id?: string }) => {
    drawState.update(state => ({
      ...state,
      selectedWinners: [
        ...state.selectedWinners,
        {
          drawNumber: state.currentDraw,
          ...winner
        }
      ]
    }));
  },

  // Set loading state
  setLoading: (loading: boolean) => {
    drawState.update(state => ({
      ...state,
      isLoading: loading
    }));
  },

  // Set error
  setError: (error: string | null) => {
    drawState.update(state => ({
      ...state,
      error,
      isLoading: false
    }));
  },

  // Reset to idle
  reset: () => {
    // Set to a safe intermediate state first to prevent subscription errors
    drawState.update(() => ({
      ...defaultState,
      stage: 'IDLE' as DrawStage, // Explicitly set to valid stage
    }));
  },

  // Manual stage override (for admin controls)
  goToStage: (stage: DrawStage) => {
    drawState.update(state => ({
      ...state,
      stage,
      stageStartTime: Date.now()
    }));
  },

  // Toggle auto progression
  toggleAutoProgress: () => {
    drawState.update(state => ({
      ...state,
      autoProgressEnabled: !state.autoProgressEnabled
    }));
  }
};

// Stage timing helpers - All manual control now
export const stageConfig = {
  ROUND_START: { duration: 0, autoProgress: false },
  DRAW_PREP: { duration: 0, autoProgress: false },
  SPINNING: { duration: 4000, autoProgress: true }, // Only spinning wheel auto-progresses after spin
  WINNER_REVEAL: { duration: 0, autoProgress: false },
  INTERMISSION: { duration: 0, autoProgress: false },
  ROUND_COMPLETE: { duration: 0, autoProgress: false },
  DISTRIBUTION: { duration: 0, autoProgress: false }
};

// Auto-progression helper
export function startAutoProgression() {
  let unsubscribe: (() => void) | null = null;
  
  unsubscribe = drawState.subscribe(state => {
    // Safety check: ensure stage exists and is valid
    if (!state?.stage || typeof state.stage !== 'string') {
      return;
    }
    
    const config = stageConfig[state.stage as DrawStage];
    
    // Safety check: ensure config exists and has autoProgress property
    if (!config || typeof config.autoProgress !== 'boolean') {
      return;
    }
    
    if (config.autoProgress && state.autoProgressEnabled && state.stageStartTime) {
      const elapsed = Date.now() - state.stageStartTime;
      
      if (elapsed >= config.duration) {
        drawActions.nextStage();
      }
    }
  });

  return unsubscribe;
}

// Global variable to store current draw ID for persistence
let currentDrawId: string | null = null;

// Set the current draw ID for persistence
export function setCurrentDrawId(drawId: string) {
  currentDrawId = drawId;
}

// Auto-save function (async but don't await to avoid blocking UI)
async function saveStageToDatabase(stage: string, drawNumber: number) {
  if (!currentDrawId) return;
  
  try {
    const { updateDrawStage } = await import('$lib/db/queries');
    await updateDrawStage(currentDrawId, stage, drawNumber);
    console.log(`✅ Saved stage: ${stage}, draw: ${drawNumber}`);
  } catch (error) {
    console.error('❌ Failed to save stage to database:', error);
  }
}