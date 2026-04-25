import { baseEmailTemplate } from './base.template';

export const passwordResetTemplate = (name: string, resetLink: string, frontendUrl?: string) => {
  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Reset your password
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${name}, we received a request to reset the password for your account. Click the button below to choose a new password. This link expires in <strong style="color: #0A0A0A;">1 hour</strong>.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 32px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${resetLink}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Didn't request this?</strong> Your account is secure. You can safely ignore this email — no changes have been made.
          </p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If the button above doesn't work, copy and paste this URL into your browser:<br />
      <a href="${resetLink}" style="color: #4B5563; word-break: break-all; text-decoration: underline;">${resetLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: 'Reset your NextPik password — link expires in 1 hour.',
    frontendUrl,
    showUnsubscribe: false,
  });
};
