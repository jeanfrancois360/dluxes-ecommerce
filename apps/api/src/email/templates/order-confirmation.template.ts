interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image?: string;
}

interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  orderUrl: string;
  trackingUrl?: string;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const currencySymbol = data.currency === 'USD' ? '$' : data.currency;
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${item.name}</p>
        <p style="color: #737373; font-size: 13px; margin: 0;">Quantity: ${item.quantity}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
        <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0;">${currencySymbol}${(item.price * item.quantity).toFixed(2)}</p>
        <p style="color: #737373; font-size: 12px; margin: 4px 0 0 0;">${currencySymbol}${item.price.toFixed(2)} each</p>
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
  <title>Order Confirmed - NextPik</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff;">
          <!-- Header -->
          <tr>
            <td style="background-color: #000000; padding: 28px 32px; text-align: center; border-bottom: 2px solid #CBB57B;">
              <span style="color: #ffffff; font-size: 18px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase;">NextPik</span>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px; background-color: #ffffff;">
              <div style="text-align: center;">
                <div style="width: 56px; height: 56px; background-color: #000000; border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; border: 2px solid #CBB57B;">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>

              <h2 style="color: #000000; font-size: 22px; font-weight: 600; margin-bottom: 16px; text-align: center;">
                Order Confirmed
              </h2>

              <p style="color: #525252; font-size: 15px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                Hello ${data.customerName}, we've received your order and are getting it ready.
              </p>

              <!-- Order Number -->
              <div style="background-color: #FAFAFA; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-bottom: 32px;">
                <p style="color: #737373; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 1px;">Order Number</p>
                <p style="color: #000000; font-size: 18px; font-weight: 600; margin: 0;">#${data.orderNumber}</p>
              </div>

              <!-- Order Items -->
              <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 2px solid #E5E5E5;">
                Order Items
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                ${itemsHtml}
              </table>

              <!-- Order Summary -->
              <div style="background-color: #FAFAFA; padding: 20px; margin-bottom: 24px; border: 1px solid #E5E5E5;">
                <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 16px 0;">Order Summary</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 14px;">Subtotal</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 14px;">${currencySymbol}${data.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 14px;">Shipping</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 14px;">${currencySymbol}${data.shipping.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #737373; font-size: 14px;">Tax</td>
                    <td style="padding: 6px 0; text-align: right; color: #000000; font-size: 14px;">${currencySymbol}${data.tax.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0 0 0; color: #000000; font-size: 16px; font-weight: 600; border-top: 1px solid #E5E5E5;">Total</td>
                    <td style="padding: 12px 0 0 0; text-align: right; color: #CBB57B; font-size: 20px; font-weight: 700; border-top: 1px solid #E5E5E5;">${currencySymbol}${data.total.toFixed(2)}</td>
                  </tr>
                </table>
              </div>

              <!-- Shipping Address -->
              <p style="color: #000000; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Shipping Address</p>
              <div style="background-color: #FAFAFA; padding: 16px; margin-bottom: 24px; border: 1px solid #E5E5E5;">
                <p style="color: #000000; font-size: 14px; font-weight: 500; margin: 0 0 4px 0;">${data.customerName}</p>
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  ${data.shippingAddress.street}<br/>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
                  ${data.shippingAddress.country}
                </p>
              </div>

              <!-- CTA -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.orderUrl}"
                   style="display: inline-block; background-color: #000000; color: #FFFFFF; padding: 14px 40px; text-decoration: none; font-weight: 600; font-size: 14px; letter-spacing: 1px; text-transform: uppercase;">
                  View Order Details
                </a>
              </div>

              ${
                data.trackingUrl
                  ? `
              <div style="background-color: #FFFFFF; border-left: 3px solid #CBB57B; padding: 16px 20px; margin-top: 24px;">
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong style="color: #000000;">Track Your Package:</strong><br/>
                  <a href="${data.trackingUrl}" style="color: #000000; text-decoration: underline;">Click here to track your shipment</a>
                </p>
              </div>
              `
                  : ''
              }

              <!-- Support -->
              <div style="background-color: #FAFAFA; border-left: 3px solid #E5E5E5; padding: 16px 20px; margin-top: 24px;">
                <p style="color: #525252; font-size: 13px; line-height: 1.6; margin: 0;">
                  <strong style="color: #000000;">Need Help?</strong> If you have any questions about your order, please contact our support team.
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
                You're receiving this email because you placed an order on our website.
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
