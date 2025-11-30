import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface OrderConfirmationData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly fromEmail: string;
  private readonly siteName: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@luxuryecommerce.com');
    this.siteName = this.configService.get('SITE_NAME', 'Luxury E-commerce');
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderConfirmationData) {
    const email = this.buildOrderConfirmationEmail(data);
    return this.sendEmail(email);
  }

  /**
   * Send payment success email
   */
  async sendPaymentSuccess(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    amount: number;
    currency: string;
  }) {
    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `Payment Confirmed - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #000; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>Payment Confirmed</h2>
              <p>Dear ${data.customerName},</p>
              <p>Your payment has been successfully processed.</p>
              <p class="amount">${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</p>
              <p>Order Number: <strong>${data.orderNumber}</strong></p>
              <p>Thank you for your purchase!</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(email);
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber?: string;
    carrier?: string;
    estimatedDelivery?: string;
  }) {
    const trackingInfo = data.trackingNumber
      ? `<p>Tracking Number: <strong>${data.trackingNumber}</strong></p>
         <p>Carrier: ${data.carrier || 'Standard Shipping'}</p>`
      : '';

    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `Your Order Has Shipped - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .tracking { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>Your Order is on the Way!</h2>
              <p>Dear ${data.customerName},</p>
              <p>Great news! Your order <strong>${data.orderNumber}</strong> has been shipped.</p>
              ${trackingInfo ? `<div class="tracking">${trackingInfo}</div>` : ''}
              ${data.estimatedDelivery ? `<p>Estimated Delivery: ${data.estimatedDelivery}</p>` : ''}
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(email);
  }

  /**
   * Send refund notification
   */
  async sendRefundNotification(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    amount: number;
    currency: string;
    isPartial: boolean;
  }) {
    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `Refund Processed - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>${data.isPartial ? 'Partial Refund' : 'Full Refund'} Processed</h2>
              <p>Dear ${data.customerName},</p>
              <p>Your refund has been processed for order <strong>${data.orderNumber}</strong>.</p>
              <p class="amount">${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</p>
              <p>The refund will appear on your statement within 5-10 business days.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(email);
  }

  /**
   * Send low stock alert to admin/seller
   */
  async sendLowStockAlert(data: {
    productName: string;
    productId: string;
    currentStock: number;
    threshold: number;
    sellerEmail: string;
  }) {
    const email: EmailTemplate = {
      to: data.sellerEmail,
      subject: `Low Stock Alert: ${data.productName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .alert { background: #fef2f2; border: 1px solid #fca5a5; padding: 15px; border-radius: 5px; }
            .stock-count { font-size: 24px; font-weight: bold; color: #dc2626; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="alert">
              <h2>Low Stock Alert</h2>
              <p><strong>${data.productName}</strong></p>
              <p class="stock-count">${data.currentStock} items remaining</p>
              <p>This product is below your threshold of ${data.threshold} items.</p>
              <p><a href="${this.configService.get('APP_URL', 'http://localhost:3000')}/admin/inventory/${data.productId}">View in Dashboard</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    return this.sendEmail(email);
  }

  /**
   * Build order confirmation email
   */
  private buildOrderConfirmationEmail(data: OrderConfirmationData): EmailTemplate {
    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.image ? `<img src="${item.image}" alt="${item.name}" width="60" height="60" style="object-fit: cover;">` : ''}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">x${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join('');

    return {
      to: data.customerEmail,
      subject: `Order Confirmation - ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .totals { text-align: right; margin-top: 20px; }
            .totals p { margin: 5px 0; }
            .total-amount { font-size: 20px; font-weight: bold; }
            .address { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>Thank You for Your Order!</h2>
              <p>Dear ${data.customerName},</p>
              <p>We've received your order and are getting it ready. Your order number is <strong>${data.orderNumber}</strong>.</p>

              <h3>Order Summary</h3>
              <table class="order-table">
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="totals">
                <p>Subtotal: $${data.subtotal.toFixed(2)}</p>
                <p>Shipping: $${data.shipping.toFixed(2)}</p>
                <p>Tax: $${data.tax.toFixed(2)}</p>
                <p class="total-amount">Total: $${data.total.toFixed(2)}</p>
              </div>

              <div class="address">
                <h4>Shipping Address</h4>
                <p>
                  ${data.shippingAddress.street}<br>
                  ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.postalCode}<br>
                  ${data.shippingAddress.country}
                </p>
              </div>
            </div>
            <div class="footer">
              <p>If you have any questions, please contact our support team.</p>
              <p>&copy; ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  }

  /**
   * Send email - to be implemented with actual email provider
   * Supports: SendGrid, AWS SES, Nodemailer, etc.
   */
  private async sendEmail(email: EmailTemplate): Promise<{ success: boolean; messageId?: string }> {
    // Check if email service is configured
    const provider = this.configService.get('EMAIL_PROVIDER', 'console');

    if (provider === 'console') {
      // Development mode - log to console
      this.logger.log('=== EMAIL NOTIFICATION ===');
      this.logger.log(`To: ${email.to}`);
      this.logger.log(`Subject: ${email.subject}`);
      this.logger.log(`From: ${this.fromEmail}`);
      this.logger.log('========================');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    // TODO: Implement actual email providers
    // Example for SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(this.configService.get('SENDGRID_API_KEY'));
    // const msg = { to: email.to, from: this.fromEmail, subject: email.subject, html: email.html };
    // await sgMail.send(msg);

    // Example for AWS SES:
    // const ses = new AWS.SES({ region: 'us-east-1' });
    // await ses.sendEmail({...}).promise();

    this.logger.warn(`Email provider '${provider}' not implemented. Email not sent.`);
    return { success: false };
  }
}
