import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { SubscriptionService } from '../subscription/subscription.service';
import { CreditsService } from '../credits/credits.service';
import { SearchService } from '../search/search.service';
import { SettingsService } from '../settings/settings.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductInquiryDto } from './dto/product-inquiry.dto';
import { ProductStatus, Prisma, PurchaseType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Products Service
 * Handles all business logic for product operations
 */
@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly subscriptionService: SubscriptionService,
    private readonly creditsService: CreditsService,
    private readonly searchService: SearchService,
    private readonly settingsService: SettingsService
  ) {}

  /**
   * Transform Decimal values to numbers for JSON serialization
   */
  private transformProduct(product: any) {
    // Transform variants to include 'attributes' field for frontend compatibility
    const variants = product.variants?.map((variant: any) => ({
      ...variant,
      price: variant.price ? Number(variant.price) : null,
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
      attributes: variant.options || {}, // Map 'options' to 'attributes' for frontend
    }));

    return {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      variants: variants || product.variants,
    };
  }

  private transformProducts(products: any[]) {
    return products.map((p) => this.transformProduct(p));
  }

  /**
   * Generate SKU automatically - ALWAYS auto-generated, no custom SKUs allowed
   * Format: {SKU_PREFIX}-{MM}-{DD}-{SEQUENCE_NUMBER}
   * Example: PROD-01-29-000001, PROD-01-29-000002, etc.
   * Sequence resets daily.
   */
  private async generateSKU(): Promise<string> {
    try {
      // Get SKU prefix from settings
      const prefixSetting = await this.settingsService.getSetting('inventory.sku_prefix');
      const prefix = String(prefixSetting.value || 'NEXTPIK').toUpperCase();

      // Get current date components
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
      const day = String(now.getDate()).padStart(2, '0'); // 01-31

      // Format: PREFIX-MM-DD-
      const datePrefix = `${prefix}-${month}-${day}-`;

      // Find the highest existing SKU number for today's date with this prefix
      const products = await this.prisma.product.findMany({
        where: {
          sku: {
            startsWith: datePrefix,
          },
        },
        orderBy: {
          sku: 'desc',
        },
        take: 1,
      });

      let nextNumber = 1;
      if (products.length > 0) {
        const lastSKU = products[0].sku;
        // Extract the sequence number from PREFIX-MM-DD-XXXXXX
        const match = lastSKU.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Format with leading zeros (6 digits)
      const formattedNumber = String(nextNumber).padStart(6, '0');
      const generatedSKU = `${datePrefix}${formattedNumber}`;

      // Double-check uniqueness (race condition protection)
      const duplicate = await this.prisma.product.findUnique({
        where: { sku: generatedSKU },
      });
      if (duplicate) {
        // Recursively try next number if collision occurs
        return this.generateSKU();
      }

      this.logger.log(`Auto-generated SKU: ${generatedSKU}`);
      return generatedSKU;
    } catch (error) {
      this.logger.error('Failed to generate SKU:', error);
      // Fallback to timestamp-based SKU if settings fail
      const timestamp = Date.now();
      const fallbackSKU = `PROD-${timestamp}`;
      this.logger.warn(`Using fallback SKU: ${fallbackSKU}`);
      return fallbackSKU;
    }
  }

  /**
   * Generate SKU for Product Variants - ALWAYS auto-generated, no custom SKUs allowed
   * Format: {SKU_PREFIX}-V-{MM}-{DD}-{SEQUENCE_NUMBER}
   * Example: NEXTPIK-V-01-29-000001, NEXTPIK-V-01-29-000002, etc.
   * The "V" distinguishes variant SKUs from product SKUs.
   * Sequence resets daily.
   */
  private async generateVariantSKU(): Promise<string> {
    try {
      // Get SKU prefix from settings
      const prefixSetting = await this.settingsService.getSetting('inventory.sku_prefix');
      const prefix = String(prefixSetting.value || 'NEXTPIK').toUpperCase();

      // Get current date components
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // 01-12
      const day = String(now.getDate()).padStart(2, '0'); // 01-31

      // Format: PREFIX-V-MM-DD- (V for Variant)
      const datePrefix = `${prefix}-V-${month}-${day}-`;

      // Find the highest existing SKU number for today's date with this prefix
      const variants = await this.prisma.productVariant.findMany({
        where: {
          sku: {
            startsWith: datePrefix,
          },
        },
        orderBy: {
          sku: 'desc',
        },
        take: 1,
      });

      let nextNumber = 1;
      if (variants.length > 0) {
        const lastSKU = variants[0].sku;
        // Extract the sequence number from PREFIX-V-MM-DD-XXXXXX
        const match = lastSKU.match(/-(\d+)$/);
        if (match) {
          nextNumber = parseInt(match[1], 10) + 1;
        }
      }

      // Format with leading zeros (6 digits)
      const formattedNumber = String(nextNumber).padStart(6, '0');
      const generatedSKU = `${datePrefix}${formattedNumber}`;

      // Double-check uniqueness (race condition protection)
      const duplicate = await this.prisma.productVariant.findUnique({
        where: { sku: generatedSKU },
      });
      if (duplicate) {
        // Recursively try next number if collision occurs
        return this.generateVariantSKU();
      }

      this.logger.log(`Auto-generated Variant SKU: ${generatedSKU}`);
      return generatedSKU;
    } catch (error) {
      this.logger.error('Failed to generate Variant SKU:', error);
      // Fallback to timestamp-based SKU if settings fail
      const timestamp = Date.now();
      const fallbackSKU = `VAR-${timestamp}`;
      this.logger.warn(`Using fallback Variant SKU: ${fallbackSKU}`);
      return fallbackSKU;
    }
  }

  /**
   * Check if user can create a subscription-based product
   */
  private async checkSubscriptionRequirements(
    userId: string,
    productType: string
  ): Promise<{ allowed: boolean; message?: string }> {
    const subscriptionTypes = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];

    // Skip check for commission-based products
    if (!subscriptionTypes.includes(productType)) {
      return { allowed: true };
    }

    const check = await this.subscriptionService.canListProductType(userId, productType);

    if (!check.canList) {
      const messages: string[] = [];
      if (!check.reasons.hasMonthlyCredits) {
        messages.push('You need an active platform subscription to list products');
      }
      if (!check.reasons.productTypeAllowed) {
        messages.push(
          `Your feature plan does not include ${productType} listings. Upgrade to a plan that supports this product type`
        );
      }
      if (!check.reasons.meetsTierRequirement) {
        messages.push(
          `Your current feature plan tier doesn't support ${productType} products. Upgrade to a higher tier`
        );
      }
      if (!check.reasons.hasListingCapacity) {
        messages.push('You have reached your maximum listing limit');
      }

      return { allowed: false, message: messages.join('. ') };
    }

    return { allowed: true };
  }

  /**
   * Deduct credits for subscription-based product
   */
  private async deductListingCredits(
    userId: string,
    productType: string,
    productId: string
  ): Promise<void> {
    const subscriptionTypes = ['SERVICE', 'RENTAL', 'VEHICLE', 'REAL_ESTATE'];

    if (!subscriptionTypes.includes(productType)) {
      return; // No credits for commission-based products
    }

    const action = `list_${productType.toLowerCase()}`;
    await this.creditsService.debitCredits(
      userId,
      action,
      `Listed ${productType} product`,
      productId
    );
  }

  /**
   * Find all products with advanced filtering, sorting, and pagination
   */
  async findAll(query: ProductQueryDto) {
    const {
      category,
      minPrice,
      maxPrice,
      brands,
      tags,
      search,
      page = 1,
      pageSize,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status,
      featured,
      colors,
      sizes,
      materials,
      inStock,
      onSale,
      productType,
      purchaseType,
    } = query;

    // Use limit if provided, otherwise fall back to pageSize, with default of 24
    const take = limit || pageSize || 24;

    const where: Prisma.ProductWhereInput = {};

    // Status filter: Default to ACTIVE for public endpoints, only show other statuses if explicitly requested
    if (status !== undefined && status !== null) {
      where.status = status;
    } else {
      // Default to ACTIVE status to hide DRAFT products from public views
      where.status = 'ACTIVE';
    }

    // Category filter - lookup by slug
    if (category) {
      const categoryRecord = await this.prisma.category.findUnique({
        where: { slug: category },
        select: { id: true },
      });

      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    // Featured filter
    if (featured !== undefined) {
      where.featured = featured;
    }

    // In Stock filter
    if (inStock !== undefined && inStock === true) {
      where.inventory = {
        gt: 0,
      };
    }

    // On Sale filter (has compareAtPrice)
    if (onSale !== undefined && onSale === true) {
      where.compareAtPrice = {
        not: null,
      };
    }

    // Colors filter
    if (colors) {
      where.colors = {
        hasSome: colors.split(','),
      };
    }

    // Sizes filter
    if (sizes) {
      where.sizes = {
        hasSome: sizes.split(','),
      };
    }

    // Materials filter
    if (materials) {
      where.materials = {
        hasSome: materials.split(','),
      };
    }

    // Product Type filter
    if (productType !== undefined) {
      where.productType = productType;
    }

    // Purchase Type filter
    if (purchaseType !== undefined) {
      where.purchaseType = purchaseType;
    }

    // Store ID filter (for public store pages)
    if (query.storeId) {
      where.storeId = query.storeId;
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',');
      where.tags = {
        some: {
          name: {
            in: tagArray,
          },
        },
      };
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { shortDescription: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Map sortBy to valid Prisma fields
    const sortByMapping: Record<string, string> = {
      relevance: 'viewCount', // Map relevance to view count (popularity)
      popularity: 'viewCount',
      price: 'price',
      name: 'name',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      rating: 'rating',
      inventory: 'inventory',
      stock: 'inventory', // Alias for inventory
    };

    const validSortBy = sortByMapping[sortBy] || 'createdAt';

    // Build orderBy
    const orderBy: any = {};
    orderBy[validSortBy] = sortOrder;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          price: true,
          compareAtPrice: true,
          heroImage: true,
          featured: true,
          rating: true,
          reviewCount: true,
          colors: true,
          sizes: true,
          materials: true,
          inventory: true,
          status: true,
          storeId: true,
          store: {
            select: {
              id: true,
              name: true,
              slug: true,
              logo: true,
              verified: true,
              rating: true,
              reviewCount: true,
              totalProducts: true,
              city: true,
              country: true,
            },
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            select: {
              id: true,
              url: true,
              alt: true,
              displayOrder: true,
            },
            orderBy: { displayOrder: 'asc' },
            take: 5,
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
            take: 10,
          },
        },
        skip: (page - 1) * take,
        take: take,
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: this.transformProducts(products),
      total,
      page,
      pageSize: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Get featured products
   */
  async getFeatured(limit: number = 12) {
    const products = await this.prisma.product.findMany({
      where: {
        featured: true,
        status: ProductStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        heroImage: true,
        featured: true,
        rating: true,
        reviewCount: true,
        inventory: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
          take: 3,
        },
      },
      take: limit,
      orderBy: { displayOrder: 'asc' },
    });
    return this.transformProducts(products);
  }

  /**
   * Get new arrival products
   */
  async getNewArrivals(limit: number = 12) {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        badges: {
          has: 'New',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        heroImage: true,
        featured: true,
        rating: true,
        reviewCount: true,
        inventory: true,
        badges: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
          take: 3,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return this.transformProducts(products);
  }

  /**
   * Get trending products based on views and likes
   */
  async getTrending(limit: number = 12) {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        heroImage: true,
        featured: true,
        rating: true,
        reviewCount: true,
        inventory: true,
        viewCount: true,
        likeCount: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
          take: 3,
        },
      },
      take: limit,
      orderBy: [{ viewCount: 'desc' }, { likeCount: 'desc' }],
    });
    return this.transformProducts(products);
  }

  /**
   * Get products on sale
   */
  async getOnSale(limit: number = 12) {
    const products = await this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        compareAtPrice: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        shortDescription: true,
        price: true,
        compareAtPrice: true,
        heroImage: true,
        featured: true,
        rating: true,
        reviewCount: true,
        inventory: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
          take: 3,
        },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return this.transformProducts(products);
  }

  /**
   * Find product by slug
   */
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        tags: true,
        reviews: {
          where: {
            isApproved: true,
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            verified: true,
            rating: true,
            reviewCount: true,
            totalProducts: true,
            city: true,
            country: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Only allow public access to ACTIVE products (sellers/admins can see their own drafts)
    if (product.status !== ProductStatus.ACTIVE) {
      throw new NotFoundException('Product not found');
    }

    // Increment view count
    await this.prisma.product.update({
      where: { id: product.id },
      data: { viewCount: { increment: 1 } },
    });

    return this.transformProduct(product);
  }

  /**
   * Find product by ID
   */
  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: {
          orderBy: { displayOrder: 'asc' },
        },
        variants: {
          orderBy: { displayOrder: 'asc' },
        },
        tags: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  /**
   * Get related products based on category and tags
   */
  async getRelatedProducts(productId: string, limit: number = 8) {
    const product = await this.findById(productId);

    return this.prisma.product.findMany({
      where: {
        status: ProductStatus.ACTIVE,
        id: {
          not: productId,
        },
        OR: [
          { categoryId: product.categoryId },
          {
            tags: {
              some: {
                name: {
                  in: product.tags.map((t) => t.name),
                },
              },
            },
          },
        ],
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: { displayOrder: 'asc' },
          take: 2,
        },
      },
      take: limit,
      orderBy: { viewCount: 'desc' },
    });
  }

  /**
   * Create new product
   */
  async create(createProductDto: CreateProductDto) {
    const {
      badges,
      seoKeywords,
      colors,
      sizes,
      materials,
      categoryId,
      storeId, // Admin can assign product to a specific store
      purchaseType,
      price,
      inventory,
      sku, // Ignore any provided SKU - always auto-generate
      images, // Extract images to handle separately (not passed to Prisma directly)
      ...productData
    } = createProductDto;

    // ALWAYS auto-generate SKU (custom SKUs not allowed)
    const finalSKU = await this.generateSKU();

    // Set defaults based on purchaseType
    const finalPurchaseType = purchaseType || PurchaseType.INSTANT;

    // For INSTANT products, ensure price and inventory have defaults if not provided
    const finalPrice =
      price !== undefined ? price : finalPurchaseType === PurchaseType.INSTANT ? 0 : null;
    const finalInventory =
      inventory !== undefined ? inventory : finalPurchaseType === PurchaseType.INSTANT ? 0 : null;

    // Validate category exists if provided
    if (categoryId && categoryId.trim() !== '') {
      const categoryExists = await this.prisma.category.findUnique({
        where: { slug: categoryId },
      });

      if (!categoryExists) {
        throw new NotFoundException(`Category with slug "${categoryId}" not found`);
      }
    }

    const product = await this.prisma.product.create({
      data: {
        ...productData,
        sku: finalSKU,
        purchaseType: finalPurchaseType,
        price: finalPrice,
        inventory: finalInventory,
        badges: badges || [],
        seoKeywords: seoKeywords || [],
        colors: colors || [],
        sizes: sizes || [],
        materials: materials || [],
        // Connect store relation if provided (admin assigns to store)
        ...(storeId && {
          store: {
            connect: { id: storeId },
          },
        }),
        // Connect category using relation if provided (by slug)
        ...(categoryId &&
          categoryId.trim() !== '' && {
            category: {
              connect: { slug: categoryId },
            },
          }),
      },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        category: true,
        images: true,
        variants: true,
        tags: true,
      },
    });

    // Auto-index in Meilisearch (async, non-blocking)
    this.indexProductAsync(product.id);

    return product;
  }

  /**
   * Update product
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findById(id); // Check if exists

    const { badges, seoKeywords, colors, sizes, materials, categoryId, storeId, ...productData } =
      updateProductDto;

    const updateData: any = { ...productData };

    if (badges !== undefined) updateData.badges = badges;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (colors !== undefined) updateData.colors = colors;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (materials !== undefined) updateData.materials = materials;

    // Handle store reassignment (admin can move product to different store)
    if (storeId !== undefined) {
      if (storeId) {
        updateData.store = {
          connect: { id: storeId },
        };
      } else {
        // Disconnect store if storeId is null/empty (orphan product)
        updateData.store = {
          disconnect: true,
        };
      }
    }

    // Handle category connection by slug
    if (categoryId !== undefined) {
      // Treat empty strings as falsy to disconnect category
      if (categoryId && categoryId.trim() !== '') {
        // Validate category exists before connecting
        const categoryExists = await this.prisma.category.findUnique({
          where: { slug: categoryId },
        });

        if (!categoryExists) {
          throw new NotFoundException(`Category with slug "${categoryId}" not found`);
        }

        updateData.category = {
          connect: { slug: categoryId },
        };
      } else {
        // Disconnect category if categoryId is null/empty/whitespace
        updateData.category = {
          disconnect: true,
        };
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        store: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
        category: true,
        images: true,
        variants: true,
        tags: true,
      },
    });

    // Auto-re-index in Meilisearch (async, non-blocking)
    this.indexProductAsync(id);

    return product;
  }

  /**
   * Add images to a product
   */
  async addProductImages(productId: string, imageUrls: string[]) {
    await this.findById(productId); // Check if product exists

    // First, delete all existing images for this product (we're replacing them)
    await this.prisma.productImage.deleteMany({
      where: { productId },
    });

    // Create product images - first image is always primary
    const imageRecords = imageUrls.map((url, index) => ({
      productId,
      url,
      alt: `Product image ${index + 1}`,
      width: 800, // Default dimensions
      height: 800,
      displayOrder: index,
      isPrimary: index === 0, // First image is always primary
    }));

    await this.prisma.productImage.createMany({
      data: imageRecords,
    });

    // Update product heroImage to be the first image
    if (imageUrls.length > 0) {
      await this.prisma.product.update({
        where: { id: productId },
        data: { heroImage: imageUrls[0] },
      });
    }

    return this.findById(productId);
  }

  /**
   * Remove product image
   */
  async removeProductImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    await this.prisma.productImage.delete({
      where: { id: imageId },
    });

    // If this was the primary image, make the first remaining image primary
    if (image.isPrimary) {
      const firstImage = await this.prisma.productImage.findFirst({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
      });

      if (firstImage) {
        await this.prisma.productImage.update({
          where: { id: firstImage.id },
          data: { isPrimary: true },
        });
      }
    }

    return this.findById(productId);
  }

  /**
   * Reorder product images
   */
  async reorderProductImages(productId: string, imageOrders: Array<{ id: string; order: number }>) {
    await this.findById(productId); // Check if product exists

    // Update each image's display order
    await Promise.all(
      imageOrders.map((item) =>
        this.prisma.productImage.update({
          where: { id: item.id },
          data: { displayOrder: item.order },
        })
      )
    );

    return this.findById(productId);
  }

  /**
   * Delete product
   */
  async delete(id: string) {
    await this.findById(id); // Check if exists

    const product = await this.prisma.product.delete({
      where: { id },
    });

    // Auto-remove from Meilisearch index (async, non-blocking)
    this.deleteProductFromIndexAsync(id);

    return product;
  }

  /**
   * Upload product image
   */
  async uploadImage(file: Express.Multer.File) {
    if (!file) {
      throw new NotFoundException('No file provided');
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    return {
      url: `/uploads/products/${fileName}`,
      fileName,
    };
  }

  /**
   * Submit product inquiry
   * Sends email notification to admin and returns success status
   */
  async submitInquiry(productId: string, inquiryDto: ProductInquiryDto) {
    // Verify product exists and get product details
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        slug: true,
        purchaseType: true,
        status: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if product is active
    if (product.status !== ProductStatus.ACTIVE) {
      throw new BadRequestException('This product is not available for inquiries');
    }

    // Optional: You can restrict inquiries to INQUIRY type products only
    // Uncomment the following if you want to enforce this:
    // if (product.purchaseType !== PurchaseType.INQUIRY) {
    //   throw new BadRequestException('This product does not accept inquiries');
    // }

    // Get admin email from environment or use default
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@nextpik.com';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Send email notification
    const emailSent = await this.emailService.sendProductInquiry(adminEmail, {
      customerName: inquiryDto.name,
      customerEmail: inquiryDto.email,
      customerPhone: inquiryDto.phone,
      productName: product.name,
      productUrl: `${frontendUrl}/products/${product.slug}`,
      message: inquiryDto.message,
    });

    // You could optionally store the inquiry in the database here
    // For now, we'll just rely on email notifications

    return {
      success: true,
      message: 'Your inquiry has been submitted successfully. We will contact you soon.',
      emailSent,
    };
  }

  // ==================== PRODUCT VARIANT METHODS ====================

  /**
   * Transform variant Decimal values to numbers
   */
  private transformVariant(variant: any) {
    return {
      ...variant,
      price: Number(variant.price),
      compareAtPrice: variant.compareAtPrice ? Number(variant.compareAtPrice) : null,
    };
  }

  private transformVariants(variants: any[]) {
    return variants.map((v) => this.transformVariant(v));
  }

  /**
   * Get all variants for a product
   */
  async getProductVariants(productId: string) {
    const variants = await this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { displayOrder: 'asc' },
    });

    return this.transformVariants(variants);
  }

  /**
   * Get next display order for variant
   */
  private async getNextVariantDisplayOrder(productId: string): Promise<number> {
    const lastVariant = await this.prisma.productVariant.findFirst({
      where: { productId },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });

    return lastVariant ? lastVariant.displayOrder + 1 : 0;
  }

  /**
   * Create a new product variant
   */
  async createVariant(productId: string, dto: any) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, storeId: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // ALWAYS auto-generate SKU (custom SKUs not allowed)
    const generatedSKU = await this.generateVariantSKU();

    // Determine display order
    const displayOrder = dto.displayOrder ?? (await this.getNextVariantDisplayOrder(productId));

    // Create variant
    const variant = await this.prisma.productVariant.create({
      data: {
        productId,
        name: dto.name,
        sku: generatedSKU, // Always use auto-generated SKU
        price: dto.price ?? product.price, // Inherit if not set
        compareAtPrice: dto.compareAtPrice,
        inventory: dto.inventory,
        options: dto.attributes,
        image: dto.image,
        colorHex: dto.colorHex,
        colorName: dto.colorName ?? dto.attributes?.color,
        sizeChart: dto.sizeChart,
        isAvailable: dto.isAvailable ?? true,
        lowStockThreshold: dto.lowStockThreshold ?? 5,
        displayOrder,
      },
    });

    // Create inventory transaction
    if (dto.inventory > 0) {
      await this.prisma.inventoryTransaction.create({
        data: {
          productId,
          variantId: variant.id,
          type: 'RESTOCK',
          quantity: dto.inventory,
          previousQuantity: 0,
          newQuantity: dto.inventory,
          reason: 'Initial stock for variant',
        },
      });
    }

    return this.transformVariant(variant);
  }

  /**
   * Create multiple variants in bulk
   * SKUs are auto-generated for all variants
   */
  async bulkCreateVariants(productId: string, dtos: any[]) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, storeId: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get starting display order
    let displayOrder = await this.getNextVariantDisplayOrder(productId);

    // Create all variants in a transaction
    const variants = await this.prisma.$transaction(async (prisma) => {
      const created = [];

      for (const dto of dtos) {
        // Auto-generate SKU for each variant
        const generatedSKU = await this.generateVariantSKU();

        const variant = await prisma.productVariant.create({
          data: {
            productId,
            name: dto.name,
            sku: generatedSKU, // Always use auto-generated SKU
            price: dto.price ?? product.price,
            compareAtPrice: dto.compareAtPrice,
            inventory: dto.inventory,
            options: dto.attributes,
            image: dto.image,
            colorHex: dto.colorHex,
            colorName: dto.colorName ?? dto.attributes?.color,
            sizeChart: dto.sizeChart,
            isAvailable: dto.isAvailable ?? true,
            lowStockThreshold: dto.lowStockThreshold ?? 5,
            displayOrder: dto.displayOrder ?? displayOrder++,
          },
        });

        // Create inventory transaction
        if (dto.inventory > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              productId,
              variantId: variant.id,
              type: 'RESTOCK',
              quantity: dto.inventory,
              previousQuantity: 0,
              newQuantity: dto.inventory,
              reason: 'Bulk variant creation',
            },
          });
        }

        created.push(variant);
      }

      return created;
    });

    return this.transformVariants(variants);
  }

  /**
   * Update a product variant
   * Note: SKU cannot be updated as it's system-generated and read-only
   */
  async updateVariant(variantId: string, dto: any) {
    // Get existing variant
    const existing = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { storeId: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Variant not found');
    }

    // SKU is read-only - ignore any provided SKU value
    if (dto.sku !== undefined) {
      this.logger.warn(
        `Attempt to update variant SKU ignored - SKU is system-generated and read-only`
      );
    }

    // Track inventory change
    const inventoryChanged = dto.inventory !== undefined && dto.inventory !== existing.inventory;
    const previousInventory = existing.inventory;
    const newInventory = dto.inventory ?? existing.inventory;

    // Update variant - only include fields that are provided in DTO (undefined means skip)
    // SKU is NEVER included in updates
    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    // SKU is read-only - never update it
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.compareAtPrice !== undefined) updateData.compareAtPrice = dto.compareAtPrice;
    if (dto.inventory !== undefined) updateData.inventory = dto.inventory;
    if (inventoryChanged) updateData.previousStock = previousInventory;
    if (dto.attributes !== undefined) updateData.options = dto.attributes;
    // Image: undefined = skip, null = clear, string = set
    if (dto.image !== undefined) updateData.image = dto.image;
    if (dto.colorHex !== undefined) updateData.colorHex = dto.colorHex;
    if (dto.colorName !== undefined) updateData.colorName = dto.colorName;
    if (dto.sizeChart !== undefined) updateData.sizeChart = dto.sizeChart;
    if (dto.isAvailable !== undefined) updateData.isAvailable = dto.isAvailable;
    if (dto.lowStockThreshold !== undefined) updateData.lowStockThreshold = dto.lowStockThreshold;
    if (dto.displayOrder !== undefined) updateData.displayOrder = dto.displayOrder;

    const updated = await this.prisma.productVariant.update({
      where: { id: variantId },
      data: updateData,
    });

    // Create inventory transaction if inventory changed
    if (inventoryChanged) {
      const quantityDiff = newInventory - previousInventory;
      await this.prisma.inventoryTransaction.create({
        data: {
          productId: existing.productId,
          variantId: variantId,
          type: quantityDiff > 0 ? 'RESTOCK' : 'ADJUSTMENT',
          quantity: Math.abs(quantityDiff),
          previousQuantity: previousInventory,
          newQuantity: newInventory,
          reason: 'Variant inventory update',
        },
      });
    }

    return this.transformVariant(updated);
  }

  /**
   * Delete a product variant
   */
  async deleteVariant(variantId: string) {
    // Get existing variant
    const existing = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      select: {
        id: true,
        productId: true,
        _count: {
          select: {
            cartItems: true,
            orderItems: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Variant not found');
    }

    // Check if variant is referenced in orders or carts
    if (existing._count.orderItems > 0) {
      throw new BadRequestException(
        'Cannot delete variant that has been ordered. Consider marking it as unavailable instead.'
      );
    }

    if (existing._count.cartItems > 0) {
      throw new BadRequestException(
        'Cannot delete variant that is in customer carts. Remove from carts first or mark as unavailable.'
      );
    }

    // Delete variant
    await this.prisma.productVariant.delete({
      where: { id: variantId },
    });

    return { success: true, message: 'Variant deleted successfully' };
  }

  /**
   * Update variant display order (for drag-and-drop reordering)
   */
  async reorderVariants(productId: string, variantOrders: Array<{ id: string; order: number }>) {
    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Update all variant orders in a transaction
    await this.prisma.$transaction(
      variantOrders.map(({ id, order }) =>
        this.prisma.productVariant.update({
          where: { id, productId }, // Ensure variant belongs to this product
          data: { displayOrder: order },
        })
      )
    );

    return { success: true, message: 'Variants reordered successfully' };
  }

  /**
   * Get variant by ID with product details
   */
  async getVariantById(variantId: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            storeId: true,
          },
        },
      },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    return this.transformVariant(variant);
  }

  // ==================== BULK OPERATIONS ====================

  /**
   * Bulk delete products (Admin only)
   * @param ids - Array of product IDs to delete
   */
  async bulkDeleteProducts(
    ids: string[]
  ): Promise<{ success: boolean; deleted: number; failed: string[] }> {
    const failed: string[] = [];
    let deleted = 0;

    for (const id of ids) {
      try {
        await this.delete(id);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete product ${id}:`, error);
        failed.push(id);
      }
    }

    return {
      success: failed.length === 0,
      deleted,
      failed,
    };
  }

  /**
   * Bulk update product status (Admin only)
   * @param ids - Array of product IDs to update
   * @param status - New status to apply
   */
  async bulkUpdateStatus(
    ids: string[],
    status: ProductStatus
  ): Promise<{ success: boolean; updated: number; failed: string[] }> {
    const failed: string[] = [];
    let updated = 0;

    for (const id of ids) {
      try {
        await this.update(id, { status });
        updated++;
      } catch (error) {
        console.error(`Failed to update product ${id}:`, error);
        failed.push(id);
      }
    }

    return {
      success: failed.length === 0,
      updated,
      failed,
    };
  }

  // ==================== MEILISEARCH AUTO-INDEXING ====================

  /**
   * Index product in Meilisearch (async, non-blocking)
   * Called after product creation or update to keep search index in sync
   */
  private indexProductAsync(productId: string): void {
    this.searchService.indexProduct(productId).catch((error) => {
      this.logger.error(`Failed to index product ${productId} in Meilisearch: ${error.message}`);
    });
  }

  /**
   * Remove product from Meilisearch index (async, non-blocking)
   * Called after product deletion to keep search index in sync
   */
  private deleteProductFromIndexAsync(productId: string): void {
    this.searchService.deleteProduct(productId).catch((error) => {
      this.logger.error(`Failed to delete product ${productId} from Meilisearch: ${error.message}`);
    });
  }
}
