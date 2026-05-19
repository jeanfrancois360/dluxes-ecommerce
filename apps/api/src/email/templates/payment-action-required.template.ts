import { baseEmailTemplate } from './base.template';

interface PaymentActionRequiredData {
  orderNumber: string;
  amount: number;
  currency: string;
  actionUrl: string;
  frontendUrl?: string;
}

export function paymentActionRequiredTemplate(data: PaymentActionRequiredData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Action required to complete your payment
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Your payment of <strong style="color: #0A0A0A;">${sym}${fmt(data.amount)}</strong> for order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> requires additional verification. Please complete the 3D Secure authentication to confirm your purchase.
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 24px; border-bottom: 3px solid #D97706;">
          <p style="color: #D97706; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Verification required
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

    <!-- Info box -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #FFFBEB; border-left: 3px solid #D97706;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #92400E; font-size: 13px; font-weight: 600; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Why is this needed?</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your bank requires 3D Secure (3DS) verification to authorise this transaction. This is an extra security step to protect your payment. Click the button below to complete verification — this link will expire shortly.</p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #D97706; padding: 13px 28px;">
          <a href="${data.actionUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Complete Payment
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This link expires soon. If it has expired, please return to your order and retry payment. If you did not initiate this transaction, please contact our support team immediately.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `ACTION REQUIRED: Complete 3D Secure verification for your ${sym}${fmt(data.amount)} payment on order #${data.orderNumber}.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
