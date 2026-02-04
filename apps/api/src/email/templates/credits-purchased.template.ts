import { baseEmailTemplate } from './base.template';

export const creditsPurchasedTemplate = (data: {
  sellerName: string;
  storeName: string;
  monthsPurchased: number;
  amountPaid: string;
  newBalance: number;
  expiryDate: string;
  dashboardUrl: string;
  invoiceUrl?: string;
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
      Payment Successful
    </h2>

    <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, your selling credits have been added to your account.
    </p>

    <div style="background-color: #000000; padding: 32px; margin: 32px 0; text-align: center;">
      <p style="color: #CBB57B; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">
        New Credit Balance
      </p>
      <p style="color: #FFFFFF; font-size: 48px; font-weight: 700; margin: 0 0 8px 0;">
        ${data.newBalance}
      </p>
      <p style="color: #A3A3A3; font-size: 14px; margin: 0;">
        month${data.newBalance !== 1 ? 's' : ''} of selling credits
      </p>
    </div>

    <div style="background-color: #FAFAFA; padding: 24px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        Purchase Details
      </h3>

      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; color: #737373; font-size: 14px;">Store</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right; color: #000000; font-size: 14px; font-weight: 500;">${data.storeName}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; color: #737373; font-size: 14px;">Credits Purchased</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right; color: #000000; font-size: 14px; font-weight: 500;">${data.monthsPurchased} month${data.monthsPurchased !== 1 ? 's' : ''}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; color: #737373; font-size: 14px;">Amount Paid</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right; color: #10B981; font-size: 14px; font-weight: 600;">$${data.amountPaid}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; color: #737373; font-size: 14px;">Valid Until</td>
          <td style="padding: 12px 0; text-align: right; color: #000000; font-size: 14px; font-weight: 500;">${data.expiryDate}</td>
        </tr>
      </table>
    </div>

    <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin: 32px 0;">
      <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">
        What happens next?
      </p>
      <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
        Your products are now active. Credits are deducted on the 1st of each month. You'll receive a notification when your balance is low.
      </p>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.dashboardUrl}"
         style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
        Go to Dashboard
      </a>
      ${data.invoiceUrl ? `
      <a href="${data.invoiceUrl}"
         style="display: inline-block; background-color: #FFFFFF; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border: 1px solid #E5E5E5; margin-left: 12px;">
        Download Invoice
      </a>
      ` : ''}
    </div>

    <p style="color: #737373; font-size: 13px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Questions about billing? <a href="{{SUPPORT_URL}}" style="color: #000000; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
