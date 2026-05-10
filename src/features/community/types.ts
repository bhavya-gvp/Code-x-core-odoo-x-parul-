/**
 * features/community/types.ts
 */

export interface CommunityPost {
  id: string;
  caption: string;
  image_url?: string;
  images?: string[];
  tags?: string[];
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked_by_me?: boolean;
  author_name: string;
  author_image?: string;
  author_personality?: string;
  trip_title?: string;
  visibility: "public" | "friends" | "private";
  created_at: string;
}

export interface Comment {
  id: string;
  content: string;
  author_name: string;
  author_image?: string;
  likes_count: number;
  parent_id?: string;
  replies: Comment[];
  created_at: string;
}
