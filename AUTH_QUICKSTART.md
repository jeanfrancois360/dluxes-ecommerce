# Authentication Quick Start

Get your luxury authentication system running in 5 minutes.

## Step 1: Update Database Schema

```bash
cd packages/database

# Generate and apply migration
npx prisma migrate dev --name add_enhanced_auth

# Generate Prisma client
npx prisma generate
```

## Step 2: Install Dependencies (if needed)

```bash
# API dependencies (most already installed)
cd apps/api
npm install speakeasy qrcode nodemailer @types/speakeasy @types/qrcode

# Web dependencies (already installed)
cd apps/web
# All dependencies present
```

## Step 3: Configure Environment Variables

```bash
# apps/api/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/luxury_ecommerce"
JWT_SECRET="your-super-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"

# Optional - for sending emails
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

## Step 4: Update Auth Module

Update `apps/api/src/auth/auth.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

import { EnhancedAuthService } from './enhanced-auth.service';
import { EnhancedAuthController } from './enhanced-auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 10,  // 10 requests
    }]),
  ],
  controllers: [EnhancedAuthController],
  providers: [
    EnhancedAuthService,
    PrismaService,
    JwtStrategy,
    LocalStrategy,
    JwtAuthGuard,
  ],
  exports: [EnhancedAuthService],
})
export class AuthModule {}
```

## Step 5: Start Development Servers

```bash
# Terminal 1 - API
cd apps/api
npm run dev

# Terminal 2 - Web
cd apps/web
npm run dev
```

## Step 6: Test Authentication

### Register New User

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Access Protected Route

```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Step 7: Access the UI

Open your browser and visit:

- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register
- **Password Reset**: http://localhost:3000/auth/forgot-password

## Features to Test

✅ **Registration** - Create new account
✅ **Login** - Email/password authentication
✅ **Magic Link** - Passwordless login (check server logs for link)
✅ **Password Reset** - Request and reset password
✅ **2FA Setup** - Enable two-factor authentication
✅ **Session Management** - View and revoke sessions
✅ **Social Login** - Google, Apple, GitHub (needs provider setup)

## Common Issues

### Database Connection Error

**Problem**: Can't connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql
# or
sudo systemctl start postgresql
```

### JWT Secret Error

**Problem**: "JWT_SECRET is not defined"

**Solution**: Set in `.env` file:
```bash
JWT_SECRET="a-very-long-random-string-min-32-characters"
```

### CORS Error

**Problem**: Frontend can't reach API

**Solution**: Update `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: 'http://localhost:3000',
  credentials: true,
});
```

### Email Not Sending

**Problem**: Magic link/password reset emails not sending

**Solution**:
1. Email functionality is stubbed - check console logs for links
2. To enable real emails, implement email service with nodemailer
3. Check SMTP configuration in `.env`

## Next Steps

1. **Customize UI** - Update colors, logos, copy
2. **Add Social Providers** - Configure OAuth apps
3. **Implement Email Service** - Connect SMTP or SendGrid
4. **Enable 2FA** - Complete speakeasy integration
5. **Add Biometric Auth** - Implement WebAuthn
6. **Deploy** - Use Vercel (web) + Railway (api)

## Pro Tips

💡 **Security**
- Change JWT_SECRET in production
- Use HTTPS only
- Enable rate limiting
- Monitor login attempts

💡 **UX**
- Test on mobile devices
- Check accessibility
- Add loading skeletons
- Implement error recovery

💡 **Performance**
- Add Redis for session caching
- Implement JWT refresh tokens
- Use CDN for static assets

## Resources

- [Full Documentation](./AUTHENTICATION_GUIDE.md)
- [Database Schema](./packages/database/SCHEMA_OVERVIEW.md)
- [API Reference](./AUTHENTICATION_GUIDE.md#api-endpoints)
- [UI Components](./packages/ui/README.md)

---

**Need Help?**

- Check [AUTHENTICATION_GUIDE.md](./AUTHENTICATION_GUIDE.md) for detailed docs
- Review [Troubleshooting](./AUTHENTICATION_GUIDE.md#troubleshooting) section
- Open an issue on GitHub

**You're all set!** 🎉

Your luxury authentication system is ready to protect your premium e-commerce platform.
