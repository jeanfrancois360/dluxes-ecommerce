/**
 * Base Email Template - NextPik E-commerce Design
 * Black, Gold, Gray, White aesthetic
 * Production-ready with unsubscribe links and company information
 */

export const baseEmailTemplate = (
  content: string,
  options?: {
    unsubscribeUrl?: string;
    frontendUrl?: string;
    showUnsubscribe?: boolean;
  },
) => {
  const frontendUrl = options?.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const showUnsubscribe = options?.showUnsubscribe !== false; // Default true
  const unsubscribeUrl = options?.unsubscribeUrl || `${frontendUrl}/account/notifications`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NextPik E-commerce</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #FAFAFA;
      padding: 20px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
    }

    .header {
      background: linear-gradient(135deg, #000000 0%, #262626 100%);
      padding: 40px 30px;
      text-align: center;
      border-bottom: 4px solid #CBB57B;
    }

    .logo {
      width: 64px;
      height: 64px;
      background-color: #CBB57B;
      border-radius: 16px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-center;
      font-size: 32px;
      font-weight: bold;
      color: #000000;
    }

    .header-title {
      color: #FFFFFF;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }

    .content {
      padding: 40px 30px;
    }

    .footer {
      background-color: #FAFAFA;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #E5E5E5;
    }

    .footer-text {
      color: #737373;
      font-size: 14px;
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .social-links {
      margin-top: 20px;
    }

    .social-links a {
      display: inline-block;
      margin: 0 8px;
      color: #737373;
      text-decoration: none;
      transition: color 0.3s ease;
    }

    .social-links a:hover {
      color: #CBB57B;
    }

    /* Utility Classes */
    .text-center {
      text-align: center;
    }

    .text-black {
      color: #000000;
    }

    .text-gray {
      color: #737373;
    }

    .text-gold {
      color: #CBB57B;
    }

    .mt-1 {
      margin-top: 8px;
    }

    .mt-2 {
      margin-top: 16px;
    }

    .mt-3 {
      margin-top: 24px;
    }

    .mb-1 {
      margin-bottom: 8px;
    }

    .mb-2 {
      margin-bottom: 16px;
    }

    .mb-3 {
      margin-bottom: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">L</div>
      <h1 class="header-title">Luxury Collection</h1>
    </div>

    <div class="content">
      ${content}
    </div>

    <div class="footer">
      <p class="footer-text">
        &copy; ${new Date().getFullYear()} NextPik. All rights reserved.
      </p>
      <p class="footer-text">
        Premium luxury marketplace, delivered with excellence
      </p>

      <div class="social-links" style="margin-top: 16px; margin-bottom: 20px;">
        <a href="${frontendUrl}" style="color: #CBB57B; text-decoration: none;">Visit Website</a>
        <span style="color: #E5E5E5;">|</span>
        <a href="${frontendUrl}/support" style="color: #737373; text-decoration: none;">Support</a>
        <span style="color: #E5E5E5;">|</span>
        <a href="${frontendUrl}/privacy" style="color: #737373; text-decoration: none;">Privacy Policy</a>
      </div>

      <p class="footer-text" style="font-size: 12px; color: #A3A3A3; margin-top: 20px;">
        NextPik Inc.<br/>
        Premium Luxury E-commerce Platform<br/>
        <a href="mailto:support@nextpik.com" style="color: #CBB57B; text-decoration: none;">support@nextpik.com</a>
      </p>

      ${
        showUnsubscribe
          ? `
      <p class="footer-text" style="font-size: 12px; color: #A3A3A3; margin-top: 16px;">
        Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #CBB57B; text-decoration: underline;">Unsubscribe</a>
      </p>`
          : ''
      }
    </div>
  </div>
</body>
</html>
`;
};
