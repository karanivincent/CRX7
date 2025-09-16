import { supabase } from "./index";
import type { AnimalMapping } from "$lib/utils/animal-mapping";

// Draw Operations using Supabase client
export async function createDraw(data: {
  drawNumber: number;
  scheduledAt: Date;
}) {
  const { data: draw, error } = await supabase
    .from('draw')
    .insert({
      id: crypto.randomUUID(),
      draw_number: data.drawNumber,
      scheduled_at: data.scheduledAt.toISOString(),
      status: "scheduled",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
    
  if (error) throw error;
  return draw;
}

export async function getCurrentDraw() {
  const { data: draw, error } = await supabase
    .from('draw')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
  return draw;
}

export async function getNextScheduledDraw() {
  const { data: draw, error } = await supabase
    .from('draw')
    .select('*')
    .eq('status', 'scheduled')
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return draw;
}

export async function getLatestDraw() {
  const { data: draw, error } = await supabase
    .from('draw')
    .select('*')
    .order('draw_number', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return draw;
}

export async function updateDrawStatus(drawId: string, status: string, executedAt?: Date) {
  if (!drawId || drawId.trim() === '') {
    throw new Error('drawId is required and cannot be empty');
  }
  
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  };
  
  if (executedAt) {
    updateData.executed_at = executedAt.toISOString();
  }
  
  const { data: draw, error } = await supabase
    .from('draw')
    .update(updateData)
    .eq('id', drawId)
    .select()
    .single();
    
  if (error) throw error;
  return draw;
}

// Stage persistence functions
export async function updateDrawStage(drawId: string, stage: string, currentDrawNumber: number) {
  if (!drawId || drawId.trim() === '') {
    throw new Error('drawId is required and cannot be empty');
  }
  
  const { data: draw, error } = await supabase
    .from('draw')
    .update({
      current_stage: stage,
      current_draw_number: currentDrawNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', drawId)
    .select()
    .single();
    
  if (error) throw error;
  return draw;
}

export async function getDrawWithState(drawId: string) {
  if (!drawId || drawId.trim() === '') {
    throw new Error('drawId is required and cannot be empty');
  }
  
  const { data: draw, error } = await supabase
    .from('draw')
    .select('*')
    .eq('id', drawId)
    .single();
    
  if (error) throw error;
  return draw;
}

export async function getNextDrawNumber(): Promise<number> {
  const { data: latestDraw, error } = await supabase
    .from('draw')
    .select('draw_number')
    .order('draw_number', { ascending: false })
    .limit(1)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error;
  return latestDraw ? latestDraw.draw_number + 1 : 1;
}

// Participant Operations
export async function clearDrawParticipants(drawId: string) {
  const { error } = await supabase
    .from('participant')
    .delete()
    .eq('draw_id', drawId);
    
  if (error) throw error;
}

export async function addParticipants(drawId: string, participants: AnimalMapping[]) {
  const participantData = participants.map(p => ({
    id: crypto.randomUUID(),
    draw_id: drawId,
    wallet_address: p.walletAddress,
    token_balance: '1000', // Default balance for now
    animal_name: p.animal.name,
    animal_emoji: p.animal.emoji,
    joined_at: new Date().toISOString(),
  }));
  
  const { data, error } = await supabase
    .from('participant')
    .insert(participantData)
    .select();
    
  if (error) throw error;
  return data;
}

export async function getDrawParticipants(drawId: string) {
  const { data: participants, error } = await supabase
    .from('participant')
    .select('*')
    .eq('draw_id', drawId);
    
  if (error) throw error;
  return participants || [];
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
    draw_id: drawId,
    participant_id: w.participantId,
    wallet_address: w.walletAddress,
    prize_amount: w.prizeAmount,
    position: w.position,
    created_at: new Date().toISOString(),
  }));
  
  const { data, error } = await supabase
    .from('winner')
    .insert(winnerData)
    .select();
    
  if (error) throw error;
  return data;
}

export async function getDrawWinners(drawId: string) {
  const { data: winners, error } = await supabase
    .from('winner')
    .select(`
      *,
      participant:participant_id (
        animal_name,
        animal_emoji
      )
    `)
    .eq('draw_id', drawId)
    .order('position', { ascending: true });
    
  if (error) throw error;
  return winners || [];
}

export async function getLatestWinners(limit = 10) {
  const { data: winners, error } = await supabase
    .from('winner')
    .select(`
      *,
      participant:participant_id (
        animal_name,
        animal_emoji
      ),
      draw:draw_id (
        draw_number
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
    
  if (error) throw error;
  return winners || [];
}

export async function markWinnerPaid(winnerId: string, transactionHash: string) {
  const { data: winner, error } = await supabase
    .from('winner')
    .update({
      transaction_hash: transactionHash,
      paid_at: new Date().toISOString(),
    })
    .eq('id', winnerId)
    .select()
    .single();
    
  if (error) throw error;
  return winner;
}

// Dashboard data aggregation
export async function getDashboardData() {
  const [currentDraw, nextDraw, participants, latestWinners] = await Promise.all([
    getCurrentDraw(),
    getNextScheduledDraw(),
    getCurrentDraw().then(draw => draw ? getDrawParticipants(draw.id) : []),
    getLatestWinners(5)
  ]);
  
  return {
    currentDraw,
    nextDraw,
    participants,
    latestWinners,
  };
}