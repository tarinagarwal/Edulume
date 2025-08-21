// Clear authentication cookies
export const clearAuthCookies = () => {
  // Clear cookie for current domain
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  // Clear cookie for subdomain (if any)
  document.cookie =
    "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" +
    window.location.hostname;
  // Clear cookie for parent domain (if any)
  const parts = window.location.hostname.split(".");
  if (parts.length > 2) {
    document.cookie =
      "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." +
      parts.slice(-2).join(".");
  }
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const response = await fetch("/api/auth/profile", {
      credentials: "include",
    });

    if (!response.ok) {
      // Clear stale cookies if authentication fails
      clearAuthCookies();
      return false;
    }

    return true;
  } catch {
    // Clear stale cookies on network errors
    clearAuthCookies();
    return false;
  }
};

export const getAuthHeaders = () => {
  return {};
};
