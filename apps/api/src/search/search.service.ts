import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { MeiliSearch } from 'meilisearch';

/**
 * Search Service
 * Handles search operations with Meilisearch
 */
@Injectable()
export class SearchService implements OnModuleInit {
  private client: MeiliSearch;
  private productsIndex: string = 'products';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const host = this.configService.get<string>('MEILISEARCH_HOST', 'http://localhost:7700');
    const apiKey = this.configService.get<string>('MEILISEARCH_API_KEY', '');

    this.client = new MeiliSearch({
      host,
      apiKey,
    });
  }

  async onModuleInit() {
    try {
      // Initialize products index
      await this.client.getIndex(this.productsIndex).catch(async () => {
        // Create index if it doesn't exist
        await this.client.createIndex(this.productsIndex, {
          primaryKey: 'id',
        });
      });

      // Configure searchable attributes
      await this.client.index(this.productsIndex).updateSettings({
        searchableAttributes: [
          'name',
          'description',
          'shortDescription',
          'category',
          'tags',
          'materials',
        ],
        filterableAttributes: [
          'categoryId',
          'status',
          'featured',
          'price',
          'colors',
          'sizes',
          'materials',
        ],
        sortableAttributes: ['price', 'createdAt', 'rating', 'viewCount'],
        displayedAttributes: [
          'id',
          'name',
          'slug',
          'description',
          'shortDescription',
          'price',
          'compareAtPrice',
          'status',
          'featured',
          'heroImage',
          'category',
          'tags',
          'rating',
          'reviewCount',
        ],
      });
    } catch (error) {
      console.error('Failed to initialize Meilisearch:', error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Fast autocomplete search for search bar
   * Returns minimal data for quick results
   */
  async autocomplete(query: string, limit: number = 8) {
    try {
      const results = await this.client
        .index(this.productsIndex)
        .search(query, {
          limit,
          attributesToRetrieve: [
            'id',
            'name',
            'slug',
            'price',
            'compareAtPrice',
            'heroImage',
            'category',
            'categoryId',
            'brand',
          ],
        });

      return results.hits.map((hit: any) => ({
        id: hit.id,
        name: hit.name,
        slug: hit.slug,
        price: hit.price,
        compareAtPrice: hit.compareAtPrice,
        heroImage: hit.heroImage,
        category: hit.category && hit.categoryId ? {
          id: hit.categoryId,
          name: hit.category,
          slug: '', // Category slug not indexed in Meilisearch
        } : undefined,
        brand: hit.brand,
      }));
    } catch (error) {
      console.error('Autocomplete error:', error instanceof Error ? error.message : String(error));
      return [];
    }
  }

  /**
   * Search products
   */
  async search(query: string, filters?: any) {
    try {
      const searchParams: any = {
        limit: filters?.limit || 20,
        offset: filters?.offset || 0,
      };

      // Add filters
      const filterArray: string[] = [];

      if (filters?.categoryId) {
        filterArray.push(`categoryId = "${filters.categoryId}"`);
      }

      if (filters?.status) {
        filterArray.push(`status = "${filters.status}"`);
      }

      if (filters?.featured !== undefined) {
        filterArray.push(`featured = ${filters.featured}`);
      }

      if (filters?.minPrice !== undefined) {
        filterArray.push(`price >= ${filters.minPrice}`);
      }

      if (filters?.maxPrice !== undefined) {
        filterArray.push(`price <= ${filters.maxPrice}`);
      }

      if (filterArray.length > 0) {
        searchParams.filter = filterArray;
      }

      // Add sorting
      if (filters?.sortBy) {
        searchParams.sort = [
          `${filters.sortBy}:${filters.sortOrder || 'desc'}`,
        ];
      }

      const results = await this.client
        .index(this.productsIndex)
        .search(query, searchParams);

      return {
        hits: results.hits,
        total: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
        query: results.query,
      };
    } catch (error) {
      console.error('Search error:', error instanceof Error ? error.message : String(error));
      throw new Error('Search failed');
    }
  }

  /**
   * Index all products
   */
  async indexAllProducts() {
    try {
      const products = await this.prisma.product.findMany({
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              name: true,
            },
          },
        },
      });

      const documents = products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        category: product.category?.name,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        status: product.status,
        featured: product.featured,
        heroImage: product.heroImage,
        colors: product.colors,
        sizes: product.sizes,
        materials: product.materials,
        tags: product.tags.map((t) => t.name),
        rating: product.rating ? Number(product.rating) : null,
        reviewCount: product.reviewCount,
        viewCount: product.viewCount,
        createdAt: product.createdAt.toISOString(),
      }));

      const task = await this.client
        .index(this.productsIndex)
        .addDocuments(documents);

      return {
        taskUid: task.taskUid,
        indexedCount: documents.length,
        message: 'Products indexing started',
      };
    } catch (error) {
      console.error('Indexing error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to index products');
    }
  }

  /**
   * Index single product
   */
  async indexProduct(productId: string) {
    try {
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          tags: {
            select: {
              name: true,
            },
          },
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const document = {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDescription: product.shortDescription,
        categoryId: product.categoryId,
        category: product.category?.name,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        status: product.status,
        featured: product.featured,
        heroImage: product.heroImage,
        colors: product.colors,
        sizes: product.sizes,
        materials: product.materials,
        tags: product.tags.map((t) => t.name),
        rating: product.rating ? Number(product.rating) : null,
        reviewCount: product.reviewCount,
        viewCount: product.viewCount,
        createdAt: product.createdAt.toISOString(),
      };

      const task = await this.client
        .index(this.productsIndex)
        .addDocuments([document]);

      return {
        taskUid: task.taskUid,
        message: 'Product indexed successfully',
      };
    } catch (error) {
      console.error('Product indexing error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to index product');
    }
  }

  /**
   * Delete product from index
   */
  async deleteProduct(productId: string) {
    try {
      const task = await this.client
        .index(this.productsIndex)
        .deleteDocument(productId);

      return {
        taskUid: task.taskUid,
        message: 'Product removed from index',
      };
    } catch (error) {
      console.error('Delete from index error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to delete product from index');
    }
  }

  /**
   * Get index stats
   */
  async getStats() {
    try {
      const stats = await this.client.index(this.productsIndex).getStats();
      return stats;
    } catch (error) {
      console.error('Stats error:', error instanceof Error ? error.message : String(error));
      throw new Error('Failed to get search stats');
    }
  }
}
