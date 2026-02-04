import { baseEmailTemplate } from './base.template';

export const sellerRejectedTemplate = (data: {
  sellerName: string;
  storeName: string;
  rejectionReason: string;
  supportUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #E5E5E5;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Seller Application Update
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, thank you for your interest in selling on NextPik.
    </p>

    <div style="background-color: #FAFAFA; border-left: 3px solid #DC2626; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        Application Not Approved
      </p>
      <p style="color: #737373; font-size: 14px; margin: 0 0 16px 0;">
        Store: ${data.storeName}
      </p>
      <div style="background-color: #FFFFFF; padding: 16px; border: 1px solid #E5E5E5;">
        <p style="color: #000000; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Reason:</p>
        <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">${data.rejectionReason}</p>
      </div>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        What You Can Do
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">1</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Review the Feedback</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Understand the reason and address any concerns.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">2</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Contact Support</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Our team can provide additional guidance.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">3</div>
          </td>
          <td valign="top" style="padding-left: 12px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Reapply Later</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">You may reapply after addressing the feedback.</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.supportUrl}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Contact Support
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        We appreciate your interest in becoming a NextPik seller. While your current application wasn't approved, we encourage you to review our seller guidelines and consider reapplying when you're ready.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Have questions? <a href="${data.supportUrl}" style="color: #000000; text-decoration: underline;">Reach out to our support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
