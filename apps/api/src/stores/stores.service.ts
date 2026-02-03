import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UploadService } from '../upload/upload.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  /**
   * Create a new store for a seller
   */
  async create(userId: string, dto: CreateStoreDto) {
    // Check if user already has a store
    const existingStore = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (existingStore) {
      throw new BadRequestException('You already have a store. Each seller can only have one store.');
    }

    // Check if slug is already taken
    const slugExists = await this.prisma.store.findUnique({
      where: { slug: dto.slug },
    });

    if (slugExists) {
      throw new BadRequestException('Store slug already exists. Please choose a different slug.');
    }

    // Update user role to SELLER
    await this.prisma.user.update({
      where: { id: userId },
      data: { role: 'SELLER' },
    });

    // Create store with PENDING status (requires admin approval)
    const store = await this.prisma.store.create({
      data: {
        userId,
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        email: dto.email,
        phone: dto.phone,
        website: dto.website,
        taxId: dto.taxId,
        address1: dto.address1,
        address2: dto.address2,
        city: dto.city,
        province: dto.province,
        country: dto.country,
        postalCode: dto.postalCode,
        returnPolicy: dto.returnPolicy,
        shippingPolicy: dto.shippingPolicy,
        termsConditions: dto.termsConditions,
        metaTitle: dto.metaTitle,
        metaDescription: dto.metaDescription,
        status: 'PENDING', // Requires admin approval
        isActive: false,
        verified: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      message: 'Store created successfully. Your store is pending admin approval.',
      store,
    };
  }

  /**
   * Get seller's own store
   */
  async getMyStore(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
            inventory: true,
          },
          take: 10,
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  /**
   * Get store by slug (public)
   */
  async getBySlug(slug: string) {
    const store = await this.prisma.store.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Only return active stores to public
    if (store.status !== 'ACTIVE' && !store.isActive) {
      throw new NotFoundException('Store is not available');
    }

    return store;
  }

  /**
   * Get all stores (public, with filters)
   */
  async findAll(query: any) {
    const { page = 1, limit = 20, status, verified } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      status: 'ACTIVE', // Only show active stores to public
      isActive: true,
    };

    if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          rating: 'desc',
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: stores,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update seller's store
   */
  async update(userId: string, dto: UpdateStoreDto) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // If updating slug, check if it's available
    if (dto.slug && dto.slug !== store.slug) {
      const slugExists = await this.prisma.store.findUnique({
        where: { slug: dto.slug },
      });

      if (slugExists) {
        throw new BadRequestException('Store slug already exists');
      }
    }

    const updatedStore = await this.prisma.store.update({
      where: { userId },
      data: dto,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      message: 'Store updated successfully',
      store: updatedStore,
    };
  }

  /**
   * Get store analytics for seller
   */
  async getAnalytics(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      include: {
        products: {
          select: {
            id: true,
            status: true,
            inventory: true,
            viewCount: true,
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Get orders for this store's products
    const orders = await this.prisma.order.findMany({
      where: {
        items: {
          some: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
      include: {
        items: {
          where: {
            product: {
              storeId: store.id,
            },
          },
        },
      },
    });

    // Calculate analytics
    const activeProducts = store.products.filter((p) => p.status === 'ACTIVE').length;
    const outOfStockProducts = store.products.filter((p) => p.inventory === 0).length;
    const totalViews = store.products.reduce((sum, p) => sum + p.viewCount, 0);

    const totalRevenue = orders.reduce((sum, order) => {
      const orderItemsTotal = order.items.reduce((itemSum, item) => {
        return itemSum + Number(item.total);
      }, 0);
      return sum + orderItemsTotal;
    }, 0);

    const pendingOrders = orders.filter((o) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
    const completedOrders = orders.filter((o) => o.status === 'DELIVERED').length;

    return {
      store: {
        id: store.id,
        name: store.name,
        status: store.status,
        verified: store.verified,
        rating: store.rating,
        totalSales: store.totalSales,
        totalOrders: store.totalOrders,
        totalProducts: store.totalProducts,
      },
      analytics: {
        products: {
          total: store.products.length,
          active: activeProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: orders.length,
          pending: pendingOrders,
          completed: completedOrders,
        },
        revenue: {
          total: totalRevenue,
          average: orders.length > 0 ? totalRevenue / orders.length : 0,
        },
        engagement: {
          totalViews,
          averageViewsPerProduct: store.products.length > 0 ? totalViews / store.products.length : 0,
        },
      },
    };
  }

  /**
   * Delete store (soft delete by setting to INACTIVE)
   */
  async delete(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    await this.prisma.store.update({
      where: { userId },
      data: {
        status: 'INACTIVE',
        isActive: false,
      },
    });

    return {
      message: 'Store deactivated successfully',
    };
  }

  /**
   * Admin: Update store status (approve/reject)
   */
  async updateStoreStatus(storeId: string, status: 'ACTIVE' | 'SUSPENDED' | 'REJECTED') {
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const updatedStore = await this.prisma.store.update({
      where: { id: storeId },
      data: {
        status,
        isActive: status === 'ACTIVE',
        verified: status === 'ACTIVE' ? true : store.verified,
        verifiedAt: status === 'ACTIVE' && !store.verifiedAt ? new Date() : store.verifiedAt,
      },
    });

    return {
      message: `Store ${status.toLowerCase()} successfully`,
      store: updatedStore,
    };
  }

  /**
   * Admin: Get all stores with filters
   */
  async adminFindAll(query: any) {
    const { page = 1, limit = 20, status, verified, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (verified !== undefined) {
      where.verified = verified === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        skip,
        take: Number(limit),
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.store.count({ where }),
    ]);

    return {
      data: stores,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Upload store logo
   */
  async uploadLogo(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Upload file to storage
    const uploadResult = await this.uploadService.uploadFile(file, 'stores/logos');

    // Update store logo URL
    const updatedStore = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        logo: uploadResult.url,
      },
    });

    return {
      message: 'Store logo uploaded successfully',
      url: uploadResult.url,
      store: updatedStore,
    };
  }

  /**
   * Upload store banner
   */
  async uploadBanner(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Upload file to storage
    const uploadResult = await this.uploadService.uploadFile(file, 'stores/banners');

    // Update store banner URL
    const updatedStore = await this.prisma.store.update({
      where: { id: store.id },
      data: {
        banner: uploadResult.url,
      },
    });

    return {
      message: 'Store banner uploaded successfully',
      url: uploadResult.url,
      store: updatedStore,
    };
  }

  /**
   * Get store reviews (aggregated from product reviews)
   */
  async getStoreReviews(storeId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Get reviews from products that belong to this store
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: {
          product: {
            storeId,
          },
          isApproved: true,
        },
        select: {
          id: true,
          rating: true,
          title: true,
          comment: true,
          images: true,
          isVerified: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              heroImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: {
          product: {
            storeId,
          },
          isApproved: true,
        },
      }),
    ]);

    // Calculate rating breakdown
    const ratingCounts = await this.prisma.review.groupBy({
      by: ['rating'],
      where: {
        product: {
          storeId,
        },
        isApproved: true,
      },
      _count: {
        rating: true,
      },
    });

    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    ratingCounts.forEach((item) => {
      if (item.rating >= 1 && item.rating <= 5) {
        breakdown[item.rating as keyof typeof breakdown] = item._count.rating;
      }
    });

    const averageRating = total > 0
      ? Object.entries(breakdown).reduce((sum, [rating, count]) => sum + Number(rating) * count, 0) / total
      : 0;

    return {
      data: reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: total,
        breakdown,
      },
    };
  }

  /**
   * Get seller's payout settings
   */
  async getPayoutSettings(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        // Payout Settings
        payoutMethod: true,
        payoutEmail: true,
        payoutCurrency: true,
        payoutMinAmount: true,
        payoutFrequency: true,
        payoutDayOfWeek: true,
        payoutDayOfMonth: true,
        payoutAutomatic: true,
        // Bank Account Details (mask sensitive data)
        bankAccountName: true,
        bankAccountNumber: true,
        bankRoutingNumber: true,
        bankName: true,
        bankBranchName: true,
        bankSwiftCode: true,
        bankIban: true,
        bankCountry: true,
        // Store status info
        verified: true,
        status: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Mask sensitive bank account details
    const maskedSettings = {
      ...store,
      bankAccountNumber: store.bankAccountNumber
        ? '****' + store.bankAccountNumber.slice(-4)
        : null,
      bankRoutingNumber: store.bankRoutingNumber
        ? '****' + store.bankRoutingNumber.slice(-4)
        : null,
      bankIban: store.bankIban
        ? store.bankIban.slice(0, 4) + '****' + store.bankIban.slice(-4)
        : null,
    };

    // Get pending balance from escrow
    const pendingBalance = await this.prisma.escrowTransaction.aggregate({
      where: {
        storeId: store.id,
        status: 'HELD',
      },
      _sum: {
        sellerAmount: true,
      },
    });

    // Get available balance (released escrow)
    const availableBalance = await this.prisma.escrowTransaction.aggregate({
      where: {
        storeId: store.id,
        status: 'RELEASED',
      },
      _sum: {
        sellerAmount: true,
      },
    });

    // Get next scheduled payout date
    const nextPayoutDate = this.calculateNextPayoutDate(
      store.payoutFrequency || 'monthly',
      store.payoutDayOfWeek,
      store.payoutDayOfMonth || 1,
    );

    return {
      settings: maskedSettings,
      balances: {
        pending: Number(pendingBalance._sum.sellerAmount || 0),
        available: Number(availableBalance._sum.sellerAmount || 0),
        currency: store.payoutCurrency || 'USD',
      },
      nextPayoutDate,
    };
  }

  /**
   * Update seller's payout settings
   */
  async updatePayoutSettings(userId: string, dto: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Convert payoutMinAmount to Decimal if provided
    const updateData: any = { ...dto };
    if (dto.payoutMinAmount !== undefined) {
      updateData.payoutMinAmount = dto.payoutMinAmount;
    }

    const updatedStore = await this.prisma.store.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        payoutMethod: true,
        payoutEmail: true,
        payoutCurrency: true,
        payoutMinAmount: true,
        payoutFrequency: true,
        payoutDayOfWeek: true,
        payoutDayOfMonth: true,
        payoutAutomatic: true,
        bankAccountName: true,
        bankAccountNumber: true,
        bankRoutingNumber: true,
        bankName: true,
        bankBranchName: true,
        bankSwiftCode: true,
        bankIban: true,
        bankCountry: true,
      },
    });

    // Mask sensitive data in response
    return {
      message: 'Payout settings updated successfully',
      settings: {
        ...updatedStore,
        bankAccountNumber: updatedStore.bankAccountNumber
          ? '****' + updatedStore.bankAccountNumber.slice(-4)
          : null,
        bankRoutingNumber: updatedStore.bankRoutingNumber
          ? '****' + updatedStore.bankRoutingNumber.slice(-4)
          : null,
        bankIban: updatedStore.bankIban
          ? updatedStore.bankIban.slice(0, 4) + '****' + updatedStore.bankIban.slice(-4)
          : null,
      },
    };
  }

  /**
   * Get seller's payout history
   */
  async getPayoutHistory(userId: string, page: number = 1, limit: number = 20, status?: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const skip = (page - 1) * limit;

    const where: any = {
      storeId: store.id,
    };

    if (status) {
      where.status = status.toUpperCase();
    }

    const [payouts, total] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          paymentMethod: true,
          paymentReference: true,
          processedAt: true,
          notes: true,
          createdAt: true,
        },
      }),
      this.prisma.payout.count({ where }),
    ]);

    // Calculate totals by status
    const payoutStats = await this.prisma.payout.groupBy({
      by: ['status'],
      where: { storeId: store.id },
      _sum: { amount: true },
      _count: true,
    });

    const stats = {
      totalPaid: 0,
      totalPending: 0,
      totalFailed: 0,
    };

    payoutStats.forEach((stat) => {
      if (stat.status === 'COMPLETED') {
        stats.totalPaid = Number(stat._sum.amount || 0);
      } else if (stat.status === 'PENDING' || stat.status === 'PROCESSING') {
        stats.totalPending = Number(stat._sum.amount || 0);
      } else if (stat.status === 'FAILED') {
        stats.totalFailed = Number(stat._sum.amount || 0);
      }
    });

    return {
      data: payouts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    };
  }

  /**
   * Calculate next payout date based on frequency
   */
  private calculateNextPayoutDate(
    frequency: string,
    dayOfWeek?: number | null,
    dayOfMonth?: number | null,
  ): Date {
    const now = new Date();
    const nextDate = new Date(now);

    switch (frequency) {
      case 'weekly':
        // Find next occurrence of dayOfWeek (0 = Sunday)
        const targetDay = dayOfWeek ?? 1; // Default to Monday
        const currentDay = now.getDay();
        const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
        nextDate.setDate(now.getDate() + daysUntil);
        break;

      case 'biweekly':
        // Next occurrence of dayOfWeek, at least 7 days away
        const biweeklyTargetDay = dayOfWeek ?? 1;
        const biweeklyCurrentDay = now.getDay();
        let biweeklyDaysUntil = (biweeklyTargetDay - biweeklyCurrentDay + 7) % 7;
        if (biweeklyDaysUntil < 7) {
          biweeklyDaysUntil += 7; // At least one week away
        }
        nextDate.setDate(now.getDate() + biweeklyDaysUntil);
        break;

      case 'monthly':
      default:
        // Next occurrence of dayOfMonth
        const targetDayOfMonth = dayOfMonth ?? 1;
        if (now.getDate() >= targetDayOfMonth) {
          // Move to next month
          nextDate.setMonth(now.getMonth() + 1);
        }
        nextDate.setDate(Math.min(targetDayOfMonth, this.getDaysInMonth(nextDate)));
        break;
    }

    nextDate.setHours(0, 0, 0, 0);
    return nextDate;
  }

  /**
   * Get days in a month
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * Get seller's vacation mode status
   */
  async getVacationStatus(userId: string) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
      select: {
        id: true,
        name: true,
        vacationMode: true,
        vacationMessage: true,
        vacationStartDate: true,
        vacationEndDate: true,
        vacationAutoReply: true,
        vacationHideProducts: true,
        status: true,
        isActive: true,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Check if vacation should auto-end
    const now = new Date();
    let isVacationActive = store.vacationMode;
    let autoEndTriggered = false;

    if (store.vacationMode && store.vacationEndDate) {
      const endDate = new Date(store.vacationEndDate);
      if (now >= endDate) {
        // Auto-end vacation
        await this.prisma.store.update({
          where: { userId },
          data: {
            vacationMode: false,
            vacationStartDate: null,
            vacationEndDate: null,
          },
        });
        isVacationActive = false;
        autoEndTriggered = true;
      }
    }

    // Calculate days on vacation
    let daysOnVacation = 0;
    if (store.vacationMode && store.vacationStartDate) {
      const startDate = new Date(store.vacationStartDate);
      daysOnVacation = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    }

    // Calculate days until vacation ends
    let daysUntilEnd = null;
    if (store.vacationMode && store.vacationEndDate) {
      const endDate = new Date(store.vacationEndDate);
      daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilEnd < 0) daysUntilEnd = 0;
    }

    return {
      vacationMode: isVacationActive,
      vacationMessage: store.vacationMessage,
      vacationStartDate: store.vacationStartDate,
      vacationEndDate: store.vacationEndDate,
      vacationAutoReply: store.vacationAutoReply,
      vacationHideProducts: store.vacationHideProducts,
      daysOnVacation: isVacationActive ? daysOnVacation : 0,
      daysUntilEnd,
      autoEndTriggered,
      storeStatus: store.status,
      storeActive: store.isActive,
    };
  }

  /**
   * Update seller's vacation mode
   */
  async updateVacationMode(userId: string, dto: any) {
    const store = await this.prisma.store.findUnique({
      where: { userId },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    // Prepare update data
    const updateData: any = {
      vacationMode: dto.vacationMode,
      vacationMessage: dto.vacationMessage || null,
      vacationAutoReply: dto.vacationAutoReply || null,
      vacationHideProducts: dto.vacationHideProducts ?? false,
    };

    // Handle vacation end date
    if (dto.vacationEndDate) {
      updateData.vacationEndDate = new Date(dto.vacationEndDate);
    } else {
      updateData.vacationEndDate = null;
    }

    // Set or clear start date based on vacation mode
    if (dto.vacationMode && !store.vacationMode) {
      // Enabling vacation mode - set start date
      updateData.vacationStartDate = new Date();
    } else if (!dto.vacationMode) {
      // Disabling vacation mode - clear dates
      updateData.vacationStartDate = null;
      updateData.vacationEndDate = null;
    }

    const updatedStore = await this.prisma.store.update({
      where: { userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        vacationMode: true,
        vacationMessage: true,
        vacationStartDate: true,
        vacationEndDate: true,
        vacationAutoReply: true,
        vacationHideProducts: true,
      },
    });

    return {
      message: dto.vacationMode
        ? 'Vacation mode enabled. Your store will display the vacation message.'
        : 'Vacation mode disabled. Your store is now active.',
      vacation: updatedStore,
    };
  }

  // ============================================================================
  // Store Following Methods
  // ============================================================================

  /**
   * Get follower count for a store
   */
  async getFollowerCount(storeId: string) {
    const count = await this.prisma.storeFollow.count({
      where: { storeId },
    });

    return { count };
  }

  /**
   * Get list of stores the user is following
   */
  async getFollowingStores(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [follows, total] = await Promise.all([
      this.prisma.storeFollow.findMany({
        where: { userId },
        include: {
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              logo: true,
              banner: true,
              city: true,
              country: true,
              verified: true,
              rating: true,
              reviewCount: true,
              totalProducts: true,
              totalOrders: true,
              vacationMode: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.storeFollow.count({
        where: { userId },
      }),
    ]);

    return {
      data: follows.map((f) => ({
        ...f.store,
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if user is following a specific store
   */
  async isFollowing(userId: string, storeId: string) {
    const follow = await this.prisma.storeFollow.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    return { isFollowing: !!follow };
  }

  /**
   * Follow a store
   */
  async followStore(userId: string, storeId: string) {
    // Check if store exists and is active
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { id: true, name: true, userId: true, status: true, isActive: true },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    if (store.status !== 'ACTIVE' || !store.isActive) {
      throw new BadRequestException('Cannot follow an inactive store');
    }

    // Prevent following own store
    if (store.userId === userId) {
      throw new BadRequestException('You cannot follow your own store');
    }

    // Check if already following
    const existingFollow = await this.prisma.storeFollow.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('You are already following this store');
    }

    // Create follow
    await this.prisma.storeFollow.create({
      data: {
        userId,
        storeId,
      },
    });

    // Get updated follower count
    const followerCount = await this.prisma.storeFollow.count({
      where: { storeId },
    });

    return {
      message: `You are now following ${store.name}`,
      isFollowing: true,
      followerCount,
    };
  }

  /**
   * Unfollow a store
   */
  async unfollowStore(userId: string, storeId: string) {
    // Check if following
    const follow = await this.prisma.storeFollow.findUnique({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    if (!follow) {
      throw new BadRequestException('You are not following this store');
    }

    // Delete follow
    await this.prisma.storeFollow.delete({
      where: {
        userId_storeId: {
          userId,
          storeId,
        },
      },
    });

    // Get updated follower count
    const followerCount = await this.prisma.storeFollow.count({
      where: { storeId },
    });

    // Get store name for message
    const store = await this.prisma.store.findUnique({
      where: { id: storeId },
      select: { name: true },
    });

    return {
      message: `You have unfollowed ${store?.name || 'the store'}`,
      isFollowing: false,
      followerCount,
    };
  }
}
