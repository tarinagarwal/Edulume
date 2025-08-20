import axios from "axios";
import { getAuthHeaders } from "./auth";
import { getToken } from "./auth";
import {
  AuthResponse,
  PDFItem,
  EbookItem,
  UploadUrlResponse,
  User,
} from "../types/index";

const api = axios.create({
  baseURL: "/api",
});

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
  return response.data;
};

export const login = async (
  usernameOrEmail: string,
  password: string
): Promise<AuthResponse> => {
  const response = await api.post("/auth/login", { usernameOrEmail, password });
  return response.data;
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
  const response = await api.get("/auth/profile", {
    headers: getAuthHeaders(),
  });
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
  const response = await api.post(
    "/pdfs/generate-upload-url",
    { filename, contentType },
    { headers: getAuthHeaders() }
  );
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
  await api.post("/pdfs/store-metadata", metadata, {
    headers: getAuthHeaders(),
  });
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
  const response = await api.post(
    "/ebooks/generate-upload-url",
    { filename, contentType },
    { headers: getAuthHeaders() }
  );
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
  await api.post("/ebooks/store-metadata", metadata, {
    headers: getAuthHeaders(),
  });
};

// File upload to Vercel Blob
export const uploadToVercelBlob = async (
  filename: string,
  file: File
): Promise<string> => {
  const token = getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-filename": filename,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Upload failed");
  }

  const result = await response.json();
  return result.url;
};
