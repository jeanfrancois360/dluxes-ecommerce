import { baseEmailTemplate } from './base.template';

export const emailVerificationTemplate = (
  name: string,
  verificationLink: string,
  frontendUrl?: string
) => {
  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Verify your email address
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${name}, thanks for signing up! Click the button below to verify your email address and activate your account.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 32px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${verificationLink}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Security note:</strong> This link expires in 24 hours. If you didn't create a NextPik account, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If the button above doesn't work, copy and paste this URL into your browser:<br />
      <a href="${verificationLink}" style="color: #4B5563; word-break: break-all; text-decoration: underline;">${verificationLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: 'Verify your email address to activate your NextPik account.',
    frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you created a NextPik account.',
  });
};
