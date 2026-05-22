import { Module } from '@nestjs/common';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { DatabaseModule } from '../database/database.module';

/**
 * Blog Module (Phase C.7)
 * Manages blog posts, translations, and lifecycle transitions.
 */
@Module({
  imports: [DatabaseModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
