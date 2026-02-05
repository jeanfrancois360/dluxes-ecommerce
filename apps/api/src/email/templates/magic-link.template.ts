import { baseEmailTemplate } from './base.template';

export const magicLinkTemplate = (name: string, magicLink: string, frontendUrl?: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Sign In to NextPik
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, click the button below to securely sign in.
      This link expires in <strong>15 minutes</strong>.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${magicLink}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Sign In
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Security Note:</strong>
        If you didn't request this link, you can safely ignore this email.
      </p>
    </div>

    <p style="color: #A3A3A3; font-size: 12px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Or copy this link:<br/>
      <a href="${magicLink}" style="color: #000000; word-break: break-all; text-decoration: underline;">${magicLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    frontendUrl,
    showUnsubscribe: false
  });
};
