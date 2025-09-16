import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db/connection';
import { winnerTable, drawTable, participantTable } from '$lib/db/schema';
import { eq, isNull, desc, sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
  try {
    // Get pending winners (those without transaction hashes)
    const pendingWinners = await db
      .select({
        id: winnerTable.id,
        drawId: winnerTable.drawId,
        walletAddress: winnerTable.walletAddress,
        prizeAmount: winnerTable.prizeAmount,
        drawSequence: winnerTable.drawSequence,
        sequenceNumber: winnerTable.sequenceNumber,
        animalName: winnerTable.animalName,
        animalEmoji: winnerTable.animalEmoji,
        wonAt: winnerTable.wonAt,
        drawNumber: drawTable.drawNumber,
        drawCompletedAt: drawTable.completedAt
      })
      .from(winnerTable)
      .leftJoin(drawTable, eq(winnerTable.drawId, drawTable.id))
      .where(isNull(winnerTable.transactionHash))
      .orderBy(desc(winnerTable.wonAt));

    // Calculate total pending amount
    const totalPending = pendingWinners.reduce((sum, winner) => {
      return sum + Number(winner.prizeAmount);
    }, 0);

    // Group by draw for better organization
    const winnersByDraw = pendingWinners.reduce((acc, winner) => {
      const drawKey = `Draw ${winner.drawNumber}`;
      if (!acc[drawKey]) {
        acc[drawKey] = [];
      }
      acc[drawKey].push(winner);
      return acc;
    }, {} as Record<string, typeof pendingWinners>);

    return json({
      success: true,
      data: {
        pendingWinners,
        winnersByDraw,
        totalPending,
        totalPendingFormatted: `${totalPending.toFixed(3)} SOL`,
        count: pendingWinners.length
      }
    });

  } catch (error) {
    console.error('Error fetching pending winners:', error);
    return json({
      error: 'Failed to fetch pending winners',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};