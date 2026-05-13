import { baseEmailTemplate } from './base.template';

interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  orderUrl: string;
  frontendUrl?: string;
}

export function orderShippedTemplate(data: OrderShippedData): string {
  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Your order is being prepared
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.customerName},
    </p>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      A shipping label has been created for order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> and it is now being prepared for dispatch.
    </p>

    ${
      data.trackingNumber
        ? `
    <!-- Tracking info -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 16px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Tracking information
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            ${
              data.carrier
                ? `
            <tr>
              <td style="padding: 3px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Carrier</td>
              <td style="padding: 3px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.carrier}</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="padding: 3px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Tracking number</td>
              <td style="padding: 3px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: 'Courier New', 'Lucida Console', monospace;">${data.trackingNumber}</td>
            </tr>
          </table>
          ${
            data.trackingUrl
              ? `
          <p style="margin: 12px 0 0 0;">
            <a href="${data.trackingUrl}" style="color: #0A0A0A; font-size: 13px; text-decoration: underline; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              Track with carrier &rarr;
            </a>
          </p>
          `
              : ''
          }
        </td>
      </tr>
    </table>
    `
        : ''
    }

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order Details
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      We'll notify you again when your order ships. Questions? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your order #${data.orderNumber} is being prepared for dispatch.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
