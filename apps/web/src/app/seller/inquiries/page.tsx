'use client';

/**
 * Seller Inquiries Management Page
 *
 * View and manage product inquiries from potential buyers
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { sellerAPI, type Inquiry, type InquiryStatus, type InquiryStats } from '@/lib/api/seller';
import useSWR from 'swr';
import PageHeader from '@/components/seller/page-header';
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Home,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Eye,
} from 'lucide-react';

function InquiryStatusBadge({ status }: { status: InquiryStatus }) {
  const config: Record<InquiryStatus, { bg: string; text: string; label: string }> = {
    NEW: { bg: 'bg-[#CBB57B]/10', text: 'text-[#A89968]', label: 'New' },
    CONTACTED: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Contacted' },
    VIEWING_SCHEDULED: {
      bg: 'bg-neutral-100',
      text: 'text-neutral-800',
      label: 'Viewing Scheduled',
    },
    TEST_DRIVE_SCHEDULED: {
      bg: 'bg-neutral-100',
      text: 'text-neutral-800',
      label: 'Test Drive Scheduled',
    },
    NEGOTIATING: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Negotiating' },
    CONVERTED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Converted' },
    CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
    SPAM: { bg: 'bg-red-100', text: 'text-red-800', label: 'Spam' },
  };

  const { bg, text, label } = config[status] || config.NEW;

  return (
    <span className={`px-3 py-1 text-xs font-medium rounded-full ${bg} ${text}`}>{label}</span>
  );
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function SellerInquiriesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | ''>('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState<InquiryStatus>('CONTACTED');
  const [sellerNotes, setSellerNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  // Fetch inquiries
  const {
    data: inquiriesResponse,
    error,
    mutate,
  } = useSWR(
    user && (user.role === 'SELLER' || user.role === 'ADMIN')
      ? ['seller-inquiries', statusFilter]
      : null,
    () =>
      sellerAPI.getInquiries({
        status: statusFilter || undefined,
        limit: 50,
      }),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  // Fetch stats
  const { data: statsResponse } = useSWR(
    user && (user.role === 'SELLER' || user.role === 'ADMIN') ? 'seller-inquiry-stats' : null,
    () => sellerAPI.getInquiryStats(),
    { refreshInterval: 60000 }
  );

  // Check if user is seller
  useEffect(() => {
    if (!authLoading && user && user.role !== 'SELLER' && user.role !== 'ADMIN') {
      router.push('/dashboard/buyer');
    }
  }, [authLoading, user, router]);

  // Extract inquiries from response - the API client returns the data directly
  const inquiries: Inquiry[] = (inquiriesResponse as any)?.inquiries || [];

  // Extract stats from response
  const stats: InquiryStats = {
    total: (statsResponse as any)?.total || 0,
    new: (statsResponse as any)?.new || 0,
    contacted: (statsResponse as any)?.contacted || 0,
    scheduled: (statsResponse as any)?.scheduled || 0,
    converted: (statsResponse as any)?.converted || 0,
  };

  const handleViewDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setShowDetailModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedInquiry) return;

    try {
      setUpdating(true);
      await sellerAPI.updateInquiryStatus(selectedInquiry.id, {
        status: newStatus,
        sellerNotes: sellerNotes || undefined,
      });

      await mutate();
      setShowUpdateModal(false);
      setShowDetailModal(false);
      setSelectedInquiry(null);
      setSellerNotes('');
    } catch (error: any) {
      console.error('Failed to update inquiry status:', error);
      alert(error?.response?.data?.message || 'Failed to update inquiry status');
    } finally {
      setUpdating(false);
    }
  };

  const isLoading = !inquiriesResponse && !error;

  if (authLoading || (isLoading && !user)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <PageHeader
        title="Inquiries"
        description="Manage inquiries from potential buyers"
        breadcrumbs={[{ label: 'Dashboard', href: '/seller' }, { label: 'Inquiries' }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-neutral-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-[#CBB57B]/10 border border-[#CBB57B]/30 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-[#A89968] font-medium">New</p>
            <p className="text-2xl font-bold text-[#A89968] mt-1">{stats.new}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-yellow-700 font-medium">Contacted</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.contacted}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-neutral-700 font-medium">Scheduled</p>
            <p className="text-2xl font-bold text-neutral-700 mt-1">{stats.scheduled}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm"
          >
            <p className="text-sm text-green-700 font-medium">Converted</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{stats.converted}</p>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-neutral-600">Filter:</span>
            {[
              { value: '', label: 'All' },
              { value: 'NEW', label: 'New' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'VIEWING_SCHEDULED', label: 'Viewing Scheduled' },
              { value: 'NEGOTIATING', label: 'Negotiating' },
              { value: 'CONVERTED', label: 'Converted' },
              { value: 'CLOSED', label: 'Closed' },
            ].map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value as InquiryStatus | '')}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  statusFilter === filter.value
                    ? 'bg-[#CBB57B] text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inquiries List */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
          {inquiries.length === 0 ? (
            <div className="text-center py-16">
              <MessageSquare className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 text-lg">No inquiries found</p>
              <p className="text-neutral-400 text-sm mt-1">
                Inquiries from potential buyers will appear here
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-200">
              {inquiries.map((inquiry) => (
                <motion.div
                  key={inquiry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-neutral-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {inquiry.product?.heroImage || inquiry.product?.images?.[0]?.url ? (
                        <img
                          src={inquiry.product.heroImage || inquiry.product.images?.[0]?.url}
                          alt={inquiry.product.name}
                          className="w-20 h-20 object-cover rounded-lg border border-neutral-200"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-neutral-100 rounded-lg flex items-center justify-center">
                          <Home className="w-8 h-8 text-neutral-400" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Link
                            href={`/products/${inquiry.product?.slug}`}
                            className="font-semibold text-black hover:text-blue-600 transition-colors"
                          >
                            {inquiry.product?.name || 'Unknown Product'}
                          </Link>
                          <div className="flex items-center gap-2 mt-1">
                            <InquiryStatusBadge status={inquiry.status} />
                            {inquiry.preApproved && (
                              <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                                Pre-approved
                              </span>
                            )}
                            {inquiry.scheduledViewing && (
                              <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(inquiry.scheduledViewing).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-neutral-500 whitespace-nowrap">
                          {formatRelativeTime(inquiry.createdAt)}
                        </span>
                      </div>

                      {/* Buyer Info */}
                      <div className="mt-3 flex items-center gap-4 text-sm text-neutral-600">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {inquiry.buyerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {inquiry.buyerEmail}
                        </span>
                        {inquiry.buyerPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-4 h-4" />
                            {inquiry.buyerPhone}
                          </span>
                        )}
                      </div>

                      {/* Message Preview */}
                      <p className="mt-2 text-sm text-neutral-600 line-clamp-2">
                        {inquiry.message}
                      </p>

                      {/* Actions */}
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => handleViewDetails(inquiry)}
                          className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View Details
                        </button>
                        <a
                          href={`mailto:${inquiry.buyerEmail}?subject=Re: ${inquiry.product?.name}`}
                          className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Mail className="w-4 h-4" />
                          Reply
                        </a>
                        {inquiry.buyerPhone && (
                          <a
                            href={`tel:${inquiry.buyerPhone}`}
                            className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="p-6 border-b border-neutral-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-black">Inquiry Details</h3>
                  <p className="text-sm text-neutral-600 mt-1">{selectedInquiry.product?.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedInquiry(null);
                  }}
                  className="text-neutral-400 hover:text-neutral-600 p-1"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <InquiryStatusBadge status={selectedInquiry.status} />
                <span className="text-sm text-neutral-500">
                  {formatDate(selectedInquiry.createdAt)}
                </span>
              </div>

              {/* Buyer Information */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Buyer Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-500">Name</p>
                    <p className="font-medium text-black">{selectedInquiry.buyerName}</p>
                  </div>
                  <div>
                    <p className="text-neutral-500">Email</p>
                    <a
                      href={`mailto:${selectedInquiry.buyerEmail}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {selectedInquiry.buyerEmail}
                    </a>
                  </div>
                  {selectedInquiry.buyerPhone && (
                    <div>
                      <p className="text-neutral-500">Phone</p>
                      <a
                        href={`tel:${selectedInquiry.buyerPhone}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {selectedInquiry.buyerPhone}
                      </a>
                    </div>
                  )}
                  {selectedInquiry.preferredContact && (
                    <div>
                      <p className="text-neutral-500">Preferred Contact</p>
                      <p className="font-medium text-black capitalize">
                        {selectedInquiry.preferredContact}
                      </p>
                    </div>
                  )}
                  {selectedInquiry.preferredTime && (
                    <div>
                      <p className="text-neutral-500">Best Time</p>
                      <p className="font-medium text-black capitalize">
                        {selectedInquiry.preferredTime}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Special Flags */}
              {(selectedInquiry.preApproved || selectedInquiry.scheduledViewing) && (
                <div className="flex flex-wrap gap-3">
                  {selectedInquiry.preApproved && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Pre-approved for Mortgage</span>
                    </div>
                  )}
                  {selectedInquiry.scheduledViewing && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        Requested Viewing:{' '}
                        {new Date(selectedInquiry.scheduledViewing).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Message */}
              <div>
                <h4 className="font-semibold text-black mb-2 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Message
                </h4>
                <div className="bg-neutral-50 rounded-xl p-4">
                  <p className="text-neutral-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
                </div>
              </div>

              {/* Seller Notes */}
              {selectedInquiry.sellerNotes && (
                <div>
                  <h4 className="font-semibold text-black mb-2">Your Notes</h4>
                  <div className="bg-yellow-50 rounded-xl p-4">
                    <p className="text-yellow-800 whitespace-pre-wrap">
                      {selectedInquiry.sellerNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-neutral-200 flex gap-3">
              <button
                onClick={() => {
                  setNewStatus(
                    selectedInquiry.status === 'NEW' ? 'CONTACTED' : selectedInquiry.status
                  );
                  setSellerNotes(selectedInquiry.sellerNotes || '');
                  setShowUpdateModal(true);
                }}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
              >
                Update Status
              </button>
              <a
                href={`mailto:${selectedInquiry.buyerEmail}?subject=Re: ${selectedInquiry.product?.name}`}
                className="flex-1 px-4 py-3 border-2 border-neutral-300 text-neutral-700 font-semibold rounded-xl hover:bg-neutral-50 transition-colors text-center"
              >
                Send Email
              </a>
            </div>
          </motion.div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-xl font-bold text-black mb-4">Update Inquiry Status</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as InquiryStatus)}
                  className="w-full px-4 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="NEW">New</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="VIEWING_SCHEDULED">Viewing Scheduled</option>
                  <option value="TEST_DRIVE_SCHEDULED">Test Drive Scheduled</option>
                  <option value="NEGOTIATING">Negotiating</option>
                  <option value="CONVERTED">Converted</option>
                  <option value="CLOSED">Closed</option>
                  <option value="SPAM">Spam</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={sellerNotes}
                  onChange={(e) => setSellerNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this inquiry..."
                  className="w-full px-4 py-2.5 border-2 border-neutral-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowUpdateModal(false)}
                disabled={updating}
                className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
