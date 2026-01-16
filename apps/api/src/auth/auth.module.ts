import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EnhancedAuthService } from './enhanced-auth.service';
import { EnhancedAuthController } from './enhanced-auth.controller';
import { EmailOTPService } from './email-otp.service';
import { GoogleOAuthService } from './google-oauth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { UsersModule } from '../users/users.module';
import { EmailModule } from '../email/email.module';
import { DatabaseModule } from '../database/database.module';
import { CartModule } from '../cart/cart.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    UsersModule,
    EmailModule,
    DatabaseModule,
    CartModule,
    SettingsModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
  ],
  providers: [
    AuthService,
    EnhancedAuthService,
    EmailOTPService,
    GoogleOAuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
  controllers: [EnhancedAuthController], // Using EnhancedAuthController with all new features
  exports: [AuthService, EnhancedAuthService, EmailOTPService, GoogleOAuthService],
})
export class AuthModule {}
