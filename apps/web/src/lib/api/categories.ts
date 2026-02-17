import { api } from './client';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  image?: string;
  icon?: string;
  displayOrder: number;
  isActive: boolean;
  colorScheme?: {
    primary: string;
    secondary: string;
  };
  showInNavbar: boolean;
  showInTopBar: boolean;
  showInSidebar: boolean;
  showInFooter: boolean;
  showOnHomepage: boolean;
  isFeatured: boolean;
  priority: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
  parent?: Category;
  children?: Category[];
  _count?: {
    products: number;
    children?: number;
  };
}

export const categoriesAPI = {
  // Public endpoints
  getAll: () => api.get<Category[]>('/categories'),

  getBySlug: (slug: string) => api.get<Category>(`/categories/${slug}`),

  getNavbar: () => api.get<Category[]>('/categories/navbar'),

  getTopBar: () => api.get<Category[]>('/categories/topbar'),

  getSidebar: () => api.get<Category[]>('/categories/sidebar'),

  getFooter: () => api.get<Category[]>('/categories/footer'),

  getHomepage: () => api.get<Category[]>('/categories/homepage'),

  getFeatured: () => api.get<Category[]>('/categories/featured'),

  getTree: () => api.get<Category[]>('/categories/tree'),

  // Admin endpoints
  create: (data: Partial<Category>) => api.post<Category>('/categories', data),

  update: (id: string, data: Partial<Category>) => api.patch<Category>(`/categories/${id}`, data),

  delete: (id: string) => api.delete(`/categories/${id}`),

  updateVisibility: (
    id: string,
    visibility: {
      showInNavbar?: boolean;
      showInTopBar?: boolean;
      showInSidebar?: boolean;
      showInFooter?: boolean;
      showOnHomepage?: boolean;
      isFeatured?: boolean;
    }
  ) => api.patch(`/categories/${id}/visibility`, visibility),

  updatePriority: (id: string, priority: number) =>
    api.patch(`/categories/${id}/priority`, { priority }),

  bulkUpdateVisibility: (
    updates: Array<{
      id: string;
      visibility: {
        showInNavbar?: boolean;
        showInTopBar?: boolean;
        showInSidebar?: boolean;
        showInFooter?: boolean;
        showOnHomepage?: boolean;
        isFeatured?: boolean;
      };
    }>
  ) => api.patch('/categories/bulk-visibility', { updates }),

  reorder: (categoryIds: string[]) => api.patch('/categories/reorder', { categoryIds }),
};
