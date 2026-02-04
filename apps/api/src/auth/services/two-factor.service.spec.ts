import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../email/email.service';
import { SessionService } from './session.service';
import { LoggerService } from '../../logger/logger.service';
import { createMockPrismaService, MockedPrismaService } from '../../test/prisma-mock.helper';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prismaService: MockedPrismaService;
  let emailService: jest.Mocked<EmailService>;
  let sessionService: jest.Mocked<SessionService>;
  let loggerService: jest.Mocked<LoggerService>;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    firstName: 'Test',
    twoFactorEnabled: false,
    twoFactorSecret: null,
  };

  const mockSecret = 'JBSWY3DPEHPK3PXP';

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();

    const mockEmailService = {
      send2FAEnabledNotification: jest.fn().mockResolvedValue(true),
    };

    const mockSessionService = {
      revokeAllSessions: jest.fn().mockResolvedValue(undefined),
    };

    const mockLoggerService = {
      logAuthEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: SessionService, useValue: mockSessionService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    prismaService = module.get(PrismaService);
    emailService = module.get(EmailService);
    sessionService = module.get(SessionService);
    loggerService = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('setup2FA', () => {
    it('should generate 2FA secret and QR code', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);
      prismaService.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: mockSecret,
      } as any);

      const result = await service.setup2FA('user-123');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { twoFactorSecret: expect.any(String) },
      });
      expect(result).toHaveProperty('secret');
      expect(result).toHaveProperty('qrCode');
      expect(result).toHaveProperty('otpauthUrl');
      expect(result.message).toContain('Scan this QR code');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.setup2FA('user-123')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('enable2FA', () => {
    it('should enable 2FA with valid verification code', async () => {
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWithSecret as any);
      prismaService.user.update.mockResolvedValue({
        ...userWithSecret,
        twoFactorEnabled: true,
      } as any);

      // Mock speakeasy to return true
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.enable2FA('user-123', '123456');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { twoFactorEnabled: true },
      });
      expect(emailService.send2FAEnabledNotification).toHaveBeenCalledWith(
        userWithSecret.email,
        userWithSecret.firstName,
      );
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        '2fa_enable',
        'user-123',
        expect.objectContaining({ email: userWithSecret.email }),
      );
      expect(result.message).toBe('2FA enabled successfully');
    });

    it('should throw BadRequestException if verification code is invalid', async () => {
      const userWithSecret = {
        ...mockUser,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWithSecret as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      await expect(service.enable2FA('user-123', 'wrong')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.enable2FA('user-123', 'wrong')).rejects.toThrow(
        'Invalid verification code',
      );
    });
  });

  describe('disable2FA', () => {
    it('should disable 2FA with valid verification code', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA as any);
      prismaService.user.update.mockResolvedValue({
        ...userWith2FA,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      } as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.disable2FA('user-123', '123456');

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
      expect(sessionService.revokeAllSessions).toHaveBeenCalledWith('user-123');
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        '2fa_disable',
        'user-123',
        expect.objectContaining({ email: userWith2FA.email }),
      );
      expect(result.message).toContain('Please log in again');
    });

    it('should throw BadRequestException if verification code is invalid', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      await expect(service.disable2FA('user-123', 'wrong')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verify2FA', () => {
    it('should return true for valid 2FA code', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(true);

      const result = await service.verify2FA('user-123', '123456');

      expect(result).toBe(true);
    });

    it('should return false for invalid 2FA code', async () => {
      const userWith2FA = {
        ...mockUser,
        twoFactorEnabled: true,
        twoFactorSecret: mockSecret,
      };

      prismaService.user.findUnique.mockResolvedValue(userWith2FA as any);
      jest.spyOn(speakeasy.totp, 'verify').mockReturnValue(false);

      const result = await service.verify2FA('user-123', 'wrong');

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.verify2FA('user-123', '123456');

      expect(result).toBe(false);
    });

    it('should return false if user has no 2FA secret', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser as any);

      const result = await service.verify2FA('user-123', '123456');

      expect(result).toBe(false);
    });
  });
});
