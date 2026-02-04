interface SellerOrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
  sku?: string;
}

interface SellerOrderNotificationData {
  sellerName: string;
  storeName: string;
  orderNumber: string;
  customerName: string;
  items: SellerOrderItem[];
  subtotal: number;
  commission: number;
  commissionRate: number;
  netPayout: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderUrl: string;
  dashboardUrl: string;
}

export function sellerOrderNotificationTemplate(data: SellerOrderNotificationData): string {
  const currencySymbol = data.currency === 'USD' ? '$' : data.currency;

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${item.name}</p>
        <p style="color: #737373; font-size: 13px; margin: 0;">SKU: ${item.sku || 'N/A'} | Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0;">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</p>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Order - NextPik</title>
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
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
                  </svg>
                </div>
              </div>

              <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
                New Order Received
              </h2>

              <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                Hello ${data.sellerName}, your store <strong>${data.storeName}</strong> has a new order.
              </p>

              <!-- Order Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                <tr>
                  <td style="background-color: #FAFAFA; border-left: 3px solid #10B981; padding: 16px; width: 50%;">
                    <p style="color: #737373; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Order Number</p>
                    <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">#${data.orderNumber}</p>
                  </td>
                  <td style="background-color: #FAFAFA; border-left: 3px solid #CBB57B; padding: 16px; width: 50%;">
                    <p style="color: #737373; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Customer</p>
                    <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">${data.customerName}</p>
                  </td>
                </tr>
              </table>

              <!-- Items -->
              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5E5E5;">
                Items to Ship
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Earnings -->
              <div style="background-color: #FAFAFA; padding: 20px; margin-bottom: 24px; border: 1px solid #E5E5E5;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Your Earnings</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 14px;">Order Subtotal</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 14px;">${currencySymbol}${data.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 14px;">Commission (${data.commissionRate.toFixed(1)}%)</td>
                    <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 14px;">-${currencySymbol}${data.commission.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; color: #000000; font-size: 16px; font-weight: 600; border-top: 1px solid #E5E5E5;">Your Payout</td>
                    <td style="padding: 12px 0 0 0; text-align: right; color: #10B981; font-size: 18px; font-weight: 700; border-top: 1px solid #E5E5E5;">${currencySymbol}${data.netPayout.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- Shipping Address -->
              <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Ship To:</p>
              <div style="background-color: #FAFAFA; padding: 16px; margin-bottom: 24px; border: 1px solid #E5E5E5;">
                <p style="color: #000000; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">${data.customerName}</p>
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  ${data.shippingAddress.street}<br/>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
                  ${data.shippingAddress.country}
                </p>
              </div>

              <!-- Action Required -->
              <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-bottom: 24px;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Action Required:</p>
                <ul style="color: #525252; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>Prepare items for shipment</li>
                  <li>Update order status in your dashboard</li>
                  <li>Add tracking information once shipped</li>
                </ul>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.orderUrl}"
                   style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                  View Order Details
                </a>
              </div>

              <div style="text-align: center;">
                <a href="${data.dashboardUrl}" style="color: #737373; text-decoration: none; font-size: 13px;">
                  Go to Dashboard
                </a>
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
