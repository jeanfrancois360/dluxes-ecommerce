import { baseEmailTemplate } from './base.template';

export const welcomeTemplate = (name: string, frontendUrl?: string) => {
  const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Welcome to NextPik, ${name}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Your account is ready. Browse thousands of products from independent sellers across the world, or start selling yourself.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 32px 0; border: 1px solid #E5E7EB;">
      <tr>
        <td style="background-color: #F9FAFB; padding: 24px 24px 8px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Get started
          </p>
        </td>
      </tr>
      <tr>
        <td style="background-color: #F9FAFB; padding: 0 24px 8px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td width="28" valign="top" style="padding-bottom: 20px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #0A0A0A; color: #FFFFFF; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">1</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 20px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Complete your profile</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Add a delivery address and your preferences.</p>
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="padding-bottom: 20px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #0A0A0A; color: #FFFFFF; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">2</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 20px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Browse products</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Explore our curated selection from verified sellers.</p>
              </td>
            </tr>
            <tr>
              <td width="28" valign="top" style="padding-bottom: 24px;">
                <table cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td width="20" height="20" align="center" valign="middle" style="background-color: #0A0A0A; color: #FFFFFF; font-size: 11px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">3</td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="padding-left: 12px; padding-bottom: 24px;">
                <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Secure your account</p>
                <p style="color: #6B7280; font-size: 13px; line-height: 1.5; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Enable two-factor authentication for added protection.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 32px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${siteUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Start Shopping
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Welcome offer:</strong> Use code <strong style="color: #0A0A0A; letter-spacing: 0.5px;">WELCOME15</strong> at checkout for 15% off your first order.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: `Welcome to NextPik, ${name}. Your account is ready.`,
    frontendUrl: siteUrl,
    showUnsubscribe: true,
    footerNote: 'You received this email because you created a NextPik account.',
  });
};
