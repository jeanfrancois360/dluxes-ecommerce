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
import { orderShippedTemplate } from './templates/order-shipped.template';
import { orderOutForDeliveryTemplate } from './templates/order-out-for-delivery.template';
import { orderDeliveredTemplate } from './templates/order-delivered.template';
import { paymentConfirmationTemplate } from './templates/payment-confirmation.template';
import { pickupOrderPlacedTemplate } from './templates/pickup-order-placed.template';
import { pickupReadyTemplate } from './templates/pickup-ready.template';
import { pickupConfirmedTemplate } from './templates/pickup-confirmed.template';
import { sellerDispatchReminderTemplate } from './templates/seller-dispatch-reminder.template';
import { productInquiryTemplate } from './templates/product-inquiry.template';
import { platformPayoutAlertTemplate } from './templates/platform-payout-alert.template';
import { disputeAlertTemplate } from './templates/dispute-alert.template';
import { disputeResolutionTemplate } from './templates/dispute-resolution.template';
import { paymentFailedTemplate } from './templates/payment-failed.template';
import { paymentCancelledTemplate } from './templates/payment-cancelled.template';
import { paymentActionRequiredTemplate } from './templates/payment-action-required.template';
import { chargeCapturedSellerTemplate } from './templates/charge-captured-seller.template';

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

      const html = productInquiryTemplate({
        customerName: inquiryData.customerName,
        customerEmail: inquiryData.customerEmail,
        customerPhone: inquiryData.customerPhone,
        productName: inquiryData.productName,
        productUrl: inquiryData.productUrl,
        message: inquiryData.message,
        frontendUrl: this.frontendUrl,
      });

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

      const html = paymentConfirmationTemplate({
        customerName,
        orderNumber,
        total,
        currency,
        paidAt,
        orderUrl: `${this.frontendUrl}/account/orders`,
        frontendUrl: this.frontendUrl,
      });

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

      const html = pickupOrderPlacedTemplate({
        customerName: pickupData.customerName,
        orderNumber: pickupData.orderNumber,
        pickupCode: pickupData.pickupCode,
        storeName: pickupData.storeName,
        storeAddress: pickupData.storeAddress,
        pickupInstructions: pickupData.pickupInstructions,
        items: pickupData.items,
        subtotal: pickupData.subtotal,
        tax: pickupData.tax,
        pickupFee: pickupData.pickupFee,
        total: pickupData.total,
        currency: pickupData.currency,
        orderUrl,
        frontendUrl: this.frontendUrl,
      });

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

      const html = pickupReadyTemplate({
        customerName: pickupData.customerName,
        orderNumber: pickupData.orderNumber,
        pickupCode: pickupData.pickupCode,
        storeName: pickupData.storeName,
        storeAddress: pickupData.storeAddress,
        pickupInstructions: pickupData.pickupInstructions,
        orderUrl,
        frontendUrl: this.frontendUrl,
      });

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

      const html = orderShippedTemplate({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        trackingUrl: data.trackingUrl,
        orderUrl,
        frontendUrl: this.frontendUrl,
      });

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

      const html = orderOutForDeliveryTemplate({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        trackingNumber: data.trackingNumber,
        carrier: data.carrier,
        estimatedDelivery: data.estimatedDelivery,
        trackingUrl: data.trackingUrl,
        orderUrl,
        frontendUrl: this.frontendUrl,
      });

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

      const html = orderDeliveredTemplate({
        customerName: data.customerName,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        reviewUrl: data.reviewUrl,
        orderUrl,
        frontendUrl: this.frontendUrl,
      });

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

      const html = sellerDispatchReminderTemplate({
        sellerName: data.sellerName,
        storeName: data.storeName,
        orderNumber: data.orderNumber,
        orderId: data.orderId,
        orderUrl: data.orderUrl,
        hoursOverdue: data.hoursOverdue,
        frontendUrl: this.frontendUrl,
      });

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

      const reviewUrl = `${this.frontendUrl}/account/orders/${pickupData.orderId}#review`;
      const html = pickupConfirmedTemplate({
        customerName: pickupData.customerName,
        orderNumber: pickupData.orderNumber,
        storeName: pickupData.storeName,
        pickedUpAt: pickupData.pickedUpAt,
        orderUrl,
        reviewUrl,
        frontendUrl: this.frontendUrl,
      });

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

  /**
   * Send platform-level payout alert to admin (Stripe bank settlement events)
   */
  async sendPlatformPayoutAlert(
    adminEmail: string,
    data: {
      payoutId: string;
      amount: number;
      currency: string;
      status: 'paid' | 'failed' | 'canceled';
      failureReason?: string;
      arrivalDate?: number;
      method: string;
    }
  ): Promise<void> {
    try {
      const stripePayoutUrl = `https://dashboard.stripe.com/payouts/${data.payoutId}`;
      const html = platformPayoutAlertTemplate({
        ...data,
        stripePayoutUrl,
        frontendUrl: this.frontendUrl,
      });

      const subjectMap = {
        paid: `Platform payout of ${data.currency.toUpperCase()} ${data.amount.toFixed(2)} arrived in bank`,
        failed: `ACTION REQUIRED: Platform payout of ${data.currency.toUpperCase()} ${data.amount.toFixed(2)} failed`,
        canceled: `Platform payout of ${data.currency.toUpperCase()} ${data.amount.toFixed(2)} canceled`,
      };

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: adminEmail,
        subject: subjectMap[data.status],
        html,
      });

      if (error) {
        this.logger.error('Failed to send platform payout alert email', error);
      } else {
        this.logger.log(
          `Platform payout alert (${data.status}) sent to ${adminEmail} for payout ${data.payoutId}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending platform payout alert email', error);
    }
  }

  /**
   * Send dispute created alert to admin or seller
   */
  async sendDisputeAlert(
    recipientEmail: string,
    data: {
      disputeId: string;
      chargeId: string;
      amount: number;
      currency: string;
      reason: string;
      orderNumber: string;
      orderId: string;
      evidenceDueBy?: number | null;
      stripeDisputeUrl: string;
      isSeller?: boolean;
    }
  ): Promise<void> {
    try {
      const html = disputeAlertTemplate({ ...data, frontendUrl: this.frontendUrl });
      const subject = data.isSeller
        ? `Payment dispute filed on order #${data.orderNumber}`
        : `ACTION REQUIRED: Chargeback on order #${data.orderNumber} — ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`;

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipientEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send dispute alert to ${recipientEmail}`, error);
      } else {
        this.logger.log(`Dispute alert sent to ${recipientEmail} for dispute ${data.disputeId}`);
      }
    } catch (error) {
      this.logger.error('Error sending dispute alert email', error);
    }
  }

  /**
   * Send dispute resolution notification to admin or seller
   */
  async sendDisputeResolution(
    recipientEmail: string,
    data: {
      disputeId: string;
      amount: number;
      currency: string;
      isWon: boolean;
      orderNumber: string;
      orderId: string;
      stripeDisputeUrl: string;
      isSeller?: boolean;
    }
  ): Promise<void> {
    try {
      const html = disputeResolutionTemplate({ ...data, frontendUrl: this.frontendUrl });
      const outcome = data.isWon ? 'WON' : 'LOST';
      const subject = data.isSeller
        ? `Dispute ${outcome.toLowerCase()} — order #${data.orderNumber}`
        : `Dispute ${outcome}: order #${data.orderNumber} — ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`;

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: recipientEmail,
        subject,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send dispute resolution to ${recipientEmail}`, error);
      } else {
        this.logger.log(
          `Dispute resolution (${outcome}) sent to ${recipientEmail} for dispute ${data.disputeId}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending dispute resolution email', error);
    }
  }

  /**
   * Send payment failed notification to buyer
   */
  async sendPaymentFailedNotification(
    email: string,
    data: {
      orderNumber: string;
      amount: number;
      currency: string;
      failureReason?: string;
      retryUrl: string;
    }
  ): Promise<void> {
    try {
      const html = paymentFailedTemplate({ ...data, frontendUrl: this.frontendUrl });

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Payment failed for order #${data.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send payment failed email to ${email}`, error);
      } else {
        this.logger.log(
          `Payment failed notification sent to ${email} for order ${data.orderNumber}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending payment failed email', error);
    }
  }

  /**
   * Send payment cancelled notification to buyer
   */
  async sendPaymentCancelledNotification(
    email: string,
    data: {
      orderNumber: string;
      amount: number;
      currency: string;
      ordersUrl: string;
    }
  ): Promise<void> {
    try {
      const html = paymentCancelledTemplate({ ...data, frontendUrl: this.frontendUrl });

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Payment cancelled for order #${data.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send payment cancelled email to ${email}`, error);
      } else {
        this.logger.log(
          `Payment cancelled notification sent to ${email} for order ${data.orderNumber}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending payment cancelled email', error);
    }
  }

  /**
   * Send payment action required (3D Secure) notification to buyer
   */
  async sendPaymentActionRequired(
    email: string,
    data: {
      orderNumber: string;
      amount: number;
      currency: string;
      actionUrl: string;
    }
  ): Promise<void> {
    try {
      const html = paymentActionRequiredTemplate({ ...data, frontendUrl: this.frontendUrl });

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `ACTION REQUIRED: Complete payment for order #${data.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send payment action required email to ${email}`, error);
      } else {
        this.logger.log(
          `Payment action required email sent to ${email} for order ${data.orderNumber}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending payment action required email', error);
    }
  }

  /**
   * Send charge captured notification to seller
   */
  async sendChargeCapturedSeller(
    email: string,
    data: {
      sellerName: string;
      storeName: string;
      orderNumber: string;
      amount: number;
      currency: string;
      orderId: string;
      dashboardUrl: string;
    }
  ): Promise<void> {
    try {
      const html = chargeCapturedSellerTemplate({ ...data, frontendUrl: this.frontendUrl });

      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: `Funds captured for order #${data.orderNumber}`,
        html,
      });

      if (error) {
        this.logger.error(`Failed to send charge captured email to ${email}`, error);
      } else {
        this.logger.log(
          `Charge captured notification sent to ${email} for order ${data.orderNumber}`
        );
      }
    } catch (error) {
      this.logger.error('Error sending charge captured seller email', error);
    }
  }
}
