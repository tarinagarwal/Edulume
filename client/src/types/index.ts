export interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
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
  enrollment_count: number;
  is_bookmarked: boolean;
  is_enrolled: boolean;
  enrollment_data: CourseEnrollment | null;
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
  isCompleted?: boolean;
  completedAt?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseEnrollment {
  id: string;
  enrolledAt: string;
  completedAt?: string | null;
  isCompleted: boolean;
  progressPercentage: number;
  lastAccessedAt?: string | null;
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

export interface Roadmap {
  id: string;
  title: string;
  description: string;
  topic: string;
  content: string; // JSON string
  authorId: string;
  author_username: string;
  isPublic: boolean;
  views: number;
  bookmark_count: number;
  is_bookmarked: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoadmapContent {
  title: string;
  description: string;
  stages: RoadmapStage[];
  tools: RoadmapTool[];
  certifications: RoadmapCertification[];
  career_path: RoadmapCareerPath;
}

export interface RoadmapStage {
  level: string;
  title: string;
  description: string;
  skills: RoadmapSkill[];
  resources: RoadmapResource[];
  timeframe: string;
  projects: RoadmapProject[];
  best_practices: RoadmapBestPractice[];
  common_pitfalls: RoadmapPitfall[];
}

export interface RoadmapSkill {
  name: string;
  description: string;
  importance: string;
}

export interface RoadmapResource {
  name: string;
  type: string;
  url?: string;
  description: string;
  format: string;
  difficulty: string;
  estimated_time: string;
  prerequisites: string[];
  cost: string;
}

export interface RoadmapProject {
  name: string;
  description: string;
  learning_objectives: string[];
  features: string[];
  skills_practiced: string[];
  difficulty: string;
  estimated_time: string;
  resources: string[];
  next_steps: string[];
}

export interface RoadmapBestPractice {
  title: string;
  description: string;
  examples: string[];
}

export interface RoadmapPitfall {
  issue: string;
  solution: string;
}

export interface RoadmapTool {
  name: string;
  category: string;
  description: string;
  url?: string;
  setup_guide: string;
  alternatives: string[];
  pros: string[];
  cons: string[];
}

export interface RoadmapCertification {
  name: string;
  provider: string;
  level: string;
  description: string;
  url?: string;
  cost: string;
  validity: string;
  preparation_resources: string[];
}

export interface RoadmapCareerPath {
  roles: string[];
  skills_required: string[];
  progression: string[];
  salary_range: string;
}

export interface RoadmapsResponse {
  roadmaps: Roadmap[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface PdfChatSession {
  id: string;
  sessionId: string;
  pdfUrl: string;
  pdfName: string;
  isActive: boolean;
  createdAt: string;
  endedAt?: string;
  messages: PdfChatMessage[];
}

export interface PdfChatMessage {
  id: string;
  message: string;
  response: string;
  createdAt: string;
}
