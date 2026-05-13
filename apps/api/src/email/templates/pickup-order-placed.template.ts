import { baseEmailTemplate } from './base.template';

interface PickupItem {
  name: string;
  quantity: number;
  price: number;
}

interface PickupOrderPlacedData {
  customerName: string;
  orderNumber: string;
  pickupCode: string;
  storeName: string;
  storeAddress: string;
  pickupInstructions?: string;
  items: PickupItem[];
  subtotal: number;
  tax: number;
  pickupFee: number;
  total: number;
  currency: string;
  orderUrl: string;
  frontendUrl?: string;
}

export function pickupOrderPlacedTemplate(data: PickupOrderPlacedData): string {
  const sym = data.currency === 'USD' ? '$' : data.currency + ' ';
  const fmt = (n: number) => n.toFixed(2);

  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 2px 0;">${item.name}</p>
        <p style="color: #6B7280; font-size: 13px; margin: 0;">Qty: ${item.quantity}</p>
      </td>
      <td style="padding: 10px 0; border-bottom: 1px solid #E5E7EB; text-align: right; vertical-align: top; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0;">${sym}${fmt(item.price * item.quantity)}</p>
      </td>
    </tr>`
    )
    .join('');

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Pickup order confirmed
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.customerName},
    </p>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong> has been confirmed and will be ready for pickup soon.
    </p>

    <!-- Pickup code -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 28px 24px; border-bottom: 3px solid #CBB57B; text-align: center;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Your pickup code
          </p>
          <p style="color: #FFFFFF; font-size: 36px; font-weight: 700; letter-spacing: 6px; margin: 0; font-family: 'Courier New', 'Lucida Console', monospace;">
            ${data.pickupCode}
          </p>
          <p style="color: #9CA3AF; font-size: 13px; margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Show this code when collecting your order
          </p>
        </td>
      </tr>
    </table>

    <!-- Pickup location -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 16px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Pickup location
          </p>
          <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.storeName}</p>
          <p style="color: #4B5563; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.storeAddress}</p>
          ${
            data.pickupInstructions
              ? `<p style="color: #4B5563; font-size: 13px; margin: 10px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Instructions:</strong> ${data.pickupInstructions}</p>`
              : ''
          }
        </td>
      </tr>
    </table>

    <!-- Items -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px 0; padding-bottom: 10px; border-bottom: 2px solid #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Order summary
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 4px 0;">
      ${itemRows}
    </table>

    <!-- Totals -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 16px 20px 12px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Subtotal</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Pickup fee</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.pickupFee)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0 12px 0; color: #6B7280; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Tax</td>
              <td style="padding: 4px 0 12px 0; text-align: right; color: #0A0A0A; font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.tax)}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0 0 0; color: #0A0A0A; font-size: 15px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Total</td>
              <td style="padding: 12px 0 0 0; text-align: right; color: #0A0A0A; font-size: 18px; font-weight: 700; border-top: 1px solid #E5E7EB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${sym}${fmt(data.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            View Order Details
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      You'll receive another email when your order is ready for pickup. Questions? <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Contact support</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your pickup order #${data.orderNumber} is confirmed. Pickup code: ${data.pickupCode}`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
