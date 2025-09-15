export const getOrCreateUserProfile = async (locals: App.Locals) => {
  const { user } = await locals.safeGetSession();

  if (!user) {
    return null;
  }

  // For now, return a mock profile based on the user from Supabase Auth
  // This allows the admin dashboard to work while we fix the database connection
  return {
    id: user.id,
    firstName: "",
    lastName: "",
    email: user.email ?? "",
    createdAt: new Date(),
    updatedAt: new Date()
  };
};
