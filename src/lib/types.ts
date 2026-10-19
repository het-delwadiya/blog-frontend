export type Role = "writer" | "editor" | "admin";
export type Status = "draft" | "pending" | "changes" | "rejected" | "published";

export interface Author {
  _id: string;
  name: string;
  handle: string;
  avatar?: string;
  bio?: string;
  role: Role;
  demo?: boolean;
}

export interface User extends Author {
  email: string;
  createdAt: string;
}

export interface Profile extends Author {
  createdAt: string;
  stories: number;
  words: number;
}

export interface HistoryEntry {
  action: "created" | "submitted" | "approved" | "changes" | "rejected" | "withdrawn";
  by: string | { _id: string; name: string; handle: string };
  note?: string;
  at: string;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

export interface Card {
  _id: string;
  title: string;
  dek: string;
  excerpt: string;
  tags: string[];
  cover?: string;
  coverAlt?: string;
  slug?: string;
  status: Status;
  minutes: number;
  words?: number;
  publishedAt?: string;
  submittedAt?: string;
  updatedAt: string;
  commentsCount: number;
  author: Author;
  sandbox?: boolean;
  history?: HistoryEntry[];
}

export interface Story extends Card {
  html: string;
  toc: TocItem[];
  saved: boolean;
  related: Card[];
}

export interface Draft extends Omit<Card, "author"> {
  author: Author;
  body: string;
  html: string;
  toc: TocItem[];
  words: number;
  reviewedBody?: string;
  history: HistoryEntry[];
}

export interface Comment {
  _id: string;
  post: string;
  author: Author;
  body: string;
  createdAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}
