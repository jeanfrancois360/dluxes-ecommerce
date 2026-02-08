import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationType, NotificationPriority } from '@prisma/client';
import { CreateNotificationDto } from './dto/notification.dto';

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
    private readonly emailService: EmailService
  ) {
    this.fromEmail = this.configService.get('EMAIL_FROM', 'noreply@luxuryecommerce.com');
    this.siteName = this.configService.get('SITE_NAME', 'NextPik E-commerce');
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
   * Send delivery assigned notification to buyer
   */
  async sendDeliveryAssigned(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
    providerName: string;
    expectedDeliveryDate?: string;
  }) {
    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `Delivery Assigned - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .tracking-box { background: linear-gradient(135deg, #CBB57B 0%, #D4AF37 100%); padding: 20px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .tracking-number { font-size: 24px; font-weight: bold; color: #000; font-family: 'Courier New', monospace; letter-spacing: 2px; }
            .info-box { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
            .button { display: inline-block; background: #000; color: #fff; padding: 12px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>📦 Your Delivery is on the Way!</h2>
              <p>Dear ${data.customerName},</p>
              <p>Great news! Your order <strong>${data.orderNumber}</strong> has been assigned to a delivery partner.</p>

              <div class="tracking-box">
                <p style="color: #000; margin: 0; font-size: 14px; font-weight: 600;">Tracking Number</p>
                <p class="tracking-number">${data.trackingNumber}</p>
              </div>

              <div class="info-box">
                <p style="margin: 8px 0;"><strong>Delivery Provider:</strong> ${data.providerName}</p>
                ${data.expectedDeliveryDate ? `<p style="margin: 8px 0;"><strong>Expected Delivery:</strong> ${data.expectedDeliveryDate}</p>` : ''}
              </div>

              <p>You can track your delivery using the tracking number above. We'll keep you updated on the delivery progress.</p>

              <div style="text-align: center;">
                <a href="${this.configService.get('APP_URL', 'http://localhost:3000')}/account/orders" class="button">
                  View Order
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Thank you for shopping with ${this.siteName}</p>
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
   * Send delivery status update notification
   */
  async sendDeliveryStatusUpdate(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
    newStatus: string;
    statusMessage: string;
  }) {
    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `Delivery Update - ${data.statusMessage}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .status-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; color: white; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <h2>Delivery Status Update</h2>
              <p>Dear ${data.customerName},</p>

              <div class="status-box">
                <p style="margin: 0; font-size: 18px; font-weight: bold;">${data.statusMessage}</p>
                <p style="margin: 10px 0 0; opacity: 0.9;">Tracking: ${data.trackingNumber}</p>
              </div>

              <p>Order Number: <strong>${data.orderNumber}</strong></p>
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
   * Send delivery delivered notification (reminder to confirm)
   */
  async sendDeliveryDelivered(data: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    trackingNumber: string;
  }) {
    const email: EmailTemplate = {
      to: data.customerEmail,
      subject: `✅ Delivered - Please Confirm Receipt`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .delivered-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; color: white; }
            .confirm-box { background: #FEF3C7; border: 2px solid #F59E0B; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #000; color: #fff; padding: 14px 40px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <div class="delivered-box">
                <h2 style="margin: 0; color: white; font-size: 28px;">🎉 Delivered!</h2>
                <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Your order has been delivered</p>
              </div>

              <p>Dear ${data.customerName},</p>
              <p>Your order <strong>${data.orderNumber}</strong> has been successfully delivered.</p>

              <div class="confirm-box">
                <p style="margin: 0 0 10px 0; color: #92400E; font-weight: bold;">⏰ Action Required</p>
                <p style="margin: 0; color: #78350F;">
                  Please confirm receipt of your order to release payment to the seller.
                  This helps us ensure you received your order in good condition.
                </p>
              </div>

              <div style="text-align: center;">
                <a href="${this.configService.get('APP_URL', 'http://localhost:3000')}/account/orders" class="button">
                  Confirm Receipt
                </a>
              </div>

              <p style="color: #666; font-size: 14px;">Tracking Number: ${data.trackingNumber}</p>
            </div>
            <div class="footer">
              <p>Thank you for shopping with ${this.siteName}</p>
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
   * Send buyer confirmation notification to admin/seller
   */
  async sendBuyerConfirmedNotification(data: {
    adminEmail: string;
    sellerEmail?: string;
    orderNumber: string;
    trackingNumber: string;
    customerName: string;
    sellerName?: string;
  }) {
    const recipients = [data.adminEmail];
    if (data.sellerEmail) {
      recipients.push(data.sellerEmail);
    }

    const emailPromises = recipients.map((email) => {
      const isSeller = email === data.sellerEmail;
      const emailTemplate: EmailTemplate = {
        to: email,
        subject: `✅ Delivery Confirmed - Order ${data.orderNumber}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
              .content { padding: 30px 0; }
              .success-box { background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; color: white; }
              .info-box { background: #EFF6FF; border: 2px solid #3B82F6; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${this.siteName}</h1>
              </div>
              <div class="content">
                <div class="success-box">
                  <h2 style="margin: 0; color: white;">✅ Delivery Confirmed</h2>
                  <p style="margin: 10px 0 0; opacity: 0.9;">Customer has confirmed receipt</p>
                </div>

                <p>Dear ${isSeller ? data.sellerName || 'Seller' : 'Admin'},</p>
                <p>Great news! ${data.customerName} has confirmed receipt of their order.</p>

                <div class="info-box">
                  <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                  <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                  <p style="margin: 8px 0;"><strong>Confirmed by:</strong> ${data.customerName}</p>
                  <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Ready for Payout</span></p>
                </div>

                ${
                  isSeller
                    ? '<p>Your payout will be processed once the admin releases it. You will receive a notification when the payout is released.</p>'
                    : '<p>This delivery is now ready for payout release. Please review and release the payout from the admin panel.</p>'
                }
              </div>
              <div class="footer">
                <p>&copy; ${new Date().getFullYear()} ${this.siteName}. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

      return this.sendEmail(emailTemplate);
    });

    return Promise.all(emailPromises);
  }

  /**
   * Send payout released notification to seller
   */
  async sendPayoutReleasedNotification(data: {
    sellerEmail: string;
    sellerName: string;
    orderNumber: string;
    trackingNumber: string;
    payoutAmount: number;
    currency: string;
  }) {
    const email: EmailTemplate = {
      to: data.sellerEmail,
      subject: `💰 Payout Released - Order ${data.orderNumber}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #000; }
            .content { padding: 30px 0; }
            .payout-box { background: linear-gradient(135deg, #D4AF37 0%, #CBB57B 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .amount { font-size: 36px; font-weight: bold; color: #000; margin: 10px 0; }
            .info-box { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px 0; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${this.siteName}</h1>
            </div>
            <div class="content">
              <div class="payout-box">
                <h2 style="margin: 0; color: #000;">💰 Payout Released!</h2>
                <p class="amount">${data.currency.toUpperCase()} ${data.payoutAmount.toFixed(2)}</p>
                <p style="margin: 0; color: #000; opacity: 0.8;">Your earnings have been released</p>
              </div>

              <p>Dear ${data.sellerName},</p>
              <p>Congratulations! Your payout for order <strong>${data.orderNumber}</strong> has been released.</p>

              <div class="info-box">
                <p style="margin: 8px 0;"><strong>Order Number:</strong> ${data.orderNumber}</p>
                <p style="margin: 8px 0;"><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
                <p style="margin: 8px 0;"><strong>Payout Amount:</strong> ${data.currency.toUpperCase()} ${data.payoutAmount.toFixed(2)}</p>
                <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Released</span></p>
              </div>

              <p>The funds should appear in your account within 5-7 business days.</p>

              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions about this payout, please contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>Thank you for being a valued seller</p>
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

  // ============================================================================
  // IN-APP NOTIFICATIONS
  // ============================================================================

  /**
   * Create a notification for a user
   */
  async createNotification(dto: CreateNotificationDto) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        link: dto.link,
        metadata: dto.metadata || {},
        priority: dto.priority || NotificationPriority.NORMAL,
      },
    });

    this.logger.log(`Notification created for user ${dto.userId}: ${dto.title}`);
    return notification;
  }

  /**
   * Create notifications for multiple users
   */
  async createBulkNotifications(
    userIds: string[],
    notification: Omit<CreateNotificationDto, 'userId'>
  ) {
    const notifications = await this.prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata || {},
        priority: notification.priority || NotificationPriority.NORMAL,
      })),
    });

    this.logger.log(`Created ${notifications.count} notifications`);
    return notifications;
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(
    userId: string,
    options: { page: number; limit: number; unreadOnly?: boolean }
  ) {
    const { page, limit, unreadOnly } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });

    return { count };
  }

  /**
   * Mark notification as read/unread
   */
  async markAsRead(userId: string, notificationId: string, read: boolean) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        read,
        readAt: read ? new Date() : null,
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  /**
   * Delete a notification
   */
  async deleteNotification(userId: string, notificationId: string) {
    // Verify notification belongs to user
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.userId !== userId) {
      throw new ForbiddenException('You do not have access to this notification');
    }

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Delete all read notifications
   */
  async deleteReadNotifications(userId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: { userId, read: true },
    });

    return { deleted: result.count };
  }

  // ============================================================================
  // NOTIFICATION HELPERS - Called by other services
  // ============================================================================

  /**
   * Send order placed notification to seller
   */
  async notifyOrderPlaced(sellerId: string, orderId: string, orderNumber: string, amount: number) {
    await this.createNotification({
      userId: sellerId,
      type: NotificationType.ORDER_PLACED,
      title: `New Order #${orderNumber}`,
      message: `You received a new order worth $${amount.toFixed(2)}`,
      link: `/seller/orders/${orderId}`,
      metadata: { orderId, orderNumber, amount },
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send low stock alert to seller
   */
  async notifyLowStock(sellerId: string, productId: string, productName: string, stock: number) {
    await this.createNotification({
      userId: sellerId,
      type: NotificationType.LOW_STOCK_ALERT,
      title: 'Low Stock Alert',
      message: `${productName} is running low (${stock} remaining)`,
      link: `/seller/products/${productId}`,
      metadata: { productId, productName, stock },
      priority: NotificationPriority.HIGH,
    });
  }

  /**
   * Send product review notification to seller
   */
  async notifyProductReview(
    sellerId: string,
    productId: string,
    productName: string,
    rating: number
  ) {
    await this.createNotification({
      userId: sellerId,
      type: NotificationType.PRODUCT_REVIEW,
      title: 'New Product Review',
      message: `${productName} received a ${rating}-star review`,
      link: `/seller/products/${productId}`,
      metadata: { productId, productName, rating },
    });
  }

  /**
   * Send payout processed notification to seller
   */
  async notifyPayoutProcessed(
    sellerId: string,
    payoutId: string,
    amount: number,
    currency: string
  ) {
    await this.createNotification({
      userId: sellerId,
      type: NotificationType.PAYOUT_PROCESSED,
      title: 'Payout Processed',
      message: `Your payout of ${currency} ${amount.toFixed(2)} has been processed`,
      link: `/seller/payouts`,
      metadata: { payoutId, amount, currency },
      priority: NotificationPriority.HIGH,
    });
  }
}
