import { baseEmailTemplate } from './base.template';

export const sellerSuspendedTemplate = (data: {
  sellerName: string;
  storeName: string;
  suspensionReason: string;
  supportUrl: string;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Your store has been suspended
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, your store <strong style="color: #0A0A0A;">${data.storeName}</strong> has been suspended, effective immediately.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #FEF2F2; border-left: 3px solid #DC2626;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Reason
          </p>
          <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            ${data.suspensionReason}
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            What this means
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 4px 0; color: #4B5563; font-size: 13px; line-height: 1.55; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; All products are now inactive and hidden from buyers</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #4B5563; font-size: 13px; line-height: 1.55; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; New orders are blocked</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #4B5563; font-size: 13px; line-height: 1.55; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Pending orders must still be fulfilled per your seller agreement</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="color: #4B5563; font-size: 14px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      To appeal or resolve this suspension, contact our support team. Once the issue is addressed and reviewed, your account may be reinstated.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.supportUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Contact Support
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      You can still access your <a href="${data.dashboardUrl}" style="color: #4B5563; text-decoration: underline;">seller dashboard</a> in read-only mode.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Important notice: your store ${data.storeName} has been suspended.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
};
