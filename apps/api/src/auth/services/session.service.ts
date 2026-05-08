import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { LoggerService } from '../../logger/logger.service';

@Injectable()
export class SessionService {
  private readonly SESSION_EXPIRY_REMEMBER = 30 * 24 * 60 * 60 * 1000; // 30 days
  private readonly SESSION_EXPIRY_DEFAULT = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService
  ) {}

  /**
   * Generate session fingerprint hash from IP and User-Agent
   * Used for detecting suspicious session activity
   */
  private generateFingerprint(ipAddress: string, userAgent: string): string {
    return createHash('sha256').update(`${ipAddress}:${userAgent}`).digest('hex').substring(0, 32); // Truncate to 32 chars for storage
  }

  /**
   * Get current session fingerprint (public method for controller)
   * Used to identify the current session when revoking others
   */
  getCurrentSessionFingerprint(ipAddress: string, userAgent: string): string {
    return this.generateFingerprint(ipAddress, userAgent);
  }

  /**
   * Parse User-Agent to generate human-readable device description
   * Returns device type, OS, and browser
   */
  parseDeviceInfo(userAgent: string): {
    device: string;
    os: string;
    browser: string;
    description: string;
  } {
    const deviceType = this.getDeviceType(userAgent);
    const browser = this.getBrowser(userAgent);
    const os = this.getOs(userAgent);

    const deviceLabel =
      deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablet' : 'Desktop';

    let description: string;
    if (browser && os) {
      description = `${browser} on ${os}`;
    } else if (browser) {
      description = browser;
    } else if (os) {
      description = `${deviceLabel} on ${os}`;
    } else {
      description = deviceLabel;
    }

    return {
      device: deviceLabel,
      os: os ?? '',
      browser: browser ?? '',
      description,
    };
  }

  /**
   * Detect suspicious activity by comparing current login with recent sessions
   * Returns array of suspicious indicators
   */
  private async detectSuspiciousActivity(
    userId: string,
    currentIp: string,
    currentUserAgent: string
  ): Promise<string[]> {
    const suspiciousFlags: string[] = [];

    // Get user's recent sessions (last 7 days)
    const recentSessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentSessions.length === 0) {
      // First login, no baseline to compare
      return suspiciousFlags;
    }

    // Check for IP address change
    const previousIPs = recentSessions
      .map((s) => s.ipAddress)
      .filter((ip) => ip !== null && ip !== currentIp);
    if (previousIPs.length > 0 && !previousIPs.includes(currentIp)) {
      suspiciousFlags.push('new_ip_address');
    }

    // Check for device type change
    const currentDeviceType = this.getDeviceType(currentUserAgent);
    const previousDeviceTypes = recentSessions
      .map((s) => s.deviceType)
      .filter((dt) => dt !== null && dt !== currentDeviceType);
    if (previousDeviceTypes.length > 0 && !previousDeviceTypes.includes(currentDeviceType)) {
      suspiciousFlags.push('new_device_type');
    }

    // Check for browser change
    const currentBrowser = this.getBrowser(currentUserAgent);
    const previousBrowsers = recentSessions
      .map((s) => s.browser)
      .filter((b) => b !== null && b !== currentBrowser);
    if (previousBrowsers.length > 0 && !previousBrowsers.includes(currentBrowser)) {
      suspiciousFlags.push('new_browser');
    }

    return suspiciousFlags;
  }

  /**
   * Create a new session for a user
   */
  async createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    rememberMe: boolean
  ): Promise<{ token: string; id: string }> {
    const token = randomBytes(32).toString('hex');
    const expiryDuration = rememberMe ? this.SESSION_EXPIRY_REMEMBER : this.SESSION_EXPIRY_DEFAULT;

    // Generate session fingerprint for security
    const fingerprint = this.generateFingerprint(ipAddress, userAgent);

    // Detect suspicious activity (non-blocking)
    const suspiciousFlags = await this.detectSuspiciousActivity(userId, ipAddress, userAgent);
    if (suspiciousFlags.length > 0) {
      // Log suspicious activity (in production, this would trigger alerts/notifications)
      console.warn(
        `[SECURITY] Suspicious activity detected for user ${userId}: ${suspiciousFlags.join(', ')}`
      );
      // In production, you could:
      // - Send email notification to user
      // - Require additional verification (2FA)
      // - Temporarily lock account
    }

    const session = await this.prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress,
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowser(userAgent),
        os: this.getOs(userAgent),
        fingerprint,
        expiresAt: new Date(Date.now() + expiryDuration),
      },
    });

    return { token, id: session.id };
  }

  /**
   * Validate session with fingerprint checking
   * Returns true if session is valid and not suspicious
   */
  async validateSession(
    sessionToken: string,
    currentIp: string,
    currentUserAgent: string
  ): Promise<{ valid: boolean; suspicious?: boolean; session?: any }> {
    const session = await this.prisma.userSession.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (!session) {
      return { valid: false };
    }

    // Check if session is active and not expired
    if (!session.isActive || new Date() > session.expiresAt) {
      return { valid: false };
    }

    // Check fingerprint if available
    if (session.fingerprint) {
      const currentFingerprint = this.generateFingerprint(currentIp, currentUserAgent);
      if (session.fingerprint !== currentFingerprint) {
        // Fingerprint mismatch - invalidate session immediately to prevent hijacking
        this.logger.logSuspiciousActivity(
          'Session fingerprint mismatch - session invalidated',
          session.userId,
          currentIp,
          { sessionId: session.id }
        );
        await this.prisma.userSession.update({
          where: { id: session.id },
          data: { isActive: false },
        });
        return { valid: false };
      }
    }

    // Update last active timestamp
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    return { valid: true, suspicious: false, session };
  }

  /**
   * Get all active sessions for a user with device information
   * Returns sessions with enhanced device descriptions
   */
  async getUserSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });

    // Enhance sessions with clean, human-readable device info
    return sessions.map((session) => {
      const deviceType = session.deviceType || 'desktop';
      const browser = session.browser || null;
      const os = session.os || null;

      // Human-readable device label
      const deviceLabel =
        deviceType === 'mobile' ? 'Mobile' : deviceType === 'tablet' ? 'Tablet' : 'Desktop';

      // Build description: "Firefox on macOS 10.15", "Chrome on Windows 10/11",
      // "Firefox" (when OS unknown), "Desktop" (when both unknown)
      let description: string;
      if (browser && os) {
        description = `${browser} on ${os}`;
      } else if (browser) {
        description = browser;
      } else if (os) {
        description = `${deviceLabel} on ${os}`;
      } else {
        description = deviceLabel;
      }

      const deviceInfo = {
        device: deviceLabel,
        os: os ?? '',
        browser: browser ?? '',
        description,
      };

      return {
        ...session,
        deviceInfo,
        isCurrent: false, // Will be set by controller based on current session
      };
    });
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: { isActive: false },
    });

    // Log session revocation
    this.logger.logAuthEvent('session_revoke', userId, {
      sessionId,
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Revoke all sessions for a user (except optionally one)
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string) {
    await this.prisma.userSession.updateMany({
      where: {
        userId,
        id: exceptSessionId ? { not: exceptSessionId } : undefined,
      },
      data: { isActive: false },
    });

    return { message: 'All sessions revoked successfully' };
  }

  /**
   * Rotate all sessions for a user (invalidate old, create new)
   * Used after critical security actions like password change, 2FA enable, etc.
   */
  async rotateSessions(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    // Invalidate all existing sessions
    await this.revokeAllSessions(userId);

    // Create new session
    const { token: newSessionToken } = await this.createSession(
      userId,
      ipAddress,
      userAgent,
      false
    );

    return newSessionToken;
  }

  /**
   * Get device type from user agent string
   */
  private getDeviceType(userAgent: string): string {
    if (/(iphone|ipod)/i.test(userAgent)) return 'mobile';
    if (/ipad/i.test(userAgent)) return 'tablet';
    if (/android/i.test(userAgent) && /mobile/i.test(userAgent)) return 'mobile';
    if (/android/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser name from user agent string.
   * Order matters: Edge and Opera embed Chrome tokens, Firefox embeds Gecko.
   */
  private getBrowser(userAgent: string): string | null {
    if (/edg\//i.test(userAgent)) return 'Edge';
    if (/opr\/|opera/i.test(userAgent)) return 'Opera';
    if (/firefox\/[\d.]+/i.test(userAgent)) return 'Firefox';
    if (/chrome\/[\d.]+/i.test(userAgent)) return 'Chrome';
    if (/safari\/[\d.]+/i.test(userAgent)) return 'Safari';
    if (/msie |trident\//i.test(userAgent)) return 'Internet Explorer';
    return null;
  }

  /**
   * Get OS name from user agent string. Returns null when unknown.
   */
  private getOs(userAgent: string): string | null {
    if (/windows nt 10/i.test(userAgent)) return 'Windows 10/11';
    if (/windows nt 6\.3/i.test(userAgent)) return 'Windows 8.1';
    if (/windows nt 6\.2/i.test(userAgent)) return 'Windows 8';
    if (/windows nt 6\.1/i.test(userAgent)) return 'Windows 7';
    if (/windows/i.test(userAgent)) return 'Windows';

    const macMatch = userAgent.match(/mac os x ([\d_]+)/i);
    if (macMatch) {
      const version = macMatch[1].replace(/_/g, '.');
      // Map legacy 10.x versions reported by Firefox/Chrome to readable macOS names
      const majorMinor = version.split('.');
      const major = parseInt(majorMinor[0]);
      const minor = parseInt(majorMinor[1] || '0');
      if (major >= 11) return `macOS ${major}`;
      if (major === 10 && minor >= 16) return 'macOS 11+';
      return `macOS ${version}`;
    }

    const androidMatch = userAgent.match(/android ([\d.]+)/i);
    if (androidMatch) return `Android ${androidMatch[1]}`;

    const iosMatch = userAgent.match(/iphone os ([\d_]+)/i);
    if (iosMatch) return `iOS ${iosMatch[1].replace(/_/g, '.')}`;

    const ipadMatch = userAgent.match(/ipad.*os ([\d_]+)/i);
    if (ipadMatch) return `iPadOS ${ipadMatch[1].replace(/_/g, '.')}`;

    if (/(macintosh|mac os x)/i.test(userAgent)) return 'macOS';
    if (/linux/i.test(userAgent)) return 'Linux';
    if (/cros/i.test(userAgent)) return 'ChromeOS';

    return null;
  }
}
