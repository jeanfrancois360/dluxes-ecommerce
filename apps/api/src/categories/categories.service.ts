import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

/**
 * Categories Service
 * Handles all business logic for category operations
 */
@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all categories with hierarchical structure
   */
  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        children: {
          include: {
            children: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        parent: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      where: {
        parentId: null, // Get top-level categories
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories;
  }

  /**
   * Get all categories (flat list)
   */
  async findAllFlat() {
    return this.prisma.category.findMany({
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string) {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: {
                products: true,
              },
            },
          },
          orderBy: { displayOrder: 'asc' },
        },
        products: {
          where: {
            status: 'ACTIVE',
          },
          include: {
            images: {
              orderBy: { displayOrder: 'asc' },
              take: 2,
            },
          },
          take: 12,
          orderBy: { displayOrder: 'asc' },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Find category by ID
   */
  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  /**
   * Create new category
   */
  async create(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: createCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Update category
   */
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    await this.findById(id); // Check if exists

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        parent: true,
        children: true,
      },
    });
  }

  /**
   * Delete category
   */
  async delete(id: string) {
    await this.findById(id); // Check if exists

    // Check if category has children
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
      },
    });

    if (category._count.children > 0) {
      throw new Error(
        'Cannot delete category with subcategories. Please delete or reassign subcategories first.'
      );
    }

    if (category._count.products > 0) {
      throw new Error(
        'Cannot delete category with products. Please delete or reassign products first.'
      );
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
