import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  scheduleNewDraw,
  startDraw,
  completeDraw,
  getCurrentDraw,
  getNextScheduledDraw,
  setupDrawParticipants,
  recordDrawWinners,
  getDashboardData
} from '$lib/db/queries';
import type { AnimalMapping } from '$lib/utils/animal-mapping';

// GET /api/draws - Get current draw or dashboard data
export const GET: RequestHandler = async ({ url }) => {
  try {
    const action = url.searchParams.get('action');
    
    switch (action) {
      case 'current':
        const currentDraw = await getCurrentDraw();
        return json({ draw: currentDraw });
        
      case 'next':
        const nextDraw = await getNextScheduledDraw();
        return json({ draw: nextDraw });
        
      case 'dashboard':
        const dashboardData = await getDashboardData();
        return json(dashboardData);
        
      default:
        const allData = await getDashboardData();
        return json(allData);
    }
  } catch (error) {
    console.error('Error fetching draw data:', error);
    return json({ error: 'Failed to fetch draw data' }, { status: 500 });
  }
};

// POST /api/draws - Create or manage draws
export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'create':
        const { scheduledAt } = data;
        const newDraw = await scheduleNewDraw(new Date(scheduledAt));
        return json({ draw: newDraw });

      case 'start':
        const { drawId } = data;
        const activeDraw = await startDraw(drawId);
        return json({ draw: activeDraw });

      case 'complete':
        const { drawId: completeDrawId } = data;
        const completedDraw = await completeDraw(completeDrawId);
        return json({ draw: completedDraw });

      case 'add_participants':
        const { drawId: participantDrawId, participants } = data;
        const addedParticipants = await setupDrawParticipants(participantDrawId, participants as AnimalMapping[]);
        return json({ participants: addedParticipants });

      case 'record_winners':
        const { drawId: winnerDrawId, winners } = data;
        const recordedWinners = await recordDrawWinners(winnerDrawId, winners);
        return json({ winners: recordedWinners });

      default:
        return json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error managing draw:', error);
    return json({ error: 'Failed to manage draw' }, { status: 500 });
  }
};