import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, BlogPostStatus, TranslationStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import {
  CreatePostDto,
  UpdatePostDto,
  ListPostsQueryDto,
  AdminListPostsQueryDto,
  AttachProductsDto,
  ReorderProductsDto,
  UpsertTranslationDto,
  UpdateTranslationDto,
} from './dto/blog.dto';

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  async listPublishedPosts(query: ListPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: Prisma.BlogPostWhereInput = {
      status: BlogPostStatus.PUBLISHED,
      publishedAt: { lte: now },
      deletedAt: null,
      ...(query.tag && { tags: { has: query.tag } }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          translations: query.locale
            ? { where: { locale: query.locale } }
            : { where: { isOriginal: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPublishedPostBySlug(slug: string, locale?: string) {
    const now = new Date();
    const post = await this.prisma.blogPost.findFirst({
      where: {
        slug,
        status: BlogPostStatus.PUBLISHED,
        publishedAt: { lte: now },
        deletedAt: null,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: locale ? { where: { locale } } : { where: { isOriginal: true } },
        featuredProducts: {
          where: { affiliateProduct: { isActive: true, deletedAt: null } },
          orderBy: { position: 'asc' },
          include: {
            affiliateProduct: {
              include: {
                advertiser: { select: { id: true, name: true, logoUrl: true } },
                translations: locale ? { where: { locale } } : { where: { isOriginal: true } },
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog post '${slug}' not found`);
    }

    return post;
  }

  // ============================================================================
  // ADMIN METHODS — POSTS
  // ============================================================================

  async createPost(dto: CreatePostDto, authorId: string) {
    const post = await this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        coverImageUrl: dto.coverImageUrl,
        tags: dto.tags ?? [],
        status: BlogPostStatus.DRAFT,
        authorId,
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: true,
      },
    });

    this.logger.log(`Created blog post: ${post.id} slug=${post.slug}`);
    return post;
  }

  async adminListPosts(query: AdminListPostsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.BlogPostWhereInput = {
      ...(!query.includeDeleted && { deletedAt: null }),
      ...(query.status && { status: query.status }),
      ...(query.tag && { tags: { has: query.tag } }),
    };

    const [posts, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: {
          author: { select: { id: true, firstName: true, lastName: true } },
          translations: true,
          _count: { select: { translations: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return {
      data: posts,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async adminGetPost(id: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { id, deletedAt: null },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: { orderBy: { locale: 'asc' } },
      },
    });

    if (!post) {
      throw new NotFoundException(`Blog post '${id}' not found`);
    }

    return post;
  }

  async updatePost(id: string, dto: UpdatePostDto) {
    await this.adminGetPost(id);

    const post = await this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.coverImageUrl !== undefined && { coverImageUrl: dto.coverImageUrl }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: true,
      },
    });

    this.logger.log(`Updated blog post: ${id}`);
    return post;
  }

  async softDeletePost(id: string) {
    await this.adminGetPost(id);
    await this.prisma.blogPost.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Soft-deleted blog post: ${id}`);
  }

  async publishPost(id: string) {
    const post = await this.adminGetPost(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      data: {
        status: BlogPostStatus.PUBLISHED,
        // Only stamp publishedAt if it has never been set — preserve original publish date
        publishedAt: post.publishedAt ?? new Date(),
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: true,
      },
    });
    this.logger.log(`Published blog post: ${id}`);
    return updated;
  }

  async unpublishPost(id: string) {
    await this.adminGetPost(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      // Status → DRAFT; publishedAt intentionally NOT cleared (preserve original)
      data: { status: BlogPostStatus.DRAFT },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: true,
      },
    });
    this.logger.log(`Unpublished blog post: ${id}`);
    return updated;
  }

  async archivePost(id: string) {
    await this.adminGetPost(id);
    const updated = await this.prisma.blogPost.update({
      where: { id },
      // Status → ARCHIVED; publishedAt intentionally NOT cleared
      data: { status: BlogPostStatus.ARCHIVED },
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        translations: true,
      },
    });
    this.logger.log(`Archived blog post: ${id}`);
    return updated;
  }

  // ============================================================================
  // ADMIN METHODS — FEATURED PRODUCTS
  // ============================================================================

  /**
   * Returns a helper include block for resolving affiliate products in the
   * featured-products context (mirrors the public affiliate endpoint shape).
   */
  private featuredProductInclude(locale?: string) {
    return {
      affiliateProduct: {
        include: {
          advertiser: { select: { id: true, name: true, logoUrl: true } },
          translations: locale ? { where: { locale } } : { where: { isOriginal: true } },
        },
      },
    };
  }

  async getFeaturedProducts(postId: string) {
    await this.adminGetPost(postId);
    return this.prisma.blogPostProduct.findMany({
      where: { blogPostId: postId },
      orderBy: { position: 'asc' },
      include: this.featuredProductInclude(),
    });
  }

  async attachProducts(postId: string, dto: AttachProductsDto) {
    await this.adminGetPost(postId);

    // Validate every requested product exists and is active — REJECT the whole
    // call if any id is invalid or inactive, naming the offending id clearly.
    for (const productId of dto.productIds) {
      const product = await this.prisma.affiliateProduct.findFirst({
        where: { id: productId, isActive: true, deletedAt: null },
      });
      if (!product) {
        throw new BadRequestException(
          `Affiliate product '${productId}' not found or is not active`
        );
      }
    }

    // Determine current max position so appended products follow existing ones
    const existing = await this.prisma.blogPostProduct.findMany({
      where: { blogPostId: postId },
      orderBy: { position: 'desc' },
      take: 1,
    });
    let nextPosition = existing.length > 0 ? existing[0].position + 1 : 0;

    // Upsert each join row — @@unique([blogPostId, affiliateProductId]) means
    // an already-attached product is a no-op (update with its current position).
    for (const productId of dto.productIds) {
      const alreadyAttached = await this.prisma.blogPostProduct.findUnique({
        where: {
          blogPostId_affiliateProductId: { blogPostId: postId, affiliateProductId: productId },
        },
      });
      if (!alreadyAttached) {
        await this.prisma.blogPostProduct.create({
          data: { blogPostId: postId, affiliateProductId: productId, position: nextPosition++ },
        });
      }
    }

    this.logger.log(`Attached ${dto.productIds.length} product(s) to post ${postId}`);
    return this.getFeaturedProducts(postId);
  }

  async detachProduct(postId: string, productId: string) {
    await this.adminGetPost(postId);
    // No-op if the join row does not exist
    await this.prisma.blogPostProduct.deleteMany({
      where: { blogPostId: postId, affiliateProductId: productId },
    });
    this.logger.log(`Detached product ${productId} from post ${postId}`);
    return this.getFeaturedProducts(postId);
  }

  async reorderProducts(postId: string, dto: ReorderProductsDto) {
    await this.adminGetPost(postId);

    // Validate that every provided id is currently attached to this post
    for (const productId of dto.productIds) {
      const join = await this.prisma.blogPostProduct.findUnique({
        where: {
          blogPostId_affiliateProductId: { blogPostId: postId, affiliateProductId: productId },
        },
      });
      if (!join) {
        throw new BadRequestException(`Product '${productId}' is not attached to post '${postId}'`);
      }
    }

    // Set each join row's position to its index in the provided array
    await this.prisma.$transaction(
      dto.productIds.map((productId, index) =>
        this.prisma.blogPostProduct.update({
          where: {
            blogPostId_affiliateProductId: { blogPostId: postId, affiliateProductId: productId },
          },
          data: { position: index },
        })
      )
    );

    this.logger.log(`Reordered ${dto.productIds.length} product(s) on post ${postId}`);
    return this.getFeaturedProducts(postId);
  }

  // ============================================================================
  // ADMIN METHODS — TRANSLATIONS
  // ============================================================================

  async listTranslations(postId: string) {
    await this.adminGetPost(postId);
    return this.prisma.blogPostTranslation.findMany({
      where: { blogPostId: postId },
      orderBy: { locale: 'asc' },
    });
  }

  async upsertTranslation(postId: string, dto: UpsertTranslationDto, reviewerId?: string) {
    await this.adminGetPost(postId);

    const translation = await this.prisma.blogPostTranslation.upsert({
      where: {
        blogPostId_locale: { blogPostId: postId, locale: dto.locale },
      },
      create: {
        blogPostId: postId,
        locale: dto.locale,
        title: dto.title,
        body: dto.body,
        excerpt: dto.excerpt,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        translationStatus: dto.translationStatus ?? TranslationStatus.ORIGINAL,
        isOriginal: dto.isOriginal ?? false,
        reviewedById: reviewerId ?? null,
        reviewedAt: reviewerId ? new Date() : null,
      },
      update: {
        title: dto.title,
        body: dto.body,
        excerpt: dto.excerpt,
        seoTitle: dto.seoTitle,
        seoDescription: dto.seoDescription,
        translationStatus: dto.translationStatus,
        isOriginal: dto.isOriginal,
        ...(reviewerId && { reviewedById: reviewerId, reviewedAt: new Date() }),
      },
    });

    this.logger.log(`Upserted translation locale=${dto.locale} for post=${postId}`);
    return translation;
  }

  async updateTranslation(
    postId: string,
    locale: string,
    dto: UpdateTranslationDto,
    reviewerId?: string
  ) {
    const existing = await this.prisma.blogPostTranslation.findUnique({
      where: { blogPostId_locale: { blogPostId: postId, locale } },
    });

    if (!existing) {
      throw new NotFoundException(`Translation for locale '${locale}' not found on post ${postId}`);
    }

    const translation = await this.prisma.blogPostTranslation.update({
      where: { blogPostId_locale: { blogPostId: postId, locale } },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.body !== undefined && { body: dto.body }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.translationStatus !== undefined && { translationStatus: dto.translationStatus }),
        ...(dto.isOriginal !== undefined && { isOriginal: dto.isOriginal }),
        ...(reviewerId && { reviewedById: reviewerId, reviewedAt: new Date() }),
      },
    });

    this.logger.log(`Updated translation locale=${locale} for post=${postId}`);
    return translation;
  }
}
