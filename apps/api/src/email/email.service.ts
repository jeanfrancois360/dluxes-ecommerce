import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailOTPType } from '@prisma/client';
import { magicLinkTemplate } from './templates/magic-link.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';
import { getEmailOTPTemplate } from './templates/email-otp.template';

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
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.log(`Magic link token for ${email}: ${token}`);
        return false;
      }

      const magicLink = `${this.frontendUrl}/auth/magic-link?token=${token}`;
      const html = magicLinkTemplate(name, magicLink);

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
      if (!process.env.RESEND_API_KEY) {
        this.logger.warn('Skipping email send - RESEND_API_KEY not configured');
        this.logger.log(`Password reset token for ${email}: ${token}`);
        return false;
      }

      const resetLink = `${this.frontendUrl}/auth/reset-password?token=${token}`;
      const html = passwordResetTemplate(name, resetLink);

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

      const html = welcomeTemplate(name);

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
    ipAddress?: string,
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
}
