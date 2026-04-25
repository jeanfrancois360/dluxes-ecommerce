import { baseEmailTemplate } from './base.template';

interface PayoutScheduledData {
  sellerName: string;
  storeName: string;
  payoutId: string;
  amount: number;
  currency: string;
  commissionsCount: number;
  periodStart: string;
  periodEnd: string;
  scheduledDate: string;
  estimatedArrival: string;
  paymentMethod: string;
  dashboardUrl: string;
  frontendUrl?: string;
}

export function payoutScheduledTemplate(data: PayoutScheduledData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';
  const method = data.paymentMethod.replace(/_/g, ' ');
  const shortId = data.payoutId.substring(0, 12);

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Payout scheduled
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, a payout for <strong style="color: #0A0A0A;">${data.storeName}</strong> has been scheduled.
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 28px 24px;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Payout amount
          </p>
          <p style="color: #FFFFFF; font-size: 40px; font-weight: 700; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${sym}${fmt(data.amount)}
          </p>
          <p style="color: #9CA3AF; font-size: 13px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            ${data.currency}
          </p>
        </td>
      </tr>
    </table>

    <!-- Details table -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Payout ID</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: 'Courier New', 'Lucida Console', monospace;">${shortId}&hellip;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Payment method</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; text-transform: capitalize; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${method}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Orders included</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.commissionsCount} order${data.commissionsCount !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Period</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${new Date(data.periodStart).toLocaleDateString()} &ndash; ${new Date(data.periodEnd).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 6px 0; color: #0A0A0A; font-size: 13px; font-weight: 600; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Scheduled date</td>
              <td style="padding: 10px 0 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${new Date(data.scheduledDate).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Estimated arrival</td>
              <td style="padding: 6px 0; text-align: right; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${new Date(data.estimatedArrival).toLocaleDateString()}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color: #4B5563; font-size: 14px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Funds are typically credited to your ${method} account within 1&ndash;3 business days. You'll receive a confirmation email once the transfer is complete.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dashboardUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Payout Details
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about this payout? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${sym}${fmt(data.amount)} payout scheduled for ${data.storeName}.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
}
