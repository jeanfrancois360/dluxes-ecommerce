import { baseEmailTemplate } from './base.template';

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

export type SellerAlertAction =
  | 'new_registration'
  | 'application_submitted'
  | 'application_resubmitted';

const ACTION_LABELS: Record<SellerAlertAction, { title: string; badge: string; color: string }> = {
  new_registration: {
    title: 'New seller account registered',
    badge: 'New Registration',
    color: '#1D4ED8',
  },
  application_submitted: {
    title: 'New seller application submitted',
    badge: 'Application Received',
    color: '#D97706',
  },
  application_resubmitted: {
    title: 'Seller application updated',
    badge: 'Application Updated',
    color: '#7C3AED',
  },
};

export const adminSellerAlertTemplate = (data: {
  action: SellerAlertAction;
  sellerName: string;
  sellerEmail: string;
  storeName: string;
  submittedAt: Date;
  reviewUrl: string;
  frontendUrl?: string;
}): string => {
  const siteUrl = data.frontendUrl || process.env.FRONTEND_URL || 'http://localhost:3000';
  const meta = ACTION_LABELS[data.action];

  const submittedDate = data.submittedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const content = `
    <!-- Badge -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 20px 0;">
      <tr>
        <td style="background-color: ${meta.color}; padding: 4px 12px; border-radius: 4px;">
          <span style="color: #FFFFFF; font-size: 12px; font-weight: 700; font-family: ${FONT}; letter-spacing: 0.5px; text-transform: uppercase;">${meta.badge}</span>
        </td>
      </tr>
    </table>

    <h1 style="color: #0A0A0A; font-size: 22px; font-weight: 700; margin: 0 0 12px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      ${meta.title}
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 24px 0; font-family: ${FONT};">
      A seller action requires your review. Please check the details below and take action from the admin panel.
    </p>

    <!-- Details card -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px;">
      <tr>
        <td style="padding: 20px 24px;">
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 7px 0; color: #6B7280; font-size: 13px; font-family: ${FONT}; width: 40%;">Seller name</td>
              <td style="padding: 7px 0; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.sellerName}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Email</td>
              <td style="padding: 7px 0; color: #0A0A0A; font-size: 13px; font-family: ${FONT};">${data.sellerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Store name</td>
              <td style="padding: 7px 0; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.storeName}</td>
            </tr>
            <tr>
              <td style="padding: 7px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Submitted at</td>
              <td style="padding: 7px 0; color: #0A0A0A; font-size: 13px; font-family: ${FONT};">${submittedDate}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 14px 28px; border-radius: 4px;">
          <a href="${data.reviewUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; white-space: nowrap;">
            Review in Admin Panel &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      This is an automated alert sent to NextPik administrators only.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${meta.title}: ${data.sellerName} — ${data.storeName}`,
    frontendUrl: siteUrl,
    showUnsubscribe: false,
    footerNote: 'You received this alert because you are a NextPik administrator.',
  });
};
