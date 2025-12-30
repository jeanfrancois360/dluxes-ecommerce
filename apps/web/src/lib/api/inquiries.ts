/**
 * Buyer Inquiries API
 *
 * API methods for managing buyer inquiries for REAL_ESTATE and VEHICLE products
 */

import { api } from './client';
import { Inquiry, InquiryStatus } from './seller';

export type { Inquiry, InquiryStatus };

export interface CreateInquiryData {
  productId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  message: string;
  preferredContact?: 'email' | 'phone' | 'both';
  preferredTime?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  // Real estate specific
  scheduledViewing?: string;
  preApproved?: boolean;
  // Vehicle specific
  scheduledTestDrive?: string;
  tradeInInterest?: boolean;
}

export interface CreateInquiryResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    productName: string;
    status: InquiryStatus;
  };
}

export interface BuyerInquiriesResponse {
  success: boolean;
  data: Inquiry[];
}

export const inquiriesApi = {
  /**
   * Get all inquiries submitted by the current buyer
   */
  getMyInquiries: () => api.get<BuyerInquiriesResponse>('/inquiries/my-inquiries'),

  /**
   * Submit a new inquiry for a product
   */
  submitInquiry: (data: CreateInquiryData) =>
    api.post<CreateInquiryResponse>('/inquiries', data),
};

export default inquiriesApi;
