import { baseEmailTemplate } from './base.template';

interface PlatformPayoutAlertData {
  payoutId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'failed' | 'canceled';
  failureReason?: string;
  arrivalDate?: number; // Unix timestamp
  method: string;
  stripePayoutUrl: string;
  frontendUrl?: string;
}

export function platformPayoutAlertTemplate(data: PlatformPayoutAlertData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency.toUpperCase() === 'USD' ? '$' : data.currency.toUpperCase() + ' ';
  const shortId = data.payoutId.substring(0, 16);
  const method = data.method.replace(/_/g, ' ');
  const arrivalStr = data.arrivalDate
    ? new Date(data.arrivalDate * 1000).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const isPaid = data.status === 'paid';
  const isFailed = data.status === 'failed';

  const statusColor = isFailed ? '#DC2626' : isPaid ? '#16A34A' : '#D97706';
  const statusLabel = isFailed ? 'Failed' : isPaid ? 'Arrived in bank' : 'Canceled';
  const heading = isFailed
    ? 'Platform payout failed'
    : isPaid
      ? 'Platform payout arrived'
      : 'Platform payout canceled';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      ${heading}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Stripe has reported a platform-level payout event. This is a settlement from the NextPik Stripe balance to the platform bank account.
    </p>

    <!-- Amount banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 24px; border-bottom: 3px solid #CBB57B;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Payout amount
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

    ${
      isFailed && data.failureReason
        ? `<!-- Failure reason -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #FEF2F2; border-left: 3px solid #DC2626;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #DC2626; font-size: 13px; font-weight: 600; margin: 0 0 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Failure reason</p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.failureReason}</p>
        </td>
      </tr>
    </table>`
        : ''
    }

    <!-- Payout details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Stripe Payout ID</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: 'Courier New', 'Lucida Console', monospace;">${shortId}&hellip;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Method</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; text-transform: capitalize; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${method}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Currency</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.currency.toUpperCase()}</td>
            </tr>
            ${
              !isFailed
                ? `<tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Arrival date</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${arrivalStr}</td>
            </tr>`
                : ''
            }
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.stripePayoutUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View in Stripe Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      This is an automated platform alert. No action is required unless the payout failed.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: isFailed
      ? `ACTION REQUIRED: Platform payout of ${sym}${fmt(data.amount)} failed — ${data.failureReason || 'check Stripe dashboard'}`
      : `Platform payout of ${sym}${fmt(data.amount)} ${statusLabel.toLowerCase()}.`,
    showUnsubscribe: false,
    footerNote: 'This alert was sent to NextPik platform administrators.',
  });
}
