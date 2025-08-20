export interface Discussion {
  id: number;
  title: string;
  content: string;
  category: string;
  tags?: string;
  images?: string;
  author_id: number;
  author_username: string;
  views: number;
  created_at: string;
  updated_at: string;
  answer_count: number;
  vote_count: number;
  upvotes?: number;
  downvotes?: number;
  has_best_answer: number;
}

export interface DiscussionAnswer {
  id: number;
  discussion_id: number;
  content: string;
  images?: string;
  author_id: number;
  author_username: string;
  is_best_answer: number;
  created_at: string;
  updated_at: string;
  vote_count: number;
  upvotes?: number;
  downvotes?: number;
  reply_count?: number;
  replies?: DiscussionReply[];
}

export interface DiscussionReply {
  id: number;
  answer_id: number;
  content: string;
  images?: string;
  author_id: number;
  author_username: string;
  created_at: string;
  updated_at: string;
  vote_count: number;
  upvotes?: number;
  downvotes?: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: "new_answer" | "mention" | "best_answer" | "reply";
  title: string;
  message: string;
  related_id?: number;
  related_type?: "discussion" | "answer";
  from_user_id?: number;
  from_username?: string;
  is_read: number;
  created_at: string;
}

export interface CreateDiscussionData {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  images?: string[];
}

export interface DiscussionsResponse {
  discussions: Discussion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface DiscussionDetailResponse {
  discussion: Discussion;
  answers: DiscussionAnswer[];
}

export const DISCUSSION_CATEGORIES = [
  { value: "academic", label: "Academic Help", icon: "📚" },
  { value: "technical", label: "Technical Support", icon: "💻" },
  { value: "general", label: "General Discussion", icon: "💬" },
  { value: "faculty", label: "Faculty Help", icon: "👨‍🏫" },
  { value: "career", label: "Career Guidance", icon: "🚀" },
  { value: "projects", label: "Project Help", icon: "🛠️" },
] as const;

export type DiscussionCategory =
  (typeof DISCUSSION_CATEGORIES)[number]["value"];
