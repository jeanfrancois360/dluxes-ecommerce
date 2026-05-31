import { baseEmailTemplate } from './base.template';

export const twoFactorEnabledTemplate = (name: string, frontendUrl?: string) => {
  const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Two-factor authentication enabled
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${name}, two-factor authentication has been successfully enabled on your account.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #10B981; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Your account is now more secure.</strong> You'll need to enter a 6-digit code from your authenticator app each time you sign in.
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Didn't make this change?</strong> If you did not enable 2FA, please contact our support team immediately at <a href="mailto:support@nextpik.com" style="color: #0A0A0A;">support@nextpik.com</a>.
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${siteUrl}/account/security" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Security Settings
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: 'Two-factor authentication has been enabled on your NextPik account.',
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because your account security settings changed.',
  });
};
