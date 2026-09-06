'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import {
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Send,
  Clock,
  XCircle,
  Users,
  Mail,
  BarChart2,
  RefreshCw,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
type CampaignAudience = 'ALL' | 'SELLERS' | 'BUYERS' | 'ADMINS' | 'DELIVERY_PARTNERS';

interface Campaign {
  id: string;
  subject: string;
  previewText: string | null;
  body: string;
  audience: CampaignAudience;
  status: CampaignStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  recipientCount: number | null;
  sentCount: number | null;
  failedCount: number | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
  };
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<CampaignStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-neutral-100 text-neutral-700' },
  SCHEDULED: { label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  SENDING: { label: 'Sending…', className: 'bg-amber-100 text-amber-700' },
  SENT: { label: 'Sent', className: 'bg-green-100 text-green-700' },
  FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'Cancelled', className: 'bg-neutral-200 text-neutral-500' },
};

const AUDIENCE_LABELS: Record<CampaignAudience, string> = {
  ALL: 'All Users',
  SELLERS: 'Sellers',
  BUYERS: 'Buyers',
  ADMINS: 'Admins',
  DELIVERY_PARTNERS: 'Delivery Partners',
};

// ─── Component ────────────────────────────────────────────────────────────────

function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  // compose / edit dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);

  // schedule dialog
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [schedulingCampaign, setSchedulingCampaign] = useState<Campaign | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');

  // preview
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);

  // recipient count hint
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    subject: '',
    previewText: '',
    body: '',
    audience: 'ALL' as CampaignAudience,
  });

  // ─── Data fetching ──────────────────────────────────────────────────────────

  const fetchCampaigns = useCallback(async () => {
    try {
      const res = await fetch(`${API}/campaigns`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      } else {
        toast.error('Failed to load campaigns');
      }
    } catch {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // Fetch recipient count whenever audience changes in form
  useEffect(() => {
    if (!dialogOpen) return;
    let cancelled = false;
    fetch(`${API}/campaigns/audience/${formData.audience}/count`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setRecipientCount(d.count ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [formData.audience, dialogOpen]);

  // ─── Dialog helpers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingCampaign(null);
    setFormData({ subject: '', previewText: '', body: '', audience: 'ALL' });
    setRecipientCount(null);
    setDialogOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      subject: campaign.subject,
      previewText: campaign.previewText ?? '',
      body: campaign.body,
      audience: campaign.audience,
    });
    setDialogOpen(true);
  };

  const openPreview = (campaign: Campaign) => {
    setPreviewCampaign(campaign);
    setPreviewDialogOpen(true);
  };

  // ─── Save (create / update) ─────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) return toast.error('Subject is required');
    if (!formData.body.trim()) return toast.error('Body is required');

    setSaving(true);
    try {
      const payload = {
        subject: formData.subject.trim(),
        previewText: formData.previewText.trim() || undefined,
        body: formData.body,
        audience: formData.audience,
      };

      const url = editingCampaign ? `${API}/campaigns/${editingCampaign.id}` : `${API}/campaigns`;

      const res = await fetch(url, {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast.success(editingCampaign ? 'Campaign updated' : 'Campaign created');
        setDialogOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to save campaign');
      }
    } catch {
      toast.error('Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  // ─── Send now ───────────────────────────────────────────────────────────────

  const handleSendNow = async (campaign: Campaign) => {
    if (
      !confirm(
        `Send "${campaign.subject}" to ${AUDIENCE_LABELS[campaign.audience]}? This cannot be undone.`
      )
    )
      return;

    const loadingToast = toast.loading('Sending campaign…');
    try {
      const res = await fetch(`${API}/campaigns/${campaign.id}/send`, {
        method: 'POST',
        headers: authHeaders(),
      });
      toast.dismiss(loadingToast);
      if (res.ok) {
        const data = await res.json();
        toast.success(`Sent ${data.sent} emails (${data.failed} failed)`);
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to send campaign');
      }
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to send campaign');
    }
  };

  // ─── Schedule ───────────────────────────────────────────────────────────────

  const openSchedule = (campaign: Campaign) => {
    setSchedulingCampaign(campaign);
    setScheduledAt('');
    setScheduleDialogOpen(true);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingCampaign || !scheduledAt) return;

    try {
      const res = await fetch(`${API}/campaigns/${schedulingCampaign.id}/schedule`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ scheduledAt: new Date(scheduledAt).toISOString() }),
      });
      if (res.ok) {
        toast.success('Campaign scheduled');
        setScheduleDialogOpen(false);
        fetchCampaigns();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to schedule');
      }
    } catch {
      toast.error('Failed to schedule campaign');
    }
  };

  // ─── Cancel schedule ────────────────────────────────────────────────────────

  const handleCancelSchedule = async (campaign: Campaign) => {
    try {
      const res = await fetch(`${API}/campaigns/${campaign.id}/cancel-schedule`, {
        method: 'PATCH',
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success('Schedule cancelled — campaign reverted to draft');
        fetchCampaigns();
      } else {
        toast.error('Failed to cancel schedule');
      }
    } catch {
      toast.error('Failed to cancel schedule');
    }
  };

  // ─── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Delete "${campaign.subject}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API}/campaigns/${campaign.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.ok) {
        toast.success('Campaign deleted');
        fetchCampaigns();
      } else {
        toast.error('Failed to delete campaign');
      }
    } catch {
      toast.error('Failed to delete campaign');
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-neutral-900 mx-auto" />
          <p className="mt-4 text-sm text-neutral-500">Loading campaigns…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Compose and send promotional emails to your user base
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchCampaigns}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: 'Total',
            value: campaigns.length,
            icon: Mail,
            color: 'text-neutral-700',
          },
          {
            label: 'Scheduled',
            value: campaigns.filter((c) => c.status === 'SCHEDULED').length,
            icon: Clock,
            color: 'text-blue-600',
          },
          {
            label: 'Sent',
            value: campaigns.filter((c) => c.status === 'SENT').length,
            icon: Send,
            color: 'text-green-600',
          },
          {
            label: 'Emails Delivered',
            value: campaigns.reduce((s, c) => s + (c.sentCount ?? 0), 0).toLocaleString(),
            icon: BarChart2,
            color: 'text-[#CBB57B]',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-neutral-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                {label}
              </span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-neutral-50">
              <TableHead>Subject</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Scheduled / Sent</TableHead>
              <TableHead className="text-center">Recipients</TableHead>
              <TableHead className="text-center">Sent / Failed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                  <Mail className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">No campaigns yet</p>
                  <p className="text-sm mt-1">Create your first email campaign to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign) => {
                const status = STATUS_CONFIG[campaign.status];
                return (
                  <TableRow key={campaign.id} className="hover:bg-neutral-50 transition-colors">
                    <TableCell>
                      <button
                        className="text-left font-medium hover:underline"
                        onClick={() => openPreview(campaign)}
                      >
                        {campaign.subject}
                      </button>
                      {campaign.previewText && (
                        <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                          {campaign.previewText}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-sm">
                        <Users className="h-3 w-3 text-neutral-400" />
                        {AUDIENCE_LABELS[campaign.audience]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-600">
                      {campaign.status === 'SCHEDULED'
                        ? formatDate(campaign.scheduledAt)
                        : campaign.sentAt
                          ? formatDate(campaign.sentAt)
                          : formatDate(campaign.createdAt)}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {campaign.recipientCount != null ? campaign.recipientCount : '—'}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {campaign.status === 'SENT' || campaign.status === 'FAILED' ? (
                        <span>
                          <span className="text-green-600 font-medium">
                            {campaign.sentCount ?? 0}
                          </span>
                          {' / '}
                          <span className="text-red-500">{campaign.failedCount ?? 0}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Send now — draft, scheduled, failed */}
                        {(campaign.status === 'DRAFT' ||
                          campaign.status === 'SCHEDULED' ||
                          campaign.status === 'FAILED') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Send now"
                            onClick={() => handleSendNow(campaign)}
                          >
                            <Send className="h-4 w-4 text-green-600" />
                          </Button>
                        )}

                        {/* Schedule — draft only */}
                        {campaign.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Schedule"
                            onClick={() => openSchedule(campaign)}
                          >
                            <Clock className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}

                        {/* Cancel schedule */}
                        {campaign.status === 'SCHEDULED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Cancel schedule"
                            onClick={() => handleCancelSchedule(campaign)}
                          >
                            <XCircle className="h-4 w-4 text-amber-500" />
                          </Button>
                        )}

                        {/* Edit — draft only */}
                        {campaign.status === 'DRAFT' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Edit"
                            onClick={() => openEdit(campaign)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}

                        {/* Delete */}
                        {campaign.status !== 'SENDING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete"
                            className="text-red-500 hover:text-red-700"
                            onClick={() => handleDelete(campaign)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ─── Compose / Edit Dialog ─── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCampaign ? 'Edit Campaign' : 'New Email Campaign'}</DialogTitle>
            <DialogDescription>
              {editingCampaign
                ? 'Update campaign details. Only draft campaigns can be edited.'
                : 'Compose a new email campaign. You can send it immediately or schedule it later.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-5 pt-2">
            <div className="space-y-2">
              <Label htmlFor="subject">
                Subject <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                placeholder="Your email subject line"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                maxLength={200}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="previewText">Preview Text</Label>
              <Input
                id="previewText"
                placeholder="Short summary shown in the inbox preview (optional)"
                value={formData.previewText}
                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                Shown in email clients as the snippet after the subject line.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="audience">
                Audience
                {recipientCount !== null && (
                  <span className="ml-2 text-xs text-muted-foreground font-normal">
                    (~{recipientCount.toLocaleString()} verified recipients)
                  </span>
                )}
              </Label>
              <Select
                value={formData.audience}
                onValueChange={(v) => setFormData({ ...formData, audience: v as CampaignAudience })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(AUDIENCE_LABELS) as [CampaignAudience, string][]).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">
                Email Body <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="body"
                placeholder="Write your email content here. HTML is supported."
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows={10}
                className="font-mono text-sm"
                required
              />
              <p className="text-xs text-muted-foreground">
                Basic HTML tags are supported (bold, italic, links, etc.).
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingCampaign ? 'Update Campaign' : 'Save as Draft'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Schedule Dialog ─── */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Schedule Campaign</DialogTitle>
            <DialogDescription>
              Choose when to automatically send &ldquo;{schedulingCampaign?.subject}&rdquo;.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSchedule} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Send at</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                required
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Clock className="h-4 w-4 mr-2" />
                Schedule
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Preview Dialog ─── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewCampaign?.subject}</DialogTitle>
            {previewCampaign?.previewText && (
              <DialogDescription>{previewCampaign.previewText}</DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                {previewCampaign && AUDIENCE_LABELS[previewCampaign.audience]}
              </span>
              {previewCampaign && (
                <Badge className={STATUS_CONFIG[previewCampaign.status].className}>
                  {STATUS_CONFIG[previewCampaign.status].label}
                </Badge>
              )}
            </div>

            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: previewCampaign?.body ?? '' }}
              />
            </div>

            {previewCampaign?.status === 'SENT' && (
              <div className="flex gap-6 text-sm text-neutral-600 bg-green-50 rounded-lg p-3 border border-green-100">
                <span>
                  <span className="font-semibold text-green-700">{previewCampaign.sentCount}</span>{' '}
                  delivered
                </span>
                <span>
                  <span className="font-semibold text-red-600">{previewCampaign.failedCount}</span>{' '}
                  failed
                </span>
                <span>Sent {formatDate(previewCampaign.sentAt)}</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CampaignsPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <CampaignsContent />
      </AdminLayout>
    </AdminRoute>
  );
}
