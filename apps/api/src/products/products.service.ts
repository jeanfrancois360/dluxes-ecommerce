import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Transform Decimal values to numbers for JSON serialization
   */
  private transformProduct(product: any) {
    return {
      ...product,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
    };
  }

  private transformProducts(products: any[]) {
    return products.map(p => this.transformProduct(p));
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
      status = ProductStatus.ACTIVE,
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

    const where: Prisma.ProductWhereInput = {
      status,
    };

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
      },
    });

    if (!product) {
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
    const { badges, seoKeywords, colors, sizes, materials, categoryId, purchaseType, price, inventory, ...productData } =
      createProductDto;

    // Set defaults based on purchaseType
    const finalPurchaseType = purchaseType || PurchaseType.INSTANT;

    // For INSTANT products, ensure price and inventory have defaults if not provided
    const finalPrice = price !== undefined ? price : (finalPurchaseType === PurchaseType.INSTANT ? 0 : null);
    const finalInventory = inventory !== undefined ? inventory : (finalPurchaseType === PurchaseType.INSTANT ? 0 : null);

    return this.prisma.product.create({
      data: {
        ...productData,
        purchaseType: finalPurchaseType,
        price: finalPrice,
        inventory: finalInventory,
        badges: badges || [],
        seoKeywords: seoKeywords || [],
        colors: colors || [],
        sizes: sizes || [],
        materials: materials || [],
        // Connect category using relation if provided
        ...(categoryId && {
          category: {
            connect: { id: categoryId },
          },
        }),
      },
      include: {
        category: true,
        images: true,
        variants: true,
        tags: true,
      },
    });
  }

  /**
   * Update product
   */
  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findById(id); // Check if exists

    const { badges, seoKeywords, colors, sizes, materials, ...productData } =
      updateProductDto;

    const updateData: any = { ...productData };

    if (badges !== undefined) updateData.badges = badges;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (colors !== undefined) updateData.colors = colors;
    if (sizes !== undefined) updateData.sizes = sizes;
    if (materials !== undefined) updateData.materials = materials;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        images: true,
        variants: true,
        tags: true,
      },
    });
  }

  /**
   * Delete product
   */
  async delete(id: string) {
    await this.findById(id); // Check if exists

    return this.prisma.product.delete({
      where: { id },
    });
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
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@luxury-ecommerce.com';
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
}
