import { baseEmailTemplate } from './base.template';

export const creditsAdjustedTemplate = (data: {
  sellerName: string;
  storeName: string;
  amount: number;
  type: string;
  reason: string;
  balanceBefore: number;
  balanceAfter: number;
  creditsUrl: string;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;
  const isAddition = data.amount > 0;
  const absAmount = Math.abs(data.amount);
  const accentColor = isAddition ? '#10B981' : '#EF4444';
  const actionLabel = isAddition ? 'added to' : 'deducted from';
  const typeLabel = data.type.charAt(0) + data.type.slice(1).toLowerCase();

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Subscription credits ${actionLabel} your account
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, a NextPik admin has ${actionLabel} <strong style="color: #0A0A0A;">${absAmount} month${absAmount !== 1 ? 's' : ''}</strong> of selling credits ${isAddition ? 'to' : 'from'} your store <strong style="color: #0A0A0A;">${data.storeName}</strong>.
    </p>

    <!-- Balance banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 28px 24px; border-bottom: 3px solid ${accentColor};">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td align="center" width="33%" style="padding: 0 8px;">
                <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  Before
                </p>
                <p style="color: #9CA3AF; font-size: 28px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  ${data.balanceBefore}
                </p>
              </td>
              <td align="center" width="33%" style="padding: 0 8px;">
                <p style="color: ${accentColor}; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  ${isAddition ? 'Added' : 'Deducted'}
                </p>
                <p style="color: ${accentColor}; font-size: 28px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  ${isAddition ? '+' : '-'}${absAmount}
                </p>
              </td>
              <td align="center" width="33%" style="padding: 0 8px;">
                <p style="color: #FFFFFF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  New balance
                </p>
                <p style="color: #FFFFFF; font-size: 28px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                  ${data.balanceAfter}
                </p>
              </td>
            </tr>
          </table>
          <p style="color: #9CA3AF; font-size: 13px; margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            month${data.balanceAfter !== 1 ? 's' : ''} remaining
          </p>
        </td>
      </tr>
    </table>

    <!-- Details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid ${accentColor}; padding: 14px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Adjustment details</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong style="color: #0A0A0A;">Type:</strong> ${typeLabel}</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong style="color: #0A0A0A;">Reason:</strong> ${data.reason}</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 14px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.creditsUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Credits
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px 0;">
      <a href="${data.dashboardUrl}" style="color: #6B7280; text-decoration: underline; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        View Dashboard
      </a>
    </p>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about this adjustment? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${absAmount} month${absAmount !== 1 ? 's' : ''} of credits ${actionLabel} ${data.storeName}. New balance: ${data.balanceAfter}.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
};
