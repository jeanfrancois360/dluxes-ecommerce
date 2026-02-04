import { Test, TestingModule } from '@nestjs/testing';
import { SessionService } from './session.service';
import { PrismaService } from '../../database/prisma.service';
import { LoggerService } from '../../logger/logger.service';
import { createMockPrismaService, MockedPrismaService } from '../../test/prisma-mock.helper';

describe('SessionService', () => {
  let service: SessionService;
  let prismaService: MockedPrismaService;
  let loggerService: jest.Mocked<LoggerService>;

  const mockSession = {
    id: 'session-123',
    userId: 'user-123',
    token: 'session-token',
    fingerprint: 'fingerprint-hash',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    deviceType: 'desktop',
    browser: 'Chrome',
    os: 'MacOS',
    isActive: true,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    lastActiveAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = createMockPrismaService();

    const mockLoggerService = {
      logAuthEvent: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    prismaService = module.get(PrismaService);
    loggerService = module.get(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create a new session without rememberMe', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);
      prismaService.userSession.create.mockResolvedValue(mockSession as any);

      const result = await service.createSession(
        'user-123',
        '127.0.0.1',
        'Mozilla/5.0',
        false,
      );

      expect(prismaService.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-123',
          ipAddress: '127.0.0.1',
          token: expect.any(String),
          fingerprint: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      });
      expect(result).toEqual(expect.any(String));
      expect(result).toHaveLength(64); // hex string of 32 bytes
    });

    it('should create session with 30-day expiry when rememberMe is true', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);
      prismaService.userSession.create.mockResolvedValue(mockSession as any);

      await service.createSession('user-123', '127.0.0.1', 'Mozilla/5.0', true);

      expect(prismaService.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      });

      const call = prismaService.userSession.create.mock.calls[0][0];
      const expiresAt = call.data.expiresAt;
      const daysDiff = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(29); // Should be close to 30 days
    });

    it('should create session with 24-hour expiry when rememberMe is false', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);
      prismaService.userSession.create.mockResolvedValue(mockSession as any);

      await service.createSession('user-123', '127.0.0.1', 'Mozilla/5.0', false);

      const call = prismaService.userSession.create.mock.calls[0][0];
      const expiresAt = call.data.expiresAt;
      const hoursDiff = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeLessThan(25); // Should be close to 24 hours
    });

    it('should generate unique session token', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);
      prismaService.userSession.create.mockResolvedValue(mockSession as any);

      const token1 = await service.createSession(
        'user-123',
        '127.0.0.1',
        'Mozilla/5.0',
        false,
      );
      const token2 = await service.createSession(
        'user-123',
        '127.0.0.1',
        'Mozilla/5.0',
        false,
      );

      expect(token1).toEqual(expect.any(String));
      expect(token2).toEqual(expect.any(String));
      expect(token1).not.toBe(token2); // Tokens should be unique
      expect(prismaService.userSession.create).toHaveBeenCalledTimes(2);
    });

    it('should generate session fingerprint from IP and User-Agent', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);
      prismaService.userSession.create.mockResolvedValue(mockSession as any);

      await service.createSession('user-123', '127.0.0.1', 'Mozilla/5.0', false);

      expect(prismaService.userSession.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fingerprint: expect.any(String),
        }),
      });
    });
  });

  describe('getUserSessions', () => {
    it('should return all active sessions for a user', async () => {
      const sessions = [mockSession, { ...mockSession, id: 'session-456' }];
      prismaService.userSession.findMany.mockResolvedValue(sessions as any);

      const result = await service.getUserSessions('user-123');

      expect(prismaService.userSession.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          isActive: true,
          expiresAt: { gt: expect.any(Date) },
        },
        orderBy: { lastActiveAt: 'desc' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('deviceInfo');
      expect(result[0]).toHaveProperty('isCurrent', false);
    });

    it('should return empty array if no sessions found', async () => {
      prismaService.userSession.findMany.mockResolvedValue([]);

      const result = await service.getUserSessions('user-123');

      expect(result).toEqual([]);
    });

    it('should include device information in response', async () => {
      prismaService.userSession.findMany.mockResolvedValue([mockSession] as any);

      const result = await service.getUserSessions('user-123');

      expect(result[0].deviceInfo).toEqual({
        device: 'Desktop',
        os: 'MacOS',
        browser: 'Chrome',
        description: 'Chrome on MacOS',
      });
    });
  });

  describe('validateSession', () => {
    it('should return valid for valid session', async () => {
      const correctFingerprint = service.getCurrentSessionFingerprint('127.0.0.1', 'Mozilla/5.0');
      const sessionWithCorrectFingerprint = {
        ...mockSession,
        fingerprint: correctFingerprint,
      };

      prismaService.userSession.findUnique.mockResolvedValue(sessionWithCorrectFingerprint as any);

      const result = await service.validateSession('session-token', '127.0.0.1', 'Mozilla/5.0');

      expect(result.valid).toBe(true);
      expect(result.suspicious).toBe(false);
      expect(prismaService.userSession.update).toHaveBeenCalledWith({
        where: { id: mockSession.id },
        data: { lastActiveAt: expect.any(Date) },
      });
    });

    it('should return invalid for non-existent session', async () => {
      prismaService.userSession.findUnique.mockResolvedValue(null);

      const result = await service.validateSession('invalid-token', '127.0.0.1', 'Mozilla/5.0');

      expect(result.valid).toBe(false);
    });

    it('should return invalid for inactive session', async () => {
      prismaService.userSession.findUnique.mockResolvedValue({
        ...mockSession,
        isActive: false,
      } as any);

      const result = await service.validateSession('session-token', '127.0.0.1', 'Mozilla/5.0');

      expect(result.valid).toBe(false);
    });

    it('should return invalid for expired session', async () => {
      prismaService.userSession.findUnique.mockResolvedValue({
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000), // Expired
      } as any);

      const result = await service.validateSession('session-token', '127.0.0.1', 'Mozilla/5.0');

      expect(result.valid).toBe(false);
    });
  });

  describe('revokeSession', () => {
    it('should successfully revoke a session', async () => {
      prismaService.userSession.updateMany.mockResolvedValue({ count: 1 } as any);

      const result = await service.revokeSession('user-123', 'session-123');

      expect(prismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          id: 'session-123',
          userId: 'user-123',
        },
        data: { isActive: false },
      });
      expect(loggerService.logAuthEvent).toHaveBeenCalledWith(
        'session_revoke',
        'user-123',
        expect.objectContaining({ sessionId: 'session-123' }),
      );
      expect(result.message).toBe('Session revoked successfully');
    });
  });

  describe('revokeAllSessions', () => {
    it('should revoke all sessions for a user', async () => {
      prismaService.userSession.updateMany.mockResolvedValue({ count: 3 } as any);

      await service.revokeAllSessions('user-123');

      expect(prismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        data: { isActive: false },
      });
    });

    it('should revoke all sessions except one', async () => {
      prismaService.userSession.updateMany.mockResolvedValue({ count: 2 } as any);

      await service.revokeAllSessions('user-123', 'session-keep');

      expect(prismaService.userSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          id: { not: 'session-keep' },
        },
        data: { isActive: false },
      });
    });
  });

  describe('getCurrentSessionFingerprint', () => {
    it('should generate consistent fingerprint for same IP and User-Agent', () => {
      const fingerprint1 = service.getCurrentSessionFingerprint(
        '127.0.0.1',
        'Mozilla/5.0',
      );
      const fingerprint2 = service.getCurrentSessionFingerprint(
        '127.0.0.1',
        'Mozilla/5.0',
      );

      expect(fingerprint1).toBe(fingerprint2);
      expect(fingerprint1).toHaveLength(32);
    });

    it('should generate different fingerprints for different inputs', () => {
      const fingerprint1 = service.getCurrentSessionFingerprint(
        '127.0.0.1',
        'Mozilla/5.0',
      );
      const fingerprint2 = service.getCurrentSessionFingerprint(
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(fingerprint1).not.toBe(fingerprint2);
    });
  });
});
