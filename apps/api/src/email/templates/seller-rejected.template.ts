import { baseEmailTemplate } from './base.template';

export const sellerRejectedTemplate = (data: {
  sellerName: string;
  storeName: string;
  rejectionReason: string;
  supportUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Seller Application Update
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, thank you for your interest in selling on NextPik.
    </p>

    <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 2px solid #EF4444;">
      <h3 style="color: #DC2626; font-size: 20px; font-weight: 600; margin-bottom: 12px; text-align: center;">
        Application Not Approved
      </h3>
      <p style="color: #525252; font-size: 16px; text-align: center; margin-bottom: 20px;">
        Store: ${data.storeName}
      </p>
      <div style="background: #FFFFFF; border-radius: 8px; padding: 20px; border-left: 4px solid #DC2626;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
          Reason:
        </p>
        <p style="color: #525252; font-size: 14px; line-height: 1.6;">
          ${data.rejectionReason}
        </p>
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 20px; font-weight: 600; margin-bottom: 16px; text-align: center;">
        What You Can Do
      </h3>

      <div style="display: grid; gap: 16px;">
        <!-- Option 1 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            1
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Review the Feedback
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Take time to understand the reason for rejection and address any concerns.
            </p>
          </div>
        </div>

        <!-- Option 2 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            2
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Contact Support
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              Our team can provide additional guidance and answer any questions you may have.
            </p>
          </div>
        </div>

        <!-- Option 3 -->
        <div style="display: flex; gap: 16px;">
          <div style="flex-shrink: 0; width: 40px; height: 40px; background: #CBB57B; border-radius: 10px; display: flex; align-items: center; justify-center; color: #000000; font-weight: 700; font-size: 16px;">
            3
          </div>
          <div>
            <h4 style="color: #000000; font-size: 16px; font-weight: 600; margin-bottom: 4px;">
              Reapply in the Future
            </h4>
            <p style="color: #737373; font-size: 14px; line-height: 1.5;">
              You may reapply after addressing the feedback provided. We encourage sellers who are committed to quality.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.supportUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);">
        Contact Support
      </a>
    </div>

    <div style="background-color: #FAFAFA; border-left: 4px solid #737373; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #000000;">Note:</strong><br/>
        We appreciate your interest in becoming a NextPik seller. While your current application wasn't approved, we encourage you to review our seller guidelines and consider reapplying when you're ready.
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Have questions or need clarification?<br/>
      <a href="${data.supportUrl}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Reach out to our support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
