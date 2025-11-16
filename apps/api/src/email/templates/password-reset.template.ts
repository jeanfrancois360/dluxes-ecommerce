import { baseEmailTemplate } from './base.template';

export const passwordResetTemplate = (name: string, resetLink: string) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #B91C1C 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Reset Your Password
    </h2>

    <p style="color: #525252; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${name}, we received a request to reset your password.
      Click the button below to create a new password.
      This link will expire in <strong>1 hour</strong>.
    </p>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${resetLink}"
         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);">
        Reset Password
      </a>
    </div>

    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #78350F; font-size: 14px; line-height: 1.6; margin-bottom: 12px;">
        <strong>⚠️ Important:</strong>
      </p>
      <ul style="color: #92400E; font-size: 14px; line-height: 1.8; margin-left: 20px;">
        <li>Use a strong, unique password</li>
        <li>Don't share your password with anyone</li>
        <li>Enable 2FA for extra security</li>
      </ul>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #CBB57B; padding: 20px; border-radius: 8px; margin-top: 20px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #000000;">Didn't request a password reset?</strong><br/>
        Your account is still secure. You can safely ignore this email.
      </p>
    </div>

    <p style="color: #A3A3A3; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Or copy and paste this link into your browser:<br/>
      <a href="${resetLink}" style="color: #CBB57B; word-break: break-all;">${resetLink}</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
