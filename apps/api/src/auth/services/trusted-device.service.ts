import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class TrustedDeviceService {
  constructor(private readonly prisma: PrismaService) {}

  generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  buildFingerprint(userAgent: string, ipAddress: string): string {
    return createHash('sha256').update(`${userAgent}|${ipAddress}`).digest('hex');
  }

  async createTrustedDevice(
    userId: string,
    rawToken: string,
    userAgent: string,
    ipAddress: string,
    durationDays: number
  ): Promise<void> {
    const id = randomBytes(12).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const fingerprint = this.buildFingerprint(userAgent, ipAddress);
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.$executeRaw`
      INSERT INTO trusted_devices (id, "userId", fingerprint, "tokenHash", "userAgent", "ipAddress", "expiresAt", "createdAt", "lastUsedAt")
      VALUES (${id}, ${userId}, ${fingerprint}, ${tokenHash}, ${userAgent}, ${ipAddress}, ${expiresAt}, NOW(), NOW())
    `;
  }

  async validateTrustedDevice(userId: string, rawToken: string): Promise<boolean> {
    const tokenHash = this.hashToken(rawToken);

    const rows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM trusted_devices
      WHERE "userId" = ${userId}
        AND "tokenHash" = ${tokenHash}
        AND "expiresAt" > NOW()
        AND "revokedAt" IS NULL
      LIMIT 1
    `;

    if (rows.length === 0) return false;

    await this.prisma.$executeRaw`
      UPDATE trusted_devices SET "lastUsedAt" = NOW() WHERE id = ${rows[0].id}
    `;

    return true;
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.$executeRaw`
      UPDATE trusted_devices SET "revokedAt" = NOW()
      WHERE "userId" = ${userId} AND "revokedAt" IS NULL
    `;
  }

  /**
   * Parse the raw trust token from a cookie header string.
   * Does NOT require cookie-parser middleware.
   */
  parseTrustTokenFromCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/(?:^|;\s*)device_trust_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}
