/**
 * useCommunity — Custom hook for community feed management
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { communityAPI } from "@/lib/api";
import { PAGINATION } from "@/lib/constants";

interface Post {
  id: string;
  caption: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  is_liked_by_me: boolean;
  author_name: string;
  author_image?: string;
  author_personality?: string;
  created_at: string;
  trip_title?: string;
  tags?: string[];
}

interface UseCommunityReturn {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  toggleLike: (postId: string) => Promise<void>;
  createPost: (data: any) => Promise<Post | null>;
  refresh: () => void;
}

export function useCommunity(): UseCommunityReturn {
  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [rev, setRev]         = useState(0);

  const limit = PAGINATION.COMMUNITY_PER_PAGE;

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res: any = await communityAPI.getFeed({ page, limit } as any);
        if (cancelled) return;
        const d = res.data?.data || [];
        setPosts((prev) => page === 1 ? d : [...prev, ...d]);
        setTotal(res.data?.meta?.pagination?.total || 0);
      } catch (err: any) {
        if (!cancelled) setError(err.response?.data?.message || "Failed to load community.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [page, rev]);

  // Optimistic like toggle
  const toggleLike = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) =>
      p.id === postId
        ? { ...p, is_liked_by_me: !p.is_liked_by_me, likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ));
    try {
      await communityAPI.likePost(postId);
    } catch {
      // Revert on failure
      setPosts((prev) => prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked_by_me: !p.is_liked_by_me, likes_count: p.is_liked_by_me ? p.likes_count + 1 : p.likes_count - 1 }
          : p
      ));
    }
  }, []);

  const createPost = useCallback(async (data: any): Promise<Post | null> => {
    try {
      const res: any = await communityAPI.createPost(data as any);
      const newPost: Post = res.data?.data;
      setPosts((prev) => [newPost, ...prev]);
      return newPost;
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post.");
      return null;
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && posts.length < total) setPage((p) => p + 1);
  }, [loading, posts.length, total]);

  const refresh = useCallback(() => {
    setPage(1);
    setRev((r) => r + 1);
  }, []);

  return {
    posts, loading, error,
    hasMore: posts.length < total,
    loadMore, toggleLike, createPost, refresh,
  };
}

export default useCommunity;
