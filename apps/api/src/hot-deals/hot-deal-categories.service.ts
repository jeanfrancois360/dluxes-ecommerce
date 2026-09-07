import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateHotDealCategoryDto, UpdateHotDealCategoryDto } from './dto/hot-deal-category.dto';

@Injectable()
export class HotDealCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** All categories (admin) — includes inactive */
  async findAll() {
    return this.prisma.hotDealCategoryConfig.findMany({
      orderBy: { displayOrder: 'asc' },
      include: { _count: { select: { hotDeals: true } } },
    });
  }

  /** Active categories only (public) */
  async findActive() {
    return this.prisma.hotDealCategoryConfig.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    const cat = await this.prisma.hotDealCategoryConfig.findUnique({
      where: { slug },
      include: { _count: { select: { hotDeals: true } } },
    });
    if (!cat) throw new NotFoundException(`Category "${slug}" not found`);
    return cat;
  }

  async create(dto: CreateHotDealCategoryDto) {
    const existing = await this.prisma.hotDealCategoryConfig.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException(`Category slug "${dto.slug}" already exists`);
    }

    // Auto-assign displayOrder if not provided
    if (dto.displayOrder === undefined) {
      const maxOrder = await this.prisma.hotDealCategoryConfig.aggregate({
        _max: { displayOrder: true },
      });
      dto.displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
    }

    return this.prisma.hotDealCategoryConfig.create({
      data: {
        slug: dto.slug,
        label: dto.label,
        icon: dto.icon ?? 'MoreHorizontal',
        color: dto.color ?? 'gray',
        displayOrder: dto.displayOrder,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(slug: string, dto: UpdateHotDealCategoryDto) {
    await this.findBySlug(slug);
    return this.prisma.hotDealCategoryConfig.update({
      where: { slug },
      data: dto,
    });
  }

  async delete(slug: string) {
    const cat = await this.findBySlug(slug);
    if ((cat as any)._count?.hotDeals > 0) {
      throw new BadRequestException(
        `Cannot delete category "${slug}" — it has ${(cat as any)._count.hotDeals} hot deals. Deactivate it instead.`
      );
    }
    return this.prisma.hotDealCategoryConfig.delete({ where: { slug } });
  }

  /** Bulk reorder — accepts ordered array of slugs */
  async reorder(slugs: string[]) {
    await this.prisma.$transaction(
      slugs.map((slug, index) =>
        this.prisma.hotDealCategoryConfig.update({
          where: { slug },
          data: { displayOrder: index },
        })
      )
    );
    return this.findAll();
  }
}
