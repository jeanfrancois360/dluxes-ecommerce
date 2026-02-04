import { EmailOTPType } from '@prisma/client';

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
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const typeLabels = {
    TWO_FACTOR_BACKUP: {
      title: 'Two-Factor Authentication Code',
      description: 'Use this code to complete your login',
    },
    ACCOUNT_RECOVERY: {
      title: 'Account Recovery Code',
      description: 'Use this code to recover your account',
    },
    SENSITIVE_ACTION: {
      title: 'Verification Code',
      description: 'Use this code to verify your identity',
    },
  };

  const { title, description } = typeLabels[data.type];

  const subject = `${title} - NextPik`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #FFFFFF;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border: 1px solid #E5E5E5;
    }
    .header {
      background-color: #000000;
      padding: 32px 20px;
      text-align: center;
      border-bottom: 2px solid #CBB57B;
    }
    .logo {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .content {
      padding: 40px 30px;
    }
    .title {
      font-size: 22px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 10px;
      text-align: center;
    }
    .description {
      font-size: 15px;
      color: #525252;
      margin-bottom: 30px;
      text-align: center;
      line-height: 1.5;
    }
    .otp-container {
      background-color: #FAFAFA;
      border: 1px solid #E5E5E5;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 40px;
      font-weight: 700;
      color: #000000;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
    }
    .otp-label {
      font-size: 12px;
      color: #737373;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .expiry-notice {
      background-color: #FAFAFA;
      border-left: 3px solid #CBB57B;
      padding: 15px;
      margin: 20px 0;
    }
    .expiry-notice p {
      margin: 0;
      color: #525252;
      font-size: 14px;
    }
    .security-info {
      background-color: #FAFAFA;
      padding: 20px;
      margin-top: 30px;
      border: 1px solid #E5E5E5;
    }
    .security-info h3 {
      font-size: 14px;
      color: #000000;
      margin: 0 0 15px 0;
      font-weight: 600;
    }
    .security-item {
      margin-bottom: 8px;
      font-size: 13px;
      color: #525252;
      line-height: 1.5;
    }
    .metadata {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #E5E5E5;
      font-size: 12px;
      color: #737373;
    }
    .warning {
      background-color: #FEF2F2;
      border-left: 3px solid #EF4444;
      padding: 15px;
      margin: 20px 0;
    }
    .warning p {
      margin: 0;
      color: #991B1B;
      font-size: 13px;
    }
    .footer {
      background-color: #FAFAFA;
      padding: 24px 30px;
      text-align: center;
      font-size: 13px;
      color: #737373;
      border-top: 1px solid #E5E5E5;
    }
    .footer-links {
      margin-top: 12px;
    }
    .footer-link {
      color: #000000;
      text-decoration: none;
      margin: 0 10px;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">NextPik</div>
    </div>

    <div class="content">
      <h1 class="title">${title}</h1>
      <p class="description">
        Hello ${data.firstName},<br><br>
        ${description}
      </p>

      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${data.code}</div>
      </div>

      <div class="expiry-notice">
        <p>
          <strong>This code expires in ${data.expiresInMinutes} minutes.</strong>
          Please enter it promptly to complete your verification.
        </p>
      </div>

      <div class="warning">
        <p>
          <strong>Security Alert:</strong> If you didn't request this code, someone may be trying to access your account.
          Please secure your account immediately by changing your password.
        </p>
      </div>

      <div class="security-info">
        <h3>Security Tips</h3>
        <div class="security-item">• Never share this code with anyone, including NextPik staff</div>
        <div class="security-item">• NextPik will never call or email asking for this code</div>
        <div class="security-item">• Only enter this code on the official NextPik website</div>
        <div class="security-item">• This code can only be used once and expires automatically</div>
      </div>

      <div class="metadata">
        <p>Request Time: ${data.timestamp.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'UTC'
        })} UTC</p>
        ${data.ipAddress ? `<p>IP Address: ${data.ipAddress}</p>` : ''}
      </div>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} NextPik. All rights reserved.</p>
      <div class="footer-links">
        <a href="${siteUrl}/help" class="footer-link">Help</a>
        <a href="${siteUrl}/security" class="footer-link">Security</a>
        <a href="${siteUrl}/contact" class="footer-link">Contact</a>
      </div>
      <p style="margin-top: 16px; font-size: 11px; color: #A3A3A3;">
        This is an automated security message. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
