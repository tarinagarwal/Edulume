export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/profile", {
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const getAuthHeaders = () => {
  return {};
};
