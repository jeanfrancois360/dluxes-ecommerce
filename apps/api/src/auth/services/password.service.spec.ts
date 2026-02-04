import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { PasswordService } from './password.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { LoggerService } from '../../logger/logger.service';
import { createMockPrismaService, MockedPrismaService } from '../../test/prisma-mock.helper';

// Mock bcrypt at module level
jest.mock('bcrypt', () => ({
  hash: jest.fn(() => Promise.resolve('$2b$12$hashedpassword')),
  compare: jest.fn(),
}));

const bcrypt = require('bcrypt');

describe('PasswordService', () => {
  let service: PasswordService;
  let prismaService: MockedPrismaService;
  let emailService: jest.Mocked<EmailService>;
  let sessionService: jest.Mocked<SessionService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    password: '$2b$12$hashedpassword',
  };

  const mockResetToken = {
    id: 'reset-123',
    userId: 'user-123',
    token: 'hashed-token',
    used: false,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();

    const mockEmailService = {
      sendPasswordReset: jest.fn().mockResolvedValue(true),
    };

    const mockSessionService = {
      revokeAllSessions: jest.fn().mockResolvedValue(undefined),
    };

    const mockLoggerService = {
      logAuthEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
    sessionService = module.get(SessionService);
    loggerService = module.get(LoggerService);

    // Clear all mocks including bcrypt spy
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestPasswordReset', () => {
    const requestDto = {
      email: 'test@example.com',
    };

    it('should create reset token and send email for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.passwordReset.create.mockResolvedValue(mockResetToken as any);

      const result = await service.requestPasswordReset(
        requestDto,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: requestDto.email },
      });
      expect(prismaService.passwordReset.create).toHaveBeenCalled();
      expect(emailService.sendPasswordReset).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.firstName,
        expect.any(String),
      );
      expect(result.message).toBe('If the email exists, a reset link has been sent');
    });

    it('should not reveal if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestPasswordReset(
        requestDto,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(prismaService.passwordReset.create).not.toHaveBeenCalled();
      expect(emailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(result.message).toBe('If the email exists, a reset link has been sent');
    });

    it('should return token in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.passwordReset.create.mockResolvedValue(mockResetToken as any);

      const result = await service.requestPasswordReset(
        requestDto,
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(result).toHaveProperty('_dev');
      expect(result._dev).toHaveProperty('token');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('resetPassword', () => {
    const resetDto = {
      token: 'plain-token',
      newPassword: 'NewStrongP@ss123',
    };

    it('should successfully reset password with valid token', async () => {
      prismaService.passwordReset.findUnique.mockResolvedValue(mockResetToken as any);
      prismaService.user.update.mockResolvedValue(mockUser as any);
      prismaService.passwordReset.update.mockResolvedValue(mockResetToken as any);

      const result = await service.resetPassword(resetDto);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.userId },
        data: { password: expect.any(String) },
      });
      expect(prismaService.passwordReset.update).toHaveBeenCalledWith({
        where: { id: mockResetToken.id },
        data: {
          used: true,
          usedAt: expect.any(Date),
        },
      });
      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith(mockResetToken.userId);
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        'password_reset',
        mockResetToken.userId,
        expect.objectContaining({ email: mockUser.email }),
      );
      expect(result.message).toBe('Password reset successful');
    });

    it('should throw UnauthorizedException if token not found', async () => {
      prismaService.passwordReset.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        'Invalid password reset link',
      );
    });

    it('should throw UnauthorizedException if token already used', async () => {
      prismaService.passwordReset.findUnique.mockResolvedValue({
        ...mockResetToken,
        used: true,
      } as any);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        'already been used',
      );
    });

    it('should throw UnauthorizedException if token expired', async () => {
      const expiredToken = {
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };
      prismaService.passwordReset.findUnique.mockResolvedValue(expiredToken as any);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.resetPassword(resetDto)).rejects.toThrow('expired');
    });

    it('should hash new password before storing', async () => {
      prismaService.passwordReset.findUnique.mockResolvedValue(mockResetToken as any);
      prismaService.user.update.mockImplementation((args) => {
        expect(args.data.password).not.toBe(resetDto.newPassword);
        expect(args.data.password).toMatch(/^\$2b\$/); // bcrypt hash format
        return Promise.resolve(mockUser as any);
      });
      prismaService.passwordReset.update.mockResolvedValue(mockResetToken as any);

      await service.resetPassword(resetDto);

      expect(prismaService.user.update).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    const userId = 'user-123';
    const currentPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    it('should successfully change password with correct current password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      bcrypt.compare.mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue(mockUser as any);

      const result = await service.changePassword(userId, currentPassword, newPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(currentPassword, mockUser.password);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: expect.any(String) },
      });
      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith(userId);
      expect(result.message).toContain('Password changed successfully');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if current password is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.changePassword(userId, currentPassword, newPassword),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should revoke all sessions after password change', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      bcrypt.compare.mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue(mockUser as any);

      await service.changePassword(userId, currentPassword, newPassword);

      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith(userId);
    });
  });
});
