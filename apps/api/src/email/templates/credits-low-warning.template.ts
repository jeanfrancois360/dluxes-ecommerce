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
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Your Selling Credits Are Running Low
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, this is a friendly reminder to top up your credits.
    </p>

    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 40px; margin: 32px 0; text-align: center; border: 2px solid #F59E0B;">
      <div style="font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #D97706; text-transform: uppercase; letter-spacing: 1px;">
        ⚠️ Current Balance
      </div>
      <div style="font-size: 56px; font-weight: 700; margin-bottom: 12px; color: #D97706;">
        ${data.currentBalance}
      </div>
      <div style="font-size: 18px; font-weight: 500; color: #92400E;">
        month${data.currentBalance !== 1 ? 's' : ''} remaining
      </div>
      <div style="margin-top: 20px; padding: 16px; background: rgba(255, 255, 255, 0.7); border-radius: 8px; border: 1px dashed #D97706;">
        <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0;">
          Store: ${data.storeName}
        </p>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #EF4444;">
      <h3 style="color: #DC2626; font-size: 18px; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        What This Means
      </h3>

      <div style="display: grid; gap: 12px;">
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
            📆 You have approximately <strong style="color: #DC2626;">${data.daysUntilDepletion} days</strong> of credits left at your current deduction rate
          </p>
        </div>
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
            ⏰ Credits are deducted automatically on the <strong style="color: #000000;">1st of each month</strong>
          </p>
        </div>
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
            🚨 If credits reach <strong style="color: #DC2626;">zero</strong>, your products will be suspended after a 3-day grace period
          </p>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">
        Recommended Action
      </h3>

      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 20px;">
        <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">
          Purchase Credits Now
        </div>
        <div style="font-size: 32px; font-weight: 700; margin-bottom: 4px;">
          $29.99/month
        </div>
        <div style="font-size: 14px; opacity: 0.9;">
          Keep your store active and selling
        </div>
      </div>

      <div style="display: grid; gap: 12px; margin-top: 20px;">
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #10B981; border-radius: 8px; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 16px;">
            ✓
          </div>
          <p style="color: #525252; font-size: 14px; line-height: 1.5; margin: 0;">
            Instant activation - no downtime for your products
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #10B981; border-radius: 8px; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 16px;">
            ✓
          </div>
          <p style="color: #525252; font-size: 14px; line-height: 1.5; margin: 0;">
            Purchase 1-12 months at once for convenience
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #10B981; border-radius: 8px; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 16px;">
            ✓
          </div>
          <p style="color: #525252; font-size: 14px; line-height: 1.5; margin: 0;">
            Secure payment via Stripe - safe and fast
          </p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #CBB57B 0%, #A89968 100%); color: #000000; padding: 18px 56px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 18px; box-shadow: 0 6px 20px rgba(203, 181, 123, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
        Purchase Credits Now
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}"
         style="color: #737373; text-decoration: none; font-size: 14px; font-weight: 500;">
        View Dashboard Instead →
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #D97706;">⏰ Don't Wait Until the Last Minute:</strong><br/>
        Purchasing credits in advance ensures your products remain active without interruption. Your customers are counting on you!
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Have questions about credits or billing?<br/>
      <a href="{{SUPPORT_URL}}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Contact our support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
