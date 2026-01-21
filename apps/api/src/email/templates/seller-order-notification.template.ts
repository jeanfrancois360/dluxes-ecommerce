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
      <td style="padding: 16px; border-bottom: 1px solid #E5E5E5;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" style="width: 64px; height: 64px; object-fit: cover; border-radius: 8px;" />`
              : ''
          }
          <div>
            <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 4px 0;">
              ${item.name}
            </p>
            <p style="color: #737373; font-size: 14px; margin: 0;">
              SKU: ${item.sku || 'N/A'} • Qty: ${item.quantity}
            </p>
          </div>
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #E5E5E5; text-align: right; white-space: nowrap;">
        <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">
          ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
        </p>
      </td>
    </tr>
  `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
    <div style="max-width: 650px; margin: 0 auto; padding: 40px 20px;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="background-color: rgba(255, 255, 255, 0.2); display: inline-block; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
          <svg style="width: 48px; height: 48px; color: #FFFFFF;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h1 style="color: #FFFFFF; font-size: 32px; margin: 0; font-weight: 700;">New Order Received!</h1>
        <p style="color: rgba(255, 255, 255, 0.9); font-size: 18px; margin: 12px 0 0;">You have a new sale</p>
      </div>

      <!-- Main Content -->
      <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
        <p style="color: #525252; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
          Hello ${data.sellerName},
        </p>

        <p style="color: #525252; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          Great news! Your store <strong>${data.storeName}</strong> has received a new order. Please prepare these items for shipment.
        </p>

        <!-- Order & Store Info -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px;">
          <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-left: 4px solid #10B981; padding: 20px; border-radius: 8px;">
            <p style="color: #737373; font-size: 14px; margin: 0 0 4px 0;">Order Number</p>
            <p style="color: #000000; font-size: 20px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">
              #${data.orderNumber}
            </p>
          </div>
          <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px;">
            <p style="color: #737373; font-size: 14px; margin: 0 0 4px 0;">Customer</p>
            <p style="color: #000000; font-size: 20px; font-weight: 700; margin: 0;">
              ${data.customerName}
            </p>
          </div>
        </div>

        <!-- Order Items -->
        <h2 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #E5E5E5;">
          Items to Ship
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          ${itemsHtml}
        </table>

        <!-- Financial Summary -->
        <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); padding: 24px; border-radius: 12px; margin-bottom: 32px; border: 2px solid #10B981;">
          <h3 style="color: #000000; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
            💰 Your Earnings
          </h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #737373; font-size: 15px;">Order Subtotal</td>
              <td style="padding: 8px 0; text-align: right; color: #000000; font-size: 15px; font-weight: 500;">
                ${currencySymbol}${data.subtotal.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #737373; font-size: 15px;">
                Platform Commission (${data.commissionRate.toFixed(1)}%)
              </td>
              <td style="padding: 8px 0; text-align: right; color: #DC2626; font-size: 15px; font-weight: 500;">
                -${currencySymbol}${data.commission.toFixed(2)}
              </td>
            </tr>
            <tr style="border-top: 2px solid #10B981;">
              <td style="padding: 16px 0 0 0; color: #000000; font-size: 18px; font-weight: 700;">Your Payout</td>
              <td style="padding: 16px 0 0 0; text-align: right; color: #10B981; font-size: 24px; font-weight: 700;">
                ${currencySymbol}${data.netPayout.toFixed(2)}
              </td>
            </tr>
          </table>

          <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 16px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #92400E; font-size: 13px; line-height: 1.6; margin: 0;">
              <strong>💡 Payout Schedule:</strong> Your earnings will be automatically transferred to your account based on your payout schedule (weekly/monthly).
            </p>
          </div>
        </div>

        <!-- Shipping Address -->
        <h3 style="color: #000000; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
          📦 Ship To
        </h3>
        <div style="background-color: #FAFAFA; padding: 20px; border-radius: 8px; margin-bottom: 32px; border: 1px solid #E5E5E5;">
          <p style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 8px 0;">
            ${data.customerName}
          </p>
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
            ${data.shippingAddress.street}<br/>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
            ${data.shippingAddress.country}
          </p>
        </div>

        <!-- Action Required -->
        <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); border-left: 4px solid #3B82F6; padding: 24px; border-radius: 8px; margin-bottom: 32px;">
          <p style="color: #1E40AF; font-size: 15px; line-height: 1.6; margin: 0 0 4px 0;">
            <strong style="color: #000000; font-size: 16px;">⚡ Action Required:</strong>
          </p>
          <ul style="color: #1E40AF; font-size: 14px; line-height: 1.8; margin: 8px 0 0 0; padding-left: 20px;">
            <li>Prepare the items for shipment</li>
            <li>Update the order status in your dashboard</li>
            <li>Add tracking information once shipped</li>
            <li>Ship within 2 business days to maintain your seller rating</li>
          </ul>
        </div>

        <!-- CTA Buttons -->
        <div style="text-align: center; margin: 32px 0; display: flex; gap: 12px; justify-content: center;">
          <a href="${data.orderUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
            View Order Details
          </a>
          <a href="${data.dashboardUrl}"
             style="display: inline-block; background: #FFFFFF; color: #10B981; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px; border: 2px solid #10B981;">
            Go to Dashboard
          </a>
        </div>

        <!-- Tips Section -->
        <div style="border-top: 1px solid #E5E5E5; margin-top: 32px; padding-top: 24px;">
          <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0 0 12px 0;">
            <strong style="color: #000000;">💡 Seller Tips:</strong>
          </p>
          <ul style="color: #737373; font-size: 13px; line-height: 1.8; margin: 0; padding-left: 20px;">
            <li>Pack items securely to prevent damage during shipping</li>
            <li>Include packing slip with order number and customer details</li>
            <li>Use quality shipping materials and proper padding</li>
            <li>Ship promptly to ensure excellent customer experience</li>
          </ul>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px;">
        <p style="color: #A3A3A3; font-size: 12px; margin: 0 0 8px 0;">
          © ${new Date().getFullYear()} NextPik E-commerce. All rights reserved.
        </p>
        <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
          You're receiving this email because you're a seller on our platform.
        </p>
      </div>
    </div>
  </body>
</html>
  `;
}
