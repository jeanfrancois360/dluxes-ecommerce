import { EmailOTPType } from '@prisma/client';

interface EmailOTPData {
  firstName: string;
  code: string;
  expiresInMinutes: number;
  type: EmailOTPType;
  ipAddress?: string;
  timestamp: Date;
}

export function getEmailOTPTemplate(data: EmailOTPData): { subject: string; html: string } {
  const typeLabels = {
    TWO_FACTOR_BACKUP: {
      title: 'Two-Factor Authentication Code',
      description: 'Use this code to complete your login',
      icon: '🔐',
    },
    ACCOUNT_RECOVERY: {
      title: 'Account Recovery Code',
      description: 'Use this code to recover your account',
      icon: '🔑',
    },
    SENSITIVE_ACTION: {
      title: 'Verification Code',
      description: 'Use this code to verify your identity',
      icon: '✅',
    },
  };

  const { title, description, icon } = typeLabels[data.type];

  const subject = `${icon} ${title} - NextPik`;

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
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .logo {
      color: #D4AF37;
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .content {
      padding: 40px 30px;
    }
    .icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 10px;
      text-align: center;
    }
    .description {
      font-size: 16px;
      color: #666666;
      margin-bottom: 30px;
      text-align: center;
      line-height: 1.5;
    }
    .otp-container {
      background-color: #f8f8f8;
      border: 2px dashed #D4AF37;
      border-radius: 12px;
      padding: 30px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 48px;
      font-weight: bold;
      color: #000000;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
      margin: 10px 0;
    }
    .otp-label {
      font-size: 14px;
      color: #666666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .expiry-notice {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .expiry-notice p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
    .security-info {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin-top: 30px;
    }
    .security-info h3 {
      font-size: 16px;
      color: #000000;
      margin: 0 0 15px 0;
    }
    .security-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 10px;
      font-size: 14px;
      color: #666666;
    }
    .security-item-icon {
      margin-right: 10px;
      color: #D4AF37;
    }
    .metadata {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      font-size: 12px;
      color: #999999;
    }
    .metadata-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .footer {
      background-color: #f8f8f8;
      padding: 30px;
      text-align: center;
      font-size: 14px;
      color: #666666;
    }
    .footer-links {
      margin-top: 15px;
    }
    .footer-link {
      color: #D4AF37;
      text-decoration: none;
      margin: 0 10px;
    }
    .warning {
      background-color: #fee;
      border-left: 4px solid #dc3545;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .warning p {
      margin: 0;
      color: #721c24;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">NEXTPIK</div>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="icon">${icon}</div>
      <h1 class="title">${title}</h1>
      <p class="description">
        Hello ${data.firstName},<br><br>
        ${description}
      </p>

      <!-- OTP Code -->
      <div class="otp-container">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${data.code}</div>
      </div>

      <!-- Expiry Notice -->
      <div class="expiry-notice">
        <p>
          ⏱️ <strong>This code expires in ${data.expiresInMinutes} minutes.</strong>
          Please enter it promptly to complete your verification.
        </p>
      </div>

      <!-- Warning -->
      <div class="warning">
        <p>
          <strong>⚠️ Security Alert:</strong> If you didn't request this code, someone may be trying to access your account.
          Please secure your account immediately by changing your password.
        </p>
      </div>

      <!-- Security Info -->
      <div class="security-info">
        <h3>🔒 Security Tips</h3>
        <div class="security-item">
          <span class="security-item-icon">•</span>
          <span>Never share this code with anyone, including NextPik staff</span>
        </div>
        <div class="security-item">
          <span class="security-item-icon">•</span>
          <span>NextPik will never call or email asking for this code</span>
        </div>
        <div class="security-item">
          <span class="security-item-icon">•</span>
          <span>Only enter this code on the official NextPik website or app</span>
        </div>
        <div class="security-item">
          <span class="security-item-icon">•</span>
          <span>This code can only be used once and expires automatically</span>
        </div>
      </div>

      <!-- Metadata -->
      <div class="metadata">
        <div class="metadata-row">
          <span>Request Time:</span>
          <span>${data.timestamp.toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'UTC'
          })} UTC</span>
        </div>
        ${data.ipAddress ? `
        <div class="metadata-row">
          <span>IP Address:</span>
          <span>${data.ipAddress}</span>
        </div>
        ` : ''}
        <div class="metadata-row">
          <span>Reference:</span>
          <span>NextPik Security</span>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} NextPik. All rights reserved.</p>
      <p>Luxury E-Commerce Platform</p>
      <div class="footer-links">
        <a href="https://nextpik.com/help" class="footer-link">Help Center</a>
        <a href="https://nextpik.com/security" class="footer-link">Security</a>
        <a href="https://nextpik.com/contact" class="footer-link">Contact Us</a>
      </div>
      <p style="margin-top: 20px; font-size: 12px;">
        This is an automated security message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;

  return { subject, html };
}
