/**
 * Invoice Download Utility
 *
 * Provides functionality to download order invoices as PDF files
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

/**
 * Downloads an invoice PDF for a given order
 *
 * @param orderId - The unique identifier of the order
 * @param orderNumber - The order number (used for filename)
 * @returns Promise that resolves when download is complete
 * @throws Error if download fails
 */
export async function downloadInvoice(
  orderId: string,
  orderNumber: string
): Promise<void> {
  try {
    // Get auth token
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      throw new Error('Authentication required to download invoice');
    }

    // Fetch the invoice PDF
    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please sign in again.');
      } else if (response.status === 404) {
        throw new Error('Invoice not found for this order.');
      } else if (response.status === 403) {
        throw new Error('You do not have permission to access this invoice.');
      } else {
        throw new Error('Failed to download invoice. Please try again.');
      }
    }

    // Get the blob from response
    const blob = await response.blob();

    // Verify it's a PDF
    if (blob.type !== 'application/pdf') {
      throw new Error('Invalid file format received. Expected PDF.');
    }

    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${orderNumber}.pdf`;
    link.style.display = 'none';

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the temporary URL
    // Use setTimeout to ensure the download has started
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    // Re-throw the error to be handled by the caller
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while downloading the invoice.');
  }
}

/**
 * Generates a preview URL for an invoice (opens in new tab)
 *
 * @param orderId - The unique identifier of the order
 * @returns Promise with the blob URL
 * @throws Error if preview generation fails
 */
export async function previewInvoice(orderId: string): Promise<string> {
  try {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      throw new Error('Authentication required to preview invoice');
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to load invoice preview');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    return url;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while previewing the invoice.');
  }
}

/**
 * Opens an invoice in a new browser tab for preview
 *
 * @param orderId - The unique identifier of the order
 * @returns Promise that resolves when preview is opened
 * @throws Error if preview fails
 */
export async function openInvoicePreview(orderId: string): Promise<void> {
  try {
    const url = await previewInvoice(orderId);
    const newWindow = window.open(url, '_blank');

    if (!newWindow) {
      throw new Error('Failed to open preview. Please allow pop-ups for this site.');
    }

    // Clean up the URL after a delay
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 60000); // Keep URL alive for 60 seconds
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while opening the invoice preview.');
  }
}

/**
 * Prints an invoice directly
 *
 * @param orderId - The unique identifier of the order
 * @returns Promise that resolves when print dialog is opened
 * @throws Error if print fails
 */
export async function printInvoice(orderId: string): Promise<void> {
  try {
    const url = await previewInvoice(orderId);

    // Create an iframe to load the PDF
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;

    document.body.appendChild(iframe);

    // Wait for the iframe to load, then print
    iframe.onload = () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.print();
      }

      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(iframe);
        window.URL.revokeObjectURL(url);
      }, 1000);
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while printing the invoice.');
  }
}

/**
 * Validates if an order has an available invoice
 *
 * @param orderId - The unique identifier of the order
 * @returns Promise that resolves to true if invoice exists, false otherwise
 */
export async function hasInvoice(orderId: string): Promise<boolean> {
  try {
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('auth_token')
      : null;

    if (!token) {
      return false;
    }

    const response = await fetch(`${API_URL}/orders/${orderId}/invoice/exists`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Utility to format invoice filename
 *
 * @param orderNumber - The order number
 * @param date - Optional date for the invoice
 * @returns Formatted filename string
 */
export function formatInvoiceFilename(
  orderNumber: string,
  date?: Date | string
): string {
  const dateStr = date
    ? new Date(date).toISOString().split('T')[0]
    : new Date().toISOString().split('T')[0];

  return `Invoice-${orderNumber}-${dateStr}.pdf`;
}
