import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Integration Tests for Authentication Flows
 *
 * Tests complete end-to-end authentication scenarios:
 * 1. Registration → Email Verification → Login
 * 2. Password Reset Flow
 * 3. Magic Link Flow
 * 4. 2FA Setup and Login
 * 5. Session Management
 */
describe('Authentication Flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Test data
  const testBuyer = {
    email: 'buyer-e2e-test@example.com',
    password: 'TestPassword123!@#',
    firstName: 'Test',
    lastName: 'Buyer',
    phone: '+1234567890',
    role: 'BUYER',
  };

  const testSeller = {
    email: 'seller-e2e-test@example.com',
    password: 'TestPassword123!@#',
    firstName: 'Test',
    lastName: 'Seller',
    phone: '+9876543210',
    role: 'SELLER',
    storeName: 'Test Store',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same validation pipe as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testBuyer.email, testSeller.email],
        },
      },
    });

    await app.close();
  });

  describe('1. Registration → Email Verification → Login Flow', () => {
    let buyerAccessToken: string;
    let buyerSessionToken: string;
    let buyerUserId: string;
    let verificationToken: string;

    it('should register a new buyer', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testBuyer)
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe(testBuyer.email);
      expect(response.body.user.role).toBe('BUYER');
      expect(response.body.user.emailVerified).toBe(false);

      buyerAccessToken = response.body.accessToken;
      buyerSessionToken = response.body.sessionToken;
      buyerUserId = response.body.user.id;
    });

    it('should not allow duplicate email registration', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testBuyer)
        .expect(409); // Conflict
    });

    it('should get current user info with access token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${buyerAccessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testBuyer.email);
      expect(response.body.id).toBe(buyerUserId);
    });

    it('should request email verification', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/request')
        .set('Authorization', `Bearer ${buyerAccessToken}`)
        .expect(200);

      expect(response.body.message).toContain('verification email sent');

      // In test mode, retrieve the token from the database (using EmailOTP model)
      const verification = await prisma.emailOTP.findFirst({
        where: { userId: buyerUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(verification).toBeTruthy();
      verificationToken = verification.code; // EmailOTP uses 'code' instead of 'token'
    });

    it('should verify email with token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/verify')
        .send({ token: verificationToken })
        .expect(200);

      expect(response.body.message).toContain('Email verified successfully');

      // Verify user is now marked as verified
      const user = await prisma.user.findUnique({
        where: { id: buyerUserId },
      });

      expect(user.emailVerified).toBe(true);
    });

    it('should not verify with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/email-verification/verify')
        .send({ token: 'invalid-token' })
        .expect(401);
    });

    it('should login with verified credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body.message).toBe('Login successful');
    });

    it('should fail login with incorrect password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: 'WrongPassword123!',
          rememberMe: false,
        })
        .expect(401);
    });

    it('should get active sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${buyerAccessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('deviceInfo');
    });
  });

  describe('2. Seller Registration with Store Creation', () => {
    let sellerAccessToken: string;
    let sellerUserId: string;
    let storeId: string;

    it('should register a seller and create store automatically', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testSeller)
        .expect(201);

      expect(response.body.user.role).toBe('SELLER');
      expect(response.body).toHaveProperty('store');
      expect(response.body.store.name).toBe(testSeller.storeName);
      expect(response.body.store.status).toBe('ACTIVE');

      sellerAccessToken = response.body.accessToken;
      sellerUserId = response.body.user.id;
      storeId = response.body.store.id;
    });

    it('should verify seller has access to their store', async () => {
      const store = await prisma.store.findUnique({
        where: { id: storeId },
      });

      expect(store).toBeTruthy();
      expect(store.userId).toBe(sellerUserId);
      expect(store.name).toBe(testSeller.storeName);
    });

    it('should logout seller', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${sellerAccessToken}`)
        .expect(200);

      expect(response.body.message).toContain('Logged out successfully');
    });
  });

  describe('3. Password Reset Flow', () => {
    let resetToken: string;

    it('should request password reset', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/reset-request')
        .send({ email: testBuyer.email })
        .expect(200);

      expect(response.body.message).toContain('reset link has been sent');

      // Retrieve token from database in test mode
      const passwordReset = await prisma.passwordReset.findFirst({
        where: {
          user: { email: testBuyer.email },
          used: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      expect(passwordReset).toBeTruthy();
      resetToken = passwordReset.token;
    });

    it('should not reveal if user does not exist', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/reset-request')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Same message for security
      expect(response.body.message).toContain('reset link has been sent');
    });

    it('should reset password with valid token', async () => {
      const newPassword = 'NewTestPassword123!@#';

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/reset')
        .send({
          token: resetToken,
          newPassword: newPassword,
        })
        .expect(200);

      expect(response.body.message).toBe('Password reset successful');

      // Verify can login with new password
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: newPassword,
          rememberMe: false,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');

      // Update test data with new password
      testBuyer.password = newPassword;
    });

    it('should not allow reusing password reset token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/reset')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!',
        })
        .expect(401);
    });

    it('should reject invalid password reset token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/password/reset')
        .send({
          token: 'invalid-token',
          newPassword: 'AnotherPassword123!',
        })
        .expect(401);
    });
  });

  describe('4. Magic Link Flow', () => {
    let magicLinkToken: string;

    it('should request magic link', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/magic-link/request')
        .send({ email: testBuyer.email })
        .expect(200);

      expect(response.body.message).toContain('Magic link sent');

      // Retrieve token from database
      const magicLink = await prisma.magicLink.findFirst({
        where: {
          userId: { not: null },
          used: false,
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(magicLink).toBeTruthy();
      expect(magicLink.user.email).toBe(testBuyer.email);
      magicLinkToken = magicLink.token;
    });

    it('should verify magic link and login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/magic-link/verify')
        .send({ token: magicLinkToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body.user.email).toBe(testBuyer.email);
    });

    it('should not allow reusing magic link', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/magic-link/verify')
        .send({ token: magicLinkToken })
        .expect(401);
    });

    it('should reject expired magic link', async () => {
      // Create an expired magic link
      const expiredToken = 'expired-test-token';
      await prisma.magicLink.create({
        data: {
          token: expiredToken,
          userId: (await prisma.user.findUnique({ where: { email: testBuyer.email } })).id,
          email: testBuyer.email,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      await request(app.getHttpServer())
        .post('/api/v1/auth/magic-link/verify')
        .send({ token: expiredToken })
        .expect(401);
    });
  });

  describe('5. 2FA Setup and Login Flow', () => {
    let accessToken: string;
    let twoFactorSecret: string;
    let verificationCode: string;

    beforeAll(async () => {
      // Login to get fresh token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('should setup 2FA and get QR code', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('secret');
      expect(response.body).toHaveProperty('qrCode');
      expect(response.body).toHaveProperty('otpauthUrl');
      expect(response.body.qrCode).toContain('data:image/png;base64');

      twoFactorSecret = response.body.secret;
    });

    it('should enable 2FA with valid verification code', async () => {
      // Generate a valid TOTP code for testing
      const speakeasy = require('speakeasy');
      verificationCode = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/enable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code: verificationCode })
        .expect(200);

      expect(response.body.message).toBe('2FA enabled successfully');

      // Verify user has 2FA enabled
      const user = await prisma.user.findUnique({
        where: { email: testBuyer.email },
      });

      expect(user.twoFactorEnabled).toBe(true);
    });

    it('should require 2FA code during login', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body.requires2FA).toBe(true);
      expect(response.body.userId).toBeTruthy();
      expect(response.body).not.toHaveProperty('accessToken');
    });

    it('should login with 2FA code', async () => {
      // Generate fresh TOTP code
      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          twoFactorCode: code,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('sessionToken');
      expect(response.body.message).toBe('Login successful');

      accessToken = response.body.accessToken;
    });

    it('should reject invalid 2FA code', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          twoFactorCode: '000000',
          rememberMe: false,
        })
        .expect(401);
    });

    it('should disable 2FA with valid code', async () => {
      // Generate fresh TOTP code
      const speakeasy = require('speakeasy');
      const code = speakeasy.totp({
        secret: twoFactorSecret,
        encoding: 'base32',
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/2fa/disable')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ code })
        .expect(200);

      expect(response.body.message).toContain('2FA has been disabled');

      // Verify user no longer has 2FA enabled
      const user = await prisma.user.findUnique({
        where: { email: testBuyer.email },
      });

      expect(user.twoFactorEnabled).toBe(false);
      expect(user.twoFactorSecret).toBeNull();
    });
  });

  describe('6. Session Management', () => {
    let accessToken: string;
    let sessionId: string;

    beforeAll(async () => {
      // Create multiple sessions
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      accessToken = response1.body.accessToken;

      // Create another session
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: true,
        })
        .set('User-Agent', 'Different-Agent')
        .expect(200);
    });

    it('should list all active sessions', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(2);

      // Get a session ID for revocation test
      sessionId = response.body[0].id;

      // Verify session has device info
      expect(response.body[0]).toHaveProperty('deviceInfo');
      expect(response.body[0].deviceInfo).toHaveProperty('browser');
      expect(response.body[0].deviceInfo).toHaveProperty('os');
    });

    it('should revoke a specific session', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/auth/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toBe('Session revoked successfully');

      // Verify session count decreased
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const remainingSessions = sessionsResponse.body.filter(s => s.id === sessionId);
      expect(remainingSessions.length).toBe(0);
    });

    it('should revoke all other sessions', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/sessions/revoke-all-other')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.message).toContain('sessions revoked');

      // Verify only current session remains
      const sessionsResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/sessions')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(sessionsResponse.body.length).toBe(1);
      expect(sessionsResponse.body[0].isCurrent).toBe(true);
    });
  });

  describe('7. Rate Limiting', () => {
    const nonExistentEmail = 'nonexistent-' + Date.now() + '@example.com';

    it('should block login after 5 failed attempts', async () => {
      // Attempt 5 failed logins
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/v1/auth/login')
          .send({
            email: nonExistentEmail,
            password: 'WrongPassword123!',
            rememberMe: false,
          })
          .expect(401);
      }

      // 6th attempt should be rate limited
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: nonExistentEmail,
          password: 'WrongPassword123!',
          rememberMe: false,
        })
        .expect(429);

      expect(response.body.message).toContain('Too many failed login attempts');
    });
  });

  describe('8. Password Change Flow', () => {
    let accessToken: string;
    const newPassword = 'ChangedPassword123!@#';

    beforeAll(async () => {
      // Login to get token
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      accessToken = response.body.accessToken;
    });

    it('should change password with correct current password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          currentPassword: testBuyer.password,
          newPassword: newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should invalidate old sessions after password change', async () => {
      // Old token should no longer work
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should login with new password', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: newPassword,
          rememberMe: false,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');

      // Update test data
      testBuyer.password = newPassword;
    });

    it('should not change password with incorrect current password', async () => {
      // Get new token
      const loginResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testBuyer.email,
          password: testBuyer.password,
          rememberMe: false,
        })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/v1/auth/password/change')
        .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
        .send({
          currentPassword: 'WrongCurrentPassword123!',
          newPassword: 'AnotherPassword123!',
        })
        .expect(401);
    });
  });
});
