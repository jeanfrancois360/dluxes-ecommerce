import { baseEmailTemplate } from './base.template';

interface PaymentCancelledData {
  orderNumber: string;
  amount: number;
  currency: string;
  ordersUrl: string;
  frontendUrl?: string;
}

export function paymentCancelledTemplate(data: PaymentCancelledData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Payment cancelled
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Your payment of <strong style="color: #0A0A0A;">${sym}${fmt(data.amount)}</strong> for order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> has been cancelled. No charge was made to your account.
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 24px; border-bottom: 3px solid #D97706;">
          <p style="color: #D97706; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Payment cancelled
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

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.ordersUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Orders
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If you did not cancel this payment or have any questions, please contact our support team.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your payment of ${sym}${fmt(data.amount)} for order #${data.orderNumber} has been cancelled.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
