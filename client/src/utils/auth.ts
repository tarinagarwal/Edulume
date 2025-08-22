// Token management
const TOKEN_KEY = "auth_token";

export const setAuthToken = (token: string) => {
  console.log("💾 Setting auth token");
  localStorage.setItem(TOKEN_KEY, token);
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  console.log("🔍 Getting auth token:", token ? "Present" : "Missing");
  return token;
};

export const removeAuthToken = () => {
  console.log("🗑️ Removing auth token");
  localStorage.removeItem(TOKEN_KEY);

  // Also clear any other auth-related data
  localStorage.removeItem("user");
  sessionStorage.clear();

  // Clear any cookies that might exist
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    document.cookie =
      name +
      "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" +
      window.location.hostname;
    document.cookie =
      name +
      "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." +
      window.location.hostname;
  });
};

export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = getAuthToken();

    if (!token) {
      console.log("❌ No token found - user not authenticated");
      return false;
    }

    const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
    const profileUrl = `${API_BASE_URL}/auth/profile`;

    // console.log("🔍 Checking authentication:", profileUrl);

    const response = await fetch(profileUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    // console.log("🔍 Auth check response:", {
    //   status: response.status,
    //   ok: response.ok,
    //   url: response.url,
    // });

    if (!response.ok) {
      console.log("❌ Authentication failed, removing token");
      removeAuthToken();
      return false;
    }

    const data = await response.json();
    console.log("✅ Authentication successful:", data.user?.username);
    return true;
  } catch (error) {
    console.log("❌ Network error during auth check, removing token:", error);
    removeAuthToken();
    return false;
  }
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};
