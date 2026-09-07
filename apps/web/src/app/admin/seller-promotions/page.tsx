'use client';

import { useState, useEffect } from 'react';
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
import { Plus, Pencil, Trash2, Eye, EyeOff, Gift, Users } from 'lucide-react';
import { safeJson } from '@/lib/safe-fetch';

interface SellerPromotion {
  id: string;
  name: string;
  description: string | null;
  creditsAmount: number;
  validFrom: string;
  validTo: string;
  isActive: boolean;
  maxUses: number | null;
  usedCount: number;
  createdAt: string;
  _count: { applications: number };
}

const emptyForm = {
  name: '',
  description: '',
  creditsAmount: 1,
  validFrom: '',
  validTo: '',
  maxUses: '',
  isActive: true,
};

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function status(promo: SellerPromotion) {
  const now = new Date();
  const from = new Date(promo.validFrom);
  const to = new Date(promo.validTo);
  if (!promo.isActive) return { label: 'Disabled', variant: 'secondary' as const };
  if (now < from) return { label: 'Scheduled', variant: 'secondary' as const };
  if (now > to) return { label: 'Expired', variant: 'destructive' as const };
  return { label: 'Active', variant: 'default' as const };
}

function PromotionsContent() {
  const [promos, setPromos] = useState<SellerPromotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SellerPromotion | null>(null);
  const [form, setForm] = useState(emptyForm);

  const API = process.env.NEXT_PUBLIC_API_URL;
  const authHeader = () => ({
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  });

  const fetchPromos = async () => {
    try {
      const res = await fetch(`${API}/admin/seller-promotions`, { headers: authHeader() });
      if (res.ok) {
        const data = await safeJson(res);
        setPromos(Array.isArray(data) ? data : []);
      } else {
        toast.error('Failed to load promotions');
      }
    } catch {
      toast.error('Failed to load promotions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const toDateInput = (iso: string) => iso?.slice(0, 10) ?? '';

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (p: SellerPromotion) => {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description ?? '',
      creditsAmount: p.creditsAmount,
      validFrom: toDateInput(p.validFrom),
      validTo: toDateInput(p.validTo),
      maxUses: p.maxUses !== null ? String(p.maxUses) : '',
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.validFrom || !form.validTo) {
      toast.error('Name, Valid From and Valid To are required');
      return;
    }
    if (new Date(form.validTo) <= new Date(form.validFrom)) {
      toast.error('"Valid To" must be after "Valid From"');
      return;
    }

    const payload = {
      name: form.name,
      description: form.description || undefined,
      creditsAmount: Number(form.creditsAmount),
      validFrom: new Date(form.validFrom).toISOString(),
      validTo: new Date(form.validTo).toISOString(),
      maxUses: form.maxUses ? Number(form.maxUses) : undefined,
      isActive: form.isActive,
    };

    try {
      const url = editing
        ? `${API}/admin/seller-promotions/${editing.id}`
        : `${API}/admin/seller-promotions`;
      const method = editing ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast.success(editing ? 'Promotion updated' : 'Promotion created');
        setDialogOpen(false);
        fetchPromos();
      } else {
        const err = await safeJson(res);
        toast.error(err?.message || 'Failed to save promotion');
      }
    } catch {
      toast.error('Failed to save promotion');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promotion?')) return;
    try {
      const res = await fetch(`${API}/admin/seller-promotions/${id}`, {
        method: 'DELETE',
        headers: authHeader(),
      });
      if (res.ok || res.status === 204) {
        toast.success('Promotion deleted');
        fetchPromos();
      } else {
        toast.error('Failed to delete promotion');
      }
    } catch {
      toast.error('Failed to delete promotion');
    }
  };

  const handleToggle = async (p: SellerPromotion) => {
    try {
      const res = await fetch(`${API}/admin/seller-promotions/${p.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ isActive: !p.isActive }),
      });
      if (res.ok) {
        toast.success(`Promotion ${!p.isActive ? 'enabled' : 'disabled'}`);
        fetchPromos();
      } else {
        toast.error('Failed to update promotion');
      }
    } catch {
      toast.error('Failed to update promotion');
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
          <h1 className="text-3xl font-bold">Seller Promotions</h1>
          <p className="text-muted-foreground mt-1">
            Grant free listing credits to newly registered sellers during a set date range
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Promotion
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total Promotions',
            value: promos.length,
            icon: Gift,
          },
          {
            label: 'Active Now',
            value: promos.filter((p) => status(p).label === 'Active').length,
            icon: Gift,
          },
          {
            label: 'Total Applied',
            value: promos.reduce((s, p) => s + p.usedCount, 0),
            icon: Users,
          },
          {
            label: 'Scheduled',
            value: promos.filter((p) => status(p).label === 'Scheduled').length,
            icon: Gift,
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className="text-2xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid To</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {promos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No promotions yet. Create your first seller promotion.
                </TableCell>
              </TableRow>
            ) : (
              promos.map((p) => {
                const s = status(p);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="font-medium">{p.name}</div>
                      {p.description && (
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {p.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-green-700">
                        {p.creditsAmount} month{p.creditsAmount !== 1 ? 's' : ''} free
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">{fmt(p.validFrom)}</TableCell>
                    <TableCell className="text-sm">{fmt(p.validTo)}</TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {p.usedCount}
                        {p.maxUses !== null ? ` / ${p.maxUses}` : ''}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.variant}>{s.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggle(p)}
                          title={p.isActive ? 'Disable' : 'Enable'}
                        >
                          {p.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Promotion' : 'New Seller Promotion'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update promotion details'
                : 'Sellers who register within the date range will automatically receive the free credits'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Promotion Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g. Launch Month — 1 Month Free"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description (Optional)</Label>
              <Textarea
                id="desc"
                placeholder="Brief description shown in credit transaction history"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credits">
                Free Credits (months) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="credits"
                type="number"
                min="1"
                max="24"
                value={form.creditsAmount}
                onChange={(e) => setForm({ ...form, creditsAmount: parseInt(e.target.value) || 1 })}
                required
              />
              <p className="text-xs text-muted-foreground">
                Number of months of free product listings granted to each qualifying seller
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="validFrom">
                  Valid From <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="validFrom"
                  type="date"
                  value={form.validFrom}
                  onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="validTo">
                  Valid To <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="validTo"
                  type="date"
                  value={form.validTo}
                  onChange={(e) => setForm({ ...form, validTo: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maxUses">Max Uses (Optional)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  min="1"
                  placeholder="Unlimited"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Leave blank for unlimited</p>
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
              <Button type="submit">{editing ? 'Save Changes' : 'Create Promotion'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SellerPromotionsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <PromotionsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
