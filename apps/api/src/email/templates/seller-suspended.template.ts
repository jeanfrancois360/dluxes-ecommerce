import { baseEmailTemplate } from './base.template';

export const sellerSuspendedTemplate = (data: {
  sellerName: string;
  storeName: string;
  suspensionReason: string;
  supportUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #F59E0B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Your Store Has Been Suspended
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, we need to inform you of a change to your seller account.
    </p>

    <div style="background-color: #FAFAFA; border-left: 3px solid #F59E0B; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">
        Store Suspended
      </p>
      <p style="color: #737373; font-size: 14px; margin: 0 0 16px 0;">
        Store: ${data.storeName}
      </p>
      <div style="background-color: #FFFFFF; padding: 16px; border: 1px solid #E5E5E5;">
        <p style="color: #000000; font-size: 13px; font-weight: 600; margin: 0 0 8px 0;">Reason:</p>
        <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">${data.suspensionReason}</p>
      </div>
    </div>

    <div style="background-color: #FAFAFA; padding: 20px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">Impact of Suspension:</p>
      <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>All your products are now inactive and not visible to buyers</li>
        <li>New orders are blocked until the issue is resolved</li>
        <li>Seller dashboard access is restricted to view-only mode</li>
      </ul>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        How to Resolve This
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">1</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Review the Reason</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Understand why your account was suspended.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">2</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Contact Our Team</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Discuss the suspension and create a resolution plan.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">3</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Take Corrective Action</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Address the issues and demonstrate compliance.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">4</div>
          </td>
          <td valign="top" style="padding-left: 12px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Request Reactivation</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Once resolved, request a review for account reactivation.</p>
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

    <div style="background-color: #FFFFFF; border-left: 3px solid #DC2626; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #DC2626;">Important:</strong> This suspension is effective immediately. Pending orders must still be fulfilled according to your seller agreement.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Need immediate assistance? <a href="${data.supportUrl}" style="color: #000000; text-decoration: underline;">Contact our support team</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
