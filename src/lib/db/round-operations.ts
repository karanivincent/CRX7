import { supabase } from "./index";
import type { Winner } from "$lib/stores/game-round";
import type { AnimalMapping } from "$lib/utils/animal-mapping";

// Simplified round operations for store-first architecture

export interface CompleteRoundData {
  roundId: string;
  winners: Winner[];
  participants: AnimalMapping[];
  metadata: {
    totalPrizePool: number;
    completedAt: Date;
    roundDurationMs: number;
  };
}

export async function startNewRound(prizePool: number): Promise<{ id: string; roundNumber: number }> {
  // Get next draw number (which actually represents the round number)
  const { data: latestDraw } = await supabase
    .from('draw')
    .select('draw_number')
    .order('draw_number', { ascending: false })
    .limit(1)
    .single();
  
  const nextRoundNumber = latestDraw ? latestDraw.draw_number + 1 : 1;
  
  // Create new draw record
  const { data: draw, error } = await supabase
    .from('draw')
    .insert({
      id: crypto.randomUUID(),
      draw_number: nextRoundNumber,
      scheduled_at: new Date().toISOString(),
      executed_at: new Date().toISOString(),
      status: 'active'
    })
    .select('id, draw_number')
    .single();
  
  if (error) throw error;
  
  return {
    id: draw.id,
    roundNumber: draw.draw_number
  };
}

export async function completeRound(data: CompleteRoundData): Promise<void> {
  const { roundId, winners, participants, metadata } = data;
  
  // Update draw record to completed
  const { error: updateError } = await supabase
    .from('draw')
    .update({
      status: 'completed',
      completed_at: metadata.completedAt.toISOString(),
      total_prize_pool: metadata.totalPrizePool.toString(),
      round_duration_ms: metadata.roundDurationMs,
      updated_at: new Date().toISOString()
    })
    .eq('id', roundId);
  
  if (updateError) throw updateError;

  // Clear any existing data for this round (in case of retry)
  await supabase.from('winner').delete().eq('draw_id', roundId);
  await supabase.from('participant').delete().eq('draw_id', roundId);

  // Insert participants
  if (participants.length > 0) {
    const participantData = participants.map(p => ({
      id: crypto.randomUUID(),
      draw_id: roundId,
      wallet_address: p.walletAddress,
      token_balance: '1000', // Default balance - could be enhanced
      animal_name: p.animal.name,
      animal_emoji: p.animal.emoji,
      joined_at: new Date().toISOString()
    }));

    const { error: participantError } = await supabase
      .from('participant')
      .insert(participantData);
    
    if (participantError) throw participantError;
  }

  // Insert winners
  if (winners.length > 0) {
    const winnerData = winners.map(w => ({
      id: crypto.randomUUID(),
      draw_id: roundId,
      wallet_address: w.address,
      prize_amount: w.prizeAmount.toString(),
      draw_sequence: w.drawNumber,
      sequence_number: w.sequenceNumber,
      animal_name: w.animal.split(' ').slice(1).join(' ') || 'Unknown', // Extract name from "🐻 BEAR"
      animal_emoji: w.animal.split(' ')[0] || '🎯', // Extract emoji from "🐻 BEAR"
      won_at: w.wonAt.toISOString(),
      created_at: new Date().toISOString()
    }));

    const { error: winnerError } = await supabase
      .from('winner')
      .insert(winnerData);
    
    if (winnerError) throw winnerError;
  }
}

export async function getActiveRound(): Promise<{ id: string; roundNumber: number; status: string } | null> {
  const { data: activeDraw, error } = await supabase
    .from('draw')
    .select('id, draw_number, status, executed_at')
    .eq('status', 'active')
    .limit(1)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  return activeDraw ? {
    id: activeDraw.id,
    roundNumber: activeDraw.draw_number,
    status: activeDraw.status
  } : null;
}

export async function getCompletedRounds(limit = 10): Promise<Array<{
  id: string;
  drawNumber: number;
  completedAt: string;
  totalPrizePool: string;
  winnersCount: number;
}>> {
  const { data: completedDraws, error } = await supabase
    .from('draw')
    .select(`
      id,
      draw_number,
      completed_at,
      total_prize_pool,
      winner(count)
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);
  
  if (error) throw error;
  
  return (completedDraws || []).map(draw => ({
    id: draw.id,
    drawNumber: draw.draw_number,
    completedAt: draw.completed_at,
    totalPrizePool: draw.total_prize_pool || '0',
    winnersCount: Array.isArray(draw.winner) ? draw.winner.length : 0
  }));
}

export async function getRoundDetails(roundId: string): Promise<{
  round: any;
  winners: Winner[];
  participants: AnimalMapping[];
} | null> {
  // Get round info
  const { data: round, error: roundError } = await supabase
    .from('draw')
    .select('*')
    .eq('id', roundId)
    .single();
  
  if (roundError) throw roundError;
  if (!round) return null;

  // Get winners
  const { data: winnersData, error: winnersError } = await supabase
    .from('winner')
    .select('*')
    .eq('draw_id', roundId)
    .order('sequence_number', { ascending: true });
  
  if (winnersError) throw winnersError;

  // Get participants
  const { data: participantsData, error: participantsError } = await supabase
    .from('participant')
    .select('*')
    .eq('draw_id', roundId);
  
  if (participantsError) throw participantsError;

  // Transform data to match store types
  const winners: Winner[] = (winnersData || []).map(w => ({
    drawNumber: w.draw_sequence,
    sequenceNumber: w.sequence_number,
    address: w.wallet_address,
    animal: `${w.animal_emoji} ${w.animal_name}`,
    prizeAmount: parseFloat(w.prize_amount),
    wonAt: new Date(w.won_at)
  }));

  const participants: AnimalMapping[] = (participantsData || []).map(p => ({
    walletAddress: p.wallet_address,
    animal: {
      name: p.animal_name,
      emoji: p.animal_emoji
    }
  }));

  return {
    round,
    winners,
    participants
  };
}

// Helper function to check if any round is currently active
export async function hasActiveRound(): Promise<boolean> {
  const activeRound = await getActiveRound();
  return activeRound !== null;
}