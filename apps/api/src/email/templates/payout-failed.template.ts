import { baseEmailTemplate } from './base.template';

interface PayoutFailedData {
  sellerName: string;
  storeName: string;
  payoutId: string;
  amount: number;
  currency: string;
  commissionsCount: number;
  failureReason: string;
  failedDate: string;
  paymentMethod: string;
  dashboardUrl: string;
  supportUrl: string;
  frontendUrl?: string;
}

export function payoutFailedTemplate(data: PayoutFailedData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';
  const method = data.paymentMethod.replace(/_/g, ' ');
  const shortId = data.payoutId.substring(0, 12);
  const failedAt = `${new Date(data.failedDate).toLocaleDateString()} ${new Date(data.failedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Payout failed
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, we were unable to process the <strong style="color: #0A0A0A;">${sym}${fmt(data.amount)}</strong> payout for <strong style="color: #0A0A0A;">${data.storeName}</strong>. Your funds are safe and have not been lost.
    </p>

    <!-- Failure reason -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #FEF2F2; border-left: 3px solid #DC2626;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Failure reason
          </p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            ${data.failureReason}
          </p>
        </td>
      </tr>
    </table>

    <!-- Details table -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Payout ID</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: 'Courier New', 'Lucida Console', monospace;">${shortId}&hellip;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Amount</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.amount)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Payment method</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; text-transform: capitalize; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${method}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Orders included</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.commissionsCount} order${data.commissionsCount !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0 6px 0; color: #DC2626; font-size: 13px; font-weight: 600; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Failed at</td>
              <td style="padding: 10px 0 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-weight: 600; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${failedAt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Action required -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Action required</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Review your payment details in the dashboard</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Ensure your bank account or payout account is active and verified</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Contact support if you need help resolving this</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTAs -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 12px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${data.dashboardUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; display: block;">
            Update Payment Details &rarr;
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <a href="${data.supportUrl}" style="color: #6B7280; text-decoration: underline; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Contact support
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: `Action required: your ${sym}${fmt(data.amount)} payout for ${data.storeName} failed.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
}
