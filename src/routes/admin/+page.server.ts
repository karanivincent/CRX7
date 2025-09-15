import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	// Get session without requiring database for admin access
	const { session, user } = await locals.safeGetSession();
	
	if (!user) {
		redirect(302, '/auth/login');
	}

	// For now, any logged-in user can access admin
	// Later we can add role-based access control
	return {
		user,
		session
	};
};