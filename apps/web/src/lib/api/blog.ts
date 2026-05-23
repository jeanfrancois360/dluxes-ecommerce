import { api } from './client';

/**
 * Blog API Client (Phase C.8)
 * Types derived from schema.prisma (Phase C.7) and blog.dto.ts.
 * apiClient auto-unwraps {success,data} — do NOT double-unwrap.
 */

// ---------------------------------------------------------------------------
// Enum literal types — must match schema.prisma exactly
// ---------------------------------------------------------------------------

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type BlogTranslationStatus =
  | 'ORIGINAL'
  | 'MACHINE_TRANSLATED'
  | 'HUMAN_REVIEWED'
  | 'PUBLISHED';

// ---------------------------------------------------------------------------
// Model interfaces — field names match schema.prisma
// ---------------------------------------------------------------------------

export interface BlogAuthor {
  id: string;
  firstName: string;
  lastName: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  status: BlogPostStatus;
  coverImageUrl?: string;
  authorId: string;
  author?: BlogAuthor;
  tags: string[];
  publishedAt?: string;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
  translations?: BlogPostTranslation[];
  _count?: { translations: number };
}

export interface BlogPostTranslation {
  id: string;
  blogPostId: string;
  locale: string;
  title: string;
  body: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  translationStatus: BlogTranslationStatus;
  isOriginal: boolean;
  reviewedById?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';
  const filtered = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return filtered ? `?${filtered}` : '';
}

// ---------------------------------------------------------------------------
// Public endpoints
// ---------------------------------------------------------------------------

const listPublishedPosts = (params?: {
  page?: number;
  limit?: number;
  tag?: string;
  locale?: string;
}) => api.get<PaginatedResponse<BlogPost>>(`/blog/posts${buildQueryString(params)}`);

const getPublishedPostBySlug = (slug: string, locale?: string) =>
  api.get<BlogPost>(`/blog/posts/${slug}${buildQueryString({ locale })}`);

// ---------------------------------------------------------------------------
// Admin — Posts
// ---------------------------------------------------------------------------

const createPost = (body: { slug: string; coverImageUrl?: string; tags?: string[] }) =>
  api.post<BlogPost>('/blog/admin/posts', body);

const adminListPosts = (params?: {
  page?: number;
  limit?: number;
  status?: BlogPostStatus;
  tag?: string;
  includeDeleted?: boolean;
}) => api.get<PaginatedResponse<BlogPost>>(`/blog/admin/posts${buildQueryString(params)}`);

const adminGetPost = (id: string) => api.get<BlogPost>(`/blog/admin/posts/${id}`);

const updatePost = (id: string, body: { slug?: string; coverImageUrl?: string; tags?: string[] }) =>
  api.patch<BlogPost>(`/blog/admin/posts/${id}`, body);

const deletePost = (id: string) => api.delete(`/blog/admin/posts/${id}`);

// ---------------------------------------------------------------------------
// Admin — Lifecycle
// ---------------------------------------------------------------------------

const publishPost = (id: string) => api.patch<BlogPost>(`/blog/admin/posts/${id}/publish`);

const unpublishPost = (id: string) => api.patch<BlogPost>(`/blog/admin/posts/${id}/unpublish`);

const archivePost = (id: string) => api.patch<BlogPost>(`/blog/admin/posts/${id}/archive`);

// ---------------------------------------------------------------------------
// Admin — Translations
// ---------------------------------------------------------------------------

const upsertTranslation = (
  postId: string,
  dto: {
    locale: string;
    title: string;
    body: string;
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
    translationStatus?: BlogTranslationStatus;
    isOriginal?: boolean;
  }
) => api.post<BlogPostTranslation>(`/blog/admin/posts/${postId}/translations`, dto);

const updateTranslation = (
  postId: string,
  locale: string,
  dto: {
    title?: string;
    body?: string;
    excerpt?: string;
    seoTitle?: string;
    seoDescription?: string;
    translationStatus?: BlogTranslationStatus;
    isOriginal?: boolean;
  }
) => api.patch<BlogPostTranslation>(`/blog/admin/posts/${postId}/translations/${locale}`, dto);

const listTranslations = (postId: string) =>
  api.get<BlogPostTranslation[]>(`/blog/admin/posts/${postId}/translations`);

// ---------------------------------------------------------------------------
// Named export
// ---------------------------------------------------------------------------

export const blogApi = {
  // Public
  listPublishedPosts,
  getPublishedPostBySlug,
  // Admin posts
  createPost,
  adminListPosts,
  adminGetPost,
  updatePost,
  deletePost,
  // Lifecycle
  publishPost,
  unpublishPost,
  archivePost,
  // Translations
  upsertTranslation,
  updateTranslation,
  listTranslations,
};
