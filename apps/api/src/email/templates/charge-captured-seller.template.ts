import { baseEmailTemplate } from './base.template';

interface ChargeCapturedSellerData {
  sellerName: string;
  storeName: string;
  orderNumber: string;
  amount: number;
  currency: string;
  orderId: string;
  dashboardUrl: string;
  frontendUrl?: string;
}

export function chargeCapturedSellerTemplate(data: ChargeCapturedSellerData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Funds captured for order #${data.orderNumber}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, the payment of <strong style="color: #0A0A0A;">${sym}${fmt(data.amount)}</strong> for order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> from <strong style="color: #0A0A0A;">${data.storeName}</strong> has been successfully captured.
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 24px; border-bottom: 3px solid #16A34A;">
          <p style="color: #16A34A; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Funds captured
          </p>
          <p style="color: #FFFFFF; font-size: 36px; font-weight: 700; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${sym}${fmt(data.amount)}
          </p>
          <p style="color: #9CA3AF; font-size: 13px; font-weight: 600; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
            Order #${data.orderNumber}
          </p>
        </td>
      </tr>
    </table>

    <!-- Escrow notice -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F0FDF4; border-left: 3px solid #16A34A;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #14532D; font-size: 13px; font-weight: 600; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">What happens next?</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">The funds are held in escrow and will be released to your account according to the platform's escrow schedule once the buyer confirms delivery.</p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dashboardUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This is an automated notification from NextPik. If you have questions about this order, please contact our support team.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Funds of ${sym}${fmt(data.amount)} captured for order #${data.orderNumber} — awaiting escrow release.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
}
