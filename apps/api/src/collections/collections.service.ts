import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';

/**
 * Collections Service
 * Handles all business logic for collection operations
 */
@Injectable()
export class CollectionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all collections
   */
  async findAll() {
    return this.prisma.collection.findMany({
      include: {
        products: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
          take: 8,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Get featured collections
   */
  async getFeatured() {
    return this.prisma.collection.findMany({
      where: {
        isFeatured: true,
        isActive: true,
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
          take: 8,
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  /**
   * Find collection by slug
   */
  async findBySlug(slug: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: { displayOrder: 'asc' },
                  take: 2,
                },
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  /**
   * Find collection by ID
   */
  async findById(id: string) {
    const collection = await this.prisma.collection.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!collection) {
      throw new NotFoundException('Collection not found');
    }

    return collection;
  }

  /**
   * Create new collection
   */
  async create(createCollectionDto: CreateCollectionDto) {
    const { startDate, endDate, ...data } = createCollectionDto;

    return this.prisma.collection.create({
      data: {
        ...data,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  /**
   * Update collection
   */
  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    await this.findById(id); // Check if exists

    const { startDate, endDate, ...data } = updateCollectionDto;

    const updateData: any = { ...data };

    if (startDate !== undefined) {
      updateData.startDate = startDate ? new Date(startDate) : null;
    }
    if (endDate !== undefined) {
      updateData.endDate = endDate ? new Date(endDate) : null;
    }

    return this.prisma.collection.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });
  }

  /**
   * Delete collection
   */
  async delete(id: string) {
    await this.findById(id); // Check if exists

    return this.prisma.collection.delete({
      where: { id },
    });
  }
}
