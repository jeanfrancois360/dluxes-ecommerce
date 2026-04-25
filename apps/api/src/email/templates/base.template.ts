/**
 * Base Email Template — NextPik
 * Black, white, and gold. Clean. Professional.
 * Full dark-mode support via @media + [data-ogsc] (Gmail Android).
 */

// Two-image logo swap: light-mode logo visible by default, dark-mode logo hidden.
// CSS overrides flip the visibility based on color scheme.
const LOGO_HTML = `
  <img src="https://nextpik.com/images/logo.png"      alt="NextPik" width="140" height="40" class="email-logo email-logo-light" style="height: 40px; width: auto; display: block; margin: 0 auto; border: 0;" />
  <img src="https://nextpik.com/images/logo-dark.png" alt="NextPik" width="140" height="40" class="email-logo email-logo-dark"  style="height: 40px; width: auto; display: none;  margin: 0 auto; border: 0;" />
`;

export const baseEmailTemplate = (
  content: string,
  options?: {
    preheader?: string;
    unsubscribeUrl?: string;
    frontendUrl?: string;
    showUnsubscribe?: boolean;
    footerNote?: string;
  }
) => {
  const frontendUrl = options?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const showUnsubscribe = options?.showUnsubscribe !== false;
  const unsubscribeUrl = options?.unsubscribeUrl || `${frontendUrl}/account/notifications`;
  const preheader = options?.preheader || '';
  const footerNote = options?.footerNote || '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>NextPik</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    /* ============================================================
       DARK MODE — @media (covers Apple Mail, Samsung Mail, etc.)
       ============================================================ */
    @media (prefers-color-scheme: dark) {
      /* Outer page background */
      body, .email-outer { background-color: #121212 !important; }

      /* Header: already black — prevent it being inverted to white */
      .email-header { background-color: #0A0A0A !important; border-bottom-color: #CBB57B !important; }

      /* Logo: swap light→dark variant */
      .email-logo { filter: none !important; }
      .email-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
      .email-logo-dark  { display: block !important; max-height: 40px !important; }

      /* Body card */
      .email-body { background-color: #1e1e1e !important; }

      /* Footer */
      .email-footer { background-color: #161616 !important; border-top-color: #2a2a2a !important; }
      .email-footer a { color: #9CA3AF !important; }
      .email-footer-link-primary { color: #FFFFFF !important; }
    }

    /* ============================================================
       DARK MODE — [data-ogsc] covers Gmail Android dark mode
       ============================================================ */
    [data-ogsc] body,
    [data-ogsc] .email-outer { background-color: #121212 !important; }

    [data-ogsc] .email-header { background-color: #0A0A0A !important; border-bottom-color: #CBB57B !important; }

    [data-ogsc] .email-logo { filter: none !important; }
    [data-ogsc] .email-logo-light { display: none !important; max-height: 0 !important; overflow: hidden !important; }
    [data-ogsc] .email-logo-dark  { display: block !important; max-height: 40px !important; }

    [data-ogsc] .email-body { background-color: #1e1e1e !important; }

    [data-ogsc] .email-footer { background-color: #161616 !important; border-top-color: #2a2a2a !important; }
    [data-ogsc] .email-footer a { color: #9CA3AF !important; }
    [data-ogsc] .email-footer-link-primary { color: #FFFFFF !important; }
  </style>
</head>
<body class="email-outer" style="margin: 0; padding: 0; background-color: #F4F4F5; -webkit-font-smoothing: antialiased;">
  ${preheader ? `<!-- Preheader --><div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="email-outer" style="background-color: #F4F4F5; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 580px; width: 100%;">

          <!-- Header -->
          <tr>
            <td class="email-header" style="background-color: #0A0A0A; padding: 28px 40px; border-bottom: 2px solid #CBB57B;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center">
                    ${LOGO_HTML}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body" style="background-color: #FFFFFF; padding: 44px 40px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer" style="background-color: #F9FAFB; padding: 24px 40px; border-top: 1px solid #E5E7EB;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${frontendUrl}" class="email-footer-link-primary" style="color: #0A0A0A; text-decoration: none; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-weight: 500;">nextpik.com</a>
                    <span style="color: #D1D5DB; margin: 0 10px;">|</span>
                    <a href="${frontendUrl}/help" class="email-footer" style="color: #6B7280; text-decoration: none; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Help</a>
                    <span style="color: #D1D5DB; margin: 0 10px;">|</span>
                    <a href="${frontendUrl}/privacy" class="email-footer" style="color: #6B7280; text-decoration: none; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Privacy</a>
                    <span style="color: #D1D5DB; margin: 0 10px;">|</span>
                    <a href="${frontendUrl}/terms" class="email-footer" style="color: #6B7280; text-decoration: none; font-size: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Terms</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #9CA3AF; font-size: 11px; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      &copy; ${new Date().getFullYear()} NextPik. All rights reserved.
                    </p>
                    ${footerNote ? `<p style="color: #9CA3AF; font-size: 11px; margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${footerNote}</p>` : ''}
                    ${showUnsubscribe ? `<p style="margin: 10px 0 0 0;"><a href="${unsubscribeUrl}" style="color: #9CA3AF; text-decoration: underline; font-size: 11px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Unsubscribe</a></p>` : ''}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
