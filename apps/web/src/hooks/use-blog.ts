import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  blogApi,
  type BlogPost,
  type BlogPostStatus,
  type BlogPostTranslation,
  type BlogEngagement,
  type BlogComment,
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
// Public single post (by slug)
// ---------------------------------------------------------------------------

export function usePublishedBlogPost(slug: string, locale?: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const result = await blogApi.getPublishedPostBySlug(slug, locale);
      setPost(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [slug, locale]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  return { post, loading, error };
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

// ---------------------------------------------------------------------------
// Engagement (views, likes, comment count)
// ---------------------------------------------------------------------------

export function useBlogEngagement(postId: string) {
  const [engagement, setEngagement] = useState<BlogEngagement>({
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    liked: false,
  });
  const [likeLoading, setLikeLoading] = useState(false);

  const fetchEngagement = useCallback(async () => {
    if (!postId) return;
    try {
      const data = await blogApi.getEngagement(postId);
      setEngagement(data);
    } catch {
      // silent — engagement failing should not break the page
    }
  }, [postId]);

  useEffect(() => {
    fetchEngagement();
  }, [fetchEngagement]);

  const handleToggleLike = useCallback(async () => {
    if (likeLoading) return;
    try {
      setLikeLoading(true);
      // Optimistic update
      setEngagement((prev) => ({
        ...prev,
        liked: !prev.liked,
        likeCount: prev.liked ? prev.likeCount - 1 : prev.likeCount + 1,
      }));
      const updated = await blogApi.toggleLike(postId);
      setEngagement(updated);
    } catch {
      // Revert optimistic update on error
      fetchEngagement();
    } finally {
      setLikeLoading(false);
    }
  }, [postId, likeLoading, fetchEngagement]);

  return { engagement, likeLoading, toggleLike: handleToggleLike };
}

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export function useBlogComments(postId: string) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const data = await blogApi.listComments(postId);
      setComments(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const submitComment = useCallback(
    async (body: string, parentId?: string) => {
      try {
        setSubmitting(true);
        const comment = await blogApi.createComment(postId, body, parentId);
        if (parentId) {
          // Inject reply into the correct parent
          setComments((prev) =>
            prev.map((c) =>
              c.id === parentId ? { ...c, replies: [...(c.replies ?? []), comment] } : c
            )
          );
        } else {
          setComments((prev) => [...prev, comment]);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [postId]
  );

  const removeComment = useCallback(async (commentId: string, parentId?: string) => {
    await blogApi.deleteComment(commentId);
    if (parentId) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId
            ? {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === commentId ? { ...r, isDeleted: true, body: '[deleted]' } : r
                ),
              }
            : c
        )
      );
    } else {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, isDeleted: true, body: '[deleted]' } : c))
      );
    }
  }, []);

  return { comments, loading, submitting, submitComment, removeComment, refetch: fetchComments };
}
