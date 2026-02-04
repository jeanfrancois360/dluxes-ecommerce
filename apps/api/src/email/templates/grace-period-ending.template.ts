import { baseEmailTemplate } from './base.template';

export const gracePeriodEndingTemplate = (data: {
  sellerName: string;
  storeName: string;
  hoursRemaining: number;
  graceEndsAt: string;
  productsCount: number;
  creditsUrl: string;
  dashboardUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #DC2626; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #DC2626; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Final Warning: Grace Period Ending Soon
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      ${data.sellerName}, your store will be suspended in less than 24 hours.
    </p>

    <div style="background-color: #000000; padding: 32px; margin: 32px 0; text-align: center;">
      <p style="color: #DC2626; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Time Remaining
      </p>
      <p style="color: #FFFFFF; font-size: 56px; font-weight: 700; margin: 0 0 8px 0;">
        ${data.hoursRemaining}
      </p>
      <p style="color: #A3A3A3; font-size: 14px; margin: 0 0 16px 0;">
        hours until suspension
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0;">
        Store: ${data.storeName} | ${data.productsCount} product${data.productsCount !== 1 ? 's' : ''}
      </p>
    </div>

    <div style="background-color: #FAFAFA; border-left: 3px solid #DC2626; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">
        What happens at ${data.graceEndsAt}:
      </p>
      <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>All ${data.productsCount} product${data.productsCount !== 1 ? 's' : ''} will be suspended</li>
        <li>You will stop receiving orders</li>
        <li>Store ranking may be affected</li>
        <li>Customer trust may be impacted</li>
      </ul>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5; text-align: center;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
        Instant Reactivation Available
      </p>
      <p style="color: #10B981; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">
        $29.99/month
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0;">
        No downtime, no lost sales
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background-color: #CBB57B; color: #000000; padding: 16px 48px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Save My Store Now
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}" style="color: #737373; text-decoration: none; font-size: 13px;">
        View Dashboard
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #DC2626; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #DC2626;">Final Warning:</strong> This is your last notification before automatic suspension. After ${data.graceEndsAt}, your store will be inactive until credits are purchased.
      </p>
    </div>

    <div style="background-color: #FAFAFA; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 16px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Need Help?</strong> If you're experiencing difficulties or have questions about your account, please contact our support team.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Urgent assistance? <a href="{{SUPPORT_URL}}" style="color: #DC2626; text-decoration: underline; font-weight: 500;">Contact emergency support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
