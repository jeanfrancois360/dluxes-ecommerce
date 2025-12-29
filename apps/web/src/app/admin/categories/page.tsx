'use client';

import React, { useState, useEffect } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useCategories } from '@/hooks/use-admin';
import { adminCategoriesApi, type Category } from '@/lib/api/admin';
import { toast } from '@/lib/toast';
import { Link2, X } from 'lucide-react';

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// Category Form Component (moved outside to prevent re-creation on every render)
interface CategoryFormProps {
  formData: Partial<Category>;
  categories: Category[];
  editingId: string | null;
  slugManuallyEdited: boolean;
  onNameChange: (name: string) => void;
  onSlugChange: (slug: string) => void;
  onFormDataChange: (data: Partial<Category>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isModal?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  formData,
  categories,
  editingId,
  slugManuallyEdited,
  onNameChange,
  onSlugChange,
  onFormDataChange,
  onSubmit,
  onCancel,
  isModal = false,
}) => (
  <form onSubmit={onSubmit} className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name || ''}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
          placeholder="e.g., Watches"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Slug <span className="text-red-500">*</span>
          {!slugManuallyEdited && (
            <span className="ml-2 text-xs text-green-600 font-normal">(auto-generated)</span>
          )}
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={formData.slug || ''}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
            placeholder="e.g., watches"
          />
          <Link2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
      <textarea
        value={formData.description || ''}
        onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
        rows={3}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
        placeholder="Optional description for this category"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
      <select
        value={formData.parentId || ''}
        onChange={(e) => onFormDataChange({ ...formData, parentId: e.target.value || undefined })}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
      >
        <option value="">None (Top Level)</option>
        {categories
          .filter((c) => !c.parentId && c.id !== editingId)
          .map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
      </select>
    </div>

    {/* Visibility Section */}
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Visibility Options</h3>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showInNavbar ?? true}
            onChange={(e) => onFormDataChange({ ...formData, showInNavbar: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B] mt-0.5"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Show in Mega Menu</span>
            <span className="text-xs text-muted-foreground text-gray-500">(Shop/Collections dropdown)</span>
          </div>
        </label>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showInTopBar ?? false}
            onChange={(e) => onFormDataChange({ ...formData, showInTopBar: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B] mt-0.5"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">Show in Category Bar</span>
            <span className="text-xs text-muted-foreground text-gray-500">(Filter pills: All Products, Watches, etc.)</span>
          </div>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showInSidebar ?? false}
            onChange={(e) => onFormDataChange({ ...formData, showInSidebar: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
          />
          <span className="text-sm font-medium text-gray-700">Show in Sidebar</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showOnHomepage ?? false}
            onChange={(e) => onFormDataChange({ ...formData, showOnHomepage: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
          />
          <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showInFooter ?? false}
            onChange={(e) => onFormDataChange({ ...formData, showInFooter: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
          />
          <span className="text-sm font-medium text-gray-700">Show in Footer</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isFeatured ?? false}
            onChange={(e) => onFormDataChange({ ...formData, isFeatured: e.target.checked })}
            className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
          />
          <span className="text-sm font-medium text-gray-700">Featured</span>
        </label>
      </div>
    </div>

    <div className="flex items-center gap-3 pt-2">
      <button
        type="submit"
        className="px-6 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors shadow"
      >
        {editingId ? 'Update Category' : 'Create Category'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        Cancel
      </button>
    </div>
  </form>
);

function CategoriesContent() {
  const { categories, loading, refetch } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parentId: undefined,
    showInNavbar: true,
    showInTopBar: false,
    showInSidebar: false,
    showInFooter: false,
    showOnHomepage: false,
    isFeatured: false,
  });

  // Toggle expand/collapse for parent categories
  const toggleExpand = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Build category tree structure
  const buildCategoryTree = () => {
    const parentCategories = categories.filter(c => !c.parentId);
    const childrenMap = new Map<string, Category[]>();

    categories.forEach(c => {
      if (c.parentId) {
        const siblings = childrenMap.get(c.parentId) || [];
        siblings.push(c);
        childrenMap.set(c.parentId, siblings);
      }
    });

    return { parentCategories, childrenMap };
  };

  // Auto-generate slug when name changes (unless user manually edited it)
  const handleNameChange = (name: string) => {
    if (!slugManuallyEdited) {
      setFormData({ ...formData, name, slug: generateSlug(name) });
    } else {
      setFormData({ ...formData, name });
    }
  };

  const handleSlugChange = (slug: string) => {
    setSlugManuallyEdited(true);
    setFormData({ ...formData, slug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Clean up data by removing empty/undefined values
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== undefined && value !== '')
      );

      console.log('Submitting category data:', cleanData);

      if (editingId) {
        const result = await adminCategoriesApi.update(editingId, cleanData);
        console.log('Update result:', result);
        toast.success('Category updated successfully');
        setShowEditModal(false);
      } else {
        const result = await adminCategoriesApi.create(cleanData);
        console.log('Create result:', result);
        toast.success('Category created successfully');
        setIsCreating(false);
      }

      // Reset form state
      setEditingId(null);
      setSlugManuallyEdited(false);
      setFormData({
        name: '',
        slug: '',
        description: '',
        parentId: undefined,
        showInNavbar: true,
        showInTopBar: false,
        showInSidebar: false,
        showInFooter: false,
        showOnHomepage: false,
        isFeatured: false
      });

      // Refetch categories to update the list
      console.log('Refetching categories...');
      await refetch();
      console.log('Categories refetched successfully');
    } catch (error: any) {
      console.error('Failed to save category:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        data: error.data,
        status: error.status
      });

      // Extract user-friendly error message
      let errorMessage = error.message || error.data?.message || error.response?.data?.message || 'Failed to save category';

      // Clean up Prisma error messages
      if (errorMessage.includes('Unique constraint failed on the fields: (`slug`)')) {
        errorMessage = 'A category with this slug already exists. Please use a different name or slug.';
      } else if (errorMessage.includes('Unique constraint')) {
        errorMessage = 'A category with these details already exists.';
      } else if (errorMessage.includes('Invalid `this.prisma')) {
        // Extract just the relevant error part
        const match = errorMessage.match(/constraint failed on the fields: \(`([^`]+)`\)/);
        if (match) {
          errorMessage = `A category with this ${match[1]} already exists.`;
        } else {
          errorMessage = 'Failed to save category due to a database constraint.';
        }
      }

      toast.error(errorMessage);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      showInNavbar: category.showInNavbar ?? true,
      showInTopBar: category.showInTopBar ?? false,
      showInSidebar: category.showInSidebar ?? false,
      showInFooter: category.showInFooter ?? false,
      showOnHomepage: category.showOnHomepage ?? false,
      isFeatured: category.isFeatured ?? false,
    });
    setSlugManuallyEdited(false); // Allow auto-slug in edit mode
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (!category) return;

    // Count children (subcategories)
    const childrenCount = categories.filter((c) => c.parentId === id).length;
    const productCount = category.productCount || 0;

    // Build confirmation message
    let message = `Are you sure you want to delete "${category.name}"?`;
    const warnings: string[] = [];

    if (childrenCount > 0) {
      warnings.push(`${childrenCount} subcategory${childrenCount > 1 ? 'ies' : ''}`);
    }
    if (productCount > 0) {
      warnings.push(`${productCount} product${productCount > 1 ? 's' : ''}`);
    }

    if (warnings.length > 0) {
      message += `\n\n⚠️ This category has:\n- ${warnings.join('\n- ')}\n\nYou must delete or reassign them first.`;
      alert(message);
      return;
    }

    // Final confirmation for clean delete
    if (!confirm(message + '\n\nThis action cannot be undone.')) {
      return;
    }

    try {
      await adminCategoriesApi.delete(id);
      toast.success('Category deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Delete error:', error);

      // Extract user-friendly error message
      let errorMessage = error.message || error.data?.message || error.response?.data?.message || 'Failed to delete category';

      // Handle specific error cases
      if (errorMessage.includes('subcategories')) {
        const count = childrenCount;
        errorMessage = `Cannot delete category with ${count} subcategory${count > 1 ? 'ies' : ''}. Please delete or reassign them first.`;
      } else if (errorMessage.includes('products')) {
        errorMessage = `Cannot delete category with ${productCount} product${productCount > 1 ? 's' : ''}. Please reassign or delete the products first.`;
      }

      toast.error(errorMessage);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setShowEditModal(false);
    setSlugManuallyEdited(false);
    setFormData({
      name: '',
      slug: '',
      description: '',
      parentId: undefined,
      showInNavbar: true,
      showInTopBar: false,
      showInSidebar: false,
      showInFooter: false,
      showOnHomepage: false,
      isFeatured: false
    });
  };

  const handleVisibilityToggle = async (id: string, field: string, value: boolean) => {
    try {
      await adminCategoriesApi.updateVisibility(id, { [field]: value });
      toast.success('Visibility updated');
      refetch();
    } catch (error) {
      toast.error('Failed to update visibility');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Categories</h1>
          <p className="text-neutral-600 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setSlugManuallyEdited(false);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Create Form - Collapsible */}
      {isCreating && !editingId && (
        <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-[#CBB57B]/30 animate-slide-in-down">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Create New Category</h2>
            <button
              onClick={handleCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <CategoryForm
            formData={formData}
            categories={categories}
            editingId={editingId}
            slugManuallyEdited={slugManuallyEdited}
            onNameChange={handleNameChange}
            onSlugChange={handleSlugChange}
            onFormDataChange={setFormData}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingId && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fade-in"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              handleCancel();
            }
          }}
          onKeyDown={(e) => {
            // Close modal on Escape key
            if (e.key === 'Escape') {
              handleCancel();
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-scale-in">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#CBB57B]/10 to-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#CBB57B]/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-[#CBB57B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Edit Category</h2>
                  <p className="text-sm text-gray-500">Update category details and settings</p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-full transition-all hover:rotate-90 duration-300"
                title="Close (Esc)"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <CategoryForm
                formData={formData}
                categories={categories}
                editingId={editingId}
                slugManuallyEdited={slugManuallyEdited}
                onNameChange={handleNameChange}
                onSlugChange={handleSlugChange}
                onFormDataChange={setFormData}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isModal
              />
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="relative bg-white rounded-2xl shadow-lg border border-neutral-200 overflow-hidden">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#CBB57B] to-transparent"></div>

        <div className="overflow-x-auto relative">
          {loading ? (
            <div className="p-16 text-center">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#CBB57B] border-t-transparent animate-spin"></div>
              </div>
              <p className="mt-4 text-neutral-700 font-semibold">Loading categories...</p>
            </div>
          ) : categories.length === 0 ? (
            <div className="p-16 text-center">
              <svg className="w-16 h-16 mx-auto text-neutral-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-neutral-600 font-medium">No categories found</p>
              <p className="text-neutral-500 text-sm mt-2">Click &quot;Add Category&quot; to create your first category</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Name</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Slug</div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2 text-black">Products</div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Visibility</div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-2 text-black">Actions</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {(() => {
                  const { parentCategories, childrenMap } = buildCategoryTree();

                  return parentCategories.map((parent) => {
                    const children = childrenMap.get(parent.id) || [];
                    const hasChildren = children.length > 0;
                    const isExpanded = expandedCategories.has(parent.id);

                    return (
                      <React.Fragment key={parent.id}>
                        {/* Parent Row */}
                        <tr className="group transition-all duration-200 hover:bg-neutral-50">
                          {/* Name with expand/collapse */}
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              {hasChildren ? (
                                <button
                                  onClick={() => toggleExpand(parent.id)}
                                  className="p-1 hover:bg-neutral-200 rounded transition-colors"
                                  title={isExpanded ? 'Collapse' : 'Expand'}
                                >
                                  <svg className={`w-4 h-4 text-neutral-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              ) : (
                                <span className="w-6" />
                              )}
                              <span className="text-sm font-semibold text-black group-hover:text-[#CBB57B] transition-colors">
                                {parent.name}
                              </span>
                              {hasChildren && (
                                <span className="inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-[#CBB57B] bg-[#CBB57B]/10 rounded" title={`${children.length} subcategory${children.length > 1 ? 'ies' : ''}`}>
                                  {children.length}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Slug */}
                          <td className="px-6 py-3">
                            <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded text-neutral-700">
                              {parent.slug}
                            </span>
                          </td>

                          {/* Products count */}
                          <td className="px-6 py-3 text-center">
                            <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-bold rounded-full ${
                              parent.productCount > 0
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-neutral-100 text-neutral-500'
                            }`}>
                              {parent.productCount}
                            </span>
                          </td>

                          {/* Visibility badges */}
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              {parent.showInNavbar && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                  Menu
                                </span>
                              )}
                              {parent.showInTopBar && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                  Cat Bar
                                </span>
                              )}
                              {parent.showInSidebar && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                                  Sidebar
                                </span>
                              )}
                              {parent.showInFooter && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                  Footer
                                </span>
                              )}
                              {parent.showOnHomepage && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  Home
                                </span>
                              )}
                              {parent.isFeatured && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                                  ⭐ Featured
                                </span>
                              )}
                              {!parent.showInNavbar && !parent.showInTopBar && !parent.showInSidebar && !parent.showInFooter && !parent.showOnHomepage && !parent.isFeatured && (
                                <span className="text-xs text-neutral-400">-</span>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(parent)}
                                className="p-2 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-all"
                                title="Edit category"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(parent.id)}
                                className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-all"
                                title={
                                  hasChildren || parent.productCount > 0
                                    ? `Has dependencies: ${children.length} subcategory${children.length !== 1 ? 'ies' : ''}, ${parent.productCount} product${parent.productCount !== 1 ? 's' : ''}`
                                    : 'Delete category'
                                }
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Child Rows - Only shown when expanded */}
                        {isExpanded && children.map((child, index) => {
                          const isLast = index === children.length - 1;
                          return (
                            <tr key={child.id} className="group bg-neutral-50/50 hover:bg-neutral-100/70 transition-all duration-200">
                              {/* Name with tree connector */}
                              <td className="px-6 py-3">
                                <div className="flex items-center pl-6">
                                  <div className="flex items-end" style={{ width: '24px', height: '20px', marginRight: '8px' }}>
                                    <div className={`border-l-2 border-b-2 border-neutral-300 ${isLast ? 'h-3 rounded-bl' : 'h-full'}`} style={{ width: '16px' }}></div>
                                  </div>
                                  <span className="text-sm font-medium text-neutral-700 group-hover:text-[#CBB57B] transition-colors">
                                    {child.name}
                                  </span>
                                </div>
                              </td>

                              {/* Slug */}
                              <td className="px-6 py-3">
                                <span className="font-mono text-xs bg-neutral-200 px-2 py-1 rounded text-neutral-600">
                                  {child.slug}
                                </span>
                              </td>

                              {/* Products count */}
                              <td className="px-6 py-3 text-center">
                                <span className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 text-xs font-bold rounded-full ${
                                  child.productCount > 0
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                  {child.productCount}
                                </span>
                              </td>

                              {/* Visibility badges */}
                              <td className="px-6 py-3">
                                <div className="flex flex-wrap items-center gap-1">
                                  {child.showInNavbar && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded">
                                      Menu
                                    </span>
                                  )}
                                  {child.showInTopBar && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-indigo-100 text-indigo-700 rounded">
                                      Cat Bar
                                    </span>
                                  )}
                                  {child.showInSidebar && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-teal-100 text-teal-700 rounded">
                                      Sidebar
                                    </span>
                                  )}
                                  {child.showInFooter && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                      Footer
                                    </span>
                                  )}
                                  {child.showOnHomepage && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                      Home
                                    </span>
                                  )}
                                  {child.isFeatured && (
                                    <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
                                      ⭐ Featured
                                    </span>
                                  )}
                                  {!child.showInNavbar && !child.showInTopBar && !child.showInSidebar && !child.showInFooter && !child.showOnHomepage && !child.isFeatured && (
                                    <span className="text-xs text-neutral-400">-</span>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => handleEdit(child)}
                                    className="p-2 hover:bg-blue-50 text-blue-600 hover:text-blue-700 rounded-lg transition-all"
                                    title="Edit category"
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(child.id)}
                                    className="p-2 hover:bg-red-50 text-red-600 hover:text-red-700 rounded-lg transition-all"
                                    title={
                                      child.productCount > 0
                                        ? `Has ${child.productCount} product${child.productCount !== 1 ? 's' : ''}`
                                        : 'Delete category'
                                    }
                                  >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom accent border */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#CBB57B]/50 to-transparent"></div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CategoriesContent />
      </AdminLayout>
    </AdminRoute>
  );
}
