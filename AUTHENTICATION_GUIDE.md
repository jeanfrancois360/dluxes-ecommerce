# Luxury E-commerce Authentication System

**Elegant, Secure, User-Friendly Authentication**

## Overview

A complete authentication system designed for luxury e-commerce with a focus on:
- ✨ **Elegant UI/UX** - Floating labels, smooth animations, premium feel
- 🔒 **Enterprise Security** - 2FA, rate limiting, session management
- 🎨 **Luxury Aesthetic** - Black, Gold, Gray, White color palette
- 📧 **Beautiful Emails** - Professionally designed templates
- 🚀 **Modern Features** - Magic links, biometric auth, social login

---

## Features

### 🎯 Core Authentication

- **Email/Password Login** - Traditional secure authentication
- **Social Authentication** - Google, Apple, GitHub
- **Magic Link** - Passwordless authentication via email
- **Two-Factor Authentication (2FA)** - TOTP-based security
- **Biometric Authentication** - Face ID, Touch ID support
- **Remember Me** - Persistent sessions (30 days)

### 🔐 Security Features

- **Rate Limiting** - 5 login attempts per minute
- **Account Lockout** - 15-minute lockout after 5 failed attempts
- **Session Management** - Multiple device tracking
- **Password Reset** - Secure token-based reset
- **IP Tracking** - Login attempt monitoring
- **Device Fingerprinting** - Browser and OS detection

### 🎨 UI/UX Features

- **Floating Labels** - Elegant input fields with smooth animations
- **Auto-Advancing OTP** - 6-digit code with auto-focus
- **Password Strength Indicator** - Visual feedback
- **Social Login Buttons** - One-click authentication
- **Loading States** - Shimmer effects and spinners
- **Error Messages** - User-friendly, non-technical
- **Success Animations** - Subtle confetti/checkmarks

---

## Architecture

```
apps/
├── api/                           # NestJS Backend
│   └── src/
│       ├── auth/
│       │   ├── dto/
│       │   │   └── auth.dto.ts           # Request validation DTOs
│       │   ├── guards/
│       │   │   ├── jwt-auth.guard.ts     # JWT authentication guard
│       │   │   └── local-auth.guard.ts   # Local strategy guard
│       │   ├── strategies/
│       │   │   ├── jwt.strategy.ts       # JWT validation
│       │   │   └── local.strategy.ts     # Password validation
│       │   ├── enhanced-auth.service.ts  # 🆕 Complete auth logic
│       │   └── enhanced-auth.controller.ts # 🆕 API endpoints
│       └── email/
│           └── templates/
│               ├── base.template.ts          # 🆕 Email base layout
│               ├── magic-link.template.ts    # 🆕 Magic link email
│               ├── password-reset.template.ts # 🆕 Password reset email
│               └── welcome.template.ts       # 🆕 Welcome email
│
├── web/                           # Next.js Frontend
│   └── src/
│       ├── app/auth/
│       │   ├── login/
│       │   │   └── page.tsx              # 🆕 Login page
│       │   ├── register/
│       │   │   └── page.tsx              # 🆕 Register page
│       │   ├── forgot-password/
│       │   │   └── page.tsx              # Password reset request
│       │   ├── reset-password/
│       │   │   └── page.tsx              # Password reset form
│       │   └── magic-link/
│       │       └── page.tsx              # Magic link landing
│       └── components/auth/
│           └── auth-layout.tsx           # 🆕 Auth page wrapper
│
└── packages/
    ├── database/
    │   └── prisma/
    │       └── schema.prisma             # 🆕 Enhanced schema
    └── ui/
        └── src/components/
            ├── floating-input.tsx        # 🆕 Elegant input field
            └── otp-input.tsx             # 🆕 2FA code input

```

---

## Database Schema

### Enhanced User Model

```prisma
model User {
  id               String    @id @default(cuid())
  email            String    @unique
  firstName        String
  lastName         String
  password         String?   // Nullable for passwordless auth
  role             UserRole  @default(CUSTOMER)

  // 2FA
  twoFactorEnabled Boolean   @default(false)
  twoFactorSecret  String?

  // Account Status
  isActive         Boolean   @default(true)
  isSuspended      Boolean   @default(false)
  lastLoginAt      DateTime?
  lastLoginIp      String?

  // Relations
  sessions         UserSession[]
  magicLinks       MagicLink[]
  loginAttempts    LoginAttempt[]
  passwordResets   PasswordReset[]
}
```

### Session Management

```prisma
model UserSession {
  id           String   @id @default(cuid())
  userId       String
  token        String   @unique

  // Device Information
  deviceName   String?
  deviceType   String?  // "desktop", "mobile", "tablet"
  browser      String?
  os           String?
  ipAddress    String?
  location     String?

  // Session Status
  isActive     Boolean  @default(true)
  lastActiveAt DateTime @default(now())
  expiresAt    DateTime
}
```

### Magic Link Authentication

```prisma
model MagicLink {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  email     String
  used      Boolean  @default(false)
  usedAt    DateTime?
  expiresAt DateTime
}
```

### Rate Limiting

```prisma
model LoginAttempt {
  id        String   @id @default(cuid())
  userId    String?
  email     String
  ipAddress String
  success   Boolean  @default(false)
  reason    String?
  createdAt DateTime @default(now())
}
```

---

## API Endpoints

### Public Endpoints

#### Register
```typescript
POST /auth/register
Body: {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}
Response: {
  accessToken: string
  sessionToken: string
  user: User
}
```

#### Login
```typescript
POST /auth/login
Body: {
  email: string
  password: string
  rememberMe?: boolean
  twoFactorCode?: string  // Required if 2FA enabled
}
Response: {
  accessToken: string
  sessionToken: string
  user: User
} | {
  requires2FA: true
  userId: string
}
```

#### Magic Link Request
```typescript
POST /auth/magic-link/request
Body: { email: string }
Response: {
  message: "If the email exists, a magic link has been sent"
}
```

#### Magic Link Verify
```typescript
POST /auth/magic-link/verify
Body: { token: string }
Response: {
  accessToken: string
  sessionToken: string
  user: User
}
```

#### Password Reset Request
```typescript
POST /auth/password/reset-request
Body: { email: string }
Response: {
  message: "If the email exists, a reset link has been sent"
}
```

#### Password Reset
```typescript
POST /auth/password/reset
Body: {
  token: string
  newPassword: string
}
Response: {
  message: "Password reset successful"
}
```

### Protected Endpoints (Require JWT)

#### Get Current User
```typescript
GET /auth/me
Headers: { Authorization: "Bearer <token>" }
Response: User
```

#### Setup 2FA
```typescript
POST /auth/2fa/setup
Response: {
  secret: string
  qrCode: string
}
```

#### Enable 2FA
```typescript
POST /auth/2fa/enable
Body: { code: string }
Response: { message: "2FA enabled successfully" }
```

#### Disable 2FA
```typescript
POST /auth/2fa/disable
Body: { code: string }
Response: { message: "2FA disabled successfully" }
```

#### Get Sessions
```typescript
GET /auth/sessions
Response: UserSession[]
```

#### Revoke Session
```typescript
DELETE /auth/sessions/:sessionId
Response: { message: "Session revoked successfully" }
```

#### Revoke All Sessions
```typescript
DELETE /auth/sessions
Response: { message: "All sessions revoked successfully" }
```

---

## Frontend Components

### FloatingInput

Elegant input field with floating label animation.

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

**Features:**
- Smooth label float animation
- Error state with message
- Icon support
- Focus/hover states
- Fully accessible

### OTPInput

Beautiful 6-digit OTP input with auto-advance.

```tsx
import { OTPInput } from '@luxury/ui/components/otp-input';

<OTPInput
  length={6}
  value={otpValue}
  onChange={setOtpValue}
  error={error}
/>
```

**Features:**
- Auto-advance between inputs
- Paste support
- Keyboard navigation (arrows, backspace)
- Success animation when filled
- Error state

### AuthLayout

Wrapper for authentication pages with consistent styling.

```tsx
import AuthLayout from '@/components/auth/auth-layout';

<AuthLayout
  title="Welcome Back"
  subtitle="Sign in to access your luxury collection"
>
  {/* Your auth form */}
</AuthLayout>
```

---

## Email Templates

### Magic Link Email

**Design:**
- Hero icon with gradient background
- Clear CTA button
- Security note
- Link expiry warning

**Variables:**
- `name`: User's first name
- `magicLink`: Authentication URL

### Password Reset Email

**Design:**
- Warning icon
- Strong CTA
- Security tips
- Clear expiry time

**Variables:**
- `name`: User's first name
- `resetLink`: Password reset URL

### Welcome Email

**Design:**
- Success icon
- Onboarding steps
- Welcome offer/promo code
- Quick action buttons

**Variables:**
- `name`: User's first name

---

## Security Best Practices

### Rate Limiting

```typescript
// Automatic rate limiting on sensitive endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
@Post('login')
async login() { ... }
```

### Password Hashing

```typescript
// bcrypt with 12 rounds
const hashedPassword = await bcrypt.hash(password, 12);
```

### Token Security

- **JWT Tokens:** 7-day expiry, signed with secret
- **Magic Links:** 15-minute expiry, single-use
- **Password Reset:** 1-hour expiry, single-use
- **Session Tokens:** Random 32-byte hex, unique per session

### HTTPS Only

All auth endpoints must use HTTPS in production.

### CORS Configuration

Restrict origins to your domain only.

---

## Usage Examples

### Frontend: Login Flow

```tsx
'use client';

import { useState } from 'react';
import { FloatingInput } from '@luxury/ui';
import { OTPInput } from '@luxury/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show2FA, setShow2FA] = useState(false);
  const [otpValue, setOtpValue] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.requires2FA) {
      setShow2FA(true);
    } else {
      // Store token and redirect
      localStorage.setItem('token', data.accessToken);
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {!show2FA ? (
        <>
          <FloatingInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <FloatingInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign In</button>
        </>
      ) : (
        <OTPInput
          length={6}
          value={otpValue}
          onChange={setOtpValue}
        />
      )}
    </form>
  );
}
```

### Backend: Custom Auth Guard

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

// Usage in controller
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@Req() req) {
  return req.user;
}
```

---

## Deployment

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/luxury_ecommerce

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Email (Optional - for sending emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@luxury.com
SMTP_PASS=password

# Frontend URL
FRONTEND_URL=https://luxury-ecommerce.com

# API URL
API_URL=https://api.luxury-ecommerce.com
```

### Database Migration

```bash
# Run Prisma migration
cd packages/database
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Build & Start

```bash
# Build API
cd apps/api
npm run build
npm run start:prod

# Build Web
cd apps/web
npm run build
npm start
```

---

## Testing

### Manual Testing

1. **Register**: Create new account
2. **Login**: Test email/password
3. **2FA**: Enable and test OTP
4. **Magic Link**: Request and verify
5. **Password Reset**: Request and complete
6. **Sessions**: Test multiple devices
7. **Rate Limiting**: Trigger lockout

### Postman Collection

Import the auth endpoints and test:
- Registration
- Login (with/without 2FA)
- Magic link flow
- Password reset flow
- Session management

---

## Troubleshooting

### "Invalid credentials" even with correct password

**Check:**
1. Password is hashed correctly
2. bcrypt.compare() is used
3. Email is lowercase/normalized

### Magic link not working

**Check:**
1. Token is SHA256 hashed when storing
2. Same hash used when verifying
3. Expiry time not passed
4. Link not already used

### 2FA code rejected

**Check:**
1. TOTP secret stored correctly
2. Time sync between server and authenticator app
3. Code not expired (30-second window)

### Rate limiting too aggressive

**Adjust:**
```typescript
@Throttle({ default: { limit: 10, ttl: 60000 } }) // Increase limit
```

---

## Roadmap

- [ ] WebAuthn/FIDO2 support
- [ ] Passkey authentication
- [ ] OAuth2 provider (allow other apps to use your auth)
- [ ] Advanced fraud detection
- [ ] Geolocation-based security
- [ ] Device trust scores
- [ ] Biometric authentication on web (WebAuthn)

---

## Support

- **Documentation**: This file
- **Issues**: GitHub issues
- **Email**: support@luxury-ecommerce.com

---

**Built with ❤️ for luxury e-commerce**

*Elegant authentication that matches your brand*
