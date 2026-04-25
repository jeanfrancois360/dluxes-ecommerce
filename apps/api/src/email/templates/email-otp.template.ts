import { EmailOTPType } from '@prisma/client';
import { baseEmailTemplate } from './base.template';

interface EmailOTPData {
  firstName: string;
  code: string;
  expiresInMinutes: number;
  type: EmailOTPType;
  ipAddress?: string;
  timestamp: Date;
  frontendUrl?: string;
}

export function getEmailOTPTemplate(data: EmailOTPData): { subject: string; html: string } {
  const typeConfig = {
    TWO_FACTOR_BACKUP: {
      subject: 'Your two-factor authentication code',
      title: 'Two-factor authentication',
      description: 'Enter this code to complete your sign-in.',
    },
    ACCOUNT_RECOVERY: {
      subject: 'Your account recovery code',
      title: 'Account recovery',
      description: 'Enter this code to recover your account.',
    },
    SENSITIVE_ACTION: {
      subject: 'Your verification code',
      title: 'Verify your identity',
      description: 'Enter this code to confirm the action.',
    },
  };

  const { subject, title, description } = typeConfig[data.type];

  const requestTime = data.timestamp.toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      ${title}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.firstName}, ${description}
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 28px 24px;">
          <p style="color: #6B7280; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Verification Code
          </p>
          <p style="color: #0A0A0A; font-size: 38px; font-weight: 700; letter-spacing: 10px; margin: 0; font-family: 'Courier New', 'Lucida Console', monospace;">
            ${data.code}
          </p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Expires in ${data.expiresInMinutes} minutes
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Never share this code with anyone. NextPik staff will never ask for it.
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
      <tr>
        <td style="background-color: #FEF2F2; border-left: 3px solid #DC2626; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #DC2626;">Didn't request this?</strong> Someone may be attempting to access your account. Change your password immediately.
          </p>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 24px 0 0 0; border-top: 1px solid #E5E7EB; padding-top: 20px;">
      <tr>
        <td>
          <p style="color: #9CA3AF; font-size: 12px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Request time: ${requestTime} UTC${data.ipAddress ? `<br />IP address: ${data.ipAddress}` : ''}
          </p>
        </td>
      </tr>
    </table>
  `;

  const html = baseEmailTemplate(content, {
    preheader: `Your ${title.toLowerCase()} code: ${data.code} — expires in ${data.expiresInMinutes} minutes.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
  });

  return { subject: `${subject} — NextPik`, html };
}
