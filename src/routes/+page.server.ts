import { getClientConfig } from "$lib/config/token";

export const load = async ({ locals }) => {
  const tokenConfig = getClientConfig();

  // Get session without requiring database for homepage
  const { session, user } = await locals.safeGetSession();

  return {
    tokenConfig,
    session,
    user,
  };
};

// No actions needed for homepage - this is just a landing page
