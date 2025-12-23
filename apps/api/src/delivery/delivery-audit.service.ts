import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DeliveryAuditAction, UserRole } from '@prisma/client';

interface AuditLogData {
  deliveryId: string;
  action: DeliveryAuditAction;
  performedBy: string;
  userRole: UserRole;
  oldValue?: any;
  newValue?: any;
  notes?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Service for logging all delivery-related actions for audit trail
 */
@Injectable()
export class DeliveryAuditService {
  private readonly logger = new Logger(DeliveryAuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an audit log entry
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.deliveryAuditLog.create({
        data: {
          deliveryId: data.deliveryId,
          action: data.action,
          performedBy: data.performedBy,
          userRole: data.userRole,
          oldValue: data.oldValue ? JSON.stringify(data.oldValue) : null,
          newValue: data.newValue ? JSON.stringify(data.newValue) : null,
          notes: data.notes,
          metadata: data.metadata || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      this.logger.log(
        `Audit: ${data.action} on delivery ${data.deliveryId} by user ${data.performedBy}`
      );
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
    }
  }

  /**
   * Get audit logs for a delivery
   */
  async getLogsForDelivery(deliveryId: string) {
    return this.prisma.deliveryAuditLog.findMany({
      where: { deliveryId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get audit logs by user
   */
  async getLogsByUser(userId: string, limit = 50) {
    return this.prisma.deliveryAuditLog.findMany({
      where: { performedBy: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        delivery: {
          select: {
            trackingNumber: true,
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get recent audit logs (admin view)
   */
  async getRecentLogs(limit = 100) {
    return this.prisma.deliveryAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        delivery: {
          select: {
            trackingNumber: true,
            order: {
              select: {
                orderNumber: true,
              },
            },
          },
        },
      },
    });
  }
}
