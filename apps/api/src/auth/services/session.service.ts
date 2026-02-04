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
    private logger: LoggerService,
  ) {}

  /**
   * Generate session fingerprint hash from IP and User-Agent
   * Used for detecting suspicious session activity
   */
  private generateFingerprint(ipAddress: string, userAgent: string): string {
    return createHash('sha256')
      .update(`${ipAddress}:${userAgent}`)
      .digest('hex')
      .substring(0, 32); // Truncate to 32 chars for storage
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
    const ua = userAgent.toLowerCase();

    // Detect device type
    let device = 'Desktop';
    if (/(iphone|ipod)/i.test(userAgent)) device = 'iPhone';
    else if (/ipad/i.test(userAgent)) device = 'iPad';
    else if (/android/i.test(userAgent) && /mobile/i.test(userAgent)) device = 'Android Phone';
    else if (/android/i.test(userAgent)) device = 'Android Tablet';
    else if (/(macintosh|mac os x)/i.test(userAgent)) device = 'Mac';
    else if (/windows/i.test(userAgent)) device = 'Windows PC';
    else if (/linux/i.test(userAgent)) device = 'Linux PC';

    // Detect OS
    let os = 'Unknown OS';
    if (/windows nt 10/i.test(userAgent)) os = 'Windows 10/11';
    else if (/windows nt 6.3/i.test(userAgent)) os = 'Windows 8.1';
    else if (/windows nt 6.2/i.test(userAgent)) os = 'Windows 8';
    else if (/windows nt 6.1/i.test(userAgent)) os = 'Windows 7';
    else if (/mac os x ([\d_]+)/i.test(userAgent)) {
      const version = userAgent.match(/mac os x ([\d_]+)/i);
      os = version ? `macOS ${version[1].replace(/_/g, '.')}` : 'macOS';
    } else if (/android ([\d.]+)/i.test(userAgent)) {
      const version = userAgent.match(/android ([\d.]+)/i);
      os = version ? `Android ${version[1]}` : 'Android';
    } else if (/iphone os ([\d_]+)/i.test(userAgent)) {
      const version = userAgent.match(/iphone os ([\d_]+)/i);
      os = version ? `iOS ${version[1].replace(/_/g, '.')}` : 'iOS';
    } else if (/ipad.*os ([\d_]+)/i.test(userAgent)) {
      const version = userAgent.match(/ipad.*os ([\d_]+)/i);
      os = version ? `iPadOS ${version[1].replace(/_/g, '.')}` : 'iPadOS';
    } else if (/linux/i.test(userAgent)) os = 'Linux';

    // Detect browser
    let browser = 'Unknown Browser';
    if (/edg\//i.test(userAgent)) browser = 'Microsoft Edge';
    else if (/chrome\//i.test(userAgent) && !/edg\//i.test(userAgent)) browser = 'Google Chrome';
    else if (/safari\//i.test(userAgent) && !/chrome\//i.test(userAgent)) browser = 'Safari';
    else if (/firefox\//i.test(userAgent)) browser = 'Firefox';
    else if (/opera|opr\//i.test(userAgent)) browser = 'Opera';

    // Generate description
    const description = `${device} - ${browser} on ${os}`;

    return { device, os, browser, description };
  }

  /**
   * Detect suspicious activity by comparing current login with recent sessions
   * Returns array of suspicious indicators
   */
  private async detectSuspiciousActivity(
    userId: string,
    currentIp: string,
    currentUserAgent: string,
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
    rememberMe: boolean,
  ): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const expiryDuration = rememberMe ? this.SESSION_EXPIRY_REMEMBER : this.SESSION_EXPIRY_DEFAULT;

    // Generate session fingerprint for security
    const fingerprint = this.generateFingerprint(ipAddress, userAgent);

    // Detect suspicious activity (non-blocking)
    const suspiciousFlags = await this.detectSuspiciousActivity(userId, ipAddress, userAgent);
    if (suspiciousFlags.length > 0) {
      // Log suspicious activity (in production, this would trigger alerts/notifications)
      console.warn(
        `[SECURITY] Suspicious activity detected for user ${userId}: ${suspiciousFlags.join(', ')}`,
      );
      // In production, you could:
      // - Send email notification to user
      // - Require additional verification (2FA)
      // - Temporarily lock account
    }

    await this.prisma.userSession.create({
      data: {
        userId,
        token,
        ipAddress,
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowser(userAgent),
        fingerprint,
        expiresAt: new Date(Date.now() + expiryDuration),
      },
    });

    return token;
  }

  /**
   * Validate session with fingerprint checking
   * Returns true if session is valid and not suspicious
   */
  async validateSession(
    sessionToken: string,
    currentIp: string,
    currentUserAgent: string,
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
          { sessionId: session.id },
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

    // Enhance sessions with device info from stored fields
    return sessions.map((session) => {
      // Construct device info from stored fields
      const device = session.deviceType || 'Unknown Device';
      const browser = session.browser || 'Unknown Browser';
      const os = session.os || 'Unknown OS';

      const deviceInfo = {
        device: device.charAt(0).toUpperCase() + device.slice(1),
        os: os,
        browser: browser,
        description: `${browser}${os ? ` on ${os}` : ''}`,
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
    const newSessionToken = await this.createSession(userId, ipAddress, userAgent, false);

    return newSessionToken;
  }

  /**
   * Get device type from user agent string
   */
  private getDeviceType(userAgent: string): string {
    // Simple device type detection
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Get browser name from user agent string
   */
  private getBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'Chrome';
    if (/safari/i.test(userAgent)) return 'Safari';
    if (/firefox/i.test(userAgent)) return 'Firefox';
    if (/edge/i.test(userAgent)) return 'Edge';
    return 'Unknown';
  }
}
