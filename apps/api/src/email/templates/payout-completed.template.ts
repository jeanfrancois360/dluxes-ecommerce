interface PayoutCompletedData {
  sellerName: string;
  storeName: string;
  payoutId: string;
  amount: number;
  currency: string;
  commissionsCount: number;
  periodStart: string;
  periodEnd: string;
  completedDate: string;
  paymentMethod: string;
  paymentReference?: string;
  dashboardUrl: string;
}

export function payoutCompletedTemplate(data: PayoutCompletedData): string {
  const currencySymbol = data.currency === 'USD' ? '$' : data.currency;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payout Completed - NextPik</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center; border-bottom: 2px solid #10B981;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">NextPik</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              <div style="text-align: center;">
                <div style="width: 56px; height: 56px; background-color: #10B981; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>

              <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
                ✅ Payout Completed
              </h2>

              <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                Great news, ${data.sellerName}! Your payout for <strong>${data.storeName}</strong> has been successfully processed.
              </p>

              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 24px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
                <p style="color: rgba(255, 255, 255, 0.9); font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 1px;">Amount Transferred</p>
                <p style="color: #FFFFFF; font-size: 36px; font-weight: 700; margin: 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${currencySymbol}${data.amount.toFixed(2)}</p>
                <p style="color: rgba(255, 255, 255, 0.85); font-size: 13px; margin: 8px 0 0 0;">${data.currency}</p>
                <div style="margin-top: 16px; padding: 8px 16px; background-color: rgba(255, 255, 255, 0.2); border-radius: 20px; display: inline-block;">
                  <p style="color: #FFFFFF; font-size: 12px; margin: 0; font-weight: 500;">✓ Payment Confirmed</p>
                </div>
              </div>

              <!-- Payout Details -->
              <div style="background-color: #FAFAFA; padding: 20px; margin-bottom: 24px; border: 1px solid #E5E5E5; border-radius: 6px;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Payout Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Payout ID</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; font-family: monospace;">#{data.payoutId.substring(0, 12)}...</td>
                  </tr>
                  ${
                    data.paymentReference
                      ? `
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Transaction Reference</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; font-family: monospace;">${data.paymentReference}</td>
                  </tr>
                  `
                      : ''
                  }
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Payment Method</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; text-transform: capitalize;">${data.paymentMethod.replace(/_/g, ' ')}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Orders Included</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px; font-weight: 500;">${data.commissionsCount} order${data.commissionsCount !== 1 ? 's' : ''}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 13px;">Period Covered</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 13px;">${new Date(data.periodStart).toLocaleDateString()} - ${new Date(data.periodEnd).toLocaleDateString()}</td>
                  </tr>
                  <tr style="border-top: 1px solid #E5E5E5;">
                    <td style="padding: 12px 0 0 0; color: #000000; font-size: 13px; font-weight: 600;">Completed Date</td>
                    <td style="padding: 12px 0 0 0; text-align: right; color: #10B981; font-size: 14px; font-weight: 600;">${new Date(data.completedDate).toLocaleDateString()} ${new Date(data.completedDate).toLocaleTimeString()}</td>
                  </tr>
                </table>
              </div>

              <!-- Next Steps -->
              <div style="background-color: #F0FDF4; border-left: 3px solid #10B981; padding: 16px 20px; margin-bottom: 24px; border-radius: 4px;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">💡 What's Next?</p>
                <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>The funds should appear in your account within 1-3 business days</li>
                  <li>Check your ${data.paymentMethod.replace(/_/g, ' ')} account for the transfer</li>
                  <li>You can view detailed breakdown in your dashboard</li>
                  <li>Keep this email for your records</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.dashboardUrl}"
                   style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; border-radius: 4px;">
                  View Transaction Details
                </a>
              </div>

              <!-- Thank You Note -->
              <div style="background-color: #FFFFFF; border: 1px solid #E5E5E5; padding: 16px 20px; margin-top: 24px; border-radius: 4px; text-align: center;">
                <p style="color: #737373; font-size: 13px; line-height: 1.6; margin: 0;">
                  Thank you for selling on NextPik! We appreciate your partnership. 🎉
                </p>
              </div>

              <!-- Support -->
              <div style="background-color: #FAFAFA; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 24px; border-radius: 4px;">
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong style="color: #000000;">Questions?</strong> If you don't see the funds or have any concerns, please contact our support team immediately.
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
