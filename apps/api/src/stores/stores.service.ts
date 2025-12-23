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
}
