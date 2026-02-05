import { baseEmailTemplate } from './base.template';

export const welcomeTemplate = (name: string, frontendUrl?: string) => {
  const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/support`;

  const content = `
    <div style="text-align: center;">
      <div style="width: 64px; height: 64px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 24px; font-weight: 600; margin-bottom: 16px; text-align: center; letter-spacing: 1px;">
      Welcome to NextPik
    </h2>

    <p style="color: #525252; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, we're glad to have you join us.
    </p>

    <div style="background-color: #FAFAFA; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 18px; font-weight: 600; margin-bottom: 24px; text-align: center;">
        Get Started
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <!-- Step 1 -->
        <tr>
          <td width="50" valign="top" style="padding-bottom: 20px;">
            <div style="width: 40px; height: 40px; background: #000000; color: #FFFFFF; font-weight: 600; font-size: 16px; text-align: center; line-height: 40px;">
              1
            </div>
          </td>
          <td valign="top" style="padding-left: 16px; padding-bottom: 20px;">
            <h4 style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
              Complete Your Profile
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">
              Add your preferences and delivery details.
            </p>
          </td>
        </tr>

        <!-- Step 2 -->
        <tr>
          <td width="50" valign="top" style="padding-bottom: 20px;">
            <div style="width: 40px; height: 40px; background: #000000; color: #FFFFFF; font-weight: 600; font-size: 16px; text-align: center; line-height: 40px;">
              2
            </div>
          </td>
          <td valign="top" style="padding-left: 16px; padding-bottom: 20px;">
            <h4 style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
              Browse Products
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">
              Explore our curated selection of products.
            </p>
          </td>
        </tr>

        <!-- Step 3 -->
        <tr>
          <td width="50" valign="top">
            <div style="width: 40px; height: 40px; background: #000000; color: #FFFFFF; font-weight: 600; font-size: 16px; text-align: center; line-height: 40px;">
              3
            </div>
          </td>
          <td valign="top" style="padding-left: 16px;">
            <h4 style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
              Secure Your Account
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">
              Enable two-factor authentication for extra security.
            </p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${siteUrl}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Start Shopping
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Welcome Offer:</strong>
        Enjoy <span style="color: #CBB57B; font-weight: 600;">15% off</span> your first purchase with code:
        <strong style="color: #000000; letter-spacing: 1px;">WELCOME15</strong>
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need help? <a href="${supportUrl}" style="color: #000000; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    frontendUrl: siteUrl,
    showUnsubscribe: true,
  });
};
