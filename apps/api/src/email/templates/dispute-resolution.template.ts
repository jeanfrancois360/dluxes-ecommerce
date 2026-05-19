import { baseEmailTemplate } from './base.template';

interface DisputeResolutionData {
  disputeId: string;
  amount: number;
  currency: string;
  isWon: boolean;
  orderNumber: string;
  orderId: string;
  stripeDisputeUrl: string;
  isSeller?: boolean;
  frontendUrl?: string;
}

export function disputeResolutionTemplate(data: DisputeResolutionData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';
  const shortDispute = data.disputeId.substring(0, 16);

  const statusColor = data.isWon ? '#16A34A' : '#DC2626';
  const statusLabel = data.isWon ? 'Dispute won' : 'Dispute lost';
  const heading = data.isWon ? 'Payment dispute resolved in your favor' : 'Payment dispute lost';

  const intro = data.isSeller
    ? data.isWon
      ? `The payment dispute for order <strong>#${data.orderNumber}</strong> has been resolved in NextPik's favor. Your funds will be released as scheduled.`
      : `The payment dispute for order <strong>#${data.orderNumber}</strong> was lost. The disputed amount has been returned to the customer by Stripe. Your payout for this order may be affected.`
    : data.isWon
      ? `The chargeback on order <strong>#${data.orderNumber}</strong> was decided in NextPik's favor. The disputed funds have been returned to the platform balance.`
      : `The chargeback on order <strong>#${data.orderNumber}</strong> was lost. Stripe has returned ${sym}${fmt(data.amount)} to the customer. Review this order in the admin panel.`;

  const orderUrl = `${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders/${data.orderId}`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      ${heading}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${intro}
    </p>

    <!-- Status banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 24px; border-bottom: 3px solid ${statusColor};">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Disputed amount
          </p>
          <p style="color: #FFFFFF; font-size: 36px; font-weight: 700; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${sym}${fmt(data.amount)}
          </p>
          <p style="color: ${statusColor}; font-size: 13px; font-weight: 600; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
            ${statusLabel}
          </p>
        </td>
      </tr>
    </table>

    <!-- Resolution details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">#${data.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Outcome</td>
              <td style="padding: 6px 0; text-align: right; color: ${statusColor}; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${statusLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Dispute ID</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: 'Courier New', 'Lucida Console', monospace;">${shortDispute}&hellip;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Currency</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.currency.toUpperCase()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      !data.isSeller
        ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 12px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.stripeDisputeUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View in Stripe Dashboard
          </a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #374151; padding: 13px 28px;">
          <a href="${orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order
          </a>
        </td>
      </tr>
    </table>`
        : ''
    }

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This is an automated notification. No further action is required${data.isWon ? '.' : ' unless you wish to appeal.'}
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: data.isWon
      ? `Dispute won — ${sym}${fmt(data.amount)} returned to platform balance for order #${data.orderNumber}`
      : `Dispute lost — ${sym}${fmt(data.amount)} returned to customer for order #${data.orderNumber}`,
    showUnsubscribe: false,
    footerNote: data.isSeller
      ? 'This notification was sent because a dispute on your order has been resolved.'
      : 'This alert was sent to NextPik platform administrators.',
  });
}
