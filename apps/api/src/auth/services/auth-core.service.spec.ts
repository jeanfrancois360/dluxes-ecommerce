import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthCoreService } from './auth-core.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { EmailVerificationService } from './email-verification.service';
import { TwoFactorService } from './two-factor.service';
import { LoggerService } from '../../logger/logger.service';
import { createMockPrismaService, MockedPrismaService } from '../../test/prisma-mock.helper';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('$2b$12$hashedpassword')),
  compare: jest.fn(),
}));

const bcrypt = require('bcrypt');

describe('AuthCoreService', () => {
  let service: AuthCoreService;
  let prismaService: MockedPrismaService;
  let jwtService: jest.Mocked<JwtService>;
  let emailService: jest.Mocked<EmailService>;
  let sessionService: jest.Mocked<SessionService>;
  let emailVerificationService: jest.Mocked<EmailVerificationService>;
  let twoFactorService: jest.Mocked<TwoFactorService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: '$2b$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    phone: null,
    role: 'BUYER',
    emailVerified: true,
    isActive: true,
    isSuspended: false,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    lastLoginAt: new Date(),
    lastLoginIp: '127.0.0.1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();

    const mockJwtService = {
      sign: jest.fn(),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    };

    const mockSessionService = {
      createSession: jest.fn().mockResolvedValue('session-token-123'),
    };

    const mockEmailVerificationService = {
      sendEmailVerification: jest.fn().mockResolvedValue(true),
    };

    const mockTwoFactorService = {
      verify2FA: jest.fn(),
    };

    const mockLoggerService = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      logAuthEvent: jest.fn(),
      logSuspiciousActivity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCoreService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: EmailVerificationService, useValue: mockEmailVerificationService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<AuthCoreService>(AuthCoreService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);
    sessionService = module.get(SessionService);
    emailVerificationService = module.get(EmailVerificationService);
    twoFactorService = module.get(TwoFactorService);
    loggerService = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: any = {
      email: 'newuser@example.com',
      password: 'StrongP@ss123',
      firstName: 'New',
      lastName: 'User',
      phone: '+1234567890',
      role: 'BUYER',
    };

    it('should successfully register a new buyer', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prismaService.user.create).toHaveBeenCalled();
      expect(sessionService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        '127.0.0.1',
        'Mozilla/5.0',
        false,
      );
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        'register',
        mockUser.id,
        expect.objectContaining({ email: mockUser.email, role: 'BUYER' }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('sessionToken');
      expect(result).toHaveProperty('user');
      expect(result.message).toBe('Registration successful');
    });

    it('should register a seller and create store automatically', async () => {
      const sellerDto: any = { ...registerDto, role: 'SELLER', storeName: 'Test Store' };
      const mockStore = {
        id: 'store-123',
        name: 'Test Store',
        slug: 'test-store-123',
        status: 'ACTIVE',
      };

      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockResolvedValue({ ...mockUser, role: 'SELLER' });
      prismaService.store.create.mockResolvedValue(mockStore);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.register(sellerDto, '127.0.0.1', 'Mozilla/5.0');

      expect(prismaService.store.create).toHaveBeenCalled();
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
      expect(result.store).toEqual({
        id: mockStore.id,
        name: mockStore.name,
        status: mockStore.status,
      });
      expect(result.message).toContain('Your store is ready');
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register(registerDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(ConflictException);

      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('should hash password before storing', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.user.create.mockImplementation((args) => {
        expect(args.data.password).not.toBe(registerDto.password);
        expect(args.data.password).toMatch(/^\$2b\$/); // bcrypt hash format
        return Promise.resolve(mockUser);
      });
      jwtService.sign.mockReturnValue('jwt-token-123');

      await service.register(registerDto, '127.0.0.1', 'Mozilla/5.0');

      expect(prismaService.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'correctpassword',
      rememberMe: false,
    };

    beforeEach(() => {
      prismaService.loginAttempt.findMany.mockResolvedValue([]);
      prismaService.loginAttempt.create.mockResolvedValue({} as any);
    });

    it('should successfully login with correct credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          lastLoginAt: expect.any(Date),
          lastLoginIp: '127.0.0.1',
        },
      });
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        'login',
        mockUser.id,
        expect.objectContaining({ email: mockUser.email }),
      );
      expect(result).toHaveProperty('accessToken', 'jwt-token-123');
      expect(result).toHaveProperty('sessionToken', 'session-token-123');
      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggerService.logSuspiciousActivity).toHaveBeenCalledWith(
        'Failed login - user not found',
        null,
        '127.0.0.1',
        expect.objectContaining({ email: loginDto.email }),
      );
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);

      expect(loggerService.logSuspiciousActivity).toHaveBeenCalledWith(
        'Failed login - invalid password',
        mockUser.id,
        '127.0.0.1',
        expect.objectContaining({ email: loginDto.email }),
      );
    });

    it('should throw UnauthorizedException if account is suspended', async () => {
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, isSuspended: true });

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if account is inactive', async () => {
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should require 2FA code when 2FA is enabled', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true };
      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      bcrypt.compare.mockResolvedValue(true);

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toEqual({
        requires2FA: true,
        userId: mockUser.id,
      });
      expect(sessionService.createSession).not.toHaveBeenCalled();
    });

    it('should verify 2FA code when provided', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true };
      const loginWith2FA = { ...loginDto, twoFactorCode: '123456' };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      bcrypt.compare.mockResolvedValue(true);
      twoFactorService.verify2FA.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginWith2FA, '127.0.0.1', 'Mozilla/5.0');

      expect(twoFactorService.verify2FA).toHaveBeenCalledWith(mockUser.id, '123456');
      expect(result).toHaveProperty('accessToken');
      expect(result.message).toBe('Login successful');
    });

    it('should throw UnauthorizedException if 2FA code is invalid', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true };
      const loginWith2FA = { ...loginDto, twoFactorCode: 'wrong' };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA);
      bcrypt.compare.mockResolvedValue(true);
      twoFactorService.verify2FA.mockResolvedValue(false);

      await expect(
        service.login(loginWith2FA, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('rate limiting', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password',
      rememberMe: false,
    };

    it('should block login after 5 failed attempts', async () => {
      const failedAttempts = Array(5).fill({
        email: loginDto.email,
        success: false,
        createdAt: new Date(),
      });

      prismaService.loginAttempt.findMany.mockResolvedValue(failedAttempts);

      await expect(
        service.login(loginDto, '127.0.0.1', 'Mozilla/5.0'),
      ).rejects.toThrow('Too many failed login attempts');
    });

    it('should allow login if failed attempts are old', async () => {
      // Old attempts (20 min ago) are outside the 15-minute lockout window
      // So findMany should return empty array (they're filtered out by the DB query)
      prismaService.loginAttempt.findMany.mockResolvedValue([]);
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.login(loginDto, '127.0.0.1', 'Mozilla/5.0');

      expect(result).toHaveProperty('accessToken');
    });
  });
});
