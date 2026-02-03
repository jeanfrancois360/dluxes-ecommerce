import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';

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
}
