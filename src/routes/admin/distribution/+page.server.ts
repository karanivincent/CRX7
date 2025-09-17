import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Get session without requiring database for admin access
  const { session, user } = await locals.safeGetSession();
  
  if (!user) {
    redirect(302, '/');
  }

  // For now, any logged-in user can access admin
  // Later we can add role-based access control
  return {
    user,
    session
  };
};