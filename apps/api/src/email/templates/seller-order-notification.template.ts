import { baseEmailTemplate } from './base.template';

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
  transactionFee?: number;
  transactionFeeRate?: number;
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
  frontendUrl?: string;
}

export function sellerOrderNotificationTemplate(data: SellerOrderNotificationData): string {
  const fmt = (n: number) => n.toFixed(2);
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';

  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 11px 0; border-bottom: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 3px 0;">${item.name}</p>
        <p style="color: #6B7280; font-size: 12px; margin: 0;">
          ${item.sku ? `SKU: ${item.sku} &nbsp;|&nbsp;` : ''}Qty: ${item.quantity}
        </p>
      </td>
      <td style="padding: 11px 0; border-bottom: 1px solid #E5E7EB; text-align: right; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0;">${sym}${fmt(item.price * item.quantity)}</p>
      </td>
    </tr>`
    )
    .join('');

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      New order received
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, <strong style="color: #0A0A0A;">${data.storeName}</strong> has a new order from ${data.customerName}.
    </p>

    <!-- Order / customer row -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td width="49%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 14px 16px; vertical-align: top;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order</p>
          <p style="color: #0A0A0A; font-size: 15px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">#${data.orderNumber}</p>
        </td>
        <td width="2%"></td>
        <td width="49%" style="background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 14px 16px; vertical-align: top;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Customer</p>
          <p style="color: #0A0A0A; font-size: 15px; font-weight: 700; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.customerName}</p>
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px 0; padding-bottom: 10px; border-bottom: 2px solid #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Items to ship
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      ${itemsHtml}
    </table>

    <!-- Earnings -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 0;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Earnings breakdown
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Order subtotal</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Platform commission (${data.commissionRate.toFixed(1)}%)</td>
              <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&minus;${sym}${fmt(data.commission)}</td>
            </tr>
            ${
              data.transactionFee && data.transactionFee > 0
                ? `
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Processing fee${data.transactionFeeRate ? ` (${data.transactionFeeRate.toFixed(2)}%)` : ''}</td>
              <td style="padding: 6px 0; text-align: right; color: #DC2626; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&minus;${sym}${fmt(data.transactionFee)}</td>
            </tr>
            `
                : ''
            }
            <tr>
              <td style="padding: 14px 0; color: #0A0A0A; font-size: 14px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your payout</td>
              <td style="padding: 14px 0; text-align: right; color: #0A0A0A; font-size: 18px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.netPayout)}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 20px 16px;">
          <p style="color: #9CA3AF; font-size: 12px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Payout is processed after the order is delivered and confirmed.
          </p>
        </td>
      </tr>
    </table>

    <!-- Ship to -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Ship to
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 14px 18px;">
          <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.customerName}</p>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            ${data.shippingAddress.street}<br />
            ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zipCode}<br />
            ${data.shippingAddress.country}
          </p>
        </td>
      </tr>
    </table>

    <!-- Action required -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Action required</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Prepare items for shipment</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Update order status in your dashboard</td></tr>
            <tr><td style="padding: 3px 0; color: #4B5563; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#x2014; Add tracking information once shipped</td></tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 16px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order
          </a>
        </td>
      </tr>
    </table>

    <p style="margin: 0;">
      <a href="${data.dashboardUrl}" style="color: #6B7280; text-decoration: underline; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        Go to seller dashboard
      </a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `New order #${data.orderNumber} from ${data.customerName} — ${sym}${fmt(data.netPayout)} net payout.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
}
