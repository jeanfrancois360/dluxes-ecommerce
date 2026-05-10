import { baseEmailTemplate } from './base.template';

interface DigitalItem {
  name: string;
  format: string | null;
  fileName: string | null;
}

interface DigitalDownloadReadyData {
  customerName: string;
  orderNumber: string;
  items: DigitalItem[];
  downloadsUrl: string;
  frontendUrl?: string;
}

export function digitalDownloadReadyTemplate(data: DigitalDownloadReadyData): string {
  const itemRows = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
        <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 2px 0;
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          ${item.name}
        </p>
        ${item.fileName ? `<p style="color: #6B7280; font-size: 12px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${item.fileName}${item.format ? ` · ${item.format.toUpperCase()}` : ''}</p>` : ''}
      </td>
    </tr>`
    )
    .join('');

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0;
               font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; letter-spacing: -0.3px;">
      Your download is ready
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Hello ${data.customerName}, your payment for order <strong style="color: #0A0A0A;">#${data.orderNumber}</strong>
      was confirmed. Your digital file${data.items.length > 1 ? 's are' : ' is'} now available.
    </p>

    <!-- File list -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
              margin: 0 0 2px 0; padding-bottom: 10px; border-bottom: 2px solid #0A0A0A;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Your files
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      ${itemRows}
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #CBB57B; padding: 14px 32px;">
          <a href="${data.downloadsUrl}"
             style="color: #000000; text-decoration: none; font-size: 14px; font-weight: 700;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    letter-spacing: 0.2px; white-space: nowrap;">
            Go to My Downloads
          </a>
        </td>
      </tr>
    </table>

    <!-- Info box -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
            Your files are available any time in
            <a href="${data.downloadsUrl}" style="color: #0A0A0A; font-weight: 600; text-decoration: underline;">
              My Account → Downloads
            </a>.
            ${data.items.some(() => true) ? 'Download limits apply per purchase — check your product details.' : ''}
          </p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      Questions? Visit our <a href="${data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000'}/contact"
      style="color: #4B5563; text-decoration: underline;">Help Center</a>.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your digital file${data.items.length > 1 ? 's are' : ' is'} ready to download — Order #${data.orderNumber}`,
    frontendUrl: data.frontendUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you purchased a digital product on NextPik.',
  });
}
