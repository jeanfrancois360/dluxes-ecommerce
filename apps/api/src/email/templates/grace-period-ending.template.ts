import { baseEmailTemplate } from './base.template';

export const gracePeriodEndingTemplate = (data: {
  sellerName: string;
  storeName: string;
  hoursRemaining: number;
  graceEndsAt: string;
  productsCount: number;
  creditsUrl: string;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Grace period ending soon
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, the grace period for <strong style="color: #0A0A0A;">${data.storeName}</strong> ends in <strong style="color: #0A0A0A;">${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}</strong>. Purchase credits to keep your products active.
    </p>

    <!-- Timer banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 28px 24px; border-bottom: 3px solid #DC2626;">
          <p style="color: #DC2626; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Time remaining
          </p>
          <p style="color: #FFFFFF; font-size: 48px; font-weight: 700; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${data.hoursRemaining}h
          </p>
          <p style="color: #9CA3AF; font-size: 13px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Suspension at ${data.graceEndsAt}
          </p>
        </td>
      </tr>
    </table>

    <!-- What happens at suspension -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #FEF2F2; border-left: 3px solid #DC2626;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            What happens at ${data.graceEndsAt}
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr><td style="padding: 3px 0; color: #374151; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; All ${data.productsCount} product${data.productsCount !== 1 ? 's' : ''} will be suspended</td></tr>
            <tr><td style="padding: 3px 0; color: #374151; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; New orders will not be accepted</td></tr>
            <tr><td style="padding: 3px 0; color: #374151; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Products reactivate immediately once credits are purchased</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Store</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.storeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Products at risk</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.productsCount} listing${data.productsCount !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #DC2626; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Suspends at</td>
              <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.graceEndsAt}</td>
            </tr>
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
      Questions? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Grace period for ${data.storeName} ends in ${data.hoursRemaining} hour${data.hoursRemaining !== 1 ? 's' : ''}. Purchase credits to prevent suspension.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
};
