# 🔐 Authentication System Setup Guide

Complete setup instructions for the Luxury E-commerce Authentication System.

---

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Resend account (for email sending) - **Optional but recommended**

---

## 🚀 Quick Start

### 1. Environment Configuration

Copy the example environment file and configure:

```bash
cp .env.example .env
```

Update the following variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/luxury_ecommerce?schema=public"

# JWT Configuration
JWT_SECRET="your-super-secret-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# Email Service (Resend) - Get free API key at https://resend.com
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="noreply@yourdomain.com"

# URLs
FRONTEND_URL="http://localhost:3000"
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

---

### 2. Database Setup

```bash
# Navigate to database package
cd packages/database

# Run Prisma migrations
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

---

### 3. Install Dependencies

```bash
# From root directory
pnpm install
```

---

### 4. Start Development Servers

```bash
# Terminal 1 - API Server
cd apps/api
pnpm dev

# Terminal 2 - Web App
cd apps/web
pnpm dev
```

The app will be available at:
- Frontend: http://localhost:3000
- API: http://localhost:3001

---

## 📧 Email Setup (Resend)

### Getting Your Resend API Key

1. Go to [Resend.com](https://resend.com) and sign up
2. Verify your email address
3. Navigate to **API Keys** in the dashboard
4. Click **Create API Key**
5. Copy the key and add it to your `.env` file:

```bash
RESEND_API_KEY="re_..."
```

### Configure Sending Domain

For production, you need to verify your domain:

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown to your domain provider
5. Wait for verification (usually <5 minutes)
6. Update `.env`:

```bash
EMAIL_FROM="noreply@yourdomain.com"
```

### Development Without Email

The system works WITHOUT Resend configured:
- Emails won't be sent
- Magic link and password reset tokens will be logged to console
- Copy tokens from console for testing

---

## 🔑 Features Overview

### ✅ Available Features

| Feature | Status | Description |
|---------|--------|-------------|
| Login/Register | ✅ Complete | Email/password with elegant UI |
| Magic Link | ✅ Complete | Passwordless authentication |
| Password Reset | ✅ Complete | Forgot password flow with email |
| 2FA | ✅ Complete | TOTP with QR code |
| Session Management | ✅ Complete | Multi-device tracking |
| Rate Limiting | ✅ Complete | 5 attempts per 15 minutes |
| Email Templates | ✅ Complete | Beautiful HTML emails |
| Success Animations | ✅ Complete | Subtle confetti effects |
| Session Timeout | ✅ Complete | Warning modal before logout |

---

## 🧪 Testing Authentication

### 1. Register a New User

```bash
POST http://localhost:3001/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "phone": "+1234567890"
}
```

### 2. Login

```bash
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePassword123!",
  "rememberMe": true
}
```

### 3. Request Magic Link

```bash
POST http://localhost:3001/auth/magic-link/request
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Without Resend configured:** Check console for token, then use:
```
http://localhost:3000/auth/magic-link?token=<TOKEN_FROM_CONSOLE>
```

### 4. Setup 2FA

```bash
# Get QR code (requires JWT token)
POST http://localhost:3001/auth/2fa/setup
Authorization: Bearer <YOUR_JWT_TOKEN>

# Returns QR code data URL - scan with Google Authenticator

# Enable 2FA with code from app
POST http://localhost:3001/auth/2fa/enable
Authorization: Bearer <YOUR_JWT_TOKEN>
Content-Type: application/json

{
  "code": "123456"
}
```

### 5. Password Reset Flow

```bash
# Request reset
POST http://localhost:3001/auth/password/reset-request
Content-Type: application/json

{
  "email": "john@example.com"
}

# Check console for token if no email configured

# Reset password
POST http://localhost:3001/auth/password/reset
Content-Type: application/json

{
  "token": "<TOKEN_FROM_EMAIL_OR_CONSOLE>",
  "newPassword": "NewSecurePassword123!"
}
```

---

## 🎨 Using UI Components

### FloatingInput

```tsx
import { FloatingInput } from '@luxury/ui/components/floating-input';

<FloatingInput
  label="Email Address"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={error}
  icon={<EmailIcon />}
  required
/>
```

### OTPInput (2FA)

```tsx
import { OTPInput } from '@luxury/ui/components/otp-input';

<OTPInput
  length={6}
  value={otpValue}
  onChange={setOtpValue}
  error={error}
/>
```

### Success Confetti

```tsx
import { SuccessConfetti } from '@/components/success-confetti';

// Trigger on successful action
<SuccessConfetti type="elegant" delay={200} />
```

### Session Timeout Modal

```tsx
import { SessionTimeoutModal } from '@/components/auth/session-timeout-modal';

<SessionTimeoutModal
  timeout={30 * 60 * 1000}  // 30 minutes
  warningTime={2 * 60 * 1000}  // 2 minute warning
  onTimeout={() => {
    // Handle logout
    router.push('/auth/login');
  }}
  onExtend={async () => {
    // Refresh token
    await refreshSession();
  }}
/>
```

### Rate Limit Message

```tsx
import { RateLimitMessage } from '@/components/auth/rate-limit-message';

{error?.includes('Too many') && (
  <RateLimitMessage
    message={error}
    onComplete={() => setError('')}
  />
)}
```

---

## 🔒 Security Features

### Rate Limiting

- **Login Attempts**: 5 attempts per 15 minutes per IP/email
- **Automatic Lockout**: Account locked for 15 minutes after 5 failed attempts
- **Elegant UI**: Countdown timer shows time remaining

### Session Management

- **JWT Tokens**: 7-day expiry
- **Session Tokens**: Device-specific, revocable
- **Remember Me**: 30-day session vs 24-hour default
- **Multi-Device**: Track and manage all active sessions
- **Automatic Timeout**: Warning modal before expiration

### Password Security

- **Hashing**: bcrypt with 12 rounds
- **Strength Requirements**: Min 8 characters, mixed case, numbers, symbols
- **Visual Indicator**: Real-time password strength meter
- **Reset Tokens**: 1-hour expiry, single-use, SHA256 hashed

### 2FA Security

- **TOTP Standard**: RFC 6238 compliant
- **30-Second Window**: Standard authenticator app timing
- **Clock Drift**: ±2 time steps tolerance
- **QR Code**: Automatic generation for easy setup

### Magic Link Security

- **15-Minute Expiry**: Short-lived tokens
- **Single-Use**: Token invalidated after use
- **SHA256 Hashing**: Tokens hashed in database
- **Email Verification**: Confirms email ownership

---

## 📱 Frontend Pages

All authentication pages are located in `apps/web/src/app/auth/`:

- `/auth/login` - Login page with 2FA support
- `/auth/register` - Registration with password strength
- `/auth/forgot-password` - Request password reset
- `/auth/reset-password?token=...` - Reset password form
- `/auth/magic-link?token=...` - Magic link verification

---

## 🛠 Customization

### Changing Colors

Edit `packages/design-system/src/tokens/colors.ts`:

```ts
export const colors = {
  gold: '#YOUR_ACCENT_COLOR',    // Primary accent
  black: '#YOUR_PRIMARY_COLOR',   // Text/borders
  // ... other colors
};
```

### Email Templates

Templates are in `apps/api/src/email/templates/`:

- `magic-link.template.ts`
- `password-reset.template.ts`
- `welcome.template.ts`

Customize HTML/CSS directly in these files.

### Session Duration

In `apps/api/src/auth/enhanced-auth.service.ts`:

```ts
private readonly SESSION_EXPIRY_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 days
private readonly SESSION_EXPIRY_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours
```

### Rate Limiting

```ts
private readonly MAX_LOGIN_ATTEMPTS = 5;
private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
```

---

## 🐛 Troubleshooting

### "Invalid credentials" with correct password

**Check:**
1. Password is hashed with bcrypt (12 rounds)
2. Email is lowercase in database
3. Check database connection

**Fix:**
```bash
# Reset user password manually
cd packages/database
npx prisma studio
# Navigate to User model and update password field with bcrypt hash
```

### Magic link not working

**Check:**
1. Token is SHA256 hashed when storing
2. Same hash algorithm used when verifying
3. Link hasn't expired (15 minutes)
4. Link hasn't been used already

**Debug:**
```ts
// In enhanced-auth.service.ts, add logging:
console.log('Generated token:', token);
console.log('Hashed token:', hashedToken);
```

### 2FA code rejected

**Check:**
1. TOTP secret is stored correctly in base32
2. Time is synchronized on server and device
3. Code hasn't expired (30-second window)

**Test:**
```bash
# Generate test code
import * as speakeasy from 'speakeasy';
const code = speakeasy.totp({
  secret: 'YOUR_SECRET',
  encoding: 'base32'
});
console.log('Test code:', code);
```

### Emails not sending

**Without Resend:**
- Check console for tokens
- Copy tokens manually for testing

**With Resend:**
1. Verify API key is correct
2. Check domain is verified
3. Ensure `EMAIL_FROM` matches verified domain
4. Check Resend dashboard for errors

---

## 📊 Database Schema

Key tables:

- **users** - User accounts with 2FA fields
- **user_sessions** - Active sessions per device
- **magic_links** - Passwordless auth tokens
- **login_attempts** - Rate limiting data
- **password_resets** - Password reset tokens

View schema: `packages/database/prisma/schema.prisma`

---

## 🚢 Production Deployment

### 1. Environment Variables

Ensure production `.env` has:

```bash
NODE_ENV=production
DATABASE_URL="postgresql://..."  # Production DB
JWT_SECRET="<LONG_RANDOM_STRING>"  # Generate secure key
RESEND_API_KEY="re_..."  # Production key
EMAIL_FROM="noreply@yourdomain.com"  # Verified domain
FRONTEND_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
```

### 2. Database Migration

```bash
cd packages/database
npx prisma migrate deploy
```

### 3. Build Applications

```bash
# API
cd apps/api
pnpm build
pnpm start

# Web
cd apps/web
pnpm build
pnpm start
```

### 4. Security Checklist

- [ ] HTTPS enabled on all endpoints
- [ ] CORS configured for your domain only
- [ ] JWT_SECRET is long and random (min 32 chars)
- [ ] Database uses strong password
- [ ] Resend domain is verified
- [ ] Rate limiting is enabled
- [ ] Environment variables are secure (not in git)
- [ ] Error messages don't leak sensitive info

---

## 📚 Additional Resources

- [Full Authentication Guide](./AUTHENTICATION_GUIDE.md)
- [Quick Start Guide](./AUTH_QUICKSTART.md)
- [Resend Documentation](https://resend.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [Next.js Documentation](https://nextjs.org/docs)

---

## 💬 Support

Having issues? Check:

1. This setup guide
2. The troubleshooting section above
3. Console logs for detailed errors
4. Prisma Studio for database inspection: `npx prisma studio`

---

**Built with ❤️ for luxury e-commerce**
