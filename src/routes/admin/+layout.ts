// Disable SSR for admin routes to avoid client-side import issues
// This is a temporary solution while we investigate the root cause
export const ssr = false;
export const prerender = false;