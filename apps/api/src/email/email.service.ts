import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { magicLinkTemplate } from './templates/magic-link.template';
import { passwordResetTemplate } from './templates/password-reset.template';
import { welcomeTemplate } from './templates/welcome.template';

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
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@luxury-ecommerce.com';
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
        subject: '🔑 Reset Your Password - Luxury E-commerce',
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
        subject: `✨ Welcome to Luxury E-commerce, ${name}!`,
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
                <p style="color: #A3A3A3; font-size: 16px; margin: 12px 0 0;">Welcome to Luxury E-commerce</p>
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
                  © ${new Date().getFullYear()} Luxury E-commerce. All rights reserved.
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: email,
        subject: '✉️ Verify Your Email - Luxury E-commerce',
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
}
