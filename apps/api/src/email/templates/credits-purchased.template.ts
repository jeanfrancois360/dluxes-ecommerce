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
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #CBB57B 0%, #A89968 100%); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-center;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#000000" stroke-width="2">
          <path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
        </svg>
      </div>
    </div>

    <h2 style="color: #000000; font-size: 28px; font-weight: 700; margin-bottom: 16px; text-align: center; letter-spacing: -0.5px;">
      Payment Successful - Credits Added!
    </h2>

    <p style="color: #525252; font-size: 18px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
      Hello ${data.sellerName}, your selling credits have been successfully added to your account.
    </p>

    <div style="background: linear-gradient(135deg, #CBB57B 0%, #A89968 100%); border-radius: 12px; padding: 40px; margin: 32px 0; text-align: center; color: #000000;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; opacity: 0.9;">
        New Credit Balance
      </div>
      <div style="font-size: 48px; font-weight: 700; margin-bottom: 8px;">
        ${data.newBalance}
      </div>
      <div style="font-size: 16px; font-weight: 500; opacity: 0.9;">
        month${data.newBalance !== 1 ? 's' : ''} of selling credits
      </div>
    </div>

    <div style="background: linear-gradient(135deg, #F5F5F5 0%, #FFFFFF 100%); border-radius: 12px; padding: 32px; margin: 32px 0; border: 1px solid #E5E5E5;">
      <h3 style="color: #000000; font-size: 20px; font-weight: 600; margin-bottom: 24px; text-align: center;">
        Purchase Details
      </h3>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5;">
            <span style="color: #737373; font-size: 14px;">Store</span>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
            <strong style="color: #000000; font-size: 14px;">${data.storeName}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5;">
            <span style="color: #737373; font-size: 14px;">Credits Purchased</span>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
            <strong style="color: #000000; font-size: 14px;">${data.monthsPurchased} month${data.monthsPurchased !== 1 ? 's' : ''}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5;">
            <span style="color: #737373; font-size: 14px;">Amount Paid</span>
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
            <strong style="color: #10B981; font-size: 16px;">$${data.amountPaid}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 0;">
            <span style="color: #737373; font-size: 14px;">Valid Until</span>
          </td>
          <td style="padding: 16px 0; text-align: right;">
            <strong style="color: #000000; font-size: 14px;">${data.expiryDate}</strong>
          </td>
        </tr>
      </table>
    </div>

    <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); border-radius: 12px; padding: 28px; margin: 32px 0; border-left: 4px solid #3B82F6;">
      <h3 style="color: #1E40AF; font-size: 18px; font-weight: 600; margin-bottom: 16px;">
        📅 What Happens Next?
      </h3>

      <div style="display: grid; gap: 12px;">
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 600; font-size: 12px;">
            ✓
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            Your products are now active and visible to buyers
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 600; font-size: 12px;">
            ✓
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            Credits will be automatically deducted on the 1st of each month
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 600; font-size: 12px;">
            ✓
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            You'll receive notifications when your balance is low
          </p>
        </div>
        <div style="display: flex; gap: 12px; align-items: start;">
          <div style="flex-shrink: 0; width: 24px; height: 24px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-center; color: #FFFFFF; font-weight: 600; font-size: 12px;">
            ✓
          </div>
          <p style="color: #1E3A8A; font-size: 14px; line-height: 1.6; margin: 0;">
            You can purchase more credits anytime before expiry
          </p>
        </div>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${data.dashboardUrl}"
         style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; padding: 16px 48px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);">
        Go to Dashboard
      </a>
      ${data.invoiceUrl ? `
      <a href="${data.invoiceUrl}"
         style="display: inline-block; background: transparent; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; border: 2px solid #E5E5E5; margin-left: 12px;">
        Download Invoice
      </a>
      ` : ''}
    </div>

    <div style="background-color: #FEF3C7; border-left: 4px solid #CBB57B; padding: 20px; border-radius: 8px; margin-top: 32px;">
      <p style="color: #525252; font-size: 14px; line-height: 1.6;">
        <strong style="color: #000000;">💡 Pro Tip:</strong><br/>
        Keep an eye on your credit balance in your seller dashboard. We recommend purchasing additional credits before your current balance runs out to ensure uninterrupted selling.
      </p>
    </div>

    <p style="color: #737373; font-size: 14px; text-align: center; margin-top: 32px; line-height: 1.6;">
      Questions about your credits or billing?<br/>
      <a href="{{SUPPORT_URL}}" style="color: #CBB57B; text-decoration: none; font-weight: 500;">Contact our billing support</a>
    </p>
  `;

  return baseEmailTemplate(content);
};
