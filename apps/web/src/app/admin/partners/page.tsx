'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Button,
  Input,
  Label,
  Textarea,
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
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
  Upload,
  Loader2,
  ImageIcon,
  X,
} from 'lucide-react';
import { safeJson } from '@/lib/safe-fetch';
import { createClient } from '@supabase/supabase-js';
import { api } from '@/lib/api/client';
import { LayoutTemplate } from 'lucide-react';

// ---------------------------------------------------------------------------
// Logo Upload — Supabase primary, API fallback (same pattern as categories)
// ---------------------------------------------------------------------------
function PartnerLogoUpload({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = isSupabaseConfigured
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
    : null;

  const uploadToSupabase = async (file: File): Promise<string> => {
    if (!supabase) throw new Error('Supabase not configured');
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const filePath = `partners/${fileName}`;
    const { error } = await supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (error) throw error;
    const { data: publicData } = supabase.storage
      .from(process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'product-images')
      .getPublicUrl(filePath);
    return publicData.publicUrl;
  };

  const uploadViaAPI = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post('/upload/image?folder=partners', formData);
    if (!response?.url) throw new Error('No URL returned from server');
    if (response.url.startsWith('http')) return response.url;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
    return `${apiUrl.replace('/api/v1', '')}${response.url}`;
  };

  const handleFile = useCallback(
    async (file: File) => {
      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'image/gif',
      ];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file type. Use JPEG, PNG, WebP, SVG or GIF.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Maximum 5 MB.');
        return;
      }
      setUploading(true);
      try {
        let url: string;
        if (isSupabaseConfigured) {
          try {
            url = await uploadToSupabase(file);
          } catch {
            url = await uploadViaAPI(file);
          }
        } else {
          url = await uploadViaAPI(file);
        }
        onChange(url);
      } catch {
        toast.error('Logo upload failed. Please try again.');
      } finally {
        setUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isSupabaseConfigured, supabase]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {value && !uploading ? (
        <div className="relative w-full h-28 rounded-lg overflow-hidden bg-gray-50 border border-gray-200 group flex items-center justify-center">
          <img src={value} alt="Logo" className="max-h-24 max-w-full object-contain p-2" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded-md shadow hover:bg-gray-100"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="p-1.5 bg-white text-red-600 rounded-md shadow hover:bg-red-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`w-full h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
            isDragging
              ? 'border-black bg-gray-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="text-xs text-gray-500">Uploading…</span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-gray-400">
                <ImageIcon className="h-5 w-5" />
                <Upload className="h-5 w-5" />
              </div>
              <span className="text-xs text-gray-500 text-center px-4">
                Click or drag & drop logo
                <br />
                PNG, SVG, WebP · max 5 MB
              </span>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
    </div>
  );
}

interface Partner {
  id: string;
  name: string;
  logo: string;
  website: string | null;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

const emptyForm = {
  name: '',
  logo: '',
  website: '',
  description: '',
  displayOrder: 0,
  isActive: true,
};

function PartnersContent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [placement, setPlacement] = useState<'below_hero' | 'above_footer'>('above_footer');
  const [placementSaving, setPlacementSaving] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  });

  const fetchPlacement = async () => {
    try {
      const res = await fetch(`${API}/settings/trusted_partners_placement`, {
        headers: authHeader(),
      });
      if (res.ok) {
        const data = await safeJson(res);
        const val = data?.value ?? data?.data?.value ?? 'above_footer';
        if (val === 'below_hero' || val === 'above_footer') setPlacement(val);
      }
    } catch {
      // silently ignore — default stays
    }
  };

  const savePlacement = async (value: 'below_hero' | 'above_footer') => {
    setPlacementSaving(true);
    try {
      const res = await fetch(`${API}/settings/trusted_partners_placement`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ value }),
      });
      if (res.ok) {
        setPlacement(value);
        toast.success('Placement updated');
      } else {
        toast.error('Failed to update placement');
      }
    } catch {
      toast.error('Failed to update placement');
    } finally {
      setPlacementSaving(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const res = await fetch(`${API}/partners`, { headers: authHeader() });
      if (res.ok) {
        const data = await safeJson(res);
        setPartners(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load partners');
      }
    } catch {
      toast.error('Failed to load partners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
    fetchPlacement();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setForm({
      name: partner.name,
      logo: partner.logo,
      website: partner.website || '',
      description: partner.description || '',
      displayOrder: partner.displayOrder,
      isActive: partner.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.logo.trim()) {
      toast.error('Name and logo are required');
      return;
    }

    const payload = {
      name: form.name,
      logo: form.logo,
      website: form.website || undefined,
      description: form.description || undefined,
      displayOrder: form.displayOrder,
      isActive: form.isActive,
    };

    try {
      const url = editing ? `${API}/partners/${editing.id}` : `${API}/partners`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editing ? 'Partner updated' : 'Partner created');
        setDialogOpen(false);
        fetchPartners();
      } else {
        const err = await safeJson(res);
        toast.error(err?.message || 'Failed to save partner');
      }
    } catch {
      toast.error('Failed to save partner');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    try {
      const res = await fetch(`${API}/partners/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok) {
        toast.success('Partner deleted');
        fetchPartners();
      } else {
        toast.error('Failed to delete partner');
      }
    } catch {
      toast.error('Failed to delete partner');
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      const res = await fetch(`${API}/partners/${partner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ isActive: !partner.isActive }),
      });
      if (res.ok) {
        toast.success(`Partner ${!partner.isActive ? 'activated' : 'deactivated'}`);
        fetchPartners();
      } else {
        toast.error('Failed to update partner');
      }
    } catch {
      toast.error('Failed to update partner');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trusted Partners</h1>
          <p className="text-muted-foreground mt-1">
            Manage partner companies displayed on the homepage
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Partner
        </Button>
      </div>

      {/* Placement Setting */}
      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold text-base">Section Placement</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Choose where the Trusted Partners section appears on the homepage.
        </p>
        <div className="grid grid-cols-2 gap-3 max-w-lg">
          {(
            [
              {
                value: 'below_hero' as const,
                label: 'Below Hero',
                description: 'Directly after the hero carousel',
              },
              {
                value: 'above_footer' as const,
                label: 'Above Footer',
                description: 'Just before the footer',
              },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={placementSaving}
              onClick={() => placement !== option.value && savePlacement(option.value)}
              className={`flex flex-col gap-1 p-4 rounded-lg border-2 text-left transition-colors disabled:opacity-60 ${
                placement === option.value
                  ? 'border-black bg-black text-white'
                  : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <span className="font-medium text-sm">{option.label}</span>
              <span
                className={`text-xs ${placement === option.value ? 'text-gray-300' : 'text-muted-foreground'}`}
              >
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Order</TableHead>
              <TableHead className="w-20">Logo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No partners yet. Add your first trusted partner.
                </TableCell>
              </TableRow>
            ) : (
              partners.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.displayOrder}</TableCell>
                  <TableCell>
                    <div className="w-14 h-10 rounded border bg-gray-50 flex items-center justify-center overflow-hidden">
                      <img
                        src={p.logo}
                        alt={p.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="40" viewBox="0 0 56 40"><rect width="56" height="40" fill="%23f3f4f6"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%239ca3af">IMG</text></svg>';
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {p.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.website ? (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {new URL(p.website).hostname}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.isActive ? 'default' : 'secondary'}>
                      {p.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(p)}
                        title={p.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Partner' : 'Add Trusted Partner'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update partner details'
                : 'Add a company to your trusted partners section'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Stripe, Google, Shopify"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>
                Logo <span className="text-red-500">*</span>
              </Label>
              <PartnerLogoUpload
                value={form.logo}
                onChange={(url) => setForm({ ...form, logo: url })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the partnership"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min="0"
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })
                  }
                />
                <p className="text-xs text-muted-foreground">Lower = appears first</p>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      form.isActive ? 'bg-black' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.isActive ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm">{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save Changes' : 'Add Partner'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PartnersPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <PartnersContent />
      </AdminLayout>
    </AdminRoute>
  );
}
