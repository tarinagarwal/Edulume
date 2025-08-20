export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PDFItem {
  id: number;
  title: string;
  description: string;
  semester: string;
  course?: string;
  department?: string;
  year_of_study?: string;
  blob_url: string;
  uploaded_by_user_id: number;
  upload_date: string;
  uploader_username?: string;
}

export interface EbookItem extends PDFItem {}

export interface UploadUrlResponse {
  url: string;
  pathname: string;
}
