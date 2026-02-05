import { baseEmailTemplate } from './base.template';

export const sellerApprovedTemplate = (data: {
  sellerName: string;
  storeName: string;
  creditsUrl: string;
  dashboardUrl: string;
}) => {
  const content = `
    <div style="text-align: center;">
      <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
      Your Seller Account is Approved
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, welcome to NextPik as a seller.
    </p>

    <div style="background-color: #FAFAFA; border-left: 3px solid #10B981; padding: 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
        ${data.storeName}
      </p>
      <p style="color: #10B981; font-size: 14px; margin: 0;">
        Your store is now active
      </p>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        Next Steps
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">1</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Purchase Selling Credits</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Get monthly credits at $29.99/month to activate your products.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top" style="padding-bottom: 16px;">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">2</div>
          </td>
          <td valign="top" style="padding-left: 12px; padding-bottom: 16px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Create Your First Product</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Add products with quality images and descriptions.</p>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">
            <div style="width: 32px; height: 32px; background-color: #CBB57B; color: #000000; font-weight: 600; font-size: 14px; text-align: center; line-height: 32px;">3</div>
          </td>
          <td valign="top" style="padding-left: 12px;">
            <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Start Receiving Orders</p>
            <p style="color: #737373; font-size: 13px; line-height: 1.5; margin: 0;">Manage orders and track sales from your dashboard.</p>
          </td>
        </tr>
      </table>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.creditsUrl}"
         style="display: inline-block; background-color: #CBB57B; color: #000000; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Purchase Credits
      </a>
      <a href="${data.dashboardUrl}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; margin-left: 12px;">
        Go to Dashboard
      </a>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 32px;">
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        <strong style="color: #000000;">Note:</strong> To publish products and start selling, you need to purchase monthly credits. Credits are automatically deducted on the 1st of each month.
      </p>
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Questions about selling? <a href="{{SUPPORT_URL}}" style="color: #000000; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
