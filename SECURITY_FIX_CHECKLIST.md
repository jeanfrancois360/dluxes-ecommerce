# Security Fix Checklist - NextPik

**Generated:** February 23, 2026
**Priority:** 🔴 CRITICAL - Complete within 7 days

---

## 🔴 CRITICAL - Do This Week

### 1. Update Vulnerable Dependencies (30 minutes)

```bash
# Update Next.js (fixes DoS vulnerability)
cd apps/web
pnpm update next@latest

# Update all dependencies
cd ../../
pnpm update --recursive

# Fix remaining vulnerabilities
pnpm audit fix

# Verify fixes
pnpm audit --audit-level=high
```

**Expected Result:** 0 critical, 0 high vulnerabilities

---

### 2. Fix XSS in Product Descriptions (1 hour)

**Step 1: Install DOMPurify**

```bash
cd apps/web
pnpm add dompurify
pnpm add -D @types/dompurify isomorphic-dompurify
```

**Step 2: Create sanitize utility**

```bash
# Create file: apps/web/src/lib/sanitize.ts
```

```typescript
// apps/web/src/lib/sanitize.ts
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'a',
      'img',
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class'],
    ALLOW_DATA_ATTR: false,
  });
}
```

**Step 3: Fix product description page**

```typescript
// apps/web/src/app/products/[slug]/page.tsx
import { sanitizeHtml } from '@/lib/sanitize';

// Replace line 1094-1096:
<div
  dangerouslySetInnerHTML={{
    __html: sanitizeHtml(product.richDescription || product.description)
  }}
/>
```

**Step 4: Fix payment gateway card**

```typescript
// apps/web/src/components/settings/payment/PaymentGatewayCard.tsx
import { sanitizeHtml } from '@/lib/sanitize';

// Replace line 197:
<li dangerouslySetInnerHTML={{ __html: sanitizeHtml(step) }} />
```

**Step 5: Test**

```bash
# Test with malicious input
<script>alert('XSS')</script>
# Should render as: &lt;script&gt;alert('XSS')&lt;/script&gt;
```

---

### 3. Add Rate Limiting to Auth Endpoints (2 hours)

**Step 1: Check if ThrottlerModule is configured**

```bash
grep -r "ThrottlerModule" apps/api/src/app.module.ts
```

**Step 2: If not configured, add it**

```typescript
// apps/api/src/app.module.ts
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // Add this
    ThrottlerModule.forRoot([{
      name: 'default',
      ttl: 60000,    // 60 seconds
      limit: 100,    // 100 requests per minute (global default)
    }]),
    // ... other imports
  ],
  providers: [
    // Add global throttle guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // ... other providers
  ],
})
```

**Step 3: Add specific limits to auth controller**

```typescript
// apps/api/src/auth/auth.controller.ts
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {

  // Login: 5 attempts per minute
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(@Body() dto: LoginDto) { ... }

  // Register: 3 attempts per minute
  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  async register(@Body() dto: RegisterDto) { ... }

  // Password reset: 3 attempts per hour
  @Post('password/reset-request')
  @Throttle({ default: { limit: 3, ttl: 3600000 } })
  async requestPasswordReset(@Body() dto: RequestResetDto) { ... }

  // Skip throttle for public endpoints
  @Get('verify-email/:token')
  @SkipThrottle()
  async verifyEmail(@Param('token') token: string) { ... }
}
```

**Step 4: Test**

```bash
# Should block after 5 attempts
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
# 6th request should return: 429 Too Many Requests
```

---

## 🟠 HIGH PRIORITY - Do This Month

### 4. Add File Upload Validation (1 hour)

```typescript
// apps/api/src/upload/upload.service.ts

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// In your multer config
{
  fileFilter: (req, file, callback) => {
    // Check MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          `Invalid file type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
        ),
        false
      );
    }
    callback(null, true);
  },
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 files per request
  },
}
```

---

### 5. Reduce JWT Expiry (15 minutes)

```typescript
// apps/api/src/auth/auth.module.ts
JwtModule.registerAsync({
  imports: [SettingsModule],
  useFactory: async (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: {
      expiresIn: '1d', // Changed from '7d' to '1d'
    },
  }),
}),
```

**Note:** This will log out users every day. Consider implementing refresh tokens first.

---

### 6. Add Rate Limiting to Payment Endpoints (30 minutes)

```typescript
// apps/api/src/payment/payment.controller.ts
import { Throttle } from '@nestjs/throttler';

@Controller('payment')
export class PaymentController {

  @Post('create-intent')
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20/min
  async createIntent(@Body() dto: CreatePaymentDto) { ... }

  @Post('webhook')
  @SkipThrottle() // Webhooks should not be throttled
  async webhook(@Headers() headers, @Body() body) { ... }
}
```

---

## 🟡 MEDIUM PRIORITY - Next Quarter

### 7. Implement Encryption Service

Follow the plan in `/Users/jeanfrancoismunyaneza/.claude/plans/ticklish-snacking-karp.md`

### 8. Add Security Monitoring

```bash
# Install Sentry
pnpm add @sentry/nextjs @sentry/node

# Configure for error tracking and security monitoring
```

### 9. Add Virus Scanning for Uploads

```bash
# Install ClamAV
brew install clamav  # macOS
# or
apt-get install clamav  # Ubuntu

# Install Node.js integration
pnpm add clamscan
```

---

## Testing Checklist

After each fix, test:

- [ ] **Dependencies:** `pnpm audit` shows 0 critical/high
- [ ] **XSS:** Try `<script>alert('XSS')</script>` in product description
- [ ] **Rate limit:** Make 6 rapid login attempts (6th should fail)
- [ ] **File upload:** Try uploading .exe file (should reject)
- [ ] **JWT:** Check token expiry matches configuration

---

## Verification Commands

```bash
# 1. Check dependency vulnerabilities
pnpm audit --audit-level=high

# 2. Test XSS protection
curl http://localhost:3000/products/test-product | grep "<script>"
# Should show escaped: &lt;script&gt;

# 3. Test rate limiting
for i in {1..6}; do
  curl -X POST http://localhost:4000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}' \
    -w "\nStatus: %{http_code}\n"
done
# Last request should return 429

# 4. Check security headers
curl -I https://nextpik.com | grep -E "X-Frame-Options|Content-Security-Policy|Strict-Transport"

# 5. Run security check
./security-check.sh
```

---

## Progress Tracking

- [ ] Critical vulnerabilities fixed (pnpm audit)
- [ ] XSS vulnerabilities fixed (DOMPurify)
- [ ] Rate limiting on auth endpoints
- [ ] File upload validation
- [ ] JWT expiry reduced
- [ ] Payment endpoint rate limiting
- [ ] All tests passing
- [ ] Security check passes

---

## Deployment

After completing fixes:

```bash
# 1. Run security check
./security-check.sh

# 2. Commit changes
git add -A
git commit -m "security: fix critical vulnerabilities and XSS issues"

# 3. Push to production
git push origin main

# 4. Verify in production
curl -I https://nextpik.com
```

---

## Support

If you need help with any of these fixes:

- Check `SECURITY.md` for detailed guidance
- Review `SECURITY_AUDIT_REPORT.md` for context
- Run `./security-check.sh` to verify progress

---

**Target Completion:** 7 days from February 23, 2026
**Next Review:** March 2, 2026
