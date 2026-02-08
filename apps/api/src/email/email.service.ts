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
        subject: '🔐 Your Magic Link - Sign In Instantly',
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
        subject: '🔑 Reset Your Password - NextPik E-commerce',
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
        subject: `✨ Welcome to NextPik E-commerce, ${name}!`,
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
                <h1 style="color: #FFFFFF; font-size: 28px; margin: 0; font-weight: 700;">Verify Your Email</h1>
                <p style="color: #A3A3A3; font-size: 16px; margin: 12px 0 0;">Welcome to NextPik E-commerce</p>
              </div>

              <div style="background-color: #FFFFFF; padding: 40px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
                <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                  Hello ${name},
                </p>

                <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                  Thank you for signing up! Please verify your email address to complete your registration and access your account.
                </p>

                <div style="text-align: center; margin: 32px 0;">
                  <a href="${verificationLink}"
                     style="display: inline-block; background: linear-gradient(135deg, #000000 0%, #262626 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);">
                    Verify Email Address
                  </a>
                </div>

                <div style="background-color: #FAFAFA; border-left: 4px solid #3B82F6; padding: 20px; border-radius: 8px; margin: 24px 0;">
                  <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
                    <strong style="color: #000000;">Security Note:</strong><br/>
                    This verification link will expire in 24 hours. If you didn't create an account, please ignore this email.
                  </p>
                </div>

                <div style="border-top: 1px solid #E5E5E5; margin-top: 32px; padding-top: 24px;">
                  <p style="color: #737373; font-size: 14px; line-height: 1.6;">
                    If the button doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="color: #3B82F6; font-size: 12px; word-break: break-all; margin: 8px 0;">
                    ${verificationLink}
                  </p>
                </div>
              </div>

              <div style="text-align: center; padding-top: 24px;">
                <p style="color: #A3A3A3; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} NextPik E-commerce. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '✉️ Verify Your Email - NextPik E-commerce',
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

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #000000; font-size: 24px; margin: 0;">Two-Factor Authentication Enabled</h1>
              </div>

              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Hello ${name},
              </p>

              <p style="color: #525252; font-size: 16px; line-height: 1.6;">
                Two-factor authentication has been successfully enabled on your account.
              </p>

              <div style="background-color: #FAFAFA; border-left: 4px solid #10B981; padding: 20px; border-radius: 8px; margin: 24px 0;">
                <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong style="color: #000000;">🔒 Your account is now more secure</strong><br/>
                  You'll need to enter a 6-digit code from your authenticator app each time you sign in.
                </p>
              </div>

              <p style="color: #737373; font-size: 14px; line-height: 1.6;">
                If you didn't enable 2FA, please contact our support team immediately.
              </p>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '🔒 Two-Factor Authentication Enabled',
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
                  © ${new Date().getFullYear()} NextPik E-commerce. All rights reserved.
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
        subject: `🛍️ New Product Inquiry - ${inquiryData.productName}`,
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
      const orderUrl = `${this.frontendUrl}/orders/${orderData.orderId}`;

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
        subject: `✅ Order Confirmation - #${orderData.orderNumber}`,
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
      const dashboardUrl = `${this.frontendUrl}/seller/dashboard`;

      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.warn('='.repeat(80));
        this.logger.log(`📧 SELLER NOTIFICATION FOR DEVELOPMENT`);
        this.logger.log(`Email: ${email}`);
        this.logger.log(`Seller: ${notificationData.sellerName}`);
        this.logger.log(`Store: ${notificationData.storeName}`);
        this.logger.log(`Order: #${notificationData.orderNumber}`);
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
        subject: `🎉 New Order #${notificationData.orderNumber} - ${notificationData.storeName}`,
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
      const dashboardUrl = `${this.frontendUrl}/dashboard/buyer`;

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
        subject: '📝 Seller Application Received - NextPik',
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
      const dashboardUrl = `${this.frontendUrl}/seller/dashboard`;

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
        subject: '🎉 Seller Application Approved - Welcome to NextPik!',
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
      const supportUrl = `${this.frontendUrl}/support`;

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
      const supportUrl = `${this.frontendUrl}/support`;
      const dashboardUrl = `${this.frontendUrl}/seller/dashboard`;

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
        subject: '⚠️ Important: Your Seller Account Has Been Suspended',
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
}
