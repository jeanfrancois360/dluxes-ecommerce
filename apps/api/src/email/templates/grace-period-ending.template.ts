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
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center; animation: pulse 2s infinite;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #DC2626; font-size: 32px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px; text-transform: uppercase;">
      Final Warning: Grace Period Ending Soon
    </h2>

    <p style="color: #991B1B; font-size: 20px; line-height: 1.6; margin-bottom: 32px; text-align: center; font-weight: 600;">
      ${data.sellerName}, your store will be suspended in less than 24 hours!
    </p>

    <div style="background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%); border-radius: 12px; padding: 48px 32px; margin: 32px 0; text-align: center; border: 4px solid #DC2626; box-shadow: 0 8px 32px rgba(220, 38, 38, 0.5);">
      <div style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: #FFFFFF; text-transform: uppercase; letter-spacing: 2px;">
        ⏰ TIME REMAINING
      </div>
      <div style="font-size: 80px; font-weight: 700; margin-bottom: 16px; color: #FFFFFF; line-height: 1; text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">
        ${data.hoursRemaining}
      </div>
      <div style="font-size: 24px; font-weight: 600; color: #FEE2E2; margin-bottom: 24px;">
        hours until suspension
      </div>
      <div style="padding: 20px; background: rgba(0, 0, 0, 0.3); border-radius: 8px; border: 2px solid #FCA5A5;">
        <p style="color: #FFFFFF; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
          Store: ${data.storeName}
        </p>
        <p style="color: #FEE2E2; font-size: 14px; margin: 0;">
          ${data.productsCount} product${data.productsCount !== 1 ? 's' : ''} will be suspended
        </p>
      </div>
    </div>

    <div style="background: #000000; color: #FFFFFF; border-radius: 12px; padding: 32px; margin: 32px 0; border-left: 6px solid #DC2626;">
      <h3 style="color: #DC2626; font-size: 22px; font-weight: 700; margin-bottom: 16px; text-align: center;">
        🚨 WHAT HAPPENS AT ${data.graceEndsAt}
      </h3>

      <div style="display: grid; gap: 16px; margin-top: 24px;">
        <div style="padding: 16px; background: #1C1C1C; border-radius: 8px; border-left: 4px solid #DC2626;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; background: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-center;">
              <span style="color: #FFFFFF; font-size: 20px; font-weight: 700;">1</span>
            </div>
            <div>
              <p style="color: #FCA5A5; font-size: 16px; font-weight: 700; margin: 0 0 6px 0;">
                All Products Suspended
              </p>
              <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0;">
                Your ${data.productsCount} product${data.productsCount !== 1 ? 's' : ''} will be immediately deactivated and hidden from all buyers
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 16px; background: #1C1C1C; border-radius: 8px; border-left: 4px solid #DC2626;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; background: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-center;">
              <span style="color: #FFFFFF; font-size: 20px; font-weight: 700;">2</span>
            </div>
            <div>
              <p style="color: #FCA5A5; font-size: 16px; font-weight: 700; margin: 0 0 6px 0;">
                Zero Sales Revenue
              </p>
              <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0;">
                You will stop receiving orders and lose potential sales until credits are purchased
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 16px; background: #1C1C1C; border-radius: 8px; border-left: 4px solid #DC2626;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; background: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-center;">
              <span style="color: #FFFFFF; font-size: 20px; font-weight: 700;">3</span>
            </div>
            <div>
              <p style="color: #FCA5A5; font-size: 16px; font-weight: 700; margin: 0 0 6px 0;">
                Store Ranking Drops
              </p>
              <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0;">
                Extended suspensions can negatively impact your store's search visibility and reputation
              </p>
            </div>
          </div>
        </div>

        <div style="padding: 16px; background: #1C1C1C; border-radius: 8px; border-left: 4px solid #DC2626;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="flex-shrink: 0; width: 36px; height: 36px; background: #DC2626; border-radius: 50%; display: flex; align-items: center; justify-center;">
              <span style="color: #FFFFFF; font-size: 20px; font-weight: 700;">4</span>
            </div>
            <div>
              <p style="color: #FCA5A5; font-size: 16px; font-weight: 700; margin: 0 0 6px 0;">
                Customer Trust Affected
              </p>
              <p style="color: #D1D5DB; font-size: 14px; line-height: 1.5; margin: 0;">
                Customers may lose confidence if your products disappear from the marketplace
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #10B981 0%, #047857 100%); color: #FFFFFF; border-radius: 12px; padding: 32px; margin: 32px 0; text-align: center;">
      <div style="margin-bottom: 20px;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2" style="margin: 0 auto;">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 12px;">
        ⚡ Instant Reactivation Available
      </h3>
      <p style="font-size: 16px; line-height: 1.7; opacity: 0.95; margin-bottom: 20px;">
        Purchase credits now and your products will be reactivated immediately. No downtime, no lost sales, no hassle.
      </p>
      <div style="background: rgba(255, 255, 255, 0.2); border-radius: 8px; padding: 16px; margin-top: 20px;">
        <div style="font-size: 14px; opacity: 0.9; margin-bottom: 4px;">Only</div>
        <div style="font-size: 36px; font-weight: 700;">$29.99/month</div>
        <div style="font-size: 14px; opacity: 0.9; margin-top: 4px;">Secure payment via Stripe</div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #CBB57B 0%, #A89968 100%); color: #000000; padding: 24px 72px; border-radius: 14px; text-decoration: none; font-weight: 700; font-size: 22px; box-shadow: 0 10px 30px rgba(203, 181, 123, 0.5); text-transform: uppercase; letter-spacing: 1.5px; border: 3px solid #FFFFFF;">
        Save My Store Now
      </a>
    </div>

    <div style="text-align: center; margin: 20px 0;">
      <a href="${data.dashboardUrl}"
         style="color: #737373; text-decoration: none; font-size: 14px; font-weight: 500;">
        View Dashboard →
      </a>
    </div>

    <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border: 3px solid #DC2626; border-radius: 12px; padding: 28px; margin-top: 32px;">
      <div style="text-align: center; margin-bottom: 16px;">
        <div style="display: inline-block; background: #DC2626; color: #FFFFFF; padding: 8px 20px; border-radius: 20px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
          ⚠️ FINAL WARNING
        </div>
      </div>
      <p style="color: #991B1B; font-size: 16px; line-height: 1.8; margin: 0; text-align: center; font-weight: 600;">
        This is your last notification before automatic suspension. After <strong>${data.graceEndsAt}</strong>, your store will be inactive until credits are purchased. Don't wait - act now to protect your business!
      </p>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #737373; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #000000;">💡 Need Help?</strong><br/>
        If you're experiencing financial difficulties or have questions about your account, please contact our support team. We're here to help you find a solution.
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Urgent assistance needed?<br/>
      <a href="{{SUPPORT_URL}}" style="color: #DC2626; text-decoration: none; font-weight: 600;">Contact emergency support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
