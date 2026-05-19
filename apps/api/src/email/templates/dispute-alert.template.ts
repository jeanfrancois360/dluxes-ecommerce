import { baseEmailTemplate } from './base.template';

interface DisputeAlertData {
  disputeId: string;
  chargeId: string;
  amount: number;
  currency: string;
  reason: string;
  orderNumber: string;
  orderId: string;
  evidenceDueBy?: number | null; // Unix timestamp
  stripeDisputeUrl: string;
  isSeller?: boolean;
  frontendUrl?: string;
}

export function disputeAlertTemplate(data: DisputeAlertData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';
  const shortDispute = data.disputeId.substring(0, 16);
  const reasonLabel = data.reason.replace(/_/g, ' ');

  const evidenceDueStr = data.evidenceDueBy
    ? new Date(data.evidenceDueBy * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const heading = data.isSeller
    ? 'A payment on your order has been disputed'
    : 'ACTION REQUIRED: New payment dispute';

  const intro = data.isSeller
    ? `A customer has filed a payment dispute for order <strong>#${data.orderNumber}</strong>. Your funds for this order have been temporarily held by Stripe pending resolution. Please contact NextPik support if you have evidence to submit.`
    : `Stripe has notified us of a new chargeback on order <strong>#${data.orderNumber}</strong>. Evidence must be submitted before the deadline below.`;

  const orderUrl = `${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/orders/${data.orderId}`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      ${heading}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      ${intro}
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #7F1D1D; padding: 24px; border-bottom: 3px solid #DC2626;">
          <p style="color: #FCA5A5; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Disputed amount
          </p>
          <p style="color: #FFFFFF; font-size: 36px; font-weight: 700; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${sym}${fmt(data.amount)}
          </p>
          <p style="color: #DC2626; font-size: 13px; font-weight: 600; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.5px; text-transform: uppercase;">
            Chargeback filed
          </p>
        </td>
      </tr>
    </table>

    ${
      evidenceDueStr && !data.isSeller
        ? `<!-- Evidence deadline -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #FEF2F2; border-left: 3px solid #DC2626;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #DC2626; font-size: 13px; font-weight: 600; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Evidence deadline</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Submit your evidence by <strong>${evidenceDueStr}</strong> or the dispute will be automatically lost.</p>
        </td>
      </tr>
    </table>`
        : ''
    }

    <!-- Dispute details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">#${data.orderNumber}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Dispute reason</td>
              <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-weight: 600; text-transform: capitalize; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${reasonLabel}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Dispute ID</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: 'Courier New', 'Lucida Console', monospace;">${shortDispute}&hellip;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Currency</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.currency.toUpperCase()}</td>
            </tr>
            ${
              evidenceDueStr
                ? `<tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Evidence due</td>
              <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${evidenceDueStr}</td>
            </tr>`
                : ''
            }
          </table>
        </td>
      </tr>
    </table>

    ${
      !data.isSeller
        ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 12px 0;">
      <tr>
        <td style="background-color: #DC2626; padding: 13px 28px;">
          <a href="${data.stripeDisputeUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Respond in Stripe Dashboard
          </a>
        </td>
      </tr>
    </table>
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order
          </a>
        </td>
      </tr>
    </table>`
        : `<p style="color: #6B7280; font-size: 13px; line-height: 1.6; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If you have evidence that this charge was legitimate (order confirmation, delivery proof, communication with the customer), please contact NextPik support immediately.
    </p>`
    }

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This is an automated alert. ${data.isSeller ? 'Contact support for assistance.' : 'Respond before the evidence deadline to contest this chargeback.'}
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Dispute of ${sym}${fmt(data.amount)} on order #${data.orderNumber} — reason: ${reasonLabel}`,
    showUnsubscribe: false,
    footerNote: data.isSeller
      ? 'This alert was sent because a dispute was filed on one of your orders.'
      : 'This alert was sent to NextPik platform administrators.',
  });
}
