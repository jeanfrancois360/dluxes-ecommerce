import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  blogApi,
  type BlogPost,
  type BlogPostStatus,
  type BlogPostTranslation,
} from '@/lib/api/blog';

/**
 * Blog Hooks (Phase C.8)
 * useState + useCallback + useEffect pattern — matches use-affiliate.ts conventions.
 */

// ---------------------------------------------------------------------------
// Public post list
// ---------------------------------------------------------------------------

export function usePublishedBlogPosts(params?: {
  page?: number;
  limit?: number;
  tag?: string;
  locale?: string;
}) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params?.page, params?.limit, params?.tag, params?.locale]
  );

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await blogApi.listPublishedPosts(memoizedParams);
      setPosts(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, pagination, loading, error };
}

// ---------------------------------------------------------------------------
// Admin post list
// ---------------------------------------------------------------------------

export function useBlogPosts(params?: {
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  includeDeleted?: boolean;
}) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize individual param values to prevent infinite re-render loops
  const memoizedParams = useMemo(
    () => params,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [params?.page, params?.limit, params?.status, params?.includeDeleted]
  );

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await blogApi.adminListPosts(memoizedParams);
      setPosts(result.data);
      setPagination(result.pagination);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch blog posts');
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return { posts, pagination, loading, error, refetch: fetchPosts };
}

// ---------------------------------------------------------------------------
// Single admin post (with translations)
// ---------------------------------------------------------------------------

export function useBlogPost(id: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [translations, setTranslations] = useState<BlogPostTranslation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [p, t] = await Promise.all([blogApi.adminGetPost(id), blogApi.listTranslations(id)]);
      setPost(p);
      setTranslations(t);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load blog post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, translations, loading, error, refetch: fetchPost };
}
