import axios from "axios";
import { getAuthHeaders, getAuthToken, removeAuthToken } from "./auth";
import {
  AuthResponse,
  PDFItem,
  EbookItem,
  UploadUrlResponse,
  User,
  Course,
  CourseChapter,
  CourseOutline,
  CoursesResponse,
  Roadmap,
  RoadmapContent,
  RoadmapsResponse,
} from "../types/index";
import {
  Notification,
  CreateDiscussionData,
  DiscussionsResponse,
  DiscussionDetailResponse,
} from "../types/discussions";

// Debug logging for production
const isDev = import.meta.env.DEV;
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
export const PYTHON_API_URL =
  import.meta.env.VITE_PYTHON_API_URL || "http://localhost:8000";

// if (!isDev) {
//   console.log("🔧 Production API Config:", {
//     baseURL: API_BASE_URL,
//     isDev,
//     env: import.meta.env.MODE,
//   });
// }

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // Increase to 2 minutes for test submission
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------
// Friendly error handling utilities
// ---------------------------------------------

export type FriendlyError = {
  title: string;
  message: string;
  type: "error" | "warning" | "info";
  status?: number;
  retrySuggestion?: string;
  rawMessage?: string;
};

// Keep toast duration consistent with UI default
export const DEFAULT_TOAST_DURATION = 5000;

type AxiosErrorLike = {
  message?: string;
  code?: string;
  request?: unknown;
  config?: { url?: string; method?: string; baseURL?: string };
  response?: { status?: number; data?: unknown };
};

function extractServerMessage(error: unknown): string | undefined {
  const e = error as AxiosErrorLike | undefined;
  const data = e?.response?.data;
  if (!data) return undefined;
  if (typeof data === "string") return data;
  if (typeof data === "object" && data) {
    const obj = data as Record<string, unknown>;
    if (typeof obj.message === "string") return obj.message;
    if (typeof obj.error === "string") return obj.error;
    if (typeof obj.detail === "string") return obj.detail;
    if (Array.isArray(obj.errors) && typeof obj.errors[0] === "string") {
      return obj.errors[0] as string;
    }
  }
  return undefined;
}

function isNetworkError(error: unknown): boolean {
  const e = error as AxiosErrorLike | undefined;
  const msg = String(e?.message || "");
  // Axios "Network Error" or fetch "Failed to fetch"
  return (
    msg.toLowerCase().includes("network error") ||
    msg.toLowerCase().includes("failed to fetch") ||
    (!e?.response && !!e?.request)
  );
}

function isTimeoutError(error: unknown): boolean {
  const e = error as AxiosErrorLike | undefined;
  return (
    e?.code === "ECONNABORTED" ||
    e?.response?.status === 408 ||
    String(e?.message || "").toLowerCase().includes("timeout")
  );
}

export function getRetrySuggestion(error: unknown): string | undefined {
  const e = error as AxiosErrorLike | undefined;
  const status = e?.response?.status;
  if (isNetworkError(error)) {
    return "Check your internet connection, then try again.";
  }
  if (isTimeoutError(error)) {
    return "The request timed out. Retry in a moment.";
  }
  if (status === 429) {
    return "You’re doing this too often. Please wait and retry.";
  }
  if (status && status >= 500) {
    return "Server issue. Please retry shortly or contact support.";
  }
  if (status === 401) {
    return "Log in and then retry the action.";
  }
  return "Please try again in a moment.";
}

export function getFriendlyError(error: unknown): FriendlyError {
  const e = error as AxiosErrorLike | undefined;
  const status = e?.response?.status;
  const serverMessage = extractServerMessage(error);
  const rawMessage = String(e?.message || serverMessage || "");

  let title = "Something went wrong";
  let message =
    serverMessage || rawMessage || "An unexpected error occurred. Please try again.";

  if (isNetworkError(error)) {
    title = "Connection Problem";
    message = "Couldn't connect to server. Check your internet connection.";
  } else if (isTimeoutError(error)) {
    title = "Request Timed Out";
    message = "The request took too long. Please try again.";
  } else if (status === 401) {
    title = "Unauthorized";
    message = "Please log in to continue.";
  } else if (status === 403) {
    title = "Access Denied";
    message = "You don’t have permission to perform this action.";
  } else if (status === 404) {
    title = "Not Found";
    message = "The requested resource wasn’t found.";
  } else if (status === 429) {
    title = "Too Many Requests";
    message =
      serverMessage || "You’re doing this too often. Please wait and retry.";
  } else if (status && status >= 500) {
    title = "Server Error";
    message = "The server hit a snag. Please try again.";
  } else if (!status && serverMessage) {
    // Generic server-sent message for non-HTTP cases
    title = "Error";
    message = serverMessage;
  }

  const finalType: FriendlyError["type"] = status === 429 ? "warning" : "error";
  return {
    title,
    message,
    type: finalType,
    status,
    retrySuggestion: getRetrySuggestion(error),
    rawMessage,
  };
}

export function formatErrorAsToast(error: unknown): {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration: number;
} {
  const friendly = getFriendlyError(error);
  return {
    type: friendly.type,
    title: friendly.title,
    message: [friendly.message, friendly.retrySuggestion]
      .filter(Boolean)
      .join(" "),
    duration: DEFAULT_TOAST_DURATION,
  };
}

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    // Add auth token to requests
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging for courses API
    if (config.url?.includes("/courses")) {
      console.log("🚀 API Request (Courses):", {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!config.headers.Authorization,
        token: token ? "present" : "missing",
      });
    }
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
    // Debug logging for courses API
    if (
      response.config.url?.includes("/courses") &&
      response.config.method === "get"
    ) {
      console.log("✅ API Response (Courses):", {
        status: response.status,
        url: response.config.url,
        coursesCount: response.data.courses?.length || 0,
        sampleCourse: response.data.courses?.[0]
          ? {
              id: response.data.courses[0].id,
              title: response.data.courses[0].title,
              is_enrolled: response.data.courses[0].is_enrolled,
              is_bookmarked: response.data.courses[0].is_bookmarked,
            }
          : null,
      });
    }
    return response;
  },
  (error) => {
    type WithFriendlyError = AxiosErrorLike & { friendlyError?: FriendlyError };
    // Attach friendly error metadata for consistent handling in UI
    const friendly = getFriendlyError(error);
    (error as WithFriendlyError).friendlyError = friendly;

    if (!isDev) {
      console.error("❌ API Error:", {
        status: error.response?.status,
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        message: friendly.message,
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

export const changeUsername = async (
  username: string
): Promise<AuthResponse> => {
  const response = await api.post("/auth/change-username", { username });

  // Store the new token
  if (response.data.token) {
    const { setAuthToken } = await import("./auth");
    setAuthToken(response.data.token);
  }

  return {
    token: response.data.token,
    user: response.data.user,
  };
};

// PDFs API
export const getPDFs = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  semester?: string;
  course?: string;
  department?: string;
  year_of_study?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  pdfs: PDFItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    availableCourses: string[];
    availableDepartments: string[];
  };
}> => {
  const response = await api.get("/pdfs", { params });
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
export const getEbooks = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  semester?: string;
  course?: string;
  department?: string;
  year_of_study?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<{
  ebooks: EbookItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    availableCourses: string[];
    availableDepartments: string[];
  };
}> => {
  const response = await api.get("/ebooks", { params });
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
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: "POST",
      body: file,
      //@ts-expect-error
      headers: {
        "Content-Type": file.type,
        "x-filename": filename,
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || "Failed to upload. Please try again."
      );
    }

    const result = await response.json();
    return result.url;
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
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

// Courses API
export const getCourses = async (params?: {
  search?: string;
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<CoursesResponse> => {
  const response = await api.get("/courses", { params });
  return response.data;
};

export const getCourse = async (id: string): Promise<{ course: Course }> => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

export const generateCourseOutline = async (
  topic: string
): Promise<CourseOutline> => {
  const response = await api.post("/courses/generate-outline", { topic });
  return response.data;
};

export const createCourse = async (courseData: {
  title: string;
  description: string;
  topic: string;
  chapters: {
    title: string;
    description: string;
    order_index: number;
  }[];
  isPublic?: boolean;
}): Promise<{ id: string; message: string; course: Course }> => {
  const response = await api.post("/courses", courseData);
  return response.data;
};

export const generateChapterContent = async (
  courseId: string,
  chapterId: string
): Promise<{ message: string; content: string; chapter: CourseChapter }> => {
  console.log("🚀 Generating chapter content:", { courseId, chapterId });
  const response = await api.post(
    `/courses/${courseId}/chapters/${chapterId}/generate-content`
  );
  console.log("✅ Chapter content response:", response.data);
  return response.data;
};

export const toggleCourseBookmark = async (
  courseId: string
): Promise<{ message: string; bookmarked: boolean }> => {
  console.log("🌐 API: Toggling bookmark for course:", courseId);
  const response = await api.post(`/courses/${courseId}/bookmark`);
  console.log("🌐 API: Bookmark response:", response.data);
  return response.data;
};

export const updateCourse = async (
  courseId: string,
  updates: {
    title?: string;
    description?: string;
    topic?: string;
    isPublic?: boolean;
  }
): Promise<{ message: string; course: Course }> => {
  const response = await api.put(`/courses/${courseId}`, updates);
  return response.data;
};

export const deleteCourse = async (
  courseId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/courses/${courseId}`);
  return response.data;
};

// Course enrollment functions
export const enrollInCourse = async (
  courseId: string
): Promise<{ message: string; enrollment: unknown }> => {
  const response = await api.post(`/courses/${courseId}/enroll`);
  return response.data;
};

export const unenrollFromCourse = async (
  courseId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/courses/${courseId}/enroll`);
  return response.data;
};

// Chapter progress functions
export const updateChapterProgress = async (
  courseId: string,
  chapterId: string,
  isCompleted: boolean
): Promise<{ message: string; progress: unknown }> => {
  const response = await api.post(
    `/courses/${courseId}/chapters/${chapterId}/progress`,
    { isCompleted }
  );
  return response.data;
};

// Get user enrollments
export const getUserEnrollments = async (
  page = 1,
  limit = 12
): Promise<{ enrollments: unknown[]; pagination: unknown }> => {
  const response = await api.get(
    `/courses/user/enrollments?page=${page}&limit=${limit}`
  );
  return response.data;
};

// Certificate Test API Functions
export const generateCertificateTest = async (
  courseId: string
): Promise<{
  success: boolean;
  message: string;
  test?: {
    id: string;
    questions: unknown[];
    testInstructions: unknown;
    timeLimit: number;
    passingScore: number;
    totalMarks: number;
    status: string;
    createdAt: string;
  };
  tests?: {
    id: string;
    status: string;
    score?: number;
    hasPassed?: boolean;
    marksObtained?: number;
    totalMarks?: number;
    createdAt: string;
    submittedAt?: string;
  }[];
  cooldown?: {
    isActive: boolean;
    remainingHours: number;
    remainingMinutes: number;
    remainingMs: number;
    nextAvailableAt: string;
    lastTestDate: string;
  };
  error?: string;
}> => {
  try {
    const response = await api.post(`/courses/${courseId}/test/generate`);
    return { success: true, ...response.data };
  } catch (error: unknown) {
    // Handle cooldown error (429) specially
    const e = error as { response?: { status?: number; data?: unknown } };
    if (e.response?.status === 429) {
      const data = e.response.data as Record<string, unknown> | undefined;
      const msg = typeof data?.message === "string"
        ? data.message
        : "Cooldown active. Please try later.";
      return {
        success: false,
        message: msg,
        ...(data || {}),
      };
    }
    throw error;
  }
};

export const submitCertificateTest = async (
  courseId: string,
  testId: string,
  answers: unknown[]
): Promise<{
  message: string;
  testId: string;
  status: string;
}> => {
  const response = await api.post(
    `/courses/${courseId}/test/submit`,
    { testId, answers },
    { timeout: 120000 } // 2 minutes timeout for submission
  );
  return response.data;
};

export const getCertificateData = async (
  courseId: string,
  testId: string
): Promise<{
  success: boolean;
  message: string;
  certificateData: {
    studentName: string;
    courseName: string;
    instructorName: string;
    completionDate: string;
    certificateId: string;
    score: number;
    totalMarks: number;
    marksObtained: number;
  };
}> => {
  const response = await api.get(
    `/courses/${courseId}/test/${testId}/certificate`
  );
  return response.data;
};

// Get certificate verification data
export const getCertificateVerification = async (certificateId: string) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/courses/verify-certificate/${certificateId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Verification failed. Please try again.`);
    }

    return response.json();
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
};

export const validateTestAccess = async (
  courseId: string,
  testId: string
): Promise<{
  success: boolean;
  message?: string;
  testId?: string;
  status?: string;
  error?: string;
}> => {
  const response = await api.get(
    `/courses/${courseId}/test/${testId}/validate`
  );
  return response.data;
};

export const getTestStatus = async (
  courseId: string,
  testId: string
): Promise<{
  status: string;
  score?: number;
  hasPassed?: boolean;
  marksObtained?: number;
  totalMarks?: number;
  submittedAt?: string;
  updatedAt?: string;
}> => {
  const response = await api.get(`/courses/${courseId}/test/${testId}/status`);
  return response.data;
};

export const getUserTests = async (
  courseId: string
): Promise<{
  tests: {
    id: string;
    status: string;
    score?: number;
    hasPassed?: boolean;
    submittedAt?: string;
    createdAt: string;
  }[];
}> => {
  const response = await api.get(`/courses/${courseId}/tests`);
  return response.data;
};

export const getCertificateTestResult = async (
  courseId: string,
  testId: string
): Promise<{
  result: {
    id: string;
    courseTitle: string;
    score: number;
    marksObtained: number;
    totalMarks: number;
    hasPassed: boolean;
    passingScore: number;
    evaluationResults: unknown[];
    submittedAt: string;
    timeLimit: number;
  };
}> => {
  const response = await api.get(`/courses/${courseId}/test/${testId}/status`);

  // Check if test is completed
  if (response.data.status !== "completed") {
    throw new Error(
      `Test is not completed yet. Current status: ${response.data.status}`
    );
  }

  // Parse evaluation results if they exist
  let evaluationResults: unknown[] = [];
  if (response.data.evaluationResults) {
    try {
      const parsedResults =
        typeof response.data.evaluationResults === "string"
          ? JSON.parse(response.data.evaluationResults)
          : response.data.evaluationResults;

      // The server stores results with a breakdown array, extract it
      type RawEvalItem = {
        questionType?: string;
        type?: string;
        question?: string;
        userAnswer?: unknown;
        correctAnswer?: unknown;
        points?: number;
        maxPoints?: number;
        isCorrect?: boolean;
        aiEvaluation?: { feedback?: string };
      };

      if (
        (parsedResults as { breakdown?: unknown[] }).breakdown &&
        Array.isArray((parsedResults as { breakdown?: unknown[] }).breakdown)
      ) {
        const breakdown = (parsedResults as { breakdown: RawEvalItem[] }).breakdown;
        evaluationResults = breakdown.map((item: RawEvalItem, index: number) => ({
            questionId: `q_${index}`,
            type: item.questionType || item.type || "unknown",
            question: item.question || "",
            userAnswer: item.userAnswer || "No answer provided",
            correctAnswer: item.correctAnswer || "",
            marksAwarded: item.points || 0,
            maxMarks: item.maxPoints || 0,
            isCorrect: item.isCorrect || false,
            feedback:
              item.aiEvaluation?.feedback ||
              (item.isCorrect ? "Correct!" : "Incorrect or incomplete"),
          })
        );
      }
    } catch (error) {
      console.error("Error parsing evaluation results:", error);
    }
  }

  // Transform the status response to match the expected result format
  return {
    result: {
      id: testId,
      courseTitle: "Course Certificate Test", // We'll need to fetch course title separately if needed
      score: response.data.score || 0,
      marksObtained: response.data.marksObtained || 0,
      totalMarks: response.data.totalMarks || 100,
      hasPassed: response.data.hasPassed || false,
      passingScore: 80, // Default passing score
      evaluationResults: evaluationResults,
      submittedAt: response.data.submittedAt || new Date().toISOString(),
      timeLimit: 180, // Default time limit
    },
  };
};

// Roadmaps API
export const getRoadmaps = async (params?: {
  search?: string;
  filter?: string;
  sort?: string;
  page?: number;
  limit?: number;
}): Promise<RoadmapsResponse> => {
  const response = await api.get("/roadmaps", { params });
  return response.data;
};

export const getRoadmap = async (id: string): Promise<{ roadmap: Roadmap }> => {
  const response = await api.get(`/roadmaps/${id}`);
  return response.data;
};

export const generateRoadmap = async (
  topic: string
): Promise<RoadmapContent> => {
  const response = await api.post("/roadmaps/generate", { topic });
  return response.data;
};

export const createRoadmap = async (roadmapData: {
  title: string;
  description: string;
  topic: string;
  content: RoadmapContent;
  isPublic?: boolean;
}): Promise<{ id: string; message: string; roadmap: Roadmap }> => {
  const response = await api.post("/roadmaps", roadmapData);
  return response.data;
};

export const toggleRoadmapBookmark = async (
  roadmapId: string
): Promise<{ message: string; bookmarked: boolean }> => {
  const response = await api.post(`/roadmaps/${roadmapId}/bookmark`);
  return response.data;
};

export const updateRoadmap = async (
  roadmapId: string,
  updates: {
    title?: string;
    description?: string;
    topic?: string;
    isPublic?: boolean;
  }
): Promise<{ message: string; roadmap: Roadmap }> => {
  const response = await api.put(`/roadmaps/${roadmapId}`, updates);
  return response.data;
};

export const deleteRoadmap = async (
  roadmapId: string
): Promise<{ message: string }> => {
  const response = await api.delete(`/roadmaps/${roadmapId}`);
  return response.data;
};

// Python Backend API (PDF Chat)
export const uploadPdfToPython = async (
  file: File,
  sessionId: string
): Promise<{
  message: string;
  cloudinary_url: string;
  cloudinary_public_id: string;
  embedding_result: string;
  session_id: string;
}> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("session_id", sessionId);

  try {
    const response = await fetch(`${PYTHON_API_URL}/upload-pdf/`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData.detail || "Failed to upload PDF. Please try again.";
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
};

export const queryPdfChat = async (
  sessionId: string,
  userQuery: string
): Promise<{ rag_response: string }> => {
  try {
    const response = await fetch(
      `${PYTHON_API_URL}/query?session_id=${sessionId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_query: userQuery,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || "Failed to send message.";
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
};

export const cleanupPdfSession = async (
  sessionId: string,
  cloudinaryPublicId?: string
): Promise<{
  message: string;
  pinecone_deleted: boolean;
  cloudinary_deleted: boolean;
}> => {
  const params = new URLSearchParams({ session_id: sessionId });
  if (cloudinaryPublicId) {
    params.append("cloudinary_public_id", cloudinaryPublicId);
  }

  try {
    const response = await fetch(
      `${PYTHON_API_URL}/cleanup-session?${params.toString()}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || "Failed to end session.";
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
};

export const getPdfSessionInfo = async (
  sessionId: string
): Promise<{
  session_id: string;
  message_count: number;
  last_accessed: string;
  messages_remaining: number;
}> => {
  try {
    const response = await fetch(
      `${PYTHON_API_URL}/session-info?session_id=${sessionId}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || "Failed to get session info.";
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err: unknown) {
    if (isNetworkError(err)) {
      throw new Error(
        "Couldn't connect to server. Check your internet connection."
      );
    }
    throw err;
  }
};
