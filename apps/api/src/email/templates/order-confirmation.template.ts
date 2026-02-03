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
              Quantity: ${item.quantity}
            </p>
          </div>
        </div>
      </td>
      <td style="padding: 16px; border-bottom: 1px solid #E5E5E5; text-align: right; white-space: nowrap;">
        <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0;">
          ${currencySymbol}${(item.price * item.quantity).toFixed(2)}
        </p>
        <p style="color: #737373; font-size: 14px; margin: 4px 0 0 0;">
          ${currencySymbol}${item.price.toFixed(2)} each
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
      <div style="background: linear-gradient(135deg, #CBB57B 0%, #a89158 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
        <div style="background-color: rgba(255, 255, 255, 0.2); display: inline-block; padding: 16px; border-radius: 50%; margin-bottom: 16px;">
          <svg style="width: 48px; height: 48px; color: #FFFFFF;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 style="color: #FFFFFF; font-size: 32px; margin: 0; font-weight: 700;">Order Confirmed!</h1>
        <p style="color: rgba(255, 255, 255, 0.9); font-size: 18px; margin: 12px 0 0;">Thank you for your purchase</p>
      </div>

      <!-- Main Content -->
      <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
        <p style="color: #525252; font-size: 16px; line-height: 1.6; margin: 0 0 8px 0;">
          Hello ${data.customerName},
        </p>

        <p style="color: #525252; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
          We've received your order and are getting it ready. You'll receive a shipping confirmation email with tracking information once your order ships.
        </p>

        <!-- Order Number -->
        <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); border-left: 4px solid #CBB57B; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <p style="color: #737373; font-size: 14px; margin: 0 0 4px 0;">Order Number</p>
          <p style="color: #000000; font-size: 24px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">
            #${data.orderNumber}
          </p>
        </div>

        <!-- Order Items -->
        <h2 style="color: #000000; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; padding-bottom: 12px; border-bottom: 2px solid #E5E5E5;">
          Order Items
        </h2>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
          ${itemsHtml}
        </table>

        <!-- Order Summary -->
        <div style="background-color: #FAFAFA; padding: 24px; border-radius: 12px; margin-bottom: 32px;">
          <h3 style="color: #000000; font-size: 18px; font-weight: 700; margin: 0 0 16px 0;">
            Order Summary
          </h3>

          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #737373; font-size: 15px;">Subtotal</td>
              <td style="padding: 8px 0; text-align: right; color: #000000; font-size: 15px; font-weight: 500;">
                ${currencySymbol}${data.subtotal.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #737373; font-size: 15px;">Shipping</td>
              <td style="padding: 8px 0; text-align: right; color: #000000; font-size: 15px; font-weight: 500;">
                ${currencySymbol}${data.shipping.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #737373; font-size: 15px;">Tax</td>
              <td style="padding: 8px 0; text-align: right; color: #000000; font-size: 15px; font-weight: 500;">
                ${currencySymbol}${data.tax.toFixed(2)}
              </td>
            </tr>
            <tr style="border-top: 2px solid #E5E5E5;">
              <td style="padding: 16px 0 0 0; color: #000000; font-size: 18px; font-weight: 700;">Total</td>
              <td style="padding: 16px 0 0 0; text-align: right; color: #CBB57B; font-size: 24px; font-weight: 700;">
                ${currencySymbol}${data.total.toFixed(2)}
              </td>
            </tr>
          </table>
        </div>

        <!-- Shipping Address -->
        <h3 style="color: #000000; font-size: 18px; font-weight: 700; margin: 0 0 12px 0;">
          Shipping Address
        </h3>
        <div style="background-color: #FAFAFA; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <p style="color: #000000; font-size: 15px; font-weight: 600; margin: 0 0 4px 0;">
            ${data.customerName}
          </p>
          <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
            ${data.shippingAddress.street}<br/>
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br/>
            ${data.shippingAddress.country}
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0;">
          <a href="${data.orderUrl}"
             style="display: inline-block; background: linear-gradient(135deg, #CBB57B 0%, #a89158 100%); color: #FFFFFF; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(203, 181, 123, 0.3);">
            View Order Details
          </a>
        </div>

        ${
          data.trackingUrl
            ? `
        <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin: 24px 0;">
          <p style="color: #1E40AF; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong style="color: #000000;">📦 Track Your Package:</strong><br/>
            <a href="${data.trackingUrl}" style="color: #3B82F6; text-decoration: none;">Click here to track your shipment</a>
          </p>
        </div>
        `
            : ''
        }

        <!-- Support Info -->
        <div style="border-top: 1px solid #E5E5E5; margin-top: 32px; padding-top: 24px;">
          <p style="color: #737373; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong style="color: #000000;">Need Help?</strong><br/>
            If you have any questions about your order, please don't hesitate to contact our support team. We're here to help!
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="text-align: center; padding-top: 24px;">
        <p style="color: #A3A3A3; font-size: 12px; margin: 0 0 8px 0;">
          © ${new Date().getFullYear()} NextPik E-commerce. All rights reserved.
        </p>
        <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
          You're receiving this email because you placed an order on our website.
        </p>
      </div>
    </div>
  </body>
</html>
  `;
}
