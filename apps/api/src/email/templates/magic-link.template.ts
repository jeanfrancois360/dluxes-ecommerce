import { baseEmailTemplate } from './base.template';

export const magicLinkTemplate = (name: string, magicLink: string, frontendUrl?: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #CBB57B 0%, #D4AF37 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Your Magic Link is Ready
    </h2>

    <p style="color: #525252; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, click the button below to securely sign in to your account.
      This link will expire in <strong>15 minutes</strong>.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${magicLink}"
         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15); transition: all 0.3s ease;">
        Sign In Securely
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #CBB57B; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
        <strong style="color: #000000;">🔒 Security Note:</strong>
      </p>
      <p style="color: #737373; font-size: 14px; line-height: 1.6;">
        If you didn't request this magic link, you can safely ignore this email.
        Your account remains secure.
      </p>
    </div>

    <p style="color: #A3A3A3; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Or copy and paste this link into your browser:<br/>
      <a href="${magicLink}" style="color: #CBB57B; word-break: break-all;">${magicLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    frontendUrl,
    showUnsubscribe: false // Don't show unsubscribe for security emails
  });
};
