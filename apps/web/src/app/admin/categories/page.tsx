'use client';

import React, { useState } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { useCategories } from '@/hooks/use-admin';
import { adminCategoriesApi, type Category } from '@/lib/api/admin';
import { toast } from '@/lib/toast';

function CategoriesContent() {
  const { categories, loading, refetch } = useCategories();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    parentId: undefined,
    showInNavbar: true,
    showInFooter: false,
    showOnHomepage: false,
    isFeatured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        await adminCategoriesApi.update(editingId, formData);
        toast.success('Category updated successfully');
      } else {
        await adminCategoriesApi.create(formData);
        toast.success('Category created successfully');
      }
      setIsCreating(false);
      setEditingId(null);
      setFormData({ name: '', slug: '', description: '', parentId: undefined, showInNavbar: true, showInFooter: false, showOnHomepage: false, isFeatured: false });
      refetch();
    } catch (error) {
      toast.error('Failed to save category');
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
      showInFooter: category.showInFooter ?? false,
      showOnHomepage: category.showOnHomepage ?? false,
      isFeatured: category.isFeatured ?? false,
    });
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const category = categories.find((c) => c.id === id);
    if (category && category.productCount > 0) {
      if (!confirm(`This category has ${category.productCount} products. Are you sure you want to delete it?`)) {
        return;
      }
    }

    try {
      await adminCategoriesApi.delete(id);
      toast.success('Category deleted successfully');
      refetch();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setFormData({ name: '', slug: '', description: '', parentId: undefined, showInNavbar: true, showInFooter: false, showOnHomepage: false, isFeatured: false });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Categories</h1>
          <p className="text-neutral-600 mt-1">Organize your products into categories</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors shadow-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Category' : 'Create Category'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CBB57B] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value || undefined })}
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
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showInNavbar}
                    onChange={(e) => setFormData({ ...formData, showInNavbar: e.target.checked })}
                    className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                  />
                  <span className="text-sm font-medium text-gray-700">Show in Navbar</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showInFooter}
                    onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                    className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                  />
                  <span className="text-sm font-medium text-gray-700">Show in Footer</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.showOnHomepage}
                    onChange={(e) => setFormData({ ...formData, showOnHomepage: e.target.checked })}
                    className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                  />
                  <span className="text-sm font-medium text-gray-700">Show on Homepage</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                className="px-4 py-2 bg-[#CBB57B] text-black font-medium rounded-lg hover:bg-[#a89158] transition-colors"
              >
                {editingId ? 'Update' : 'Create'} Category
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
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
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-neutral-200 bg-neutral-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Name <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Slug <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Parent <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Products <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Visibility <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-2 text-black">Actions <div className="w-1.5 h-1.5 rounded-full bg-[#CBB57B]"></div></div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {categories.map((category) => (
                  <tr key={category.id} className="group transition-all duration-200 hover:bg-neutral-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-black group-hover:text-[#CBB57B] transition-colors">{category.name}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-700">
                      <span className="font-mono text-xs bg-neutral-100 px-2 py-1 rounded font-semibold text-neutral-800">{category.slug}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-neutral-700">
                      {category.parentId
                        ? categories.find((c) => c.id === category.parentId)?.name || '-'
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-800 font-bold">{category.productCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        <button
                          onClick={() => handleVisibilityToggle(category.id, 'showInNavbar', !category.showInNavbar)}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${category.showInNavbar ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}`}
                        >
                          Nav
                        </button>
                        <button
                          onClick={() => handleVisibilityToggle(category.id, 'showInFooter', !category.showInFooter)}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${category.showInFooter ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}`}
                        >
                          Footer
                        </button>
                        <button
                          onClick={() => handleVisibilityToggle(category.id, 'showOnHomepage', !category.showOnHomepage)}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${category.showOnHomepage ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}`}
                        >
                          Home
                        </button>
                        <button
                          onClick={() => handleVisibilityToggle(category.id, 'isFeatured', !category.isFeatured)}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${category.isFeatured ? 'bg-[#CBB57B]/20 text-[#9a8854] border border-[#CBB57B]' : 'bg-neutral-100 text-neutral-600 border border-neutral-300'}`}
                        >
                          Featured
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#CBB57B]/20 hover:bg-[#CBB57B]/30 border border-[#CBB57B]/30 text-[#CBB57B] rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg text-xs font-semibold transition-all hover:scale-105"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
