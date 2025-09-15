import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db } from "./index";
import { drawTable, participantTable, winnerTable } from "./schema";
import type { AnimalMapping } from "$lib/utils/animal-mapping";

// Draw Operations
export async function createDraw(data: {
  drawNumber: number;
  scheduledAt: Date;
}) {
  const [draw] = await db.insert(drawTable).values({
    id: crypto.randomUUID(),
    drawNumber: data.drawNumber,
    scheduledAt: data.scheduledAt,
    status: "scheduled",
  }).returning();
  
  return draw;
}

export async function getCurrentDraw() {
  const [draw] = await db
    .select()
    .from(drawTable)
    .where(eq(drawTable.status, "active"))
    .limit(1);
    
  return draw;
}

export async function getNextScheduledDraw() {
  const [draw] = await db
    .select()
    .from(drawTable)
    .where(eq(drawTable.status, "scheduled"))
    .orderBy(drawTable.scheduledAt)
    .limit(1);
    
  return draw;
}

export async function getLatestDraw() {
  const [draw] = await db
    .select()
    .from(drawTable)
    .orderBy(desc(drawTable.drawNumber))
    .limit(1);
    
  return draw;
}

export async function updateDrawStatus(drawId: string, status: string, executedAt?: Date) {
  const updateData: any = { 
    status, 
    updatedAt: new Date() 
  };
  
  if (executedAt) {
    updateData.executedAt = executedAt;
  }
  
  const [draw] = await db
    .update(drawTable)
    .set(updateData)
    .where(eq(drawTable.id, drawId))
    .returning();
    
  return draw;
}

export async function updateDrawStats(drawId: string, stats: {
  totalParticipants?: number;
  totalPrizePool?: string;
  winnersCount?: number;
}) {
  const [draw] = await db
    .update(drawTable)
    .set({
      ...stats,
      updatedAt: new Date()
    })
    .where(eq(drawTable.id, drawId))
    .returning();
    
  return draw;
}

// Participant Operations
export async function addParticipants(drawId: string, participants: AnimalMapping[]) {
  const participantData = participants.map(p => ({
    id: crypto.randomUUID(),
    drawId,
    walletAddress: p.walletAddress,
    tokenBalance: "0", // Will be updated with actual balance
    animalName: p.animal.name,
    animalEmoji: p.animal.emoji,
    joinedAt: new Date(),
  }));
  
  const insertedParticipants = await db
    .insert(participantTable)
    .values(participantData)
    .returning();
    
  return insertedParticipants;
}

export async function updateParticipantBalance(participantId: string, balance: string) {
  const [participant] = await db
    .update(participantTable)
    .set({ tokenBalance: balance })
    .where(eq(participantTable.id, participantId))
    .returning();
    
  return participant;
}

export async function getDrawParticipants(drawId: string) {
  const participants = await db
    .select()
    .from(participantTable)
    .where(eq(participantTable.drawId, drawId))
    .orderBy(participantTable.joinedAt);
    
  return participants;
}

export async function clearDrawParticipants(drawId: string) {
  await db
    .delete(participantTable)
    .where(eq(participantTable.drawId, drawId));
}

// Winner Operations
export async function addWinners(drawId: string, winners: Array<{
  participantId: string;
  walletAddress: string;
  prizeAmount: string;
  position: number;
}>) {
  const winnerData = winners.map(w => ({
    id: crypto.randomUUID(),
    drawId,
    participantId: w.participantId,
    walletAddress: w.walletAddress,
    prizeAmount: w.prizeAmount,
    position: w.position,
    createdAt: new Date(),
  }));
  
  const insertedWinners = await db
    .insert(winnerTable)
    .values(winnerData)
    .returning();
    
  return insertedWinners;
}

export async function updateWinnerTransaction(winnerId: string, transactionHash: string, paidAt: Date) {
  const [winner] = await db
    .update(winnerTable)
    .set({ 
      transactionHash, 
      paidAt 
    })
    .where(eq(winnerTable.id, winnerId))
    .returning();
    
  return winner;
}

export async function getDrawWinners(drawId: string) {
  const winners = await db
    .select({
      id: winnerTable.id,
      walletAddress: winnerTable.walletAddress,
      prizeAmount: winnerTable.prizeAmount,
      position: winnerTable.position,
      transactionHash: winnerTable.transactionHash,
      paidAt: winnerTable.paidAt,
      createdAt: winnerTable.createdAt,
      participant: {
        animalName: participantTable.animalName,
        animalEmoji: participantTable.animalEmoji,
        tokenBalance: participantTable.tokenBalance,
      }
    })
    .from(winnerTable)
    .leftJoin(participantTable, eq(winnerTable.participantId, participantTable.id))
    .where(eq(winnerTable.drawId, drawId))
    .orderBy(winnerTable.position);
    
  return winners;
}

export async function getLatestWinners(limit: number = 10) {
  const winners = await db
    .select({
      id: winnerTable.id,
      walletAddress: winnerTable.walletAddress,
      prizeAmount: winnerTable.prizeAmount,
      position: winnerTable.position,
      createdAt: winnerTable.createdAt,
      drawNumber: drawTable.drawNumber,
      participant: {
        animalName: participantTable.animalName,
        animalEmoji: participantTable.animalEmoji,
      }
    })
    .from(winnerTable)
    .leftJoin(participantTable, eq(winnerTable.participantId, participantTable.id))
    .leftJoin(drawTable, eq(winnerTable.drawId, drawTable.id))
    .orderBy(desc(winnerTable.createdAt))
    .limit(limit);
    
  return winners;
}

// Statistics Operations
export async function getDrawStats(fromDate?: Date, toDate?: Date) {
  let query = db
    .select({
      totalDraws: drawTable.id,
      totalParticipants: drawTable.totalParticipants,
      totalPrizePool: drawTable.totalPrizePool,
      status: drawTable.status,
    })
    .from(drawTable);
    
  if (fromDate && toDate) {
    query = query.where(
      and(
        gte(drawTable.createdAt, fromDate),
        lte(drawTable.createdAt, toDate)
      )
    );
  }
  
  const stats = await query;
  return stats;
}

export async function getNextDrawNumber() {
  const latestDraw = await getLatestDraw();
  return latestDraw ? latestDraw.drawNumber + 1 : 1;
}