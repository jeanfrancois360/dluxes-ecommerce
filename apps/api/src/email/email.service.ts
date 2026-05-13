import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailOTPType } from '@prisma/client';
import { magicLinkTemplate } from './templates/magic-link.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';
import { getEmailOTPTemplate } from './templates/email-otp.template';
import { orderConfirmationTemplate } from './templates/order-confirmation.template';
import { sellerOrderNotificationTemplate } from './templates/seller-order-notification.template';
import { sellerApplicationSubmittedTemplate } from './templates/seller-application-submitted.template';
import { sellerApprovedTemplate } from './templates/seller-approved.template';
import { sellerRejectedTemplate } from './templates/seller-rejected.template';
import { sellerSuspendedTemplate } from './templates/seller-suspended.template';
import { payoutScheduledTemplate } from './templates/payout-scheduled.template';
import { payoutCompletedTemplate } from './templates/payout-completed.template';
import { payoutFailedTemplate } from './templates/payout-failed.template';
import { creditsLowWarningTemplate } from './templates/credits-low-warning.template';
import { gracePeriodEndingTemplate } from './templates/grace-period-ending.template';
import { emailVerificationTemplate } from './templates/email-verification.template';
import { twoFactorEnabledTemplate } from './templates/two-factor-enabled.template';
import { digitalDownloadReadyTemplate } from './templates/digital-download-ready.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      this.logger.warn('RESEND_API_KEY not found. Email functionality will be disabled.');
    }

    this.resend = new Resend(apiKey || 'dummy-key');
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@nextpik.com';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  /**
   * Send magic link email
   */
  async sendMagicLink(email: string, name: string, token: string): Promise<boolean> {
    try {
      const magicLink = `${this.frontendUrl}/auth/magic-link?token=${token}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`🔗 MAGIC LINK FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Name: ${name}`);
        this.logger.log(`Link: ${magicLink}`);
        this.logger.log(`Token: ${token}`);
        this.logger.warn('='.repeat(80));
        // Return true to indicate the token was generated successfully
        return true;
      }

      const html = magicLinkTemplate(name, magicLink, this.frontendUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Your Magic Link - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send magic link email', error);
        return false;
      }

      this.logger.log(`Magic link email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending magic link email', error);
      return false;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email: string, name: string, token: string): Promise<boolean> {
    try {
      const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`🔑 PASSWORD RESET LINK FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Name: ${name}`);
        this.logger.log(`Link: ${resetLink}`);
        this.logger.log(`Token: ${token}`);
        this.logger.warn('='.repeat(80));
        // Return true to indicate the token was generated successfully
        return true;
      }

      const html = passwordResetTemplate(name, resetLink, this.frontendUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Reset Your Password - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send password reset email', error);
        return false;
      }

      this.logger.log(`Password reset email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending password reset email', error);
      return false;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        return false;
      }

      const html = welcomeTemplate(name, this.frontendUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Welcome to NextPik, ${name}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send welcome email', error);
        return false;
      }

      this.logger.log(`Welcome email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending welcome email', error);
      return false;
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(email: string, name: string, token: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.log(`Email verification token for ${email}: ${token}`);
        this.logger.log(`Verification URL: ${this.frontendUrl}/auth/verify-email?token=${token}`);
        return false;
      }

      const verificationLink = `${this.frontendUrl}/auth/verify-email?token=${token}`;

      const html = emailVerificationTemplate(name, verificationLink, this.frontendUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Verify Your Email - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send email verification', error);
        return false;
      }

      this.logger.log(`Email verification sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email verification', error);
      return false;
    }
  }

  /**
   * Send 2FA setup email (notification)
   */
  async send2FAEnabledNotification(email: string, name: string): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        return false;
      }

      const html = twoFactorEnabledTemplate(name, this.frontendUrl);

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Two-Factor Authentication Enabled - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send 2FA notification email', error);
        return false;
      }

      this.logger.log(`2FA notification email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending 2FA notification email', error);
      return false;
    }
  }

  /**
   * Send product inquiry notification to admin
   */
  async sendProductInquiry(
    adminEmail: string,
    inquiryData: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      productName: string;
      productUrl: string;
      message: string;
    }
  ): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.log(
          `Product inquiry from ${inquiryData.customerEmail} for ${inquiryData.productName}`
        );
        return false;
      }

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #000000 0%, #1A1A1A 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">New Product Inquiry</h1>
                <p style="color: #D4AF37; font-size: 16px; margin: 12px 0 0;">A customer is interested in a product</p>
              </div>

              <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                <div style="background-color: #FAFAFA; border-left: 4px solid #D4AF37; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="color: #000000; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                    Product: ${inquiryData.productName}
                  </p>
                  <a href="${inquiryData.productUrl}" style="color: #3B82F6; font-size: 14px; text-decoration: none;">
                    View Product →
                  </a>
                </div>

                <h3 style="color: #000000; font-size: 18px; margin: 24px 0 12px 0; font-weight: 600;">Customer Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                      <strong style="color: #737373; font-size: 14px;">Name:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
                      <span style="color: #000000; font-size: 14px;">${inquiryData.customerName}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                      <strong style="color: #737373; font-size: 14px;">Email:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
                      <a href="mailto:${inquiryData.customerEmail}" style="color: #3B82F6; font-size: 14px; text-decoration: none;">
                        ${inquiryData.customerEmail}
                      </a>
                    </td>
                  </tr>
                  ${
                    inquiryData.customerPhone
                      ? `
                  <tr>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5;">
                      <strong style="color: #737373; font-size: 14px;">Phone:</strong>
                    </td>
                    <td style="padding: 12px 0; border-bottom: 1px solid #E5E5E5; text-align: right;">
                      <a href="tel:${inquiryData.customerPhone}" style="color: #3B82F6; font-size: 14px; text-decoration: none;">
                        ${inquiryData.customerPhone}
                      </a>
                    </td>
                  </tr>
                  `
                      : ''
                  }
                </table>

                <h3 style="color: #000000; font-size: 18px; margin: 24px 0 12px 0; font-weight: 600;">Message</h3>
                <div style="background-color: #FAFAFA; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                  <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">
                    ${inquiryData.message}
                  </p>
                </div>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="mailto:${inquiryData.customerEmail}?subject=Re: ${inquiryData.productName}"
                     style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    Reply to Customer
                  </a>
                </div>

                <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="color: #92400E; font-size: 14px; line-height: 1.6; margin: 0;">
                    <strong style="color: #000000;">⚡ Action Required:</strong><br/>
                    Please respond to this customer inquiry within 24 hours to maintain excellent service standards.
                  </p>
                </div>
              </div>

              <div style="text-align: center; padding-top: 24px;">
                <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} NextPik. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmail,
        replyTo: inquiryData.customerEmail,
        subject: `New Product Inquiry - ${inquiryData.productName}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send product inquiry email', error);
        return false;
      }

      this.logger.log(`Product inquiry email sent to ${adminEmail} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending product inquiry email', error);
      return false;
    }
  }

  /**
   * Send email OTP code
   */
  async sendEmailOTP(
    email: string,
    firstName: string,
    code: string,
    type: EmailOTPType,
    ipAddress?: string
  ): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.log(`Email OTP code for ${email}: ${code} (Type: ${type})`);
        return false;
      }

      const { subject, html } = getEmailOTPTemplate({
        firstName,
        code,
        expiresInMinutes: 10,
        type,
        ipAddress,
        timestamp: new Date(),
        frontendUrl: this.frontendUrl,
      });

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject,
        html,
      });

      if (error) {
        this.logger.error('Failed to send email OTP', error);
        return false;
      }

      this.logger.log(`Email OTP sent to ${email} (ID: ${data?.id}, Type: ${type})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending email OTP', error);
      return false;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(
    email: string,
    orderData: {
      orderNumber: string;
      customerName: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
      }>;
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
      orderId: string;
      trackingUrl?: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${orderData.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 ORDER CONFIRMATION FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${orderData.orderNumber}`);
        this.logger.log(`Total: ${orderData.currency} ${orderData.total.toFixed(2)}`);
        this.logger.log(`URL: ${orderUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = orderConfirmationTemplate({
        ...orderData,
        orderUrl,
      });

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Order Confirmation - #${orderData.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send order confirmation email', error);
        return false;
      }

      this.logger.log(`Order confirmation email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending order confirmation email', error);
      return false;
    }
  }

  /**
   * Send seller order notification email
   */
  async sendSellerOrderNotification(
    email: string,
    notificationData: {
      sellerName: string;
      storeName: string;
      orderNumber: string;
      customerName: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
        sku?: string;
      }>;
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
      orderId: string;
      sellerId: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/seller/orders/${notificationData.orderId}`;
      const dashboardUrl = `${this.frontendUrl}/seller`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER NOTIFICATION FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${notificationData.sellerName}`);
        this.logger.log(`Store: ${notificationData.storeName}`);
        this.logger.log(`Order: #${notificationData.orderNumber}`);
        this.logger.log(
          `Subtotal: ${notificationData.currency} ${notificationData.subtotal.toFixed(2)}`
        );
        this.logger.log(
          `Commission: -${notificationData.currency} ${notificationData.commission.toFixed(2)}`
        );
        if (notificationData.transactionFee) {
          this.logger.log(
            `Transaction Fee: -${notificationData.currency} ${notificationData.transactionFee.toFixed(2)}`
          );
        }
        this.logger.log(
          `Net Payout: ${notificationData.currency} ${notificationData.netPayout.toFixed(2)}`
        );
        this.logger.log(`URL: ${orderUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = sellerOrderNotificationTemplate({
        ...notificationData,
        orderUrl,
        dashboardUrl,
      });

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `New Order #${notificationData.orderNumber} - ${notificationData.storeName}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller notification email', error);
        return false;
      }

      this.logger.log(`Seller notification email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller notification email', error);
      return false;
    }
  }

  /**
   * Send payment confirmation email with invoice PDF attachment
   */
  async sendPaymentConfirmationWithInvoice(
    email: string,
    data: {
      orderNumber: string;
      customerName: string;
      total: number;
      currency: string;
      paidAt: Date;
      invoicePdf: Buffer;
    }
  ): Promise<boolean> {
    const { orderNumber, customerName, total, currency, paidAt, invoicePdf } = data;

    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping invoice email - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 INVOICE EMAIL FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Customer: ${customerName}`);
        this.logger.log(`Order: #${orderNumber}`);
        this.logger.log(`Amount: ${currency} ${total.toFixed(2)}`);
        this.logger.log(`Date: ${paidAt.toLocaleDateString()}`);
        this.logger.log(`Invoice PDF: ${invoicePdf.length} bytes`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const formattedTotal = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency || 'USD',
      }).format(total);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              padding: 30px 0;
              background: linear-gradient(135deg, #CBB57B 0%, #A89560 100%);
              color: white;
              border-radius: 8px 8px 0 0;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
            }
            .content {
              background: white;
              padding: 30px;
              border: 1px solid #e0e0e0;
              border-top: none;
            }
            .info-box {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border-left: 4px solid #CBB57B;
            }
            .info-box p {
              margin: 8px 0;
            }
            .info-box strong {
              color: #000;
              display: inline-block;
              min-width: 140px;
            }
            .total {
              font-size: 20px;
              color: #CBB57B;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
              border: 1px solid #e0e0e0;
              border-top: none;
              border-radius: 0 0 8px 8px;
              background: #f8f9fa;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: #CBB57B;
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✓ Payment Confirmed</h1>
          </div>

          <div class="content">
            <p>Dear ${customerName},</p>

            <p>Thank you for your payment! Your order has been confirmed and is being processed.</p>

            <div class="info-box">
              <p><strong>Order Number:</strong> #${orderNumber}</p>
              <p><strong>Payment Date:</strong> ${paidAt.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}</p>
              <p class="total"><strong>Amount Paid:</strong> ${formattedTotal}</p>
            </div>

            <p>Your invoice is attached to this email for your records.</p>

            <p>We'll send you another email with tracking information once your order ships.</p>

            <center>
              <a href="${this.frontendUrl}/orders" class="button">View Order Details</a>
            </center>

            <p>If you have any questions, please don't hesitate to contact our support team.</p>

            <p>Best regards,<br>The NextPik Team</p>
          </div>

          <div class="footer">
            <p>This is an automated email. Please do not reply directly to this message.</p>
            <p>For support, contact us at support@nextpik.com</p>
          </div>
        </body>
        </html>
      `;

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Payment Confirmed - Invoice #${orderNumber}`,
        html,
        attachments: [
          {
            filename: `invoice-${orderNumber}.pdf`,
            content: invoicePdf,
          },
        ],
      });

      if (error) {
        this.logger.error('Failed to send payment confirmation email with invoice', error);
        return false;
      }

      this.logger.log(`Payment confirmation with invoice sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending payment confirmation email with invoice', error);
      return false;
    }
  }

  /**
   * Send seller application submitted email
   */
  async sendSellerApplicationSubmitted(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      submittedAt: Date;
    }
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${this.frontendUrl}/become-seller/status`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER APPLICATION SUBMITTED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = sellerApplicationSubmittedTemplate({
        ...data,
        dashboardUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Seller Application Received - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller application email', error);
        return false;
      }

      this.logger.log(`Seller application email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller application email', error);
      return false;
    }
  }

  /**
   * Send seller approved email
   */
  async sendSellerApproved(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
    }
  ): Promise<boolean> {
    try {
      const creditsUrl = `${this.frontendUrl}/seller/credits`;
      const dashboardUrl = `${this.frontendUrl}/seller`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER APPROVED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = sellerApprovedTemplate({
        ...data,
        creditsUrl,
        dashboardUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Seller Application Approved - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller approved email', error);
        return false;
      }

      this.logger.log(`Seller approved email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller approved email', error);
      return false;
    }
  }

  /**
   * Send seller rejected email
   */
  async sendSellerRejected(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      rejectionReason: string;
    }
  ): Promise<boolean> {
    try {
      const supportUrl = `${this.frontendUrl}/contact`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER REJECTED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.log(`Reason: ${data.rejectionReason}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = sellerRejectedTemplate({
        ...data,
        supportUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Seller Application Update - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller rejected email', error);
        return false;
      }

      this.logger.log(`Seller rejected email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller rejected email', error);
      return false;
    }
  }

  /**
   * Send seller suspended email
   */
  async sendSellerSuspended(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      suspensionReason: string;
    }
  ): Promise<boolean> {
    try {
      const supportUrl = `${this.frontendUrl}/contact`;
      const dashboardUrl = `${this.frontendUrl}/seller`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER SUSPENDED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.log(`Reason: ${data.suspensionReason}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = sellerSuspendedTemplate({
        ...data,
        supportUrl,
        dashboardUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Important: Your Seller Account Has Been Suspended - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller suspended email', error);
        return false;
      }

      this.logger.log(`Seller suspended email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller suspended email', error);
      return false;
    }
  }

  /**
   * Send payout scheduled notification email
   */
  async sendPayoutScheduled(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      payoutId: string;
      amount: number;
      currency: string;
      commissionsCount: number;
      periodStart: string;
      periodEnd: string;
      scheduledDate: string;
      estimatedArrival: string;
      paymentMethod: string;
      sellerId: string;
    }
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${this.frontendUrl}/seller/earnings`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PAYOUT SCHEDULED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.log(`Amount: ${data.currency} ${data.amount.toFixed(2)}`);
        this.logger.log(`Scheduled: ${data.scheduledDate}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = payoutScheduledTemplate({
        ...data,
        dashboardUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Payout Scheduled - ${data.currency} ${data.amount.toFixed(2)}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send payout scheduled email', error);
        return false;
      }

      this.logger.log(`Payout scheduled email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending payout scheduled email', error);
      return false;
    }
  }

  /**
   * Send payout completed notification email
   */
  async sendPayoutCompleted(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      payoutId: string;
      amount: number;
      currency: string;
      commissionsCount: number;
      periodStart: string;
      periodEnd: string;
      completedDate: string;
      paymentMethod: string;
      paymentReference?: string;
      sellerId: string;
    }
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${this.frontendUrl}/seller/earnings`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PAYOUT COMPLETED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.log(`Amount: ${data.currency} ${data.amount.toFixed(2)}`);
        this.logger.log(`Completed: ${data.completedDate}`);
        if (data.paymentReference) {
          this.logger.log(`Reference: ${data.paymentReference}`);
        }
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = payoutCompletedTemplate({
        ...data,
        dashboardUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Payout Completed - ${data.currency} ${data.amount.toFixed(2)}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send payout completed email', error);
        return false;
      }

      this.logger.log(`Payout completed email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending payout completed email', error);
      return false;
    }
  }

  /**
   * Send payout failed notification email
   */
  async sendPayoutFailed(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      payoutId: string;
      amount: number;
      currency: string;
      commissionsCount: number;
      failureReason: string;
      failedDate: string;
      paymentMethod: string;
      sellerId: string;
    }
  ): Promise<boolean> {
    try {
      const dashboardUrl = `${this.frontendUrl}/seller/payout-settings`;
      const supportUrl = `${this.frontendUrl}/contact`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PAYOUT FAILED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Store: ${data.storeName}`);
        this.logger.log(`Amount: ${data.currency} ${data.amount.toFixed(2)}`);
        this.logger.log(`Reason: ${data.failureReason}`);
        this.logger.log(`Failed: ${data.failedDate}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = payoutFailedTemplate({
        ...data,
        dashboardUrl,
        supportUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: 'Payout Failed - Action Required - NextPik',
        html,
      });

      if (error) {
        this.logger.error('Failed to send payout failed email', error);
        return false;
      }

      this.logger.log(`Payout failed email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending payout failed email', error);
      return false;
    }
  }

  /**
   * Send digital download ready email — triggered after payment confirmation
   * when the order contains at least one DIGITAL product.
   */
  async sendDigitalDownloadReady(
    email: string,
    data: {
      customerName: string;
      orderNumber: string;
      items: Array<{ name: string; format: string | null; fileName: string | null }>;
      orderId: string;
    }
  ): Promise<boolean> {
    try {
      const downloadsUrl = `${this.frontendUrl}/account/downloads`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 DIGITAL DOWNLOAD READY FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${data.orderNumber}`);
        this.logger.log(`Files: ${data.items.map((i) => i.name).join(', ')}`);
        this.logger.log(`Downloads URL: ${downloadsUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = digitalDownloadReadyTemplate({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        items: data.items,
        downloadsUrl,
        frontendUrl: this.frontendUrl,
      });

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Your download is ready — Order #${data.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send digital download ready email', error);
        return false;
      }

      this.logger.log(`Digital download ready email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending digital download ready email', error);
      return false;
    }
  }

  // ============================================================================
  // SELF-PICKUP EMAIL NOTIFICATIONS (v2.10.0)
  // ============================================================================

  /**
   * Send pickup order placed notification to customer
   */
  async sendPickupOrderPlacedNotification(
    email: string,
    pickupData: {
      orderNumber: string;
      customerName: string;
      pickupCode: string;
      storeName: string;
      storeAddress: string;
      pickupInstructions?: string;
      items: Array<{
        name: string;
        quantity: number;
        price: number;
        image?: string;
      }>;
      subtotal: number;
      tax: number;
      pickupFee: number;
      total: number;
      currency: string;
      orderId: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${pickupData.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PICKUP ORDER PLACED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${pickupData.orderNumber}`);
        this.logger.log(`Pickup Code: ${pickupData.pickupCode}`);
        this.logger.log(`Store: ${pickupData.storeName}`);
        this.logger.log(`Address: ${pickupData.storeAddress}`);
        this.logger.log(`Total: ${pickupData.currency} ${pickupData.total.toFixed(2)}`);
        this.logger.log(`URL: ${orderUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">📍 Pickup Order Confirmed</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                  Hi ${pickupData.customerName},
                </p>
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                  Your order <strong>#${pickupData.orderNumber}</strong> has been confirmed and will be ready for pickup soon!
                </p>

                <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px; font-size: 20px; color: #667eea;">🔑 Your Pickup Code</h2>
                  <div style="background-color: #ffffff; padding: 15px; text-align: center; border-radius: 8px; border: 2px dashed #667eea;">
                    <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 4px;">${pickupData.pickupCode}</span>
                  </div>
                  <p style="margin: 15px 0 0; font-size: 14px; color: #666666;">
                    Show this code when collecting your order
                  </p>
                </div>

                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #856404;">📍 Pickup Location</h3>
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #856404;">
                    <strong>${pickupData.storeName}</strong><br>
                    ${pickupData.storeAddress}
                  </p>
                  ${
                    pickupData.pickupInstructions
                      ? `
                    <p style="margin: 15px 0 0; font-size: 14px; color: #856404;">
                      <strong>Instructions:</strong> ${pickupData.pickupInstructions}
                    </p>
                  `
                      : ''
                  }
                </div>

                <h3 style="margin: 30px 0 15px; font-size: 18px; color: #333333;">Order Summary</h3>
                ${pickupData.items
                  .map(
                    (item) => `
                  <div style="padding: 15px 0; border-bottom: 1px solid #eeeeee;">
                    <div style="display: flex; justify-content: space-between;">
                      <span style="font-size: 16px; color: #333333;">${item.name} × ${item.quantity}</span>
                      <span style="font-size: 16px; font-weight: bold; color: #333333;">${pickupData.currency} ${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                `
                  )
                  .join('')}

                <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #eeeeee;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 16px; color: #666666;">Subtotal:</span>
                    <span style="font-size: 16px; color: #666666;">${pickupData.currency} ${pickupData.subtotal.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 16px; color: #666666;">Pickup Fee:</span>
                    <span style="font-size: 16px; color: #666666;">${pickupData.currency} ${pickupData.pickupFee.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <span style="font-size: 16px; color: #666666;">Tax:</span>
                    <span style="font-size: 16px; color: #666666;">${pickupData.currency} ${pickupData.tax.toFixed(2)}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; padding-top: 15px; border-top: 2px solid #333333;">
                    <span style="font-size: 18px; font-weight: bold; color: #333333;">Total:</span>
                    <span style="font-size: 18px; font-weight: bold; color: #667eea;">${pickupData.currency} ${pickupData.total.toFixed(2)}</span>
                  </div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                  <a href="${orderUrl}" style="display: inline-block; padding: 15px 30px; background-color: #667eea; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Track Your Order</a>
                </div>

                <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  You'll receive another email when your order is ready for pickup.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Need help? Contact us at <a href="mailto:support@nextpik.com" style="color: #667eea;">support@nextpik.com</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Pickup Order Confirmed - #${pickupData.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send pickup order placed email', error);
        return false;
      }

      this.logger.log(`Pickup order placed email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending pickup order placed email', error);
      return false;
    }
  }

  /**
   * Send pickup ready notification to customer
   */
  async sendPickupReadyNotification(
    email: string,
    pickupData: {
      orderNumber: string;
      customerName: string;
      pickupCode: string;
      storeName: string;
      storeAddress: string;
      pickupInstructions?: string;
      orderId: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${pickupData.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PICKUP READY FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${pickupData.orderNumber}`);
        this.logger.log(`Pickup Code: ${pickupData.pickupCode}`);
        this.logger.log(`Store: ${pickupData.storeName}`);
        this.logger.log(`URL: ${orderUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">✅ Order Ready for Pickup!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                  Hi ${pickupData.customerName},
                </p>
                <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #333333; font-weight: bold;">
                  Great news! Your order <strong>#${pickupData.orderNumber}</strong> is ready for pickup! 🎉
                </p>

                <div style="background-color: #f0fdf4; border-left: 4px solid #48bb78; padding: 20px; margin: 20px 0;">
                  <h2 style="margin: 0 0 15px; font-size: 20px; color: #48bb78;">🔑 Your Pickup Code</h2>
                  <div style="background-color: #ffffff; padding: 15px; text-align: center; border-radius: 8px; border: 2px dashed #48bb78;">
                    <span style="font-size: 32px; font-weight: bold; color: #48bb78; letter-spacing: 4px;">${pickupData.pickupCode}</span>
                  </div>
                  <p style="margin: 15px 0 0; font-size: 14px; color: #666666;">
                    Show this code when collecting your order
                  </p>
                </div>

                <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0;">
                  <h3 style="margin: 0 0 10px; font-size: 18px; color: #856404;">📍 Pickup Location</h3>
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #856404;">
                    <strong>${pickupData.storeName}</strong><br>
                    ${pickupData.storeAddress}
                  </p>
                  ${
                    pickupData.pickupInstructions
                      ? `
                    <p style="margin: 15px 0 0; font-size: 14px; color: #856404;">
                      <strong>Instructions:</strong> ${pickupData.pickupInstructions}
                    </p>
                  `
                      : ''
                  }
                </div>

                <div style="margin-top: 30px; text-align: center;">
                  <a href="${orderUrl}" style="display: inline-block; padding: 15px 30px; background-color: #48bb78; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">View Order Details</a>
                </div>

                <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                  Please collect your order within 7 days.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Need help? Contact us at <a href="mailto:support@nextpik.com" style="color: #48bb78;">support@nextpik.com</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Order Ready for Pickup - #${pickupData.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send pickup ready email', error);
        return false;
      }

      this.logger.log(`Pickup ready email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending pickup ready email', error);
      return false;
    }
  }

  // ============================================================================
  // SHIPPING EVENT EMAIL NOTIFICATIONS
  // ============================================================================

  /**
   * Send "order is being prepared / label purchased" email to buyer
   */
  async sendOrderShipped(
    email: string,
    data: {
      orderNumber: string;
      customerName: string;
      orderId: string;
      trackingNumber?: string;
      carrier?: string;
      trackingUrl?: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${data.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 ORDER SHIPPED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${data.orderNumber}`);
        if (data.trackingNumber) this.logger.log(`Tracking: ${data.trackingNumber}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">📦 Your Order Is Being Prepared</h1>
              <p style="color: #FDE68A; font-size: 16px; margin: 12px 0 0;">Order #${data.orderNumber}</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">Hello ${data.customerName},</p>
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Great news! A shipping label has been created for your order and it is now being prepared for dispatch.
              </p>
              ${
                data.trackingNumber
                  ? `
              <div style="background-color: #FFFBEB; border-left: 4px solid #D97706; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">Tracking Information</p>
                <p style="color: #92400E; font-size: 14px; margin: 0;">
                  ${data.carrier ? `Carrier: <strong>${data.carrier}</strong><br>` : ''}
                  Tracking Number: <strong>${data.trackingNumber}</strong>
                </p>
                ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="color: #D97706; font-size: 14px; text-decoration: none; display: inline-block; margin-top: 8px;">Track with carrier →</a>` : ''}
              </div>
              `
                  : ''
              }
              <div style="text-align: center; margin: 32px 0;">
                <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  View Order Details
                </a>
              </div>
            </div>
            <div style="text-align: center; padding-top: 24px;">
              <p style="color: #A3A3A3; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPik. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Your Order #${data.orderNumber} Is Being Prepared`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send order shipped email', error);
        return false;
      }

      this.logger.log(`Order shipped email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending order shipped email', error);
      return false;
    }
  }

  /**
   * Send "order is out for delivery" email to buyer
   */
  async sendOrderOutForDelivery(
    email: string,
    data: {
      orderNumber: string;
      customerName: string;
      orderId: string;
      trackingNumber?: string;
      carrier?: string;
      estimatedDelivery?: string;
      trackingUrl?: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${data.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 OUT FOR DELIVERY FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${data.orderNumber}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">🚚 Your Order Is On Its Way</h1>
              <p style="color: #BFDBFE; font-size: 16px; margin: 12px 0 0;">Order #${data.orderNumber}</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">Hello ${data.customerName},</p>
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Your order is out for delivery today. Keep an eye out — it should arrive soon!
              </p>
              <div style="background-color: #EFF6FF; border-left: 4px solid #1D4ED8; padding: 20px; border-radius: 8px; margin: 24px 0;">
                ${data.carrier ? `<p style="color: #1E40AF; font-size: 14px; margin: 0 0 4px 0;">Carrier: <strong>${data.carrier}</strong></p>` : ''}
                ${data.trackingNumber ? `<p style="color: #1E40AF; font-size: 14px; margin: 0 0 4px 0;">Tracking: <strong>${data.trackingNumber}</strong></p>` : ''}
                ${data.estimatedDelivery ? `<p style="color: #1E40AF; font-size: 14px; margin: 0;">Expected delivery: <strong>${data.estimatedDelivery}</strong></p>` : ''}
                ${data.trackingUrl ? `<a href="${data.trackingUrl}" style="color: #1D4ED8; font-size: 14px; text-decoration: none; display: inline-block; margin-top: 8px;">Live tracking →</a>` : ''}
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Track Your Order
                </a>
              </div>
            </div>
            <div style="text-align: center; padding-top: 24px;">
              <p style="color: #A3A3A3; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPik. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Your Order #${data.orderNumber} Is Out for Delivery`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send out-for-delivery email', error);
        return false;
      }

      this.logger.log(`Out-for-delivery email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending out-for-delivery email', error);
      return false;
    }
  }

  /**
   * Send "order has been delivered" email to buyer with review link
   */
  async sendOrderDelivered(
    email: string,
    data: {
      orderNumber: string;
      customerName: string;
      orderId: string;
      reviewUrl: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${data.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 ORDER DELIVERED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${data.orderNumber}`);
        this.logger.log(`Review URL: ${data.reviewUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">✅ Your Order Has Arrived!</h1>
              <p style="color: #A7F3D0; font-size: 16px; margin: 12px 0 0;">Order #${data.orderNumber}</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">Hello ${data.customerName},</p>
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Your order has been delivered. We hope you love it!
              </p>
              <div style="background-color: #F0FDF4; border-left: 4px solid #059669; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #065F46; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">Enjoyed your purchase?</p>
                <p style="color: #065F46; font-size: 14px; margin: 0;">
                  Your feedback helps other buyers and rewards great sellers. Leave a review — it only takes a moment.
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; margin-bottom: 12px;">
                  Leave a Review
                </a>
                <br>
                <a href="${orderUrl}" style="color: #6B7280; font-size: 14px; text-decoration: none;">View order details</a>
              </div>
            </div>
            <div style="text-align: center; padding-top: 24px;">
              <p style="color: #A3A3A3; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPik. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Your Order #${data.orderNumber} Has Arrived - Leave a Review`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send order delivered email', error);
        return false;
      }

      this.logger.log(`Order delivered email sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending order delivered email', error);
      return false;
    }
  }

  /**
   * Send 48-hour dispatch reminder to seller
   */
  async sendSellerDispatchReminder(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      orderNumber: string;
      orderId: string;
      orderUrl: string;
      hoursOverdue: number;
    }
  ): Promise<boolean> {
    try {
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER DISPATCH REMINDER FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${data.sellerName}`);
        this.logger.log(`Order: #${data.orderNumber}`);
        this.logger.log(`Hours since order: ${data.hoursOverdue}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #F9FAFB;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            <div style="background: linear-gradient(135deg, #D97706 0%, #B45309 100%); padding: 40px; text-align: center; border-radius: 16px 16px 0 0;">
              <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">⚡ Reminder: Order Needs to Ship</h1>
              <p style="color: #FDE68A; font-size: 16px; margin: 12px 0 0;">${data.storeName}</p>
            </div>
            <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">Hello ${data.sellerName},</p>
              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Order <strong>#${data.orderNumber}</strong> was placed <strong>${data.hoursOverdue} hours ago</strong> and a shipping label has not yet been purchased.
              </p>
              <div style="background-color: #FFFBEB; border-left: 4px solid #D97706; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #92400E; font-size: 14px; font-weight: 600; margin: 0 0 8px 0;">⚠️ Action Required</p>
                <p style="color: #92400E; font-size: 14px; margin: 0;">
                  Please purchase a shipping label and dispatch this order as soon as possible to maintain your seller rating and ensure customer satisfaction.
                </p>
              </div>
              <div style="text-align: center; margin: 32px 0;">
                <a href="${data.orderUrl}" style="display: inline-block; background: linear-gradient(135deg, #D97706 0%, #B45309 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                  Ship This Order Now
                </a>
              </div>
            </div>
            <div style="text-align: center; padding-top: 24px;">
              <p style="color: #A3A3A3; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} NextPik. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const { data: emailData, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Reminder: Order #${data.orderNumber} Still Needs to Ship`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send seller dispatch reminder email', error);
        return false;
      }

      this.logger.log(`Seller dispatch reminder sent to ${email} (ID: ${emailData?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending seller dispatch reminder email', error);
      return false;
    }
  }

  /**
   * Send pickup confirmed notification to customer
   */
  async sendPickupConfirmedNotification(
    email: string,
    pickupData: {
      orderNumber: string;
      customerName: string;
      storeName: string;
      pickedUpAt: Date;
      orderId: string;
    }
  ): Promise<boolean> {
    try {
      const orderUrl = `${this.frontendUrl}/account/orders/${pickupData.orderId}`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 PICKUP CONFIRMED FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Order: #${pickupData.orderNumber}`);
        this.logger.log(`Store: ${pickupData.storeName}`);
        this.logger.log(`Picked up at: ${pickupData.pickedUpAt}`);
        this.logger.log(`URL: ${orderUrl}`);
        this.logger.warn('='.repeat(80));
        return true;
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px;">🎉 Pickup Complete!</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                  Hi ${pickupData.customerName},
                </p>
                <p style="margin: 0 0 20px; font-size: 18px; line-height: 1.6; color: #333333;">
                  Thank you for picking up your order <strong>#${pickupData.orderNumber}</strong> from <strong>${pickupData.storeName}</strong>!
                </p>

                <div style="background-color: #ebf8ff; border-left: 4px solid #4299e1; padding: 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: #2c5282;">
                    <strong>Picked up on:</strong><br>
                    ${pickupData.pickedUpAt.toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #333333;">
                  We hope you enjoy your purchase! If you have any questions or concerns, please don't hesitate to reach out.
                </p>

                <div style="margin-top: 30px; text-align: center;">
                  <a href="${orderUrl}" style="display: inline-block; padding: 15px 30px; background-color: #4299e1; color: #ffffff; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">View Order Details</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; text-align: center; background-color: #f8f9fa; border-top: 1px solid #eeeeee;">
                <p style="margin: 0 0 15px; font-size: 16px; font-weight: bold; color: #333333;">
                  Thank you for shopping with NextPik! 💜
                </p>
                <p style="margin: 0; font-size: 14px; color: #666666;">
                  Need help? Contact us at <a href="mailto:support@nextpik.com" style="color: #4299e1;">support@nextpik.com</a>
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Pickup Complete - #${pickupData.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error('Failed to send pickup confirmed email', error);
        return false;
      }

      this.logger.log(`Pickup confirmed email sent to ${email} (ID: ${data?.id})`);
      return true;
    } catch (error) {
      this.logger.error('Error sending pickup confirmed email', error);
      return false;
    }
  }

  // ============================================================================
  // SELLER CREDIT NOTIFICATIONS
  // ============================================================================

  /**
   * Send low credit warning emails to sellers (≤2 months remaining)
   */
  async sendLowCreditWarning(
    stores: Array<{
      ownerEmail: string;
      ownerName: string;
      storeName: string;
      creditsBalance: number;
    }>
  ): Promise<void> {
    const creditsUrl = `${this.frontendUrl}/seller/credits`;
    const dashboardUrl = `${this.frontendUrl}/seller`;

    for (const store of stores) {
      try {
        const daysUntilDepletion = store.creditsBalance * 30;

        if (!process.env.RESEND_API_KEY) {
          this.logger.warn(
            `[DEV] Low credit warning skipped for ${store.ownerEmail} (${store.storeName}, ${store.creditsBalance} months left)`
          );
          continue;
        }

        const html = creditsLowWarningTemplate({
          sellerName: store.ownerName,
          storeName: store.storeName,
          currentBalance: store.creditsBalance,
          daysUntilDepletion,
          creditsUrl,
          dashboardUrl,
          frontendUrl: this.frontendUrl,
        });

        const { error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: store.ownerEmail,
          subject: `Credits running low - ${store.storeName}`,
          html,
        });

        if (error) {
          this.logger.error(`Failed to send low credit warning to ${store.ownerEmail}`, error);
        } else {
          this.logger.log(`Low credit warning sent to ${store.ownerEmail} (${store.storeName})`);
        }
      } catch (err) {
        this.logger.error(`Error sending low credit warning to ${store.ownerEmail}`, err);
      }
    }
  }

  /**
   * Send grace period ending warning emails to sellers
   */
  async sendGracePeriodWarning(
    stores: Array<{
      ownerEmail: string;
      ownerName: string;
      storeName: string;
      graceEndsAt: Date | null;
      productsCount: number;
    }>
  ): Promise<void> {
    const creditsUrl = `${this.frontendUrl}/seller/credits`;
    const dashboardUrl = `${this.frontendUrl}/seller`;

    for (const store of stores) {
      try {
        if (!store.graceEndsAt) continue;

        const hoursRemaining = Math.max(
          1,
          Math.ceil((new Date(store.graceEndsAt).getTime() - Date.now()) / (1000 * 60 * 60))
        );
        const graceEndsAtStr = new Date(store.graceEndsAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'UTC',
          timeZoneName: 'short',
        });

        if (!process.env.RESEND_API_KEY) {
          this.logger.warn(
            `[DEV] Grace period warning skipped for ${store.ownerEmail} (${store.storeName}, ${hoursRemaining}h left)`
          );
          continue;
        }

        const html = gracePeriodEndingTemplate({
          sellerName: store.ownerName,
          storeName: store.storeName,
          hoursRemaining,
          graceEndsAt: graceEndsAtStr,
          productsCount: store.productsCount,
          creditsUrl,
          dashboardUrl,
          frontendUrl: this.frontendUrl,
        });

        const { error } = await this.resend.emails.send({
          from: this.fromEmail,
          to: store.ownerEmail,
          subject: `Grace period ending soon - ${store.storeName}`,
          html,
        });

        if (error) {
          this.logger.error(`Failed to send grace period warning to ${store.ownerEmail}`, error);
        } else {
          this.logger.log(
            `Grace period warning sent to ${store.ownerEmail} (${store.storeName}, ${hoursRemaining}h remaining)`
          );
        }
      } catch (err) {
        this.logger.error(`Error sending grace period warning to ${store.ownerEmail}`, err);
      }
    }
  }
}
