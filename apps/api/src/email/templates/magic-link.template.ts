import { baseEmailTemplate } from './base.template';

export const magicLinkTemplate = (name: string, magicLink: string, frontendUrl?: string) => {
  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Sign in to NextPik
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${name}, use the button below to sign in. This link expires in <strong style="color: #0A0A0A;">15 minutes</strong> and can only be used once.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 32px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${magicLink}" style="color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; display: block;">
            Sign In to NextPik &rarr;
          </a>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Didn't request this?</strong> You can safely ignore this email. Your account has not been accessed.
          </p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      If the button above doesn't work, copy and paste this URL into your browser:<br />
      <a href="${magicLink}" style="color: #4B5563; word-break: break-all; text-decoration: underline;">${magicLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: 'Your sign-in link for NextPik — expires in 15 minutes.',
    frontendUrl,
    showUnsubscribe: false,
  });
};
