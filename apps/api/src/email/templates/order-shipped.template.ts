import { baseEmailTemplate, orderProgressTracker } from './base.template';

interface OrderShippedData {
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  orderUrl: string;
  frontendUrl?: string;
}

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function orderShippedTemplate(data: OrderShippedData): string {
  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.5px;">
      Your order is on its way
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.customerName}, great news! Order <strong style="color: #111827;">#${data.orderNumber}</strong> has been handed to the carrier and is now in transit.
    </p>

    ${orderProgressTracker(2)}

    ${
      data.trackingNumber
        ? `
    <!-- Tracking card -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #0A0A0A; border-bottom: 3px solid #CBB57B;">
      <tr>
        <td style="padding: 24px 24px 20px;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 16px 0; font-family: ${FONT};">Tracking information</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            ${
              data.carrier
                ? `<tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Carrier</td>
              <td style="padding: 4px 0; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.carrier}</td>
            </tr>`
                : ''
            }
            <tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Tracking number</td>
              <td style="padding: 4px 0; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 0.5px;">${data.trackingNumber}</td>
            </tr>
            ${
              data.estimatedDelivery
                ? `<tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Est. delivery</td>
              <td style="padding: 4px 0; text-align: right; color: #CBB57B; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.estimatedDelivery}</td>
            </tr>`
                : ''
            }
          </table>
          ${
            data.trackingUrl
              ? `<table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 16px 0 0 0;">
            <tr>
              <td>
                <a href="${data.trackingUrl}" style="color: #CBB57B; font-size: 13px; font-weight: 600; text-decoration: underline; font-family: ${FONT};">
                  Track with carrier &rarr;
                </a>
              </td>
            </tr>
          </table>`
              : ''
          }
        </td>
      </tr>
    </table>
    `
        : ''
    }

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

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      We'll email you again when your order is delivered. Questions? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your order #${data.orderNumber} is on its way${data.carrier ? ` via ${data.carrier}` : ''}.`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
