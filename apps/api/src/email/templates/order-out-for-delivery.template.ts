import { baseEmailTemplate, orderProgressTracker } from './base.template';

interface OrderOutForDeliveryData {
  customerName: string;
  orderNumber: string;
  orderId: string;
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: string;
  trackingUrl?: string;
  orderUrl: string;
  frontendUrl?: string;
}

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export function orderOutForDeliveryTemplate(data: OrderOutForDeliveryData): string {
  const content = `
    <h1 style="color: #111827; font-size: 26px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.5px;">
      Out for delivery today
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.customerName}! Order <strong style="color: #111827;">#${data.orderNumber}</strong> is with the delivery driver and should arrive today. Keep an eye out!
    </p>

    ${orderProgressTracker(2)}

    <!-- Delivery info card -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #0A0A0A; border-bottom: 3px solid #CBB57B;">
      <tr>
        <td style="padding: 22px 22px 18px;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 14px 0; font-family: ${FONT};">Delivery details</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            ${
              data.carrier
                ? `<tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Carrier</td>
              <td style="padding: 4px 0; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.carrier}</td>
            </tr>`
                : ''
            }
            ${
              data.trackingNumber
                ? `<tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Tracking</td>
              <td style="padding: 4px 0; text-align: right; color: #FFFFFF; font-size: 13px; font-weight: 600; font-family: 'Courier New', monospace; letter-spacing: 0.5px;">${data.trackingNumber}</td>
            </tr>`
                : ''
            }
            ${
              data.estimatedDelivery
                ? `<tr>
              <td style="padding: 4px 0; color: #9CA3AF; font-size: 13px; font-family: ${FONT};">Expected by</td>
              <td style="padding: 4px 0; text-align: right; color: #CBB57B; font-size: 13px; font-weight: 700; font-family: ${FONT};">${data.estimatedDelivery}</td>
            </tr>`
                : ''
            }
          </table>
          ${
            data.trackingUrl
              ? `<p style="margin: 14px 0 0 0;">
            <a href="${data.trackingUrl}" style="color: #CBB57B; font-size: 13px; font-weight: 600; text-decoration: underline; font-family: ${FONT};">
              Live tracking &rarr;
            </a>
          </p>`
              : ''
          }
        </td>
      </tr>
    </table>

    <!-- CTA (full width) -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 16px 28px;">
          <a href="${data.orderUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 15px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; display: block;">
            Track Your Order &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      Questions? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact" style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your order #${data.orderNumber} is out for delivery today!`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you placed an order on NextPik.',
  });
}
