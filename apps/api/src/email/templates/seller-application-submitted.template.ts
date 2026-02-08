import { baseEmailTemplate } from './base.template';

export const sellerApplicationSubmittedTemplate = (data: {
  sellerName: string;
  storeName: string;
  submittedAt: Date;
  dashboardUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Application Received!
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, thank you for applying to sell on NextPik.
    </p>

    <div style="background-color: #FAFAFA; border-left: 3px solid #CBB57B; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
        ${data.storeName}
      </p>
      <p style="color: #737373; font-size: 14px; margin: 0;">
        Submitted on ${data.submittedAt.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        What Happens Next?
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">1</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Application Review</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Our team will carefully review your application details.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">2</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Decision Notification</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">You'll receive an email within 2-3 business days with our decision.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">3</div>
          </td>
          <td valign="top" style="padding-left: 12px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Get Started</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">If approved, you can immediately start setting up your store.</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="background-color: #FEF3C7; border-left: 3px solid #F59E0B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #92400E; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">⏱️ Review Timeline:</strong> Applications are typically reviewed within 2-3 business days. We'll notify you as soon as a decision is made.
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.dashboardUrl}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        View Dashboard
      </a>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Questions about your application? <a href="{{SUPPORT_URL}}" style="color: #000000; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
