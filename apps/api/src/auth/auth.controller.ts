import { Controller, Post, Body, UseGuards, Request, Response } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'];
    const sessionId = req.body?.sessionId;

    return this.authService.login(req.user, sessionId, {
      ipAddress,
      userAgent,
    });
  }

  @Post('register')
  async register(
    @Request() req: any,
    @Body()
    body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      sessionId?: string;
    }
  ) {
    const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'];

    return this.authService.register({
      ...body,
      deviceInfo: { ipAddress, userAgent },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any, @Response() res: ExpressResponse) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await this.authService.logout(token, req.user?.id);
    }

    // Get hostname from request for domain handling
    const hostname = req.hostname || req.get('host')?.split(':')[0] || 'localhost';
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || req.protocol === 'https';

    // Cookie options matching frontend exactly
    const baseCookieOptions = {
      path: '/',
      httpOnly: false, // Frontend needs to read these
      secure: isSecure,
      sameSite: 'lax' as const,
      expires: new Date(0),
    };

    // All possible cookie variations
    const cookieNames = [
      'nextpik_ecommerce_access_token',
      'nextpik_ecommerce_refresh_token',
      'auth_token',
      'refresh_token',
      'access_token',
      'nextpik_session_token',
      'nextpik_ecommerce_user',
      'token',
      'jwt',
    ];

    // Strategy 1: Clear without domain (matches how frontend sets them)
    cookieNames.forEach((name) => {
      res.clearCookie(name, baseCookieOptions);
    });

    // Strategy 2: Clear with root domain for Cloudflare/production
    if (hostname !== 'localhost' && !hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        const rootDomain = '.' + parts.slice(-2).join('.');
        const domainOptions = { ...baseCookieOptions, domain: rootDomain };
        cookieNames.forEach((name) => {
          res.clearCookie(name, domainOptions);
        });
      }
    }

    // Log for production debugging
    if (isProduction) {
      this.authService['logger'].log(
        `Logout complete for user ${req.user?.id || 'unknown'} from ${hostname}`
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
