import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { EmailOTPType } from '@prisma/client';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { EnhancedAuthService } from './enhanced-auth.service';
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
} from './dto/auth.dto';

@Controller('auth')
export class EnhancedAuthController {
  constructor(
    private authService: EnhancedAuthService,
    private googleOAuthService: GoogleOAuthService,
  ) {}

  // ============================================================================
  // Public Routes
  // ============================================================================

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('magic-link/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async requestMagicLink(@Body() dto: MagicLinkDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.sendMagicLink(dto, ipAddress, userAgent);
  }

  @Post('magic-link/verify')
  @HttpCode(HttpStatus.OK)
  async verifyMagicLink(@Body() dto: VerifyMagicLinkDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.verifyMagicLink(dto.token, ipAddress, userAgent);
  }

  @Post('password/reset-request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async requestPasswordReset(@Body() dto: PasswordResetRequestDto, @Req() req: Request) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.requestPasswordReset(dto, ipAddress, userAgent);
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: PasswordResetDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('email/verify')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: { token: string }) {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('email/resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  async resendVerification(@Body() dto: { email: string }) {
    return this.authService.resendEmailVerification(dto.email);
  }

  // ============================================================================
  // Protected Routes (Require Authentication)
  // ============================================================================

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  async setup2FA(@Req() req: any) {
    return this.authService.setup2FA(req.user.id);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  async enable2FA(@Body() dto: Enable2FADto, @Req() req: any) {
    return this.authService.enable2FA(req.user.id, dto.code);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  async disable2FA(@Body() dto: Verify2FADto, @Req() req: any) {
    return this.authService.disable2FA(req.user.id, dto.code);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Req() req: any) {
    return this.authService.getUserSessions(req.user.id);
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  async revokeSession(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.authService.revokeSession(req.user.id, sessionId);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  async revokeAllSessions(@Req() req: any) {
    // Except current session (passed via query or header if needed)
    return this.authService.revokeAllSessions(req.user.id);
  }

  // ============================================================================
  // Email OTP Routes
  // ============================================================================

  @Post('email-otp/request')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @HttpCode(HttpStatus.OK)
  async requestEmailOTP(
    @Body() dto: { type: EmailOTPType },
    @Req() req: any,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.requestEmailOTP(
      req.user.id,
      dto.type,
      ipAddress,
      userAgent,
    );
  }

  @Post('email-otp/verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmailOTP(
    @Body() dto: { code: string; type: EmailOTPType },
    @Req() req: any,
  ) {
    return this.authService.verifyEmailOTP(req.user.id, dto.code, dto.type);
  }

  @Post('email-otp/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enableEmailOTP(@Req() req: any) {
    return this.authService.enableEmailOTP(req.user.id);
  }

  @Post('email-otp/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disableEmailOTP(@Req() req: any) {
    return this.authService.disableEmailOTP(req.user.id);
  }

  @Get('email-otp/status')
  @UseGuards(JwtAuthGuard)
  async getEmailOTPStatus(@Req() req: any) {
    const enabled = await this.authService.isEmailOTPEnabled(req.user.id);
    return { enabled };
  }

  @Post('login/email-otp')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @HttpCode(HttpStatus.OK)
  async loginWithEmailOTP(
    @Body() dto: { email: string; password: string; otpCode: string },
    @Req() req: Request,
  ) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.authService.loginWithEmailOTP(
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
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: any) {
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    return this.googleOAuthService.googleAuth(req.user, ipAddress, userAgent);
  }

  @Post('google/link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkGoogleAccount(@Req() req: any, @Body() dto: { googleToken: string }) {
    // In production, verify the Google token first
    // For now, we'll use the authenticated user and a mock Google user
    return this.googleOAuthService.linkGoogleAccount(req.user.id, req.user);
  }

  @Post('google/unlink')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unlinkGoogleAccount(@Req() req: any) {
    return this.googleOAuthService.unlinkGoogleAccount(req.user.id);
  }
}
