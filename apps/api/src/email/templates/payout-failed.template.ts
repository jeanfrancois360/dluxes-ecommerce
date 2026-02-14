interface PayoutFailedData {
  sellerName: string;
  storeName: string;
  payoutId: string;
  amount: number;
  currency: string;
  commissionsCount: number;
  failureReason: string;
  failedDate: string;
  paymentMethod: string;
  dashboardUrl: string;
  supportUrl: string;
}

export function payoutFailedTemplate(data: PayoutFailedData): string {
  const currencySymbol = data.currency === 'USD' ? '$' : data.currency;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Failed - NextPik</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center; border-bottom: 2px solid #DC2626;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">NextPik</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              <div style="text-align: center;">
                <div style="width: 56px; height: 56px; background-color: #DC2626; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>

              <h2 style="color: #DC2626; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
                ⚠️ Payout Failed
              </h2>

              <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                ${data.sellerName}, we encountered an issue processing your payout for <strong>${data.storeName}</strong>. Please review the details below.
              </p>

              <!-- Failed Amount -->
              <div style="background-color: #FEF2F2; border: 2px solid #DC2626; padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                <p style="color: #991B1B; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Payout Amount</p>
                <p style="color: #DC2626; font-size: 36px; font-weight: 700; margin: 0;">${currencySymbol}${data.amount.toFixed(2)}</p>
                <p style="color: #991B1B; font-size: 13px; margin: 8px 0 0 0;">${data.currency}</p>
              </div>

              <!-- Failure Reason -->
              <div style="background-color: #FFFBEB; border-left: 3px solid #F59E0B; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">⚠️ Failure Reason:</p>
                <p style="color: #78350F; font-size: 14px; line-height: 1.6; margin: 0;">
                  ${data.failureReason}
                </p>
              </div>

              <!-- Payout Details -->
              <div style="background-color: #FAFAFA; padding: 20px; margin-bottom: 24px; border: 1px solid #E5E5E5; border-radius: 6px;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Payout Details</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Payout ID</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; font-family: monospace;">#{data.payoutId.substring(0, 12)}...</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Payment Method</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; text-transform: capitalize;">${data.paymentMethod.replace(/_/g, ' ')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Orders Included</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; font-weight: 500;">${data.commissionsCount} order${data.commissionsCount !== 1 ? 's' : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Failed Date</td>
                    <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-weight: 500;">${new Date(data.failedDate).toLocaleDateString()} ${new Date(data.failedDate).toLocaleTimeString()}</td>
                  </tr>
                </table>
              </div>

              <!-- Action Required -->
              <div style="background-color: #FEF2F2; border-left: 3px solid #DC2626; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="color: #DC2626; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">🔧 Action Required:</p>
                <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Review your payment method details in your dashboard</li>
                  <li>Ensure your bank account or payment account is active and verified</li>
                  <li>Check that all required information is up to date</li>
                  <li>Contact support if you need assistance resolving this issue</li>
                </ul>
              </div>

              <!-- What Happens Next -->
              <div style="background-color: #F0FDF4; border-left: 3px solid #10B981; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">💡 What Happens Next?</p>
                <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Your funds are safe and will remain in your account</li>
                  <li>We will automatically retry the payout after you update your information</li>
                  <li>You can also manually request a payout from your dashboard</li>
                  <li>Your commissions will not be lost</li>
                </ul>
              </div>

              <!-- CTA Buttons -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.dashboardUrl}"
                   style="display: inline-block; background-color: #DC2626; color: #FFFFFF; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px; margin: 0 8px 12px 8px;">
                  Update Payment Details
                </a>
                <br/>
                <a href="${data.supportUrl}"
                   style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px; margin: 0 8px;">
                  Contact Support
                </a>
              </div>

              <!-- Support -->
              <div style="background-color: #FAFAFA; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 24px; border-radius: 4px;">
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong style="color: #000000;">Need Help?</strong> Our support team is here to help you resolve this issue quickly. Please don't hesitate to reach out.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #fafafa; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e5e5;">
              <p style="color: #737373; font-size: 12px; margin: 0 0 8px 0;">
                &copy; ${new Date().getFullYear()} NextPik. All rights reserved.
              </p>
              <p style="color: #A3A3A3; font-size: 11px; margin: 0;">
                You're receiving this email because you're a seller on our platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
