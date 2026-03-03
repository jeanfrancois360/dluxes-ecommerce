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

    // Clear authentication cookies with proper attributes
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      expires: new Date(0),
    };

    // Clear all possible cookie variations
    const cookieNames = [
      'nextpik_ecommerce_access_token',
      'nextpik_ecommerce_refresh_token',
      'auth_token',
      'refresh_token',
      'access_token',
    ];

    cookieNames.forEach((name) => {
      res.clearCookie(name, cookieOptions);
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
