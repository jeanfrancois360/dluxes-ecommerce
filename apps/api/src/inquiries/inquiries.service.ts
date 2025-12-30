import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateInquiryDto } from './dto/create-inquiry.dto';
import { UpdateInquiryStatusDto } from './dto/update-inquiry-status.dto';
import { InquiryQueryDto } from './dto/inquiry-query.dto';
import { InquiryStatus, Prisma } from '@prisma/client';

@Injectable()
export class InquiriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Create a new inquiry for a product
   * Can be submitted by guests or logged-in users
   */
  async create(dto: CreateInquiryDto, userId?: string) {
    // Get product with store and seller info
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      include: {
        store: {
          include: {
            user: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
        images: { take: 1, select: { url: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Get seller ID from store or product
    const sellerId = product.store?.userId;
    if (!sellerId) {
      throw new NotFoundException('Seller not found for this product');
    }

    // Create the inquiry
    const inquiry = await this.prisma.productInquiry.create({
      data: {
        productId: dto.productId,
        sellerId,
        storeId: product.storeId,
        userId: userId || null,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        message: dto.message,
        preferredContact: dto.preferredContact,
        preferredTime: dto.preferredTime,
        scheduledViewing: dto.scheduledViewing
          ? new Date(dto.scheduledViewing)
          : null,
        preApproved: dto.preApproved || false,
        scheduledTestDrive: dto.scheduledTestDrive
          ? new Date(dto.scheduledTestDrive)
          : null,
        tradeInInterest: dto.tradeInInterest || false,
        status: InquiryStatus.NEW,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
          },
        },
      },
    });

    // Send email notification to seller
    try {
      const sellerEmail = product.store?.user?.email;
      if (sellerEmail) {
        // Build enhanced message with inquiry details
        let enhancedMessage = dto.message;

        // Add real estate specific info
        if (dto.scheduledViewing) {
          enhancedMessage += `\n\nRequested Viewing Date: ${new Date(dto.scheduledViewing).toLocaleDateString()}`;
        }
        if (dto.preApproved) {
          enhancedMessage += '\n\nBuyer is pre-approved for mortgage.';
        }

        // Add vehicle specific info
        if (dto.scheduledTestDrive) {
          enhancedMessage += `\n\nRequested Test Drive Date: ${new Date(dto.scheduledTestDrive).toLocaleDateString()}`;
        }
        if (dto.tradeInInterest) {
          enhancedMessage += '\n\nBuyer has a vehicle to trade in.';
        }

        // Add contact preferences
        if (dto.preferredContact) {
          enhancedMessage += `\n\nPreferred Contact Method: ${dto.preferredContact}`;
        }
        if (dto.preferredTime) {
          enhancedMessage += `\nPreferred Contact Time: ${dto.preferredTime}`;
        }

        await this.emailService.sendProductInquiry(sellerEmail, {
          customerName: dto.buyerName,
          customerEmail: dto.buyerEmail,
          customerPhone: dto.buyerPhone,
          productName: product.name,
          productUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/products/${product.slug}`,
          message: enhancedMessage,
        });
      }
    } catch (emailError) {
      // Log but don't fail the inquiry creation
      console.error('Failed to send inquiry notification email:', emailError);
    }

    return {
      success: true,
      message:
        'Your inquiry has been sent successfully. The seller will contact you soon.',
      data: {
        id: inquiry.id,
        productName: product.name,
        status: inquiry.status,
      },
    };
  }

  /**
   * Get all inquiries for a seller with pagination and filtering
   */
  async getSellerInquiries(sellerId: string, query: InquiryQueryDto) {
    const { status, page = 1, limit = 20 } = query;

    const where: Prisma.ProductInquiryWhereInput = {
      sellerId,
    };

    if (status) {
      where.status = status;
    }

    const [inquiries, total] = await Promise.all([
      this.prisma.productInquiry.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              productType: true,
              heroImage: true,
              images: { take: 1, select: { url: true } },
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.productInquiry.count({ where }),
    ]);

    return {
      success: true,
      data: {
        inquiries,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get inquiry statistics for a seller
   */
  async getSellerStats(sellerId: string) {
    const [total, newCount, contactedCount, scheduledCount, convertedCount] =
      await Promise.all([
        this.prisma.productInquiry.count({ where: { sellerId } }),
        this.prisma.productInquiry.count({
          where: { sellerId, status: InquiryStatus.NEW },
        }),
        this.prisma.productInquiry.count({
          where: { sellerId, status: InquiryStatus.CONTACTED },
        }),
        this.prisma.productInquiry.count({
          where: {
            sellerId,
            status: {
              in: [
                InquiryStatus.VIEWING_SCHEDULED,
                InquiryStatus.TEST_DRIVE_SCHEDULED,
              ],
            },
          },
        }),
        this.prisma.productInquiry.count({
          where: { sellerId, status: InquiryStatus.CONVERTED },
        }),
      ]);

    return {
      success: true,
      data: {
        total,
        new: newCount,
        contacted: contactedCount,
        scheduled: scheduledCount,
        converted: convertedCount,
      },
    };
  }

  /**
   * Get a single inquiry by ID
   */
  async getById(id: string, sellerId: string) {
    const inquiry = await this.prisma.productInquiry.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
            price: true,
            heroImage: true,
            images: { take: 3, select: { url: true } },
            // Real estate fields
            propertyType: true,
            bedrooms: true,
            bathrooms: true,
            squareFeet: true,
            propertyCity: true,
            propertyState: true,
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    // Verify the seller owns this inquiry
    if (inquiry.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have access to this inquiry');
    }

    // Transform Decimal fields
    const transformedInquiry = {
      ...inquiry,
      product: inquiry.product
        ? {
            ...inquiry.product,
            price: inquiry.product.price
              ? Number(inquiry.product.price)
              : null,
            bathrooms: inquiry.product.bathrooms
              ? Number(inquiry.product.bathrooms)
              : null,
            squareFeet: inquiry.product.squareFeet
              ? Number(inquiry.product.squareFeet)
              : null,
          }
        : null,
    };

    return {
      success: true,
      data: transformedInquiry,
    };
  }

  /**
   * Update inquiry status
   */
  async updateStatus(id: string, sellerId: string, dto: UpdateInquiryStatusDto) {
    // Verify ownership
    const inquiry = await this.prisma.productInquiry.findUnique({
      where: { id },
      select: { sellerId: true, respondedAt: true },
    });

    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }

    if (inquiry.sellerId !== sellerId) {
      throw new ForbiddenException('You do not have access to this inquiry');
    }

    const updatedInquiry = await this.prisma.productInquiry.update({
      where: { id },
      data: {
        status: dto.status,
        sellerNotes: dto.sellerNotes,
        respondedAt:
          dto.status !== InquiryStatus.NEW && !inquiry.respondedAt
            ? new Date()
            : undefined,
      },
      include: {
        product: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return {
      success: true,
      message: 'Inquiry status updated successfully',
      data: updatedInquiry,
    };
  }

  /**
   * Get buyer's own inquiries
   */
  async getBuyerInquiries(userId: string) {
    const inquiries = await this.prisma.productInquiry.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            productType: true,
            heroImage: true,
            images: { take: 1, select: { url: true } },
          },
        },
        store: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: inquiries,
    };
  }
}
