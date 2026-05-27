import { baseEmailTemplate, orderProgressTracker } from './base.template';

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
  discount?: number;
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

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function orderConfirmationTemplate(data: OrderConfirmationData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';

  const itemsHtml = data.items
    .map((item) => {
      const imageCell = item.image
        ? `<td width="60" valign="top" style="padding: 14px 14px 14px 0;">
            <img src="${item.image}" alt="${item.name}" width="60" height="60" style="display: block; width: 60px; height: 60px; object-fit: cover; border: 1px solid #E5E7EB;" />
          </td>`
        : `<td width="60" valign="top" style="padding: 14px 14px 14px 0;">
            <table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td width="60" height="60" align="center" valign="middle" style="background-color: #F3F4F6; border: 1px solid #E5E7EB;">
                <p style="color: #9CA3AF; font-size: 10px; font-weight: 600; text-transform: uppercase; margin: 0; font-family: ${FONT};">${item.name.charAt(0)}</p>
              </td>
            </tr></table>
          </td>`;
      return `
    <tr>
      ${imageCell}
      <td valign="top" style="padding: 14px 0; border-bottom: 1px solid #F3F4F6; font-family: ${FONT};">
        <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${item.name}</p>
        <p style="color: #6B7280; font-size: 13px; margin: 0;">Qty: ${item.quantity}</p>
      </td>
      <td valign="top" align="right" style="padding: 14px 0; border-bottom: 1px solid #F3F4F6; text-align: right; font-family: ${FONT}; white-space: nowrap;">
        <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0;">${sym}${fmt(item.price * item.quantity)}</p>
        ${item.quantity > 1 ? `<p style="color: #9CA3AF; font-size: 12px; margin: 3px 0 0 0;">${sym}${fmt(item.price)} each</p>` : ''}
      </td>
    </tr>`;
    })
    .join('');

  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.5px;">
      Order confirmed &#x2713;
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.customerName}, thank you for your purchase. We've received your order and it's being prepared by the seller.
    </p>

    <!-- Order number -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 4px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: ${FONT};">Order number</p>
          <p style="color: #111827; font-size: 20px; font-weight: 700; margin: 0; font-family: ${FONT}; letter-spacing: -0.3px;">#${data.orderNumber}</p>
        </td>
      </tr>
    </table>

    ${orderProgressTracker(0)}

    <!-- Items -->
    <p style="color: #111827; font-size: 12px; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase; margin: 0; padding-bottom: 10px; border-bottom: 2px solid #111827; font-family: ${FONT};">
      Items ordered (${data.items.length})
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
              <td style="padding: 5px 0; color: #6B7280; font-size: 14px; font-family: ${FONT};">Subtotal</td>
              <td style="padding: 5px 0; text-align: right; color: #111827; font-size: 14px; font-family: ${FONT};">${sym}${fmt(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6B7280; font-size: 14px; font-family: ${FONT};">Shipping</td>
              <td style="padding: 5px 0; text-align: right; color: #111827; font-size: 14px; font-family: ${FONT};">
                ${data.shipping === 0 ? '<span style="color: #059669; font-weight: 600;">Free</span>' : `${sym}${fmt(data.shipping)}`}
              </td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #6B7280; font-size: 14px; font-family: ${FONT};">Tax</td>
              <td style="padding: 5px 0; text-align: right; color: #111827; font-size: 14px; font-family: ${FONT};">${sym}${fmt(data.tax)}</td>
            </tr>
            ${
              data.discount && data.discount > 0
                ? `<tr>
              <td style="padding: 5px 0 14px 0; color: #059669; font-size: 14px; font-family: ${FONT};">Store credit applied</td>
              <td style="padding: 5px 0 14px 0; text-align: right; color: #059669; font-size: 14px; font-weight: 600; font-family: ${FONT};">&minus;${sym}${fmt(data.discount)}</td>
            </tr>`
                : ''
            }
            <tr>
              <td style="padding: 16px 0; color: #111827; font-size: 16px; font-weight: 700; border-top: 2px solid #111827; font-family: ${FONT};">Total</td>
              <td style="padding: 16px 0; text-align: right; color: #111827; font-size: 20px; font-weight: 700; border-top: 2px solid #111827; font-family: ${FONT};">${sym}${fmt(data.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Shipping address -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 16px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: ${FONT};">Shipping to</p>
          <p style="color: #111827; font-size: 14px; font-weight: 600; margin: 0 0 4px 0; font-family: ${FONT};">${data.customerName}</p>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
            ${data.shippingAddress.street}<br />
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br />
            ${data.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    <!-- CTA (full width) -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; display: block;">
            View Order Details &rarr;
          </a>
        </td>
      </tr>
    </table>

    ${
      data.trackingUrl
        ? `
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 4px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
            <strong style="color: #111827;">Track your shipment:</strong>&nbsp;
            <a href="${data.trackingUrl}" style="color: #111827; text-decoration: underline; font-weight: 600;">View tracking &rarr;</a>
          </p>
        </td>
      </tr>
    </table>
    `
        : ''
    }

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
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
