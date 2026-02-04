import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { EmailOTPType } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
// New refactored services
import { AuthCoreService } from './services/auth-core.service';
import { PasswordService } from './services/password.service';
import { EmailVerificationService } from './services/email-verification.service';
import { MagicLinkService } from './services/magic-link.service';
import { TwoFactorService } from './services/two-factor.service';
import { SessionService } from './services/session.service';
// Existing services
import { EnhancedAuthService } from './enhanced-auth.service';
import { EmailOTPService } from './email-otp.service';
import { GoogleOAuthService } from './google-oauth.service';
import {
  RegisterDto,
  LoginDto,
  MagicLinkDto,
  PasswordResetDto,
  PasswordResetRequestDto,
  Enable2FADto,
  Verify2FADto,
  VerifyMagicLinkDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ChangePasswordDto,
} from './dto/auth.dto';

@ApiTags('Authentication')
@Controller('auth')
export class EnhancedAuthController {
  constructor(
    // New refactored services
    private authCoreService: AuthCoreService,
    private passwordService: PasswordService,
    private emailVerificationService: EmailVerificationService,
    private magicLinkService: MagicLinkService,
    private twoFactorService: TwoFactorService,
    private sessionService: SessionService,
    // Existing services
    private emailOTPService: EmailOTPService,
    private googleOAuthService: GoogleOAuthService,
    // Keep legacy service for any remaining methods
    private enhancedAuthService: EnhancedAuthService,
    // Config
    private configService: ConfigService,
  ) {}

  // ============================================================================
  // Public Routes
  // ============================================================================

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful, returns JWT and session token' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded (3 req/hour)' })
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authCoreService.register(dto, ipAddress, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful or 2FA required' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or account locked' })
  @ApiResponse({ status: 423, description: 'Account locked due to failed attempts' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authCoreService.login(dto, ipAddress, userAgent);
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request a magic link for passwordless login' })
  @ApiResponse({ status: 200, description: 'Magic link sent (same response whether email exists or not)' })
  async requestMagicLink(@Body() dto: MagicLinkDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.magicLinkService.sendMagicLink(dto, ipAddress, userAgent);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify a magic link and log in' })
  @ApiResponse({ status: 200, description: 'Login successful via magic link' })
  @ApiResponse({ status: 401, description: 'Invalid, used, or expired magic link' })
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.magicLinkService.verifyMagicLink(dto.token, ipAddress, userAgent);
  }

  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  @ApiResponse({ status: 200, description: 'Reset email sent (same response whether email exists or not)' })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.passwordService.requestPasswordReset(dto, ipAddress, userAgent);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid token' })
  @ApiResponse({ status: 200, description: 'Password reset successful, all sessions revoked' })
  @ApiResponse({ status: 401, description: 'Invalid, used, or expired token' })
  async resetPassword(@Body() dto: PasswordResetDto) {
    return this.passwordService.resetPassword(dto);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address using a verification token' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid, used, or expired token (includes canResend flag if expired)' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(dto.token);
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  @ApiOperation({ summary: 'Resend email verification link' })
  @ApiResponse({ status: 200, description: 'Verification email sent (same response whether email exists or not)' })
  @ApiResponse({ status: 400, description: 'Email already verified' })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.emailVerificationService.resendEmailVerification(dto.email);
  }

  // ============================================================================
  // Protected Routes (Require Authentication)
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile (sensitive fields stripped)' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup TOTP 2FA — generates secret and QR code' })
  @ApiResponse({ status: 201, description: 'Returns secret, QR code data URL, and otpauth URL' })
  async setup2FA(@Req() req: any) {
    return this.twoFactorService.setup2FA(req.user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable 2FA after verifying a TOTP code' })
  @ApiResponse({ status: 201, description: '2FA enabled; returns 10 one-time backup codes' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async enable2FA(@Body() dto: Enable2FADto, @Req() req: any) {
    return this.twoFactorService.enable2FA(req.user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA (requires current TOTP code). All sessions revoked.' })
  @ApiResponse({ status: 200, description: '2FA disabled, backup codes cleared' })
  @ApiResponse({ status: 400, description: 'Invalid verification code' })
  async disable2FA(@Body() dto: Verify2FADto, @Req() req: any) {
    return this.twoFactorService.disable2FA(req.user.id, dto.code);
  }

  @Post('2fa/regenerate-backup-codes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Regenerate 2FA backup codes (replaces existing set)' })
  @ApiResponse({ status: 200, description: 'Returns 10 new one-time backup codes' })
  @ApiResponse({ status: 400, description: '2FA not enabled' })
  async regenerateBackupCodes(@Req() req: any) {
    return this.twoFactorService.regenerateBackupCodes(req.user.id);
  }

  @Post('password/change')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (requires current password). All sessions revoked.' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Current password incorrect or passwordless account' })
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: any) {
    return this.passwordService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  // ============================================================================
  // Email OTP Routes
  // ============================================================================

  @Post('email-otp/request')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 1800000 } })
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Request an Email OTP for the given type' })
  @ApiResponse({ status: 200, description: 'OTP sent to registered email' })
  async requestEmailOTP(
    @Body() dto: { type: EmailOTPType },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.enhancedAuthService.requestEmailOTP(
      req.user.id,
      dto.type,
      ipAddress,
      userAgent,
    );
  }

  @Post('email-otp/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify an Email OTP code' })
  @ApiResponse({ status: 200, description: 'OTP verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP' })
  async verifyEmailOTP(
    @Body() dto: { code: string; type: EmailOTPType },
    @Req() req: any,
  ) {
    return this.enhancedAuthService.verifyEmailOTP(req.user.id, dto.code, dto.type);
  }

  @Post('email-otp/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enable Email OTP as a 2FA method' })
  @ApiResponse({ status: 200, description: 'Email OTP enabled' })
  async enableEmailOTP(@Req() req: any) {
    return this.enhancedAuthService.enableEmailOTP(req.user.id);
  }

  @Post('email-otp/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable Email OTP 2FA' })
  @ApiResponse({ status: 200, description: 'Email OTP disabled' })
  async disableEmailOTP(@Req() req: any) {
    return this.enhancedAuthService.disableEmailOTP(req.user.id);
  }

  @Get('email-otp/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if Email OTP is enabled for the current user' })
  @ApiResponse({ status: 200, description: 'Returns { enabled: boolean }' })
  async getEmailOTPStatus(@Req() req: any) {
    const enabled = await this.enhancedAuthService.isEmailOTPEnabled(req.user.id);
    return { enabled };
  }

  @Post('login/email-otp')
  @Throttle({ default: { limit: 5, ttl: 1800000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login using email + password + Email OTP code' })
  @ApiResponse({ status: 200, description: 'Login successful with Email OTP verification' })
  @ApiResponse({ status: 401, description: 'Invalid credentials or OTP' })
  async loginWithEmailOTP(
    @Body() dto: { email: string; password: string; otpCode: string },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.enhancedAuthService.loginWithEmailOTP(
      dto.email,
      dto.password,
      dto.otpCode,
      ipAddress,
      userAgent,
    );
  }

  // ============================================================================
  // Google OAuth Routes
  // ============================================================================

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login (redirects to Google)' })
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback — creates/links account and redirects to frontend' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend callback with tokens' })
  @ApiResponse({ status: 302, description: 'Redirects to login with error on failure' })
  async googleAuthCallback(@Req() req: any, @Res() res: Response) {
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

    try {
      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await this.googleOAuthService.googleAuth(req.user, ipAddress, userAgent);

      const params = new URLSearchParams({
        accessToken: result.accessToken,
        sessionToken: result.sessionToken,
        user: Buffer.from(JSON.stringify(result.user)).toString('base64'),
        isNewUser: String(result.isNewUser),
      });

      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (err: any) {
      const message = err.message || 'Google authentication failed';
      const params = new URLSearchParams({ error: message });
      return res.redirect(`${frontendUrl}/auth/login?${params.toString()}`);
    }
  }

  @Post('google/unlink')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlink Google account (requires a password already set)' })
  @ApiResponse({ status: 200, description: 'Google account unlinked' })
  @ApiResponse({ status: 400, description: 'No Google account linked, or no password set' })
  async unlinkGoogleAccount(@Req() req: any) {
    return this.googleOAuthService.unlinkGoogleAccount(req.user.id);
  }

  // ============================================================================
  // Session Management Routes (Device Trust / Remember Me Enhancement)
  // ============================================================================

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all active sessions for the current user' })
  @ApiResponse({ status: 200, description: 'Returns sessions with device info; current session marked with isCurrent: true' })
  async getUserSessions(@Req() req: any) {
    const sessions = await this.sessionService.getUserSessions(req.user.id);

    // Mark current session
    const currentToken = req.headers.authorization?.replace('Bearer ', '');
    return sessions.map((session) => ({
      ...session,
      isCurrent: session.token === currentToken,
    }));
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke (sign out) a specific session by ID' })
  @ApiResponse({ status: 200, description: 'Session revoked' })
  async revokeSession(@Req() req: any, @Param('sessionId') sessionId: string) {
    return this.sessionService.revokeSession(req.user.id, sessionId);
  }

  @Post('sessions/revoke-all-other')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sign out all other sessions (keeps current session active)' })
  @ApiResponse({ status: 200, description: 'Returns { message, revokedCount }' })
  async revokeAllOtherSessions(@Req() req: any) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Get current session fingerprint
    const currentFingerprint = await this.sessionService.getCurrentSessionFingerprint(
      ipAddress,
      userAgent,
    );

    const allSessions = await this.sessionService.getUserSessions(req.user.id);

    // Find the most recent session with matching fingerprint as "current"
    const sessionsWithFingerprint = allSessions.filter(
      (s) => s.fingerprint === currentFingerprint,
    );
    const currentSession =
      sessionsWithFingerprint.length > 0
        ? sessionsWithFingerprint.sort(
            (a, b) =>
              new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
          )[0]
        : null;

    // Revoke all sessions except the current one
    const revokePromises = allSessions
      .filter((session) => session.id !== currentSession?.id)
      .map((session) => this.sessionService.revokeSession(req.user.id, session.id));

    await Promise.all(revokePromises);

    return {
      message: 'All other sessions revoked successfully',
      revokedCount: revokePromises.length,
    };
  }
}
