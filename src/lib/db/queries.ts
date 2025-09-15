import type { AnimalMapping } from "$lib/utils/animal-mapping";
import { 
  createDraw,
  getCurrentDraw,
  getNextScheduledDraw,
  getLatestDraw,
  updateDrawStatus,
  updateDrawStats,
  addParticipants,
  getDrawParticipants,
  clearDrawParticipants,
  addWinners,
  getDrawWinners,
  getLatestWinners,
  getDrawStats,
  getNextDrawNumber,
  updateWinnerTransaction
} from "./operations";

// Public query functions that can be used throughout the app
export {
  getCurrentDraw,
  getNextScheduledDraw,
  getLatestDraw,
  getDrawParticipants,
  getDrawWinners,
  getLatestWinners,
  getDrawStats,
  getNextDrawNumber
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
  await updateDrawStats(drawId, {
    totalParticipants: participants.length
  });
  
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
  
  // Update draw stats
  const totalPrizePool = winners.reduce((sum, w) => {
    return sum + parseFloat(w.prizeAmount);
  }, 0);
  
  await updateDrawStats(drawId, {
    winnersCount: winners.length,
    totalPrizePool: totalPrizePool.toString()
  });
  
  return insertedWinners;
}

export async function markWinnerPaid(winnerId: string, transactionHash: string) {
  return await updateWinnerTransaction(winnerId, transactionHash, new Date());
}

// Dashboard data aggregation
export async function getDashboardData() {
  const [currentDraw, nextDraw, latestWinners] = await Promise.all([
    getCurrentDraw(),
    getNextScheduledDraw(),
    getLatestWinners(5)
  ]);
  
  let participants: any[] = [];
  if (currentDraw) {
    participants = await getDrawParticipants(currentDraw.id);
  }
  
  return {
    currentDraw,
    nextDraw,
    participants,
    latestWinners
  };
}

// Admin dashboard aggregation
export async function getAdminDashboardData() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [dashboardData, recentStats] = await Promise.all([
    getDashboardData(),
    getDrawStats(thirtyDaysAgo, new Date())
  ]);
  
  // Calculate aggregated stats
  const totalDrawsCount = recentStats.length;
  const completedDraws = recentStats.filter(d => d.status === 'completed');
  const totalParticipants = completedDraws.reduce((sum, d) => sum + (d.totalParticipants || 0), 0);
  const totalPrizePool = completedDraws.reduce((sum, d) => {
    return sum + parseFloat(d.totalPrizePool || '0');
  }, 0);
  
  return {
    ...dashboardData,
    stats: {
      totalDrawsLast30Days: totalDrawsCount,
      completedDrawsLast30Days: completedDraws.length,
      totalParticipantsLast30Days: totalParticipants,
      totalPrizePoolLast30Days: totalPrizePool,
      averageParticipantsPerDraw: completedDraws.length > 0 ? 
        Math.round(totalParticipants / completedDraws.length) : 0
    }
  };
}