import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreatePostDto,
  UpdatePostDto,
  ListPostsQueryDto,
  AdminListPostsQueryDto,
  AttachProductsDto,
  ReorderProductsDto,
  UpsertTranslationDto,
  UpdateTranslationDto,
  CreateCommentDto,
} from './dto/blog.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

/**
 * Blog Controller (Phase C.7)
 * Public endpoints: list/get published posts
 * Admin endpoints: full CRUD on posts, lifecycle transitions, translations
 */
@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  /**
   * GET /blog/posts
   * List published posts (public — no auth)
   */
  @Get('posts')
  async listPosts(@Query() query: ListPostsQueryDto) {
    const result = await this.blogService.listPublishedPosts(query);
    return { success: true, data: result };
  }

  /**
   * GET /blog/posts/:slug
   * Get a single published post by slug (public — no auth)
   */
  @Get('posts/:slug')
  async getPostBySlug(@Param('slug') slug: string, @Query('locale') locale?: string) {
    const post = await this.blogService.getPublishedPostBySlug(slug, locale);
    return { success: true, data: post };
  }

  // ============================================================================
  // ADMIN ENDPOINTS — POST CRUD
  // ============================================================================

  /**
   * POST /blog/admin/posts
   * Create a new blog post as DRAFT (ADMIN)
   */
  @Post('admin/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createPost(@Body() dto: CreatePostDto, @Request() req: any) {
    const post = await this.blogService.createPost(dto, req.user.id);
    return { success: true, data: post };
  }

  /**
   * GET /blog/admin/posts
   * List all posts across all statuses, paginated (ADMIN)
   */
  @Get('admin/posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminListPosts(@Query() query: AdminListPostsQueryDto) {
    const result = await this.blogService.adminListPosts(query);
    return { success: true, data: result };
  }

  /**
   * GET /blog/admin/posts/:id
   * Get a post by ID — any status (ADMIN)
   */
  @Get('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async adminGetPost(@Param('id') id: string) {
    const post = await this.blogService.adminGetPost(id);
    return { success: true, data: post };
  }

  /**
   * PATCH /blog/admin/posts/:id
   * Update post metadata: slug, coverImageUrl, tags (ADMIN)
   */
  @Patch('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updatePost(@Param('id') id: string, @Body() dto: UpdatePostDto) {
    const post = await this.blogService.updatePost(id, dto);
    return { success: true, data: post };
  }

  /**
   * DELETE /blog/admin/posts/:id
   * Soft-delete a post (sets deletedAt) (ADMIN)
   */
  @Delete('admin/posts/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async deletePost(@Param('id') id: string) {
    await this.blogService.softDeletePost(id);
    return { success: true };
  }

  // ============================================================================
  // ADMIN ENDPOINTS — LIFECYCLE
  // ============================================================================

  /**
   * PATCH /blog/admin/posts/:id/publish
   * Transition post to PUBLISHED; stamps publishedAt only if not already set (ADMIN)
   */
  @Patch('admin/posts/:id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async publishPost(@Param('id') id: string) {
    const post = await this.blogService.publishPost(id);
    return { success: true, data: post };
  }

  /**
   * PATCH /blog/admin/posts/:id/unpublish
   * Transition post back to DRAFT; publishedAt is preserved (ADMIN)
   */
  @Patch('admin/posts/:id/unpublish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async unpublishPost(@Param('id') id: string) {
    const post = await this.blogService.unpublishPost(id);
    return { success: true, data: post };
  }

  /**
   * PATCH /blog/admin/posts/:id/archive
   * Transition post to ARCHIVED; publishedAt is preserved (ADMIN)
   */
  @Patch('admin/posts/:id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async archivePost(@Param('id') id: string) {
    const post = await this.blogService.archivePost(id);
    return { success: true, data: post };
  }

  // ============================================================================
  // ADMIN ENDPOINTS — FEATURED PRODUCTS
  // ============================================================================

  /**
   * GET /blog/admin/posts/:id/products
   * List currently featured products on a post (ADMIN)
   */
  @Get('admin/posts/:id/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getFeaturedProducts(@Param('id') id: string) {
    const items = await this.blogService.getFeaturedProducts(id);
    return { success: true, data: items };
  }

  /**
   * POST /blog/admin/posts/:id/products
   * Attach affiliate products to a post (ADMIN)
   * Rejects if any productId is invalid or inactive.
   * Already-attached products are no-op (not re-appended).
   */
  @Post('admin/posts/:id/products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async attachProducts(@Param('id') id: string, @Body() dto: AttachProductsDto) {
    const items = await this.blogService.attachProducts(id, dto);
    return { success: true, data: items };
  }

  /**
   * DELETE /blog/admin/posts/:id/products/:productId
   * Detach a single featured product from a post (ADMIN). No-op if not attached.
   */
  @Delete('admin/posts/:id/products/:productId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  async detachProduct(@Param('id') id: string, @Param('productId') productId: string) {
    const items = await this.blogService.detachProduct(id, productId);
    return { success: true, data: items };
  }

  /**
   * PATCH /blog/admin/posts/:id/products/reorder
   * Set featured product order by providing the full ordered productId array (ADMIN)
   */
  @Patch('admin/posts/:id/products/reorder')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async reorderProducts(@Param('id') id: string, @Body() dto: ReorderProductsDto) {
    const items = await this.blogService.reorderProducts(id, dto);
    return { success: true, data: items };
  }

  // ============================================================================
  // ADMIN ENDPOINTS — TRANSLATIONS
  // ============================================================================

  /**
   * POST /blog/admin/posts/:id/translations
   * Upsert a translation by (postId, locale) (ADMIN)
   */
  @Post('admin/posts/:id/translations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async upsertTranslation(
    @Param('id') id: string,
    @Body() dto: UpsertTranslationDto,
    @Request() req: any
  ) {
    const translation = await this.blogService.upsertTranslation(id, dto, req.user.id);
    return { success: true, data: translation };
  }

  /**
   * PATCH /blog/admin/posts/:id/translations/:locale
   * Update an existing translation (ADMIN)
   */
  @Patch('admin/posts/:id/translations/:locale')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateTranslation(
    @Param('id') id: string,
    @Param('locale') locale: string,
    @Body() dto: UpdateTranslationDto,
    @Request() req: any
  ) {
    const translation = await this.blogService.updateTranslation(id, locale, dto, req.user.id);
    return { success: true, data: translation };
  }

  /**
   * GET /blog/admin/posts/:id/translations
   * List all translations for a post (ADMIN)
   */
  @Get('admin/posts/:id/translations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async listTranslations(@Param('id') id: string) {
    const translations = await this.blogService.listTranslations(id);
    return { success: true, data: translations };
  }

  // ============================================================================
  // ENGAGEMENT ENDPOINTS (public + auth-gated)
  // ============================================================================

  /**
   * POST /blog/posts/:postId/view
   * Record a page view — deduped per user (24 h window) or IP hash.
   * Public endpoint, fire-and-forget.
   */
  @Post('posts/:postId/view')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordView(@Param('postId') postId: string, @Request() req: any, @Ip() ip: string) {
    const userId: string | undefined = req.user?.id;
    const ipHash = crypto
      .createHash('sha256')
      .update(ip || '')
      .digest('hex');
    await this.blogService.recordView(postId, userId, ipHash);
  }

  /**
   * GET /blog/posts/:postId/engagement
   * Return { viewCount, likeCount, commentCount, liked } for the current viewer.
   * Public; optional auth to resolve `liked`.
   */
  @Get('posts/:postId/engagement')
  @UseGuards(OptionalJwtAuthGuard)
  async getEngagement(@Param('postId') postId: string, @Request() req: any) {
    const userId: string | undefined = req.user?.id;
    const data = await this.blogService.getEngagement(postId, userId);
    return { success: true, data };
  }

  /**
   * POST /blog/posts/:postId/like
   * Toggle like on/off for the authenticated user.
   */
  @Post('posts/:postId/like')
  @UseGuards(JwtAuthGuard)
  async toggleLike(@Param('postId') postId: string, @Request() req: any) {
    const data = await this.blogService.toggleLike(postId, req.user.id);
    return { success: true, data };
  }

  /**
   * GET /blog/posts/:postId/comments
   * List top-level comments + replies. Public.
   */
  @Get('posts/:postId/comments')
  async listComments(@Param('postId') postId: string) {
    const data = await this.blogService.listComments(postId);
    return { success: true, data };
  }

  /**
   * POST /blog/posts/:postId/comments
   * Create a new comment (or reply). Auth required.
   */
  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  async createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
    @Request() req: any
  ) {
    const data = await this.blogService.createComment(postId, dto, req.user.id);
    return { success: true, data };
  }

  /**
   * DELETE /blog/comments/:id
   * Soft-delete a comment. Own comment or admin.
   */
  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deleteComment(@Param('id') id: string, @Request() req: any) {
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(req.user.role);
    await this.blogService.deleteComment(id, req.user.id, isAdmin);
    return { success: true };
  }
}
