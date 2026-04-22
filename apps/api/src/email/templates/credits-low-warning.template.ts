import { baseEmailTemplate } from './base.template';

export const creditsLowWarningTemplate = (data: {
  sellerName: string;
  storeName: string;
  currentBalance: number;
  daysUntilDepletion: number;
  creditsUrl: string;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Credits running low
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, your selling credits for <strong style="color: #0A0A0A;">${data.storeName}</strong> are running low. Top up to keep your products active.
    </p>

    <!-- Balance banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 28px 24px; border-bottom: 3px solid #F59E0B;">
          <p style="color: #F59E0B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Credit balance
          </p>
          <p style="color: #FFFFFF; font-size: 48px; font-weight: 700; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${data.currentBalance}
          </p>
          <p style="color: #9CA3AF; font-size: 13px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            month${data.currentBalance !== 1 ? 's' : ''} remaining
          </p>
        </td>
      </tr>
    </table>

    <!-- What this means -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #F59E0B; padding: 14px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">What this means</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Approximately <strong style="color: #0A0A0A;">${data.daysUntilDepletion} days</strong> of credits remaining</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Credits are deducted on the <strong style="color: #0A0A0A;">1st of each month</strong></td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; If balance reaches zero, products enter a 3-day grace period before suspension</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 14px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.creditsUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Purchase Credits
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
      Questions about billing? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${data.currentBalance} month${data.currentBalance !== 1 ? 's' : ''} of credits remaining for ${data.storeName}. Top up to avoid interruption.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
};
