import { baseEmailTemplate } from './base.template';

interface SellerDispatchReminderData {
  sellerName: string;
  storeName: string;
  orderNumber: string;
  orderId: string;
  orderUrl: string;
  hoursOverdue: number;
  frontendUrl?: string;
}

export function sellerDispatchReminderTemplate(data: SellerDispatchReminderData): string {
  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Action required: order needs to ship
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName},
    </p>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> from your store <strong style="color: #0A0A0A;">${data.storeName}</strong> was placed <strong style="color: #0A0A0A;">${data.hoursOverdue} hours ago</strong> and a shipping label has not yet been purchased.
    </p>

    <!-- Order info -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order number</p>
          <p style="color: #0A0A0A; font-size: 18px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">#${data.orderNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Warning box -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #FFFBEB; border: 1px solid #FDE68A; padding: 16px 18px;">
          <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Action required
          </p>
          <p style="color: #92400E; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Please purchase a shipping label and dispatch this order as soon as possible to maintain your seller rating and ensure customer satisfaction.
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Ship This Order Now
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Repeated delays may affect your seller standing. <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/seller/help" style="color: #4B5563; text-decoration: underline;">Seller Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Reminder: order #${data.orderNumber} has been waiting ${data.hoursOverdue} hours for a shipping label.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
}
