import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	
	if (!user) {
		redirect(302, '/');
	}

	return {
		user,
		session
	};
};