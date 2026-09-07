'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Button,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
} from '@nextpik/ui';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Loader2, LayoutGrid, Eye, EyeOff } from 'lucide-react';
import {
  hotDealsApi,
  HotDealCategoryConfig,
  COLOR_MAP,
  getCategoryColors,
} from '@/lib/api/hot-deals';
import { getIconComponent } from '@/lib/hot-deal-icons';

// Available color options for the picker
const AVAILABLE_COLORS = Object.keys(COLOR_MAP);

// Available icon names (Lucide icons commonly used for categories)
const AVAILABLE_ICONS = [
  'Heart',
  'Home',
  'Car',
  'Star',
  'Truck',
  'Monitor',
  'BookOpen',
  'Activity',
  'Sparkles',
  'MoreHorizontal',
  'ShoppingBag',
  'Wrench',
  'Camera',
  'Music',
  'Utensils',
  'Dumbbell',
  'Palette',
  'Briefcase',
  'Baby',
  'Dog',
  'Hammer',
  'Shirt',
  'Laptop',
  'Phone',
  'Leaf',
  'Scissors',
  'Zap',
  'Shield',
  'Globe',
  'Package',
];

function CategoryForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: HotDealCategoryConfig;
  onSave: (data: {
    slug: string;
    label: string;
    icon: string;
    color: string;
    isActive: boolean;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [label, setLabel] = useState(initial?.label ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? 'MoreHorizontal');
  const [color, setColor] = useState(initial?.color ?? 'gray');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const isEdit = !!initial;

  return (
    <div className="space-y-5">
      {!isEdit && (
        <div>
          <Label htmlFor="slug">Slug (UPPER_SNAKE_CASE)</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
            placeholder="e.g. PLUMBING"
            className="mt-1.5"
          />
          <p className="text-xs text-gray-400 mt-1">
            Unique identifier. Cannot be changed after creation.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="label">Display Name</Label>
        <Input
          id="label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Plumbing Services"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label>Icon</Label>
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5 mt-1.5 max-h-48 overflow-y-auto p-1">
          {AVAILABLE_ICONS.map((name) => {
            const IconComp = getIconComponent(name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => setIcon(name)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                  icon === name
                    ? 'border-[#CBB57B] bg-[#CBB57B]/10 text-[#CBB57B]'
                    : 'border-gray-200 hover:border-gray-300 text-gray-500'
                }`}
                title={name}
              >
                <IconComp className="w-5 h-5" />
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Selected: <span className="font-semibold">{icon}</span>
        </p>
      </div>

      <div>
        <Label>Color</Label>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {AVAILABLE_COLORS.map((c) => {
            const classes = getCategoryColors(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${classes.bg} ${
                  color === c
                    ? 'border-black ring-2 ring-offset-1 ring-black/20 scale-110'
                    : 'border-transparent'
                }`}
                title={c}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Label htmlFor="active" className="cursor-pointer">
          Active
        </Label>
        <button
          type="button"
          id="active"
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
            isActive ? 'bg-green-500 border-green-600' : 'bg-gray-200 border-gray-400'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full transition-transform shadow-sm ${
              isActive ? 'translate-x-6 bg-white' : 'translate-x-1 bg-gray-500'
            }`}
          />
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave({ slug, label, icon, color, isActive })}
          disabled={saving || !label.trim() || (!isEdit && !slug.trim())}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isEdit ? 'Save Changes' : 'Create Category'}
        </Button>
      </div>
    </div>
  );
}

export default function AdminHotDealCategoriesPage() {
  const [categories, setCategories] = useState<HotDealCategoryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<HotDealCategoryConfig | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await hotDealsApi.getAdminCategories();
      setCategories(data);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (data: {
    slug: string;
    label: string;
    icon: string;
    color: string;
    isActive: boolean;
  }) => {
    setSaving(true);
    try {
      await hotDealsApi.createCategory(data);
      toast.success('Category created');
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: {
    slug: string;
    label: string;
    icon: string;
    color: string;
    isActive: boolean;
  }) => {
    if (!editingCategory) return;
    setSaving(true);
    try {
      await hotDealsApi.updateCategory(editingCategory.slug, {
        label: data.label,
        icon: data.icon,
        color: data.color,
        isActive: data.isActive,
      });
      toast.success('Category updated');
      setDialogOpen(false);
      setEditingCategory(undefined);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (slug: string) => {
    setSaving(true);
    try {
      await hotDealsApi.deleteCategory(slug);
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete category');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (cat: HotDealCategoryConfig) => {
    try {
      await hotDealsApi.updateCategory(cat.slug, { isActive: !cat.isActive });
      toast.success(cat.isActive ? 'Category deactivated' : 'Category activated');
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to toggle category');
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...categories];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setCategories(newOrder);
    try {
      await hotDealsApi.reorderCategories(newOrder.map((c) => c.slug));
    } catch {
      toast.error('Failed to reorder');
      fetchCategories();
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= categories.length - 1) return;
    const newOrder = [...categories];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setCategories(newOrder);
    try {
      await hotDealsApi.reorderCategories(newOrder.map((c) => c.slug));
    } catch {
      toast.error('Failed to reorder');
      fetchCategories();
    }
  };

  return (
    <AdminRoute>
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#CBB57B]/10 rounded-xl flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-[#CBB57B]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Hot Deal Categories</h1>
                <p className="text-sm text-gray-500">
                  Manage categories shown on the Hot Deals posting form
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingCategory(undefined);
                setDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-[#CBB57B] animate-spin" />
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <LayoutGrid className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No categories yet</p>
              <p className="text-sm">Create your first hot deal category.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Order</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Deals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat, index) => {
                    const colors = getCategoryColors(cat.color);
                    return (
                      <TableRow key={cat.id}>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▲
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index >= categories.length - 1}
                              className="text-gray-400 hover:text-gray-600 disabled:opacity-30 text-xs"
                            >
                              ▼
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                            {cat.slug}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">{cat.label}</TableCell>
                        <TableCell>
                          {(() => {
                            const IconComp = getIconComponent(cat.icon);
                            return (
                              <span
                                className="inline-flex items-center gap-1.5 text-gray-500"
                                title={cat.icon}
                              >
                                <IconComp className="w-4 h-4" />
                                <span className="text-xs">{cat.icon}</span>
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${colors.bg} ring-1 ${colors.ring}`}
                            />
                            {cat.color}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{cat._count?.hotDeals ?? 0}</span>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => handleToggleActive(cat)}>
                            {cat.isActive ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer">
                                <Eye className="w-3 h-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="cursor-pointer">
                                <EyeOff className="w-3 h-3 mr-1" />
                                Hidden
                              </Badge>
                            )}
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCategory(cat);
                                setDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            {(cat._count?.hotDeals ?? 0) === 0 ? (
                              deleteConfirm === cat.slug ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(cat.slug)}
                                  disabled={saving}
                                >
                                  Confirm
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm(cat.slug)}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              )
                            ) : null}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            if (!open) {
              setDialogOpen(false);
              setEditingCategory(undefined);
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'New Category'}</DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? 'Update the category details below.'
                  : 'Create a new hot deal category.'}
              </DialogDescription>
            </DialogHeader>
            <CategoryForm
              initial={editingCategory}
              onSave={editingCategory ? handleUpdate : handleCreate}
              onCancel={() => {
                setDialogOpen(false);
                setEditingCategory(undefined);
              }}
              saving={saving}
            />
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </AdminRoute>
  );
}
