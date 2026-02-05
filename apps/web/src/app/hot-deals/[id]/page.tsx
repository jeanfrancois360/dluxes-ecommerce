'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  CheckCircle,
  User,
  Send,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { PageLayout } from '@/components/layout/page-layout';
import { useAuth } from '@/hooks/use-auth';
import {
  hotDealsApi,
  HotDeal,
  CATEGORY_LABELS,
  URGENCY_CONFIG,
  STATUS_CONFIG,
} from '@/lib/api/hot-deals';

// Calculate time remaining
function getTimeRemaining(expiresAt: string): { text: string; isExpired: boolean } {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();

  if (diff <= 0) return { text: 'Expired', isExpired: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return { text: `${hours}h ${minutes}m remaining`, isExpired: false };
  }
  return { text: `${minutes}m remaining`, isExpired: false };
}

// Format date
function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface ResponseFormData {
  message: string;
  contactInfo?: string;
}

export default function HotDealDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const dealId = params.id as string;

  const [deal, setDeal] = useState<HotDeal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [isMarkingFulfilled, setIsMarkingFulfilled] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ResponseFormData>();

  // Fetch deal details
  useEffect(() => {
    async function fetchDeal() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await hotDealsApi.getOne(dealId);
        setDeal(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hot deal');
      } finally {
        setIsLoading(false);
      }
    }
    fetchDeal();
  }, [dealId]);

  // Handle response submission
  const onSubmitResponse = async (data: ResponseFormData) => {
    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=/hot-deals/${dealId}`);
      return;
    }

    setIsSubmittingResponse(true);
    try {
      await hotDealsApi.respond(dealId, data);
      toast.success('Response sent successfully!');
      reset();
      setShowResponseForm(false);
      // Refresh deal to show the new response
      const updatedDeal = await hotDealsApi.getOne(dealId);
      setDeal(updatedDeal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Handle mark as fulfilled
  const handleMarkFulfilled = async () => {
    if (!deal) return;

    setIsMarkingFulfilled(true);
    try {
      await hotDealsApi.markFulfilled(dealId);
      toast.success('Hot deal marked as fulfilled!');
      const updatedDeal = await hotDealsApi.getOne(dealId);
      setDeal(updatedDeal);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as fulfilled');
    } finally {
      setIsMarkingFulfilled(false);
    }
  };

  const isOwner = user && deal && user.id === deal.user.id;
  const hasResponded = deal?.responses?.some((r) => r.user.id === user?.id);
  const canRespond = isAuthenticated && !isOwner && deal?.status === 'ACTIVE' && !hasResponded;
  const timeInfo = deal ? getTimeRemaining(deal.expiresAt) : null;

  // Loading state
  if (isLoading) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <PageLayout showCategoryNav={false}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Hot Deal Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'This hot deal may have been removed or expired.'}</p>
              <Link
                href="/hot-deals"
                className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Hot Deals
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const urgencyConfig = URGENCY_CONFIG[deal.urgency];
  const statusConfig = STATUS_CONFIG[deal.status];

  return (
    <PageLayout showCategoryNav={false}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Link
              href="/hot-deals"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Hot Deals
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Info Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Header with badges */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${urgencyConfig.bgColor} ${urgencyConfig.color}`}
                    >
                      {urgencyConfig.label}
                    </span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                    >
                      {statusConfig.label}
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
                      {CATEGORY_LABELS[deal.category]}
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-gray-900 mb-2">{deal.title}</h1>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {deal.city}{deal.state ? `, ${deal.state}` : ''}
                      {deal.zipCode ? ` ${deal.zipCode}` : ''}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {timeInfo?.text}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {deal._count?.responses || 0} responses
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{deal.description}</p>
                </div>

                {/* Contact Info (only for logged-in users) */}
                {isAuthenticated ? (
                  <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h2>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">{deal.contactName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <a
                          href={`tel:${deal.contactPhone}`}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          {deal.contactPhone}
                        </a>
                        {deal.preferredContact === 'PHONE' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Preferred
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <a
                          href={`mailto:${deal.contactEmail}`}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          {deal.contactEmail}
                        </a>
                        {deal.preferredContact === 'EMAIL' && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Preferred
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-gray-50">
                    <div className="text-center">
                      <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">
                        Log in to see contact information and respond to this hot deal.
                      </p>
                      <Link
                        href={`/auth/login?redirect=/hot-deals/${dealId}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                      >
                        Log In to Continue
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Response Form */}
              {canRespond && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl shadow-sm p-6"
                >
                  {!showResponseForm ? (
                    <button
                      onClick={() => setShowResponseForm(true)}
                      className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors"
                    >
                      <Send className="w-5 h-5" />
                      Respond to This Request
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit(onSubmitResponse)}>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Send Your Response
                      </h2>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Message <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            {...register('message', {
                              required: 'Message is required',
                              minLength: { value: 20, message: 'Message must be at least 20 characters' },
                              maxLength: { value: 500, message: 'Message cannot exceed 500 characters' },
                            })}
                            rows={4}
                            placeholder="Introduce yourself and explain how you can help..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                          {errors.message && (
                            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Contact Info (optional)
                          </label>
                          <textarea
                            {...register('contactInfo')}
                            rows={2}
                            placeholder="Phone: xxx-xxx-xxxx, Email: your@email.com"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>

                        <div className="flex gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setShowResponseForm(false);
                              reset();
                            }}
                            className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmittingResponse}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                          >
                            {isSubmittingResponse ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Send className="w-5 h-5" />
                            )}
                            Send Response
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Already Responded Message */}
              {hasResponded && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <p className="font-medium">You have already responded to this hot deal.</p>
                  </div>
                </div>
              )}

              {/* Responses (visible to owner) */}
              {isOwner && deal.responses && deal.responses.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Responses ({deal.responses.length})
                    </h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {deal.responses.map((response) => (
                      <div key={response.id} className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">
                                {response.user.firstName} {response.user.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(response.createdAt)}
                              </p>
                            </div>
                            <p className="text-gray-600 mb-3">{response.message}</p>
                            {response.contactInfo && (
                              <div className="bg-gray-50 rounded-lg p-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Contact Info:</p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {response.contactInfo}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-sm p-6 sticky top-6"
              >
                {/* Posted By */}
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Posted by</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {deal.user.firstName} {deal.user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{formatDate(deal.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Owner Actions */}
                {isOwner && deal.status === 'ACTIVE' && (
                  <div className="pt-6 border-t border-gray-100">
                    <button
                      onClick={handleMarkFulfilled}
                      disabled={isMarkingFulfilled}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      {isMarkingFulfilled ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Mark as Fulfilled
                    </button>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Mark when you've found help for your request
                    </p>
                  </div>
                )}

                {/* Time Warning */}
                {deal.status === 'ACTIVE' && timeInfo && !timeInfo.isExpired && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-xl">
                    <div className="flex items-center gap-2 text-orange-700">
                      <Clock className="w-5 h-5" />
                      <p className="text-sm font-medium">{timeInfo.text}</p>
                    </div>
                    <p className="text-xs text-orange-600 mt-1">
                      This deal will expire automatically
                    </p>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
