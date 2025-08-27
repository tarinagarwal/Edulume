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

export interface Course {
  id: string;
  title: string;
  description: string;
  topic: string;
  authorId: string;
  author_username: string;
  isPublic: boolean;
  views: number;
  chapter_count: number;
  bookmark_count: number;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
  chapters?: CourseChapter[];
}

export interface CourseChapter {
  id: string;
  courseId: string;
  title: string;
  description: string;
  content?: string;
  orderIndex: number;
  created_at: string;
  updated_at: string;
}

export interface CourseOutline {
  title: string;
  description: string;
  chapters: {
    title: string;
    description: string;
    order_index: number;
  }[];
}

export interface CoursesResponse {
  courses: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
