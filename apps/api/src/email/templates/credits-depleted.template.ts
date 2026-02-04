import { baseEmailTemplate } from './base.template';

export const creditsDepletedTemplate = (data: {
  sellerName: string;
  storeName: string;
  graceEndsAt: string;
  creditsUrl: string;
  dashboardUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #DC2626;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #DC2626; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Your Credits Have Been Depleted
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, your selling credits balance has reached zero.
    </p>

    <div style="background-color: #000000; padding: 32px; margin: 32px 0; text-align: center;">
      <p style="color: #DC2626; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Credits Remaining
      </p>
      <p style="color: #FFFFFF; font-size: 56px; font-weight: 700; margin: 0 0 8px 0;">
        0
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0 0 16px 0;">
        Store: ${data.storeName}
      </p>
      <p style="color: #DC2626; font-size: 14px; font-weight: 600; margin: 0;">
        Grace Period Active
      </p>
    </div>

    <div style="background-color: #FAFAFA; border-left: 3px solid #DC2626; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
        Grace Period Ends: ${data.graceEndsAt}
      </p>
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        Your products will be suspended if credits are not purchased before this time.
      </p>
    </div>

    <div style="background-color: #FAFAFA; padding: 20px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Immediate Impact:</p>
      <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li><strong>Grace Period:</strong> You have 3 days to purchase credits</li>
        <li><strong>Products Still Visible:</strong> Your products remain active during grace period</li>
        <li><strong>After Grace Period:</strong> All products will be suspended</li>
      </ul>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5; text-align: center;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
        Restore Full Access
      </p>
      <p style="color: #10B981; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">
        $29.99/month
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0;">
        Instant activation - no downtime
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background-color: #DC2626; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Purchase Credits Now
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}" style="color: #737373; text-decoration: none; font-size: 13px;">
        View Dashboard
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #DC2626; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #DC2626;">Act Now:</strong> Purchase credits before ${data.graceEndsAt} to keep your products active and your store running.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need help? <a href="{{SUPPORT_URL}}" style="color: #000000; text-decoration: underline;">Contact urgent support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
