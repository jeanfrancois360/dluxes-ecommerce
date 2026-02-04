import { baseEmailTemplate } from './base.template';

export const creditsLowWarningTemplate = (data: {
  sellerName: string;
  storeName: string;
  currentBalance: number;
  daysUntilDepletion: number;
  creditsUrl: string;
  dashboardUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #F59E0B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Your Selling Credits Are Running Low
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, this is a reminder to top up your credits.
    </p>

    <div style="background-color: #000000; padding: 32px; margin: 32px 0; text-align: center;">
      <p style="color: #F59E0B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        Current Balance
      </p>
      <p style="color: #FFFFFF; font-size: 48px; font-weight: 700; margin: 0 0 8px 0;">
        ${data.currentBalance}
      </p>
      <p style="color: #A3A3A3; font-size: 14px; margin: 0 0 16px 0;">
        month${data.currentBalance !== 1 ? 's' : ''} remaining
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0;">
        Store: ${data.storeName}
      </p>
    </div>

    <div style="background-color: #FAFAFA; padding: 20px; margin: 32px 0; border-left: 3px solid #F59E0B;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">What this means:</p>
      <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>You have approximately <strong>${data.daysUntilDepletion} days</strong> of credits left</li>
        <li>Credits are deducted on the <strong>1st of each month</strong></li>
        <li>If credits reach zero, your products will be suspended after a 3-day grace period</li>
      </ul>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5; text-align: center;">
      <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
        Purchase Credits Now
      </p>
      <p style="color: #10B981; font-size: 28px; font-weight: 700; margin: 0 0 8px 0;">
        $29.99/month
      </p>
      <p style="color: #737373; font-size: 13px; margin: 0;">
        Keep your store active and selling
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background-color: #CBB57B; color: #000000; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Purchase Credits
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}" style="color: #737373; text-decoration: none; font-size: 13px;">
        View Dashboard
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Tip:</strong> Purchase credits in advance to ensure your products remain active without interruption.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Questions about billing? <a href="{{SUPPORT_URL}}" style="color: #000000; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
