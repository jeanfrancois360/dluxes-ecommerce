import { baseEmailTemplate } from './base.template';

export const sellerApplicationSubmittedTemplate = (data: {
  sellerName: string;
  storeName: string;
  submittedAt: Date;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;

  const submittedDate = data.submittedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Application received
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, we've received your application to sell on NextPik. Our team will review it and respond within 2&ndash;3 business days.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 18px 20px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Store name</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.storeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Submitted</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${submittedDate}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Status</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Under review</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color: #4B5563; font-size: 14px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      You'll receive an email as soon as a decision is made. In the meantime, you can monitor the status from your dashboard.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dashboardUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Dashboard
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about your application? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `We received your seller application for ${data.storeName}.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you applied to become a NextPik seller.',
  });
};
