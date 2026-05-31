import { baseEmailTemplate } from './base.template';

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export const welcomeTemplate = (name: string, frontendUrl?: string) => {
  const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';

  const step = (num: string, title: string, desc: string) => `
    <tr>
      <td width="28" valign="top" style="padding-bottom: 20px;">
        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
          <td width="24" height="24" align="center" valign="middle" style="background-color: #CBB57B; color: #0A0A0A; font-size: 11px; font-weight: 700; font-family: ${FONT};">${num}</td>
        </tr></table>
      </td>
      <td valign="top" style="padding-left: 14px; padding-bottom: 20px;">
        <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 3px 0; font-family: ${FONT};">${title}</p>
        <p style="color: #6B7280; font-size: 13px; line-height: 1.55; margin: 0; font-family: ${FONT};">${desc}</p>
      </td>
    </tr>`;

  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.5px;">
      Welcome to NextPik, ${name}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0; font-family: ${FONT};">
      Your account is ready. Explore thousands of products from independent sellers worldwide — or start your own store and sell to the world.
    </p>

    <!-- Get started steps -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 32px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 22px 22px 8px;">
          <p style="color: #111827; font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; margin: 0 0 20px 0; font-family: ${FONT};">
            Get started in 3 steps
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            ${step('1', 'Complete your profile', 'Add a delivery address and set your shopping preferences.')}
            ${step('2', 'Browse the marketplace', 'Explore curated products from verified sellers across all categories.')}
            ${step('3', 'Secure your account', 'Enable two-factor authentication for added protection.')}
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA (full width) -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${siteUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; display: block;">
            Start Shopping &rarr;
          </a>
        </td>
      </tr>
    </table>

    <!-- Welcome offer -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 8px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 4px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
            <strong style="color: #111827;">Welcome offer:</strong> Use code <strong style="color: #111827; letter-spacing: 0.8px;">WELCOME15</strong> at checkout for 15% off your first order.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: `Welcome to NextPik, ${name}. Your account is ready — start exploring.`,
    frontendUrl: siteUrl,
    showUnsubscribe: true,
    footerNote: 'You received this email because you created a NextPik account.',
  });
};
