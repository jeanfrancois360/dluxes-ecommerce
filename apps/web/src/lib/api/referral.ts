import { api } from './client';

/**
 * Referral API Client (v2.11.0)
 * Dynamic Referral Management - Zero hardcoded values
 */

/**
 * Build query string from params object, filtering out undefined/null/empty values
 */
function buildQueryString(params?: Record<string, any>): string {
  if (!params) return '';

  const filtered = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');

  return filtered ? `?${filtered}` : '';
}

// ============================================================================
// USER ENDPOINTS
// ============================================================================

/**
 * Generate referral code for current user
 */
export const generateReferralCode = async () => {
  return api.post('/referral/generate');
};

/**
 * Validate a referral code
 */
export const validateReferralCode = async (code: string) => {
  const { data } = await api.get(`/referral/validate/${code}`);
  return data;
};

/**
 * Get referral summary for current user
 */
export const getReferralSummary = async () => {
  const { data } = await api.get('/referral/summary');
  return data;
};

/**
 * Get referral history for current user
 */
export const getReferralHistory = async (params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get(`/referral/history${buildQueryString(params)}`);
  return data;
};

/**
 * Get referral settings (public info for frontend)
 */
export const getReferralSettings = async () => {
  return api.get('/referral/settings');
};

/**
 * Save user's preferred reward type
 */
export const updatePreferredRewardType = async (
  rewardType: 'STORE_CREDIT' | 'COUPON' | 'FLAT_COMMISSION'
) => {
  return api.patch('/referral/preferred-reward-type', { rewardType });
};

/**
 * Get top referrers leaderboard
 */
export const getLeaderboard = async (limit?: number) => {
  const params = limit ? { limit } : undefined;
  const { data } = await api.get(`/referral/leaderboard${buildQueryString(params)}`);
  return data;
};

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

/**
 * Get all referrals with filters (Admin only)
 */
export const getAllReferrals = async (params?: {
  status?: string;
  role?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}) => {
  const { data } = await api.get(`/referral/admin/all${buildQueryString(params)}`);
  return data;
};

/**
 * Get referral statistics (Admin only)
 */
export const getReferralStatistics = async (params?: { startDate?: string; endDate?: string }) => {
  const { data } = await api.get(`/referral/admin/statistics${buildQueryString(params)}`);
  return data;
};

/**
 * Get top referrers with full details (Admin only)
 */
export const getTopReferrersAdmin = async (limit?: number) => {
  const params = limit ? { limit } : undefined;
  const { data } = await api.get(`/referral/admin/top-referrers${buildQueryString(params)}`);
  return data;
};

/**
 * Get all referral settings (Admin only)
 */
export const getReferralSettingsAdmin = async () => {
  const { data } = await api.get('/referral/admin/settings');
  return data;
};

/**
 * Redeem a referral coupon for store credit
 */
export const redeemCoupon = async (code: string) => {
  const { data } = await api.post('/referral/redeem-coupon', { code });
  return data;
};

/**
 * Manually grant referral reward (Admin only)
 */
export const grantRewardAdmin = async (referralId: string) => {
  const { data } = await api.post(`/referral/admin/grant-reward/${referralId}`);
  return data;
};

/**
 * List referral payout records (Admin — flat_commission reward type)
 */
export const getReferralPayouts = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}) => {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const { data } = await api.get(`/referral/admin/payouts?${query.toString()}`);
  return data;
};

/**
 * Update a referral payout record status (Admin)
 */
export const updateReferralPayout = async (
  payoutId: string,
  body: {
    status: string;
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
  }
) => {
  const { data } = await api.patch(`/referral/admin/payouts/${payoutId}`, body);
  return data;
};

export const referralApi = {
  // User endpoints
  generateReferralCode,
  validateReferralCode,
  getReferralSummary,
  getReferralHistory,
  getReferralSettings,
  getLeaderboard,
  redeemCoupon,
  updatePreferredRewardType,

  // Admin endpoints
  getAllReferrals,
  getReferralStatistics,
  getTopReferrersAdmin,
  getReferralSettingsAdmin,
  grantRewardAdmin,
  getReferralPayouts,
  updateReferralPayout,
};
