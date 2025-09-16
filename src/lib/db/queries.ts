import type { AnimalMapping } from "$lib/utils/animal-mapping";
import { 
  createDraw,
  getCurrentDraw,
  getNextScheduledDraw,
  getLatestDraw,
  updateDrawStatus,
  updateDrawStage,
  getDrawWithState,
  addParticipants,
  getDrawParticipants,
  clearDrawParticipants,
  addWinners,
  getDrawWinners,
  getLatestWinners,
  getNextDrawNumber,
  markWinnerPaid,
  getDashboardData
} from "./supabase-operations";

// Public query functions that can be used throughout the app
export {
  getCurrentDraw,
  getNextScheduledDraw,
  getLatestDraw,
  getDrawParticipants,
  getDrawWinners,
  getLatestWinners,
  getNextDrawNumber,
  markWinnerPaid,
  getDashboardData,
  updateDrawStage,
  getDrawWithState
};

// Draw management functions for admin/system use
export async function scheduleNewDraw(scheduledAt: Date) {
  const drawNumber = await getNextDrawNumber();
  return await createDraw({ drawNumber, scheduledAt });
}

export async function startDraw(drawId: string) {
  return await updateDrawStatus(drawId, "active", new Date());
}

export async function completeDraw(drawId: string) {
  return await updateDrawStatus(drawId, "completed");
}

export async function cancelDraw(drawId: string) {
  return await updateDrawStatus(drawId, "cancelled");
}

// Participant management
export async function setupDrawParticipants(drawId: string, participants: AnimalMapping[]) {
  // Clear existing participants first
  await clearDrawParticipants(drawId);
  
  // Add new participants
  const insertedParticipants = await addParticipants(drawId, participants);
  
  // Update draw stats
  // TODO: Implement updateDrawStats function in supabase-operations.ts
  // await updateDrawStats(drawId, {
  //   totalParticipants: participants.length
  // });
  
  return insertedParticipants;
}

// Winner management
export async function recordDrawWinners(
  drawId: string, 
  winners: Array<{
    participantId: string;
    walletAddress: string;
    prizeAmount: string;
    position: number;
  }>
) {
  const insertedWinners = await addWinners(drawId, winners);
  
  // TODO: Update draw stats (implement updateDrawStats in supabase-operations.ts)
  
  return insertedWinners;
}

// Admin dashboard aggregation
export async function getAdminDashboardData() {
  const dashboardData = await getDashboardData();
  
  return {
    ...dashboardData,
    stats: {
      totalDrawsLast30Days: 0,
      completedDrawsLast30Days: 0,
      totalParticipantsLast30Days: 0,
      totalPrizePoolLast30Days: 0,
      averageParticipantsPerDraw: 0
    }
  };
}