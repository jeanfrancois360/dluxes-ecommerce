import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { StoreStatus } from '@prisma/client';

/**
 * Guard to check if a seller can publish products
 * Requirements:
 * 1. Store status must be ACTIVE
 * 2. Must have credits > 0 OR be within grace period
 */
@Injectable()
export class CanPublishGuard implements CanActivate {
  private readonly logger = new Logger(CanPublishGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get user's store
    const store = await this.prisma.store.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        creditsBalance: true,
        creditsGraceEndsAt: true,
      },
    });

    // Check if store exists
    if (!store) {
      throw new ForbiddenException(
        'No store found. You must apply to become a seller before creating products.',
      );
    }

    // Check store status
    if (store.status === StoreStatus.PENDING) {
      throw new ForbiddenException(
        'Your seller application is pending review. You cannot publish products until your store is approved by an admin.',
      );
    }

    if (store.status === StoreStatus.REJECTED) {
      throw new ForbiddenException(
        'Your seller application was rejected. Please contact support for more information.',
      );
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your store has been suspended. Please contact support for assistance.',
      );
    }

    if (store.status === StoreStatus.INACTIVE) {
      throw new ForbiddenException(
        'Your store is inactive. Please reactivate your store to publish products.',
      );
    }

    if (store.status !== StoreStatus.ACTIVE) {
      throw new ForbiddenException(
        'Your store is not active. Please contact support.',
      );
    }

    // Check credits
    if (store.creditsBalance > 0) {
      // Has credits, can publish
      return true;
    }

    // No credits, check if in grace period
    if (store.creditsBalance === 0) {
      const now = new Date();
      const inGracePeriod =
        store.creditsGraceEndsAt && now < store.creditsGraceEndsAt;

      if (inGracePeriod) {
        // In grace period, can still publish
        const daysRemaining = Math.ceil(
          (store.creditsGraceEndsAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        this.logger.warn(
          `Store ${store.id} (${store.name}) publishing in grace period - ${daysRemaining} days remaining`,
        );

        return true;
      }

      // Grace period expired or not set
      throw new ForbiddenException(
        'Insufficient credits. Your store has run out of selling credits. Please purchase credits to continue publishing products.',
      );
    }

    // Should not reach here, but failsafe
    throw new ForbiddenException(
      'Unable to verify publishing permissions. Please contact support.',
    );
  }
}
