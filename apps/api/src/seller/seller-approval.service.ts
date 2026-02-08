import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { StoreStatus } from '@prisma/client';

/**
 * Service for managing seller application approvals
 */
@Injectable()
export class SellerApprovalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  /**
   * Get all pending seller applications
   */
  async getPendingApplications(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      this.prisma.store.findMany({
        where: { status: StoreStatus.PENDING },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({
        where: { status: StoreStatus.PENDING },
      }),
    ]);

    return {
      success: true,
      data: {
        applications: applications.map((store) => ({
          storeId: store.id,
          storeName: store.name,
          storeSlug: store.slug,
          storeEmail: store.email,
          storePhone: store.phone,
          description: store.description,
          status: store.status,
          appliedAt: store.createdAt,
          owner: {
            id: store.user.id,
            email: store.user.email,
            firstName: store.user.firstName,
            lastName: store.user.lastName,
            phone: store.user.phone,
            accountCreated: store.user.createdAt,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get all sellers with optional status filter
   */
  async getAllSellers(
    filters: { status?: StoreStatus; search?: string } = {},
    page = 1,
    limit = 20
  ) {
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [sellers, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              role: true,
              createdAt: true,
              sellerApprovedAt: true,
              sellerApprovedBy: true,
              sellerRejectedAt: true,
              sellerRejectionNote: true,
              sellerSuspendedAt: true,
              sellerSuspensionNote: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      success: true,
      data: {
        sellers: sellers.map((store) => ({
          storeId: store.id,
          storeName: store.name,
          storeSlug: store.slug,
          storeEmail: store.email,
          storePhone: store.phone,
          status: store.status,
          verified: store.verified,
          verifiedAt: store.verifiedAt,
          creditsBalance: store.creditsBalance,
          creditsExpiresAt: store.creditsExpiresAt,
          creditsGraceEndsAt: store.creditsGraceEndsAt,
          appliedAt: store.createdAt,
          owner: {
            id: store.user.id,
            email: store.user.email,
            firstName: store.user.firstName,
            lastName: store.user.lastName,
            phone: store.user.phone,
            role: store.user.role,
            approvedAt: store.user.sellerApprovedAt,
            approvedBy: store.user.sellerApprovedBy,
            rejectedAt: store.user.sellerRejectedAt,
            rejectionNote: store.user.sellerRejectionNote,
            suspendedAt: store.user.sellerSuspendedAt,
            suspensionNote: store.user.sellerSuspensionNote,
          },
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get seller statistics for admin dashboard
   */
  async getSellerStats() {
    const [
      total,
      pending,
      active,
      suspended,
      rejected,
      inactive,
      activeWithCredits,
      inGracePeriod,
      lowCredits,
    ] = await Promise.all([
      this.prisma.store.count(),
      this.prisma.store.count({ where: { status: StoreStatus.PENDING } }),
      this.prisma.store.count({ where: { status: StoreStatus.ACTIVE } }),
      this.prisma.store.count({ where: { status: StoreStatus.SUSPENDED } }),
      this.prisma.store.count({ where: { status: StoreStatus.REJECTED } }),
      this.prisma.store.count({ where: { status: StoreStatus.INACTIVE } }),
      this.prisma.store.count({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: { gt: 0 },
        },
      }),
      this.prisma.store.count({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: 0,
          creditsGraceEndsAt: { gte: new Date() },
        },
      }),
      this.prisma.store.count({
        where: {
          status: StoreStatus.ACTIVE,
          creditsBalance: { lte: 2, gt: 0 },
        },
      }),
    ]);

    return {
      success: true,
      data: {
        total,
        pending,
        active,
        suspended,
        rejected,
        inactive,
        activeWithCredits,
        inGracePeriod,
        lowCredits,
      },
    };
  }

  /**
   * Get detailed information about a seller application
   */
  async getApplicationDetails(storeId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true,
            createdAt: true,
            sellerApprovedAt: true,
            sellerApprovedBy: true,
            sellerRejectedAt: true,
            sellerRejectedBy: true,
            sellerRejectionNote: true,
            sellerSuspendedAt: true,
            sellerSuspendedBy: true,
            sellerSuspensionNote: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            status: true,
          },
          take: 5,
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return {
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          description: store.description,
          email: store.email,
          phone: store.phone,
          status: store.status,
          verified: store.verified,
          verifiedAt: store.verifiedAt,
          creditsBalance: store.creditsBalance,
          creditsExpiresAt: store.creditsExpiresAt,
          creditsGraceEndsAt: store.creditsGraceEndsAt,
          totalSales: store.totalSales,
          totalOrders: store.totalOrders,
          totalProducts: store.totalProducts,
          createdAt: store.createdAt,
          updatedAt: store.updatedAt,
        },
        owner: store.user,
        recentProducts: store.products,
      },
    };
  }

  /**
   * Approve a seller application (atomic: updates User + Store)
   */
  async approveSeller(storeId: string, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.status === StoreStatus.ACTIVE) {
      throw new BadRequestException('Store is already approved');
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Cannot approve a suspended store. Please reactivate it instead.'
      );
    }

    const now = new Date();

    // Atomic transaction: Update both User and Store
    await this.prisma.$transaction([
      // Update User with approval info
      this.prisma.user.update({
        where: { id: store.userId },
        data: {
          role: 'SELLER',
          sellerApprovedAt: now,
          sellerApprovedBy: adminId,
        },
      }),
      // Update Store status
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.ACTIVE,
          verified: true,
          verifiedAt: now,
        },
      }),
    ]);

    // Send approval email
    await this.emailService.sendSellerApproved(store.user.email, {
      sellerName: `${store.user.firstName} ${store.user.lastName}`,
      storeName: store.name,
    });

    return {
      success: true,
      message: 'Seller approved successfully',
      data: {
        storeId,
        storeName: store.name,
        ownerEmail: store.user.email,
        approvedAt: now,
        approvedBy: adminId,
      },
    };
  }

  /**
   * Reject a seller application
   */
  async rejectSeller(storeId: string, adminId: string, rejectionNote: string) {
    if (!rejectionNote || rejectionNote.trim().length === 0) {
      throw new BadRequestException('Rejection note is required');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.status === StoreStatus.REJECTED) {
      throw new BadRequestException('Store is already rejected');
    }

    const now = new Date();

    // Update both User and Store
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: store.userId },
        data: {
          sellerRejectedAt: now,
          sellerRejectedBy: adminId,
          sellerRejectionNote: rejectionNote,
        },
      }),
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.REJECTED,
        },
      }),
    ]);

    // Send rejection email
    await this.emailService.sendSellerRejected(store.user.email, {
      sellerName: `${store.user.firstName} ${store.user.lastName}`,
      storeName: store.name,
      rejectionReason: rejectionNote,
    });

    return {
      success: true,
      message: 'Seller application rejected',
      data: {
        storeId,
        storeName: store.name,
        ownerEmail: store.user.email,
        rejectedAt: now,
        rejectedBy: adminId,
        rejectionNote,
      },
    };
  }

  /**
   * Suspend an active seller (products become inactive)
   */
  async suspendSeller(storeId: string, adminId: string, suspensionNote: string) {
    if (!suspensionNote || suspensionNote.trim().length === 0) {
      throw new BadRequestException('Suspension note is required');
    }

    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new BadRequestException('Store is already suspended');
    }

    if (store.status !== StoreStatus.ACTIVE) {
      throw new ForbiddenException('Can only suspend active stores');
    }

    const now = new Date();

    // Update User, Store, and all Products in transaction
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: store.userId },
        data: {
          sellerSuspendedAt: now,
          sellerSuspendedBy: adminId,
          sellerSuspensionNote: suspensionNote,
        },
      }),
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.SUSPENDED,
        },
      }),
      // Suspend all active products
      this.prisma.product.updateMany({
        where: {
          storeId,
          status: 'ACTIVE',
        },
        data: {
          status: 'ARCHIVED',
        },
      }),
    ]);

    // Send suspension email
    await this.emailService.sendSellerSuspended(store.user.email, {
      sellerName: `${store.user.firstName} ${store.user.lastName}`,
      storeName: store.name,
      suspensionReason: suspensionNote,
    });

    return {
      success: true,
      message: 'Seller suspended successfully',
      data: {
        storeId,
        storeName: store.name,
        ownerEmail: store.user.email,
        suspendedAt: now,
        suspendedBy: adminId,
        suspensionNote,
      },
    };
  }

  /**
   * Reactivate a suspended seller
   */
  async reactivateSeller(storeId: string, adminId: string) {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      include: { user: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.status !== StoreStatus.SUSPENDED) {
      throw new BadRequestException('Store is not suspended');
    }

    // Check if store has credits
    if (store.creditsBalance <= 0) {
      const inGracePeriod = store.creditsGraceEndsAt && new Date() < store.creditsGraceEndsAt;

      if (!inGracePeriod) {
        throw new ForbiddenException(
          'Cannot reactivate seller without credits. Seller must purchase credits first.'
        );
      }
    }

    const now = new Date();

    // Update User and Store
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: store.userId },
        data: {
          sellerSuspendedAt: null,
          sellerSuspendedBy: null,
          sellerSuspensionNote: null,
        },
      }),
      this.prisma.store.update({
        where: { id: storeId },
        data: {
          status: StoreStatus.ACTIVE,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Seller reactivated successfully',
      data: {
        storeId,
        storeName: store.name,
        ownerEmail: store.user.email,
        reactivatedAt: now,
        reactivatedBy: adminId,
      },
    };
  }
}
