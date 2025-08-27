import axios from "axios";
import { getAuthHeaders, getAuthToken, removeAuthToken } from "./auth";
import {
  AuthResponse,
  PDFItem,
  EbookItem,
  UploadUrlResponse,
  User,
} from "../types/index";
import {
  Discussion,
  DiscussionAnswer,
  DiscussionReply,
  Notification,
  CreateDiscussionData,
  DiscussionsResponse,
  DiscussionDetailResponse,
} from "../types/discussions";

// Debug logging for production
const isDev = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// if (!isDev) {
//   console.log("🔧 Production API Config:", {
//     baseURL: API_BASE_URL,
//     isDev,
//     env: import.meta.env.MODE,
//   });
// }

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // if (!isDev) {
    //   console.log("🚀 API Request:", {
    //     method: config.method?.toUpperCase(),
    //     url: config.url,
    //     baseURL: config.baseURL,
    //     fullURL: `${config.baseURL}${config.url}`,
    //     hasAuth: !!config.headers.Authorization,
    //   });
    // }
    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => {
    // if (!isDev) {
    //   console.log("✅ API Response:", {
    //     status: response.status,
    //     url: response.config.url,
    //     method: response.config.method?.toUpperCase(),
    //   });
    // }
    return response;
  },
  (error) => {
    if (!isDev) {
      console.error("❌ API Error:", {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: error.message,
        baseURL: error.config?.baseURL,
      });
    }

    if (error.response?.status === 401) {
      console.log("🔐 401 Unauthorized - Clearing auth state");
      removeAuthToken();

      // Only redirect if we're not already on the auth page
      if (
        !window.location.pathname.includes("/auth") &&
        !window.location.pathname.includes("/forgot-password")
      ) {
        console.log("🔄 Redirecting to auth page");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const sendOTP = async (
  email: string,
  type: "signup" | "reset" = "signup"
): Promise<{ message: string }> => {
  const response = await api.post("/auth/send-otp", { email, type });
  return response.data;
};

export const verifyOTP = async (
  email: string,
  otp: string,
  type: "signup" | "reset" = "signup"
): Promise<{ verified: boolean; message: string }> => {
  const response = await api.post("/auth/verify-otp", { email, otp, type });
  return response.data;
};

export const signup = async (
  username: string,
  email: string,
  password: string,
  otp?: string
): Promise<AuthResponse> => {
  const response = await api.post("/auth/signup", {
    username,
    email,
    password,
    otp,
  });

  // Store the token
  if (response.data.token) {
    const { setAuthToken } = await import("./auth");
    setAuthToken(response.data.token);
  }

  return {
    token: response.data.token,
    user: response.data.user,
  };
};

export const login = async (
  usernameOrEmail: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", { usernameOrEmail, password });

  // Store the token
  if (response.data.token) {
    const { setAuthToken } = await import("./auth");
    setAuthToken(response.data.token);
  }

  return {
    token: response.data.token,
    user: response.data.user,
  };
};

export const logout = async (): Promise<{ message: string }> => {
  try {
    await api.post("/auth/logout");
  } catch (error) {
    console.log(
      "⚠️ Server logout failed, but continuing with local logout:",
      error
    );
  }

  // Always clear local token
  removeAuthToken();

  return { message: "Logged out successfully" };
};

export const forgotPassword = async (
  email: string
): Promise<{ message: string }> => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPassword = async (
  email: string,
  otp: string,
  newPassword: string
): Promise<{ message: string }> => {
  const response = await api.post("/auth/reset-password", {
    email,
    otp,
    newPassword,
  });
  return response.data;
};

export const getUserProfile = async (): Promise<{ user: User }> => {
  const response = await api.get("/auth/profile");
  return response.data;
};

// PDFs API
export const getPDFs = async (): Promise<PDFItem[]> => {
  const response = await api.get("/pdfs");
  return response.data;
};

export const generatePDFUploadUrl = async (
  filename: string,
  contentType: string
): Promise<UploadUrlResponse> => {
  const response = await api.post("/pdfs/generate-upload-url", {
    filename,
    contentType,
  });
  return response.data;
};

export const storePDFMetadata = async (metadata: {
  title: string;
  description: string;
  semester: string;
  course?: string;
  department?: string;
  year_of_study?: string;
  blob_url: string;
}): Promise<void> => {
  await api.post("/pdfs/store-metadata", metadata);
};

// E-books API
export const getEbooks = async (): Promise<EbookItem[]> => {
  const response = await api.get("/ebooks");
  return response.data;
};

export const generateEbookUploadUrl = async (
  filename: string,
  contentType: string
): Promise<UploadUrlResponse> => {
  const response = await api.post("/ebooks/generate-upload-url", {
    filename,
    contentType,
  });
  return response.data;
};

export const storeEbookMetadata = async (metadata: {
  title: string;
  description: string;
  semester: string;
  course?: string;
  department?: string;
  year_of_study?: string;
  blob_url: string;
}): Promise<void> => {
  await api.post("/ebooks/store-metadata", metadata);
};

// File upload to Vercel Blob
export const uploadToVercelBlob = async (
  filename: string,
  file: File
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    body: file,
    //@ts-ignore
    headers: {
      "Content-Type": file.type,
      "x-filename": filename,
      ...getAuthHeaders(),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Upload failed");
  }

  const result = await response.json();
  return result.url;
};

// Discussion API
export const getDiscussions = async (params?: {
  category?: string;
  tag?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<DiscussionsResponse> => {
  const response = await api.get("/discussions", { params });
  return response.data;
};

export const getDiscussion = async (
  id: string
): Promise<DiscussionDetailResponse> => {
  const response = await api.get(`/discussions/${id}`);
  return response.data;
};

export const createDiscussion = async (
  data: CreateDiscussionData
): Promise<{ id: number; message: string }> => {
  const response = await api.post("/discussions", data);
  return response.data;
};

export const addAnswer = async (
  discussionId: string,
  content: string,
  images?: string[]
): Promise<{ id: number; message: string }> => {
  console.log("🌐 API: Adding answer to discussion:", discussionId, {
    content,
    images,
  });
  const response = await api.post(`/discussions/${discussionId}/answers`, {
    content,
    images,
  });
  console.log("🌐 API: Answer response:", response.data);
  return response.data;
};

export const voteDiscussion = async (
  discussionId: string,
  voteType: "up" | "down"
): Promise<{ message: string }> => {
  const response = await api.post(`/discussions/${discussionId}/vote`, {
    voteType,
  });
  return response.data;
};

export const voteAnswer = async (
  answerId: string,
  voteType: "up" | "down"
): Promise<{ message: string }> => {
  const response = await api.post(`/discussions/answers/${answerId}/vote`, {
    voteType,
  });
  return response.data;
};

export const markBestAnswer = async (
  answerId: string
): Promise<{ message: string }> => {
  const response = await api.post(`/discussions/answers/${answerId}/best`, {});
  return response.data;
};

export const getPopularTags = async (): Promise<
  { tag: string; count: number }[]
> => {
  const response = await api.get("/discussions/tags/popular");
  return response.data;
};

export const addReply = async (
  answerId: string,
  content: string,
  images?: string[]
): Promise<{ id: number; message: string }> => {
  console.log("🌐 API: Adding reply to answer:", answerId, { content, images });
  const response = await api.post(`/discussions/answers/${answerId}/replies`, {
    content,
    images,
  });
  console.log("🌐 API: Reply response:", response.data);
  return response.data;
};

export const voteReply = async (
  replyId: string,
  voteType: "up" | "down"
): Promise<{ message: string }> => {
  const response = await api.post(`/discussions/replies/${replyId}/vote`, {
    voteType,
  });
  return response.data;
};

export const getNotifications = async (): Promise<{
  notifications: Notification[];
  unreadCount: number;
}> => {
  const response = await api.get("/notifications");
  return response.data;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<{ message: string }> => {
  const response = await api.put(`/notifications/${notificationId}/read`, {});
  return response.data;
};

export const markAllNotificationsAsRead = async (): Promise<{
  message: string;
}> => {
  const response = await api.put("/notifications/read-all", {});
  return response.data;
};

export const getUnreadNotificationCount = async (): Promise<{
  count: number;
}> => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const searchUsers = async (query: string): Promise<string[]> => {
  const response = await api.get("/discussions/users/search", {
    params: { q: query },
  });
  return response.data;
};

export const uploadImage = async (
  imageFile: File,
  name?: string
): Promise<{ url: string; thumbnail: string; deleteUrl: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        const response = await api.post("/images/upload", {
          image: base64,
          name,
        });
        resolve(response.data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};
