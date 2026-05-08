import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // If the JWT was issued with a session ID, verify the session is still active.
    // This ensures revoked devices (logged out from the sessions list) are immediately blocked.
    if (payload.session_id) {
      const session = await this.prisma.userSession.findUnique({
        where: { id: payload.session_id },
        select: { isActive: true, expiresAt: true },
      });
      if (!session || !session.isActive || new Date() > session.expiresAt) {
        throw new UnauthorizedException('Session has been revoked');
      }
    }

    // Return user object with 'id' for consistency across the app
    return {
      id: payload.sub, // Primary user ID
      userId: payload.sub, // Alias for backward compatibility
      email: payload.email,
      role: payload.role,
      setupOnly: payload.setup_only ?? false, // true for 15-min setup-only tokens (v2.12.0)
      sessionId: payload.session_id ?? null, // Used to identify the current session
    };
  }
}
