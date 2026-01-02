import api from "../utils/api";



// PR-1: Dashboard Profile
export const getDashboardProfile = async () => {
  const response = await api.get("/users/me");
  return response.data;
};
