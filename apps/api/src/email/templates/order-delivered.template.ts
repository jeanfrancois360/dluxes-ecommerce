import { baseEmailTemplate, orderProgressTracker } from './base.template';

interface OrderDeliveredData {
  customerName: string;
  orderNumber: string;
  orderId: string;
  reviewUrl: string;
  orderUrl: string;
  frontendUrl?: string;
}

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function orderDeliveredTemplate(data: OrderDeliveredData): string {
  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.5px;">
      Your order has arrived
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.customerName}, order <strong style="color: #111827;">#${data.orderNumber}</strong> has been delivered. We hope you love your purchase!
    </p>

    ${orderProgressTracker(3)}

    <!-- Review prompt -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px 20px 16px;">
          <p style="color: #111827; font-size: 15px; font-weight: 700; margin: 0 0 6px 0; font-family: ${FONT};">Happy with your order?</p>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0; font-family: ${FONT};">
            Your feedback helps other buyers discover great products and rewards sellers who deliver. It only takes a moment.
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td align="center" style="background-color: #CBB57B; padding: 14px 28px;">
                <a href="${data.reviewUrl}" style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 700; font-family: ${FONT}; display: block;">
                  Leave a Review
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 28px 0;">
      <a href="${data.orderUrl}" style="color: #6B7280; font-size: 13px; text-decoration: underline; font-family: ${FONT};">
        View order details
      </a>
    </p>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      Something not right? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a> — we're here to help.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your order #${data.orderNumber} has been delivered. Share your feedback!`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
