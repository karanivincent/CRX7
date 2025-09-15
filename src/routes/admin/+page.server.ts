import { redirect } from '@sveltejs/kit';
import { getOrCreateUserProfile } from '$lib/auth';

export const load = async ({ locals }) => {
	const userProfile = await getOrCreateUserProfile(locals);
	
	if (!userProfile) {
		redirect(302, '/auth/login');
	}

	// For now, any logged-in user can access admin
	// Later we can add role-based access control
	return {
		userProfile
	};
};