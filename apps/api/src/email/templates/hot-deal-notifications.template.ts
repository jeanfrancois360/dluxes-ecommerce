import { baseEmailTemplate } from './base.template';

const FONT = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

// ─── Deal Activated (after payment) ─────────────────────────────────────────

interface DealActivatedData {
  userName: string;
  dealTitle: string;
  dealUrl: string;
  expiresAt: string; // formatted date/time string
  city: string;
  category: string;
  frontendUrl?: string;
}

export function hotDealActivatedTemplate(data: DealActivatedData): string {
  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      Your request is live!
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.userName}, your service request has been published and is now visible to providers in your area.
    </p>

    <!-- Deal details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0; background-color: #F9FAFB; border: 1px solid #E5E7EB;">
      <tr>
        <td style="padding: 20px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 12px 0; font-family: ${FONT};">Request Details</p>
          <table cellpadding="0" cellspacing="0" role="presentation" width="100%">
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Title</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.dealTitle}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Category</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: ${FONT};">${data.category}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Location</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-family: ${FONT};">${data.city}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #6B7280; font-size: 13px; font-family: ${FONT};">Expires</td>
              <td style="padding: 4px 0; text-align: right; color: #0A0A0A; font-size: 13px; font-weight: 600; font-family: ${FONT};">${data.expiresAt}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dealUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; white-space: nowrap;">
            View Your Request &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      You'll receive an email each time a service provider responds. Your request will automatically expire after 24 hours.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your request "${data.dealTitle}" is now live in ${data.city}`,
    frontendUrl: data.frontendUrl,
  });
}

// ─── New Response Received ──────────────────────────────────────────────────

interface NewResponseData {
  ownerName: string;
  dealTitle: string;
  dealUrl: string;
  responderName: string;
  responseMessage: string;
  responseCount: number;
  frontendUrl?: string;
}

export function hotDealNewResponseTemplate(data: NewResponseData): string {
  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      New response to your request
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.ownerName}, someone has responded to your service request. You now have ${data.responseCount} ${data.responseCount === 1 ? 'response' : 'responses'}.
    </p>

    <!-- Request title -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 24px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #CBB57B; padding: 14px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: ${FONT};">Your Request</p>
          <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0; font-family: ${FONT};">${data.dealTitle}</p>
        </td>
      </tr>
    </table>

    <!-- Response -->
    <p style="color: #0A0A0A; font-size: 13px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 2px 0; padding-bottom: 10px; border-bottom: 2px solid #0A0A0A; font-family: ${FONT};">
      Response from ${data.responderName}
    </p>
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="padding: 16px 0;">
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0; font-family: ${FONT}; white-space: pre-wrap;">${data.responseMessage}</p>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.dealUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; white-space: nowrap;">
            View All Responses &rarr;
          </a>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      Once you've found the right provider, mark your request as fulfilled from the request page.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `${data.responderName} responded to "${data.dealTitle}"`,
    frontendUrl: data.frontendUrl,
  });
}

// ─── Deal Expired ───────────────────────────────────────────────────────────

interface DealExpiredData {
  userName: string;
  dealTitle: string;
  newDealUrl: string;
  city: string;
  frontendUrl?: string;
}

export function hotDealExpiredTemplate(data: DealExpiredData): string {
  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      Your request has expired
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.userName}, your service request in ${data.city} has reached its 24-hour limit and is no longer visible to providers.
    </p>

    <!-- Deal title -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F9FAFB; border-left: 3px solid #9CA3AF; padding: 14px 18px;">
          <p style="color: #9CA3AF; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: ${FONT};">Expired Request</p>
          <p style="color: #6B7280; font-size: 14px; font-weight: 600; margin: 0; font-family: ${FONT};">${data.dealTitle}</p>
        </td>
      </tr>
    </table>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Still need help? You can post a new request for just $1.
    </p>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" role="presentation" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #0A0A0A; padding: 13px 28px;">
          <a href="${data.newDealUrl}" style="color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 600; font-family: ${FONT}; letter-spacing: 0.2px; white-space: nowrap;">
            Post New Request &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your request "${data.dealTitle}" has expired`,
    frontendUrl: data.frontendUrl,
  });
}

// ─── Deal Fulfilled ─────────────────────────────────────────────────────────

interface DealFulfilledData {
  userName: string;
  dealTitle: string;
  city: string;
  responseCount: number;
  frontendUrl?: string;
}

export function hotDealFulfilledTemplate(data: DealFulfilledData): string {
  const content = `
    <h1 style="color: #111827; font-size: 24px; font-weight: 700; margin: 0 0 8px 0; font-family: ${FONT}; letter-spacing: -0.3px;">
      Request fulfilled &#x2713;
    </h1>

    <p style="color: #4B5563; font-size: 15px; line-height: 1.65; margin: 0 0 28px 0; font-family: ${FONT};">
      Hi ${data.userName}, your service request has been marked as fulfilled. We're glad you found the help you needed!
    </p>

    <!-- Deal details -->
    <table cellpadding="0" cellspacing="0" role="presentation" width="100%" style="margin: 0 0 28px 0;">
      <tr>
        <td style="background-color: #F0FDF4; border-left: 3px solid #22C55E; padding: 14px 18px;">
          <p style="color: #15803D; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 4px 0; font-family: ${FONT};">Fulfilled</p>
          <p style="color: #0A0A0A; font-size: 14px; font-weight: 600; margin: 0 0 6px 0; font-family: ${FONT};">${data.dealTitle}</p>
          <p style="color: #6B7280; font-size: 13px; margin: 0; font-family: ${FONT};">${data.city} &middot; ${data.responseCount} ${data.responseCount === 1 ? 'response' : 'responses'} received</p>
        </td>
      </tr>
    </table>

    <p style="color: #9CA3AF; font-size: 13px; line-height: 1.6; margin: 0; font-family: ${FONT};">
      Thank you for using NextPik to connect with local service providers.
    </p>
  `;

  return baseEmailTemplate(content, {
    preheader: `Your request "${data.dealTitle}" has been fulfilled`,
    frontendUrl: data.frontendUrl,
  });
}
