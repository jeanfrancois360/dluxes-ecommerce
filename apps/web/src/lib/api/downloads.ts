/**
 * Downloads API Client
 *
 * API methods for managing digital product downloads
 */

import { api } from './client';

export interface DigitalPurchase {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  digitalFileUrl: string | null;
  digitalFileName: string | null;
  digitalFileSize: string | null;
  digitalFileFormat: string | null;
  digitalVersion: string | null;
  digitalLicenseType: string | null;
  digitalInstructions: string | null;
  digitalDownloadLimit: number | null;
  downloadCount: number;
  canDownload: boolean;
}

export interface DownloadsResponse {
  success: boolean;
  data: DigitalPurchase[];
}

export interface DownloadUrlResponse {
  success: boolean;
  data: {
    url: string;
    fileName: string;
    fileSize: string | null;
    fileFormat: string | null;
  };
}

export const downloadsApi = {
  /**
   * Get all digital purchases for current user
   */
  getMyDownloads: () => api.get<DownloadsResponse>('/downloads'),

  /**
   * Get download URL for a specific purchase
   */
  getDownloadUrl: (orderId: string, productId: string) =>
    api.get<DownloadUrlResponse>(`/downloads/${orderId}/${productId}`),

  /**
   * Get digital products from a specific order
   */
  getOrderDigitalProducts: (orderId: string) =>
    api.get<DownloadsResponse>(`/downloads/order/${orderId}`),
};

export default downloadsApi;
