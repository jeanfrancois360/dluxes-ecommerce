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
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #DC2626; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Critical: Your Credits Have Been Depleted
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, your selling credits balance has reached zero.
    </p>

    <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 12px; padding: 40px; margin: 32px 0; text-align: center; border: 3px solid #DC2626;">
      <div style="font-size: 14px; font-weight: 700; margin-bottom: 12px; color: #DC2626; text-transform: uppercase; letter-spacing: 1.5px;">
        🚨 URGENT ACTION REQUIRED
      </div>
      <div style="font-size: 72px; font-weight: 700; margin-bottom: 16px; color: #DC2626; line-height: 1;">
        0
      </div>
      <div style="font-size: 20px; font-weight: 600; color: #991B1B; margin-bottom: 20px;">
        Credits Remaining
      </div>
      <div style="margin-top: 20px; padding: 20px; background: rgba(255, 255, 255, 0.9); border-radius: 8px; border: 2px dashed #DC2626;">
        <p style="color: #DC2626; font-size: 16px; font-weight: 700; margin: 0;">
          Store: ${data.storeName}
        </p>
        <p style="color: #991B1B; font-size: 14px; font-weight: 600; margin: 8px 0 0 0;">
          Status: Grace Period Active
        </p>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%); color: #FFFFFF; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">
        ⏰ Grace Period Ends
      </div>
      <div style="font-size: 32px; font-weight: 700; margin-bottom: 12px; letter-spacing: -0.5px;">
        ${data.graceEndsAt}
      </div>
      <div style="font-size: 14px; opacity: 0.9; line-height: 1.6;">
        Your products will be suspended if credits are not purchased before this time
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 2px solid #FCA5A5;">
      <h3 style="color: #DC2626; font-size: 20px; font-weight: 600; margin-bottom: 20px; text-align: center;">
        ⚠️ Immediate Impact
      </h3>

      <div style="display: grid; gap: 12px;">
        <div style="padding: 16px; background: #FFFFFF; border-radius: 8px; border-left: 4px solid #EF4444;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 32px; height: 32px; background: #FEE2E2; border-radius: 8px; display: flex; align-items: center; justify-center;">
              <span style="color: #DC2626; font-size: 18px;">⏸</span>
            </div>
            <div>
              <p style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
                Grace Period Activated
              </p>
              <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">
                You have 3 days to purchase credits before products are suspended
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 16px; background: #FFFFFF; border-radius: 8px; border-left: 4px solid #EF4444;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 32px; height: 32px; background: #FEE2E2; border-radius: 8px; display: flex; align-items: center; justify-center;">
              <span style="color: #DC2626; font-size: 18px;">👁</span>
            </div>
            <div>
              <p style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
                Products Still Visible (For Now)
              </p>
              <p style="color: #737373; font-size: 14px; line-height: 1.5; margin: 0;">
                Your products remain active during the grace period
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 16px; background: #FEF2F2; border-radius: 8px; border-left: 4px solid #DC2626;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 32px; height: 32px; background: #DC2626; border-radius: 8px; display: flex; align-items: center; justify-center;">
              <span style="color: #FFFFFF; font-size: 18px;">❌</span>
            </div>
            <div>
              <p style="color: #DC2626; font-size: 15px; font-weight: 700; margin: 0 0 4px 0;">
                After Grace Period: Products Suspended
              </p>
              <p style="color: #991B1B; font-size: 14px; line-height: 1.5; margin: 0;">
                All products will become inactive and invisible to buyers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #3B82F6;">
      <h3 style="color: #1E40AF; font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center;">
        ✅ How to Restore Full Access
      </h3>

      <div style="display: grid; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 14px;">
            1
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Purchase credits immediately</strong> ($29.99/month)
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 14px;">
            2
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Credits added instantly</strong> - no waiting period
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 32px; height: 32px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 700; font-size: 14px;">
            3
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Products remain active</strong> - continue selling without interruption
          </p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFFFFF; padding: 20px 60px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 20px; box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4); text-transform: uppercase; letter-spacing: 1px; animation: pulse 2s infinite;">
        Purchase Credits Now
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}"
         style="color: #737373; text-decoration: none; font-size: 14px; font-weight: 500;">
        View Dashboard →
      </a>
    </div>

    <div style="background-color: #7F1D1D; color: #FFFFFF; border-radius: 12px; padding: 24px; margin-top: 32px;">
      <p style="font-size: 15px; line-height: 1.7; margin: 0; text-align: center;">
        <strong style="font-size: 16px;">⚡ Act Now to Avoid Service Interruption</strong><br/><br/>
        Don't lose sales! Purchase credits before <strong>${data.graceEndsAt}</strong> to keep your products active and your store running smoothly.
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need help or have billing questions?<br/>
      <a href="{{SUPPORT_URL}}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Contact urgent support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
