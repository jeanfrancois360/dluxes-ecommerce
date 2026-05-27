import { baseEmailTemplate } from './base.template';

export const sellerApprovedTemplate = (data: {
  sellerName: string;
  storeName: string;
  creditsUrl: string;
  dashboardUrl: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Your seller account is approved
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, your application has been approved. <strong style="color: #0A0A0A;">${data.storeName}</strong> is now an active NextPik store.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 24px 4px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Next steps
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 24px 4px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td width="28" valign="top" style="padding-bottom: 18px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #CBB57B; color: #0A0A0A; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">1</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 18px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Purchase selling credits</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Credits activate your product listings. One credit covers one month.</p>
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="padding-bottom: 18px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #CBB57B; color: #0A0A0A; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">2</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 18px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">List your products</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Add products with clear images, descriptions, and pricing.</p>
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="padding-bottom: 24px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #CBB57B; color: #0A0A0A; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">3</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Start receiving orders</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Manage orders, track earnings, and grow your store from the dashboard.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 12px 0;">
      <tr>
        <td align="center" style="background-color: #CBB57B; padding: 16px 28px;">
          <a href="${data.creditsUrl}" style="color: #0A0A0A; text-decoration: none; font-size: 15px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; display: block;">
            Purchase Credits &rarr;
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 32px 0;">
      <tr>
        <td align="center" style="padding: 8px 0;">
          <a href="${data.dashboardUrl}" style="color: #6B7280; text-decoration: underline; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Go to seller dashboard
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Credits are deducted on the 1st of each month. You'll receive a notification when your balance is low.
          </p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 24px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about selling? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your seller application has been approved. ${data.storeName} is now live.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you applied to become a NextPik seller.',
  });
};
