import { baseEmailTemplate } from './base.template';

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

/**
 * Email campaign template — wraps admin-authored HTML body in the branded shell.
 */
export const campaignEmailTemplate = (
  subject: string,
  body: string,
  previewText?: string,
  frontendUrl?: string
): string => {
  const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const content = `
    <h1 style="color: #111827; font-size: 22px; font-weight: 700; margin: 0 0 20px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      ${subject}
    </h1>

    <!-- Divider -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="border-top: 2px solid #CBB57B; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>
    </table>

    <!-- Admin-authored body -->
    <div style="color: #374151; font-size: 15px; line-height: 1.7; font-family: ${FONT};">
      ${body}
    </div>

    <!-- Spacer -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 36px 0 0 0;">
      <tr>
        <td style="border-top: 1px solid #E5E7EB; font-size: 0; line-height: 0;">&nbsp;</td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 28px 0 0 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${siteUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; display: block;">
            Visit NextPik &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: previewText || subject,
    frontendUrl: siteUrl,
    showUnsubscribe: true,
    footerNote: 'You received this email because you are a registered NextPik user.',
  });
};
