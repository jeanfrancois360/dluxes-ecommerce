import { baseEmailTemplate } from './base.template';

export const sellerSuspendedTemplate = (data: {
  sellerName: string;
  storeName: string;
  suspensionReason: string;
  supportUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Important: Your Store Has Been Suspended
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, we need to inform you of a change to your seller account status.
    </p>

    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 2px solid #F59E0B;">
      <h3 style="color: #D97706; font-size: 20px; font-weight: 600; margin-bottom: 12px; text-align: center;">
        ⚠️ Store Suspended
      </h3>
      <p style="color: #525252; font-size: 16px; text-align: center; margin-bottom: 20px;">
        Store: ${data.storeName}
      </p>
      <div style="background: #FFFFFF; border-radius: 8px; padding: 20px; border-left: 4px solid #D97706;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          Reason for Suspension:
        </p>
        <p style="color: #525252; font-size: 14px; line-height: 1.6;">
          ${data.suspensionReason}
        </p>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #FCA5A5;">
      <h3 style="color: #DC2626; font-size: 18px; font-weight: 600; margin-bottom: 16px; text-align: center;">
        Impact of Suspension
      </h3>

      <div style="display: grid; gap: 12px;">
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px; border-left: 3px solid #DC2626;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6;">
            ❌ <strong style="color: #000000;">All your products are now inactive</strong> and not visible to buyers
          </p>
        </div>
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px; border-left: 3px solid #DC2626;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6;">
            ❌ <strong style="color: #000000;">New orders are blocked</strong> until the issue is resolved
          </p>
        </div>
        <div style="padding: 12px; background: #FFFFFF; border-radius: 8px; border-left: 3px solid #DC2626;">
          <p style="color: #525252; font-size: 14px; line-height: 1.6;">
            ❌ <strong style="color: #000000;">Seller dashboard access restricted</strong> to view-only mode
          </p>
        </div>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 20px; font-weight: 600; margin-bottom: 16px; text-align: center;">
        How to Resolve This
      </h3>

      <div style="display: grid; gap: 16px;">
        <!-- Step 1 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            1
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Review the Reason
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Understand why your account was suspended and what needs to be corrected.
            </p>
          </div>
        </div>

        <!-- Step 2 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            2
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Contact Our Team
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Reach out to our support team to discuss the suspension and create a resolution plan.
            </p>
          </div>
        </div>

        <!-- Step 3 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            3
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Take Corrective Action
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Address the issues identified and demonstrate compliance with our seller policies.
            </p>
          </div>
        </div>

        <!-- Step 4 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            4
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Request Reactivation
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Once issues are resolved, request a review for account reactivation.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.supportUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);">
        Contact Support Immediately
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #DC2626; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #DC2626;">⚠️ Important:</strong><br/>
        This suspension is effective immediately. Pending orders must still be fulfilled according to your seller agreement. Failure to comply may result in permanent account termination and potential legal action.
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need immediate assistance?<br/>
      <a href="${data.supportUrl}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Contact our seller support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
