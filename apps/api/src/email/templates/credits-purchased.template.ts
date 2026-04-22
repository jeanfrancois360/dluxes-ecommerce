import { baseEmailTemplate } from './base.template';

export const creditsPurchasedTemplate = (data: {
  sellerName: string;
  storeName: string;
  monthsPurchased: number;
  amountPaid: string;
  newBalance: number;
  expiryDate: string;
  dashboardUrl: string;
  invoiceUrl?: string;
  frontendUrl?: string;
}) => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const supportUrl = `${siteUrl}/contact`;

  const content = `
    <h1 style="color: #0A0A0A; font-size: 24px; font-weight: 700; margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -0.3px;">
      Payment confirmed
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Hello ${data.sellerName}, your selling credits for <strong style="color: #0A0A0A;">${data.storeName}</strong> have been added.
    </p>

    <!-- Balance banner -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td align="center" style="background-color: #0A0A0A; padding: 28px 24px; border-bottom: 3px solid #CBB57B;">
          <p style="color: #CBB57B; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Credit balance
          </p>
          <p style="color: #FFFFFF; font-size: 48px; font-weight: 700; margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: -1px;">
            ${data.newBalance}
          </p>
          <p style="color: #9CA3AF; font-size: 13px; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            month${data.newBalance !== 1 ? 's' : ''} remaining
          </p>
        </td>
      </tr>
    </table>

    <!-- Purchase details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px 20px 14px;">
          <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Purchase details
          </p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Store</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.storeName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Credits purchased</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.monthsPurchased} month${data.monthsPurchased !== 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Amount charged</td>
              <td style="padding: 6px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">$${data.amountPaid}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #6B7280; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Valid until</td>
              <td style="padding: 6px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 500; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">${data.expiryDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            Your products are now active. Credits are deducted on the 1st of each month. You'll receive a notification before your balance runs low.
          </p>
        </td>
      </tr>
    </table>

    <!-- CTAs -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 14px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dashboardUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; letter-spacing: 0.2px; white-space: nowrap;">
            Go to Dashboard
          </a>
        </td>
      </tr>
    </table>

    ${
      data.invoiceUrl
        ? `
    <p style="margin: 0 0 24px 0;">
      <a href="${data.invoiceUrl}" style="color: #6B7280; text-decoration: underline; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        Download invoice
      </a>
    </p>
    `
        : ''
    }

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      Questions about billing? <a href="${supportUrl}" style="color: #4B5563; text-decoration: underline;">Contact support</a>
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${data.monthsPurchased} month${data.monthsPurchased !== 1 ? 's' : ''} of credits added to ${data.storeName}.`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this email because you are a NextPik seller.',
  });
};
