import type { LayoutServerLoad } from "./$types";
import { loadClientConfig } from "$lib/server/client-config-loader";

export const load: LayoutServerLoad = async ({ locals }) => {
  const { session } = await locals.safeGetSession();
  
  // Load configuration from database for client use
  const clientConfig = await loadClientConfig();
  
  return {
    session,
    clientConfig
  };
};
