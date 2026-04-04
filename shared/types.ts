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
  name: string;
  avatarUrl?: string;
  telegramHandle?: string;
}

export interface ForumThread {
  id: string;
  title: string;
  body: string;
  authorId: string;
  category: string;
  createdAt: string;
  replyCount: number;
}
