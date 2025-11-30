import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

interface UpdateVisibilityDto {
  showInNavbar?: boolean;
  showInTopBar?: boolean;
  showInSidebar?: boolean;
  showInFooter?: boolean;
  showOnHomepage?: boolean;
  isFeatured?: boolean;
}

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

  /**
   * Get categories for navbar
   */
  async findNavCategories() {
    return this.prisma.category.findMany({
      where: { showInNavbar: true },
      include: {
        children: {
          where: { showInNavbar: true },
          orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
        },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get categories for footer
   */
  async findFooterCategories() {
    return this.prisma.category.findMany({
      where: { showInFooter: true },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get categories for homepage
   */
  async findHomepageCategories() {
    return this.prisma.category.findMany({
      where: { showOnHomepage: true },
      include: {
        products: {
          where: { status: 'ACTIVE' },
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            images: { take: 1, orderBy: { displayOrder: 'asc' } },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Get featured categories
   */
  async findFeatured() {
    return this.prisma.category.findMany({
      where: { isFeatured: true },
      include: {
        _count: { select: { products: true } },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  /**
   * Update category visibility settings
   */
  async updateVisibility(id: string, dto: UpdateVisibilityDto) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Reorder categories
   */
  async reorder(categoryIds: string[]) {
    const updates = categoryIds.map((id, index) =>
      this.prisma.category.update({
        where: { id },
        data: { priority: categoryIds.length - index },
      })
    );

    await this.prisma.$transaction(updates);
    return this.findAll();
  }

  /**
   * Get categories for top category bar
   */
  async findTopBarCategories() {
    return this.prisma.category.findMany({
      where: {
        showInTopBar: true,
        isActive: true,
      },
      include: {
        children: {
          where: {
            showInTopBar: true,
            isActive: true,
          },
          orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }],
          select: {
            id: true,
            name: true,
            slug: true,
            icon: true,
            isFeatured: true,
          },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  /**
   * Get categories for products page sidebar
   */
  async findSidebarCategories() {
    return this.prisma.category.findMany({
      where: {
        showInSidebar: true,
        isActive: true,
        parentId: null, // Only top-level categories for sidebar
      },
      include: {
        children: {
          where: {
            showInSidebar: true,
            isActive: true,
          },
          orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }],
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { displayOrder: 'asc' }],
    });
  }

  /**
   * Bulk update categories visibility
   */
  async bulkUpdateVisibility(updates: Array<{ id: string; visibility: UpdateVisibilityDto }>) {
    const transactions = updates.map(({ id, visibility }) =>
      this.prisma.category.update({
        where: { id },
        data: visibility,
      })
    );

    await this.prisma.$transaction(transactions);
    return this.findAll();
  }

  /**
   * Update category priority/display order
   */
  async updatePriority(id: string, priority: number) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: { priority },
      include: {
        parent: true,
        children: true,
      },
    });
  }
}
