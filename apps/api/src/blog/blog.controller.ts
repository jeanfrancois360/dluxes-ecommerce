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
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CreatePostDto,
  UpdatePostDto,
  ListPostsQueryDto,
  AdminListPostsQueryDto,
  UpsertTranslationDto,
  UpdateTranslationDto,
} from './dto/blog.dto';

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
}
