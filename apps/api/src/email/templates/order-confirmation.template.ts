import { baseEmailTemplate } from './base.template';

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
  frontendUrl?: string;
}

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0;">${item.name}</p>
        <p style="color: #6B7280; font-size: 13px; margin: 0;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0;">${sym}${fmt(item.price * item.quantity)}</p>
        ${item.quantity > 1 ? `<p style="color: #9CA3AF; font-size: 12px; margin: 3px 0 0 0;">${sym}${fmt(item.price)} each</p>` : ''}
      </td>
    </tr>`
    )
    .join('');

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Order confirmed
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.customerName}, we've received your order and it's being prepared.
    </p>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order number</p>
          <p style="color: #0A0A0A; font-size: 18px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">#${data.orderNumber}</p>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px 0; padding-bottom: 10px; border-bottom: 2px solid #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Items
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      ${itemsHtml}
    </table>

    <!-- Totals -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 0;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Subtotal</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Shipping</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.shipping)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0 14px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Tax</td>
              <td style="padding: 6px 0 14px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.tax)}</td>
            </tr>
            <tr>
              <td style="padding: 14px 0; color: #0A0A0A; font-size: 15px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Total</td>
              <td style="padding: 14px 0; text-align: right; color: #0A0A0A; font-size: 18px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Shipping address -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Shipping address
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.customerName}</p>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            ${data.shippingAddress.street}<br />
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br />
            ${data.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order
          </a>
        </td>
      </tr>
    </table>

    ${
      data.trackingUrl
        ? `
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <strong style="color: #0A0A0A;">Track your shipment:</strong> <a href="${data.trackingUrl}" style="color: #0A0A0A; text-decoration: underline;">View tracking</a>
          </p>
        </td>
      </tr>
    </table>
    `
        : ''
    }

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about your order? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Order #${data.orderNumber} confirmed — ${sym}${fmt(data.total)}`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
