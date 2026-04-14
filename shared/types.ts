// comunikit — canonical shared types (frontend + backend)

export type ListingType = "sell" | "buy" | "service" | "lost" | "found";
export type ListingStatus = "active" | "closed" | "archived";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price?: number;
  type: ListingType;
  category: string;
  authorId: string;
  createdAt: string;
  images: string[];
  status: ListingStatus;
}

export interface User {
  id: string;
  studentId: string;
  isStudentVerified: boolean;
  name: string;
  email?: string;
  emailVerified?: string | null;
  bio?: string;
  avatarUrl?: string;
  telegramHandle?: string;
  group?: string;
  karma: number;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  category: string;
  createdAt: string;
  replyCount: number;
  upvotes: number;
  isPinned: boolean;
  deletedAt?: string | null;
}

export interface Comment {
  id: string;
  body: string;
  authorId: string;
  listingId?: string | null;
  threadId?: string | null;
  parentId?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface Vote {
  id: string;
  userId: string;
  listingId?: string | null;
  threadId?: string | null;
  commentId?: string | null;
  value: number;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  ip: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  createdAt: string;
}
