import { baseEmailTemplate } from './base.template';

export const passwordResetTemplate = (name: string, resetLink: string, frontendUrl?: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Reset Your Password
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, we received a request to reset your password.
      This link expires in <strong>1 hour</strong>.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${resetLink}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Reset Password
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0;">
        <strong style="color: #000000;">Password Tips:</strong>
      </p>
      <p style="color: #737373; font-size: 13px; line-height: 1.6; margin: 0;">
        Use a strong, unique password and enable 2FA for extra security.
      </p>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 16px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Didn't request this?</strong>
        Your account is secure. You can ignore this email.
      </p>
    </div>

    <p style="color: #A3A3A3; font-size: 12px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Or copy this link:<br/>
      <a href="${resetLink}" style="color: #000000; word-break: break-all; text-decoration: underline;">${resetLink}</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    frontendUrl,
    showUnsubscribe: false
  });
};
