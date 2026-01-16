'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit, Trash2, MoreVertical, Copy, ToggleLeft, ToggleRight, X, Loader2, Check } from 'lucide-react';
import { AdminRoute } from '@/components/admin-route';
import { AdminLayout } from '@/components/admin/admin-layout';
import { toast, standardToasts } from '@/lib/utils/toast';
import { formatCurrencyAmount } from '@/lib/utils/number-format';
import { subscriptionApi, type SubscriptionPlan, type CreatePlanData } from '@/lib/api/subscription';

// Stat Card Component
function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 hover:border-gray-300 transition-colors p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-[#CBB57B]/10 rounded-lg">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SubscriptionPlansContent() {
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<SubscriptionPlan | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreatePlanData>({
    tier: 'FREE',
    name: '',
    description: '',
    monthlyPrice: 0,
    yearlyPrice: 0,
    maxActiveListings: 10,
    monthlyCredits: 5,
    featuredSlotsPerMonth: 0,
    listingDurationDays: 30,
    features: [''],
    allowedProductTypes: ['SERVICE', 'RENTAL'],
    isActive: true,
    isPopular: false,
    displayOrder: 0,
  });

  // Fetch plans with useSWR
  const { data: plans, error, isLoading, mutate } = useSWR(
    'subscription-plans',
    () => subscriptionApi.adminGetPlans()
  );

  // Show error toast if data fetch fails
  React.useEffect(() => {
    if (error) {
      toast.error('Failed to fetch subscription plans');
    }
  }, [error]);

  // Open modal for create
  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      tier: 'FREE',
      name: '',
      description: '',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxActiveListings: 10,
      monthlyCredits: 5,
      featuredSlotsPerMonth: 0,
      listingDurationDays: 30,
      features: [''],
      allowedProductTypes: ['SERVICE', 'RENTAL'],
      isActive: true,
      isPopular: false,
      displayOrder: 0,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit
  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      tier: plan.tier,
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      maxActiveListings: plan.maxActiveListings,
      monthlyCredits: plan.monthlyCredits,
      featuredSlotsPerMonth: plan.featuredSlotsPerMonth,
      listingDurationDays: plan.listingDurationDays,
      features: (plan.features as string[])?.length > 0 ? plan.features as string[] : [''],
      allowedProductTypes: (plan.allowedProductTypes as string[]) || [],
      isActive: plan.isActive,
      isPopular: plan.isPopular,
      displayOrder: plan.displayOrder,
    });
    setIsModalOpen(true);
    setOpenMenuId(null);
  };

  // Submit form (create or update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const data = {
        ...formData,
        features: formData.features?.filter(f => f.trim() !== ''),
      };

      if (editingPlan) {
        // When editing, don't include tier (it's not allowed to change)
        const { tier, ...updateData } = data;
        await subscriptionApi.adminUpdatePlan(editingPlan.id, updateData);
        toast.success('Plan updated successfully');
      } else {
        await subscriptionApi.adminCreatePlan(data);
        toast.success('Plan created successfully');
      }

      setIsModalOpen(false);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save plan');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete plan
  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await subscriptionApi.adminDeletePlan(deleteConfirm.id);
      toast.success('Plan deleted successfully');
      setDeleteConfirm(null);
      mutate();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete plan');
    }
  };

  // Toggle status
  const handleToggle = async (plan: SubscriptionPlan) => {
    try {
      await subscriptionApi.adminTogglePlanStatusById(plan.id);
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'}`);
      mutate();
    } catch (error) {
      toast.error('Failed to update plan status');
    }
    setOpenMenuId(null);
  };

  // Duplicate plan
  const handleDuplicate = async (plan: SubscriptionPlan) => {
    try {
      await subscriptionApi.adminDuplicatePlan(plan.id);
      toast.success('Plan duplicated successfully');
      mutate();
    } catch (error) {
      toast.error('Failed to duplicate plan');
    }
    setOpenMenuId(null);
  };

  // Feature management
  const addFeature = () => {
    setFormData({ ...formData, features: [...(formData.features || []), ''] });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    const newFeatures = (formData.features || []).filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures.length > 0 ? newFeatures : [''] });
  };

  const filteredPlans = React.useMemo(() => {
    if (!plans) return [];
    return plans.filter((plan) => {
      if (filter === 'all') return true;
      if (filter === 'active') return plan.isActive;
      return !plan.isActive;
    });
  }, [plans, filter]);

  const totalSubscribers = React.useMemo(() => {
    if (!plans) return 0;
    return plans.reduce((sum, p) => sum + (p._count?.subscriptions || 0), 0);
  }, [plans]);

  const totalRevenue = React.useMemo(() => {
    if (!plans) return 0;
    return plans.reduce((sum, p) => sum + (p.monthlyPrice * (p._count?.subscriptions || 0)), 0);
  }, [plans]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="bg-gray-800 rounded-lg p-8 animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-3" />
          <div className="h-5 bg-gray-700 rounded w-1/2" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing tiers and features</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#CBB57B] text-black font-semibold rounded-xl hover:bg-[#b9a369] transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Plans"
          value={(plans?.length || 0).toString()}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          }
        />
        <StatCard
          title="Total Subscribers"
          value={totalSubscribers.toString()}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrencyAmount(totalRevenue)}
          icon={
            <svg className="w-6 h-6 text-[#CBB57B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center bg-gray-100 p-1 rounded-xl">
          {(['all', 'active', 'inactive'] as const).map((tab) => {
            let count = 0;
            if (tab === 'all') count = plans?.length || 0;
            else if (tab === 'active') count = plans?.filter(p => p.isActive).length || 0;
            else count = plans?.filter(p => !p.isActive).length || 0;

            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  filter === tab
                    ? 'bg-[#000000] text-[#FFFFFF] shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase() + tab.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No plans found</h3>
          <p className="text-gray-600">Try adjusting your filters or create a new plan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlans.map((plan) => {
            const savingsPercent = plan.monthlyPrice > 0
              ? Math.round((1 - (plan.yearlyPrice / 12) / plan.monthlyPrice) * 100)
              : 0;

            return (
              <div
                key={plan.id}
                className="bg-[#FFFFFF] rounded-xl border-2 border-gray-200 hover:border-[#CBB57B] shadow-sm hover:shadow-lg transition-all flex flex-col h-full overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-6 flex-1 flex flex-col min-h-0">
                  {/* Title Row with Fixed Height */}
                  <div className="flex items-start justify-between mb-4 min-h-[60px]">
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-[#000000] truncate">{plan.name}</h3>
                        {plan.isPopular && (
                          <span className="px-2 py-0.5 bg-[#CBB57B] text-[#000000] text-xs font-semibold rounded-full whitespace-nowrap">
                            Popular
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm line-clamp-2 leading-tight">{plan.description || `${plan.tier} tier subscription`}</p>
                    </div>

                    {/* Status & Menu */}
                    <div className="flex items-start gap-1 flex-shrink-0">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                        plan.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {plan.isActive ? '●' : '○'}
                      </span>

                      {/* More Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>

                        {openMenuId === plan.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            <div className="absolute right-0 top-full mt-1 w-44 bg-[#FFFFFF] rounded-xl shadow-lg border-2 border-gray-200 py-1 z-20">
                              <button
                                onClick={() => handleEdit(plan)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={() => handleToggle(plan)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                {plan.isActive ? (
                                  <>
                                    <ToggleLeft className="w-4 h-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <ToggleRight className="w-4 h-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDuplicate(plan)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <hr className="my-1 border-gray-100" />
                              <button
                                onClick={() => {
                                  setDeleteConfirm(plan);
                                  setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pricing - Fixed Height */}
                  <div className="mb-4 min-h-[56px]">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[#000000]">
                        {plan.monthlyPrice === 0 ? 'Free' : `$${plan.monthlyPrice.toFixed(2)}`}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-gray-500 text-sm font-medium">/month</span>
                      )}
                    </div>
                    {plan.yearlyPrice > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-gray-500 text-xs">${plan.yearlyPrice.toFixed(2)} /year</span>
                        {savingsPercent > 0 && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">
                            Save {savingsPercent}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Stats Row - Compact */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">Subscribers</p>
                      <p className="text-xl font-bold text-[#000000]">{plan._count?.subscriptions || 0}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium mb-1">Revenue</p>
                      <p className="text-xl font-bold text-[#000000]">
                        ${((plan.monthlyPrice * (plan._count?.subscriptions || 0))).toFixed(0)}
                      </p>
                    </div>
                  </div>

                  {/* Features - Fixed Height with Scroll */}
                  <div className="flex-1 min-h-0">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Top Features</p>
                    <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
                      {(plan.features as string[])?.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                          <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-tight">{feature}</span>
                        </div>
                      ))}
                      {(plan.features as string[])?.length > 4 && (
                        <p className="text-xs text-gray-400 pl-5 pt-1">
                          +{(plan.features as string[]).length - 4} more
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer - Edit Button */}
                <div className="p-4 border-t-2 border-gray-100 bg-gray-50/50">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#000000] text-[#FFFFFF] rounded-lg font-semibold hover:bg-[#1a1a1a] active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Plan
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !isSubmitting && setIsModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create New Plan'}
              </h2>
              <button
                onClick={() => !isSubmitting && setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Plan Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                      placeholder="e.g., Professional"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier *</label>
                    <select
                      value={formData.tier}
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                      required
                      disabled={isSubmitting || !!editingPlan}
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER</option>
                      <option value="PROFESSIONAL">PROFESSIONAL</option>
                      <option value="BUSINESS">BUSINESS</option>
                    </select>
                    {editingPlan && (
                      <p className="text-xs text-gray-500 mt-1">Tier cannot be changed after creation</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                      rows={2}
                      placeholder="Brief description of this plan"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                {/* Pricing */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Monthly Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.monthlyPrice}
                        onChange={(e) => setFormData({ ...formData, monthlyPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Yearly Price ($) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.yearlyPrice}
                        onChange={(e) => setFormData({ ...formData, yearlyPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        required
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Limits */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Plan Limits</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Active Listings</label>
                      <input
                        type="number"
                        min="-1"
                        value={formData.maxActiveListings}
                        onChange={(e) => setFormData({ ...formData, maxActiveListings: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        placeholder="-1 for unlimited"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500 mt-1">-1 for unlimited</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Credits per Month</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthlyCredits}
                        onChange={(e) => setFormData({ ...formData, monthlyCredits: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Featured Slots</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.featuredSlotsPerMonth}
                        onChange={(e) => setFormData({ ...formData, featuredSlotsPerMonth: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Listing Duration (days)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.listingDurationDays}
                        onChange={(e) => setFormData({ ...formData, listingDurationDays: parseInt(e.target.value) || 30 })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">Features</h3>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-sm text-[#CBB57B] hover:text-[#b9a369] font-medium transition-colors"
                      disabled={isSubmitting}
                    >
                      + Add Feature
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(formData.features || ['']).map((feature, idx) => (
                      <div key={idx} className="flex gap-2">
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(idx, e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                          placeholder="e.g., Priority support"
                          disabled={isSubmitting}
                        />
                        {(formData.features?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFeature(idx)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Options</h3>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">Plan is active and visible to sellers</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isPopular}
                        onChange={(e) => setFormData({ ...formData, isPopular: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-[#CBB57B] focus:ring-[#CBB57B]"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-700">Mark as &quot;Popular&quot; (highlighted)</span>
                    </label>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.displayOrder}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      className="w-32 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#CBB57B]/20 focus:border-[#CBB57B] transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#CBB57B] text-black font-medium rounded-xl hover:bg-[#b9a369] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Plan</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete &quot;{deleteConfirm.name}&quot;? This action cannot be undone.
              {deleteConfirm._count && deleteConfirm._count.subscriptions > 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  Warning: This plan has {deleteConfirm._count.subscriptions} active subscriber(s).
                </span>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPlansPage() {
  return (
    <AdminRoute>
      <AdminLayout>
        <SubscriptionPlansContent />
      </AdminLayout>
    </AdminRoute>
  );
}

