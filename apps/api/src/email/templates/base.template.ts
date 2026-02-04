/**
 * Base Email Template - NextPik
 * Clean, modern design with black, white, and gold accents
 */

export const baseEmailTemplate = (
  content: string,
  options?: {
    unsubscribeUrl?: string;
    frontendUrl?: string;
    showUnsubscribe?: boolean;
  },
) => {
  const frontendUrl = options?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const showUnsubscribe = options?.showUnsubscribe !== false;
  const unsubscribeUrl = options?.unsubscribeUrl || `${frontendUrl}/account/notifications`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextPik</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center; border-bottom: 2px solid #CBB57B;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">NextPik</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #737373; font-size: 12px; margin: 0 0 12px 0;">
                &copy; ${new Date().getFullYear()} NextPik. All rights reserved.
              </p>
              <p style="margin: 0;">
                <a href="${frontendUrl}" style="color: #000000; text-decoration: none; font-size: 12px;">Website</a>
                <span style="color: #d4d4d4; margin: 0 8px;">|</span>
                <a href="${frontendUrl}/support" style="color: #737373; text-decoration: none; font-size: 12px;">Support</a>
                <span style="color: #d4d4d4; margin: 0 8px;">|</span>
                <a href="${frontendUrl}/privacy" style="color: #737373; text-decoration: none; font-size: 12px;">Privacy</a>
              </p>
              ${
                showUnsubscribe
                  ? `<p style="margin: 16px 0 0 0;">
                <a href="${unsubscribeUrl}" style="color: #a3a3a3; text-decoration: underline; font-size: 11px;">Unsubscribe</a>
              </p>`
                  : ''
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
