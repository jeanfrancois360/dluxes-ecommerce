import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../database/prisma.service';
import { GelatoService } from './gelato.service';
import { UploadService } from '../upload/upload.service';
import { CreatePodProductDto, UpdatePodProductDto } from './dto';
import { FulfillmentType } from '@prisma/client';

@Injectable()
export class GelatoProductsService {
  private readonly logger = new Logger(GelatoProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gelatoService: GelatoService,
    private readonly uploadService: UploadService
  ) {}

  async getCatalog(
    params?: {
      category?: string;
      limit?: number;
      offset?: number;
      search?: string;
    },
    userId?: string
  ) {
    return this.gelatoService.getProducts(params, userId);
  }

  async getCategories(userId?: string) {
    return this.gelatoService.getProductCategories(userId);
  }

  async getProductDetails(productUid: string, userId?: string) {
    // Try to fetch from Gelato API
    try {
      const gelatoProduct = await this.gelatoService.getProduct(productUid, userId);

      // Check if we have a local product with this gelatoProductUid
      const localProduct = await this.prisma.product.findFirst({
        where: { gelatoProductUid: productUid },
        include: {
          images: {
            where: { alt: 'gelato-cached' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      // If we have cached images, enrich the Gelato response with them
      if (localProduct && localProduct.images.length > 0) {
        this.logger.debug(
          `Using ${localProduct.images.length} cached images for Gelato product ${productUid}`
        );
        return {
          ...gelatoProduct,
          cachedImages: localProduct.images.map((img) => ({
            url: img.url,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
          })),
        };
      }

      return gelatoProduct;
    } catch (error) {
      this.logger.error(`Failed to fetch Gelato product ${productUid}: ${error.message}`);

      // Fallback: Return cached data if available
      const localProduct = await this.prisma.product.findFirst({
        where: { gelatoProductUid: productUid },
        include: {
          images: {
            where: { alt: 'gelato-cached' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      if (localProduct && localProduct.images.length > 0) {
        this.logger.warn(`Gelato API failed, returning cached images for product ${productUid}`);
        return {
          uid: productUid,
          title: localProduct.name,
          description: localProduct.description,
          cachedImages: localProduct.images.map((img) => ({
            url: img.url,
            isPrimary: img.isPrimary,
            displayOrder: img.displayOrder,
          })),
          apiError: true,
          errorMessage: 'Gelato API unavailable, showing cached data',
        };
      }

      // No cached data available, re-throw the error
      throw error;
    }
  }

  async configurePodProduct(productId: string, dto: CreatePodProductDto) {
    const gelatoProduct = await this.gelatoService.getProduct(dto.gelatoProductUid);
    if (!gelatoProduct) {
      throw new NotFoundException(`Gelato product ${dto.gelatoProductUid} not found`);
    }

    // Get product to access storeId and current price
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (!product.storeId) {
      throw new BadRequestException(
        'Product must be associated with a store to configure Gelato POD'
      );
    }

    // Auto-fetch Gelato's production cost
    let baseCost = dto.baseCost;

    try {
      this.logger.log(
        `Fetching Gelato production cost for ${dto.gelatoProductUid} (quantity: 1, country: US)`
      );

      const pricing = await this.gelatoService.calculatePrice(
        {
          items: [{ productUid: dto.gelatoProductUid, quantity: 1 }],
          country: 'US', // Use US as default for base cost calculation
        },
        product.storeId
      );

      if (pricing.items && pricing.items.length > 0) {
        baseCost = parseFloat(pricing.items[0].itemCost.amount);
        this.logger.log(`✅ Gelato base cost: $${baseCost.toFixed(2)}`);
      } else {
        this.logger.warn('Could not fetch Gelato pricing - using provided baseCost or null');
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch Gelato pricing: ${error.message} - continuing anyway`);
      // Continue with provided baseCost or null
    }

    // Validate price is not below cost (if both are set)
    if (baseCost && product.price) {
      const productPrice =
        typeof product.price === 'number' ? product.price : Number(product.price);
      if (productPrice < baseCost) {
        const suggestedPrice = (baseCost * 1.3).toFixed(2);
        throw new BadRequestException(
          `Product price ($${productPrice}) cannot be lower than Gelato production cost ($${baseCost.toFixed(2)}). ` +
            `We recommend at least $${suggestedPrice} (30% markup) to cover shipping variations and ensure profitability.`
        );
      }
    }

    // Log pricing recommendation
    if (baseCost && product.price) {
      const productPrice =
        typeof product.price === 'number' ? product.price : Number(product.price);
      const markup = (((productPrice - baseCost) / baseCost) * 100).toFixed(1);
      this.logger.log(
        `Product pricing: Cost=$${baseCost.toFixed(2)}, Price=$${productPrice}, Markup=${markup}%`
      );
    } else if (baseCost && !product.price) {
      const suggestedPrice = Math.ceil(baseCost * 1.5);
      this.logger.log(
        `Suggested retail price: $${suggestedPrice} (50% markup over Gelato cost of $${baseCost.toFixed(2)})`
      );
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        fulfillmentType: FulfillmentType.GELATO_POD,
        gelatoProductUid: dto.gelatoProductUid,
        gelatoTemplateId: dto.gelatoTemplateId,
        designFileUrl: dto.designFileUrl,
        printAreas: dto.printAreas || null,
        baseCost,
        markupPercentage: dto.markupPercentage,
      },
    });

    this.logger.log(
      `Configured product ${productId} as Gelato POD with template ${dto.gelatoProductUid}`
    );

    // Cache Gelato product images
    try {
      await this.cacheGelatoProductImages(productId, gelatoProduct);
    } catch (error) {
      this.logger.warn(`Failed to cache Gelato images during configuration: ${error.message}`);
      // Don't throw - product is still configured, images can be cached later
    }

    return updatedProduct;
  }

  async updatePodProduct(productId: string, dto: UpdatePodProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.fulfillmentType !== FulfillmentType.GELATO_POD) {
      throw new BadRequestException('Product is not configured as a POD product');
    }

    // If changing productUid, validate it exists and fetch new cost
    let baseCost = dto.baseCost !== undefined ? dto.baseCost : product.baseCost;
    let gelatoProduct: any = null;

    if (dto.gelatoProductUid && dto.gelatoProductUid !== product.gelatoProductUid) {
      gelatoProduct = await this.gelatoService.getProduct(dto.gelatoProductUid);
      if (!gelatoProduct) {
        throw new NotFoundException(`Gelato product ${dto.gelatoProductUid} not found`);
      }

      // Fetch new cost for the new product
      if (product.storeId) {
        try {
          this.logger.log(`Fetching updated Gelato cost for new product ${dto.gelatoProductUid}`);

          const pricing = await this.gelatoService.calculatePrice(
            {
              items: [{ productUid: dto.gelatoProductUid, quantity: 1 }],
              country: 'US',
            },
            product.storeId
          );

          if (pricing.items && pricing.items.length > 0) {
            baseCost = parseFloat(pricing.items[0].itemCost.amount);
            this.logger.log(`✅ Updated Gelato base cost: $${baseCost.toFixed(2)}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch updated Gelato pricing: ${error.message}`);
        }
      }
    }

    // Validate price is not below cost
    if (baseCost && product.price) {
      const productPrice =
        typeof product.price === 'number' ? product.price : Number(product.price);
      if (productPrice < baseCost) {
        const suggestedPrice = (baseCost * 1.3).toFixed(2);
        throw new BadRequestException(
          `Product price ($${productPrice}) cannot be lower than Gelato production cost ($${baseCost.toFixed(2)}). ` +
            `We recommend at least $${suggestedPrice} (30% markup).`
        );
      }
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        gelatoProductUid: dto.gelatoProductUid,
        gelatoTemplateId: dto.gelatoTemplateId,
        designFileUrl: dto.designFileUrl,
        printAreas: dto.printAreas,
        baseCost,
        markupPercentage: dto.markupPercentage,
      },
    });

    // Cache images if product UID changed
    if (gelatoProduct) {
      try {
        await this.cacheGelatoProductImages(productId, gelatoProduct);
      } catch (error) {
        this.logger.warn(`Failed to cache Gelato images during update: ${error.message}`);
        // Don't throw - product is still updated, images can be cached later
      }
    }

    return updatedProduct;
  }

  async removePodConfiguration(productId: string) {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        fulfillmentType: FulfillmentType.SELF_FULFILLED,
        gelatoProductUid: null,
        gelatoTemplateId: null,
        designFileUrl: null,
        printAreas: null,
        baseCost: null,
        markupPercentage: null,
      },
    });
  }

  /**
   * Refresh Gelato production cost for a POD product
   * Useful when Gelato prices change or to get latest pricing
   */
  async refreshGelatoCost(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.fulfillmentType !== FulfillmentType.GELATO_POD || !product.gelatoProductUid) {
      throw new BadRequestException('Product is not configured as a Gelato POD product');
    }

    if (!product.storeId) {
      throw new BadRequestException('Product must be associated with a store');
    }

    this.logger.log(
      `Refreshing Gelato cost for product ${productId} (${product.gelatoProductUid})`
    );

    // Fetch latest Gelato pricing
    const pricing = await this.gelatoService.calculatePrice(
      {
        items: [{ productUid: product.gelatoProductUid, quantity: 1 }],
        country: 'US',
      },
      product.storeId
    );

    if (!pricing.items || pricing.items.length === 0) {
      throw new BadRequestException('Failed to fetch Gelato pricing');
    }

    const newBaseCost = parseFloat(pricing.items[0].itemCost.amount);
    const oldBaseCost = product.baseCost;

    // Update product with new baseCost
    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: { baseCost: newBaseCost },
    });

    this.logger.log(
      `✅ Cost refreshed: ${oldBaseCost ? `$${oldBaseCost} → ` : ''}$${newBaseCost.toFixed(2)}`
    );

    // Return update info
    return {
      success: true,
      product: updatedProduct,
      costUpdate: {
        previous: oldBaseCost,
        current: newBaseCost,
        changed: oldBaseCost !== null && Math.abs(oldBaseCost - newBaseCost) > 0.01,
      },
    };
  }

  async getShippingEstimate(
    productId: string,
    params: { quantity: number; country: string; state?: string }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });
    if (!product?.gelatoProductUid) throw new NotFoundException('POD product not found');
    if (!product.storeId) {
      throw new BadRequestException('Product must be associated with a store');
    }

    return this.gelatoService.getShippingMethods(
      {
        productUid: product.gelatoProductUid,
        ...params,
      },
      product.storeId
    );
  }

  async calculateOrderPrice(
    items: Array<{ productId: string; quantity: number }>,
    country: string,
    shippingMethodUid?: string
  ) {
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: items.map((i) => i.productId) },
        fulfillmentType: FulfillmentType.GELATO_POD,
      },
      include: { store: true },
    });

    const gelatoItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.gelatoProductUid) {
        throw new BadRequestException(`Product ${item.productId} is not a valid POD product`);
      }
      if (!product.storeId) {
        throw new BadRequestException(`Product ${item.productId} must be associated with a store`);
      }
      return { productUid: product.gelatoProductUid, quantity: item.quantity };
    });

    // Verify all products are from the same store (POD orders must be single-seller)
    const storeIds = [...new Set(products.map((p) => p.storeId))];
    if (storeIds.length > 1) {
      throw new BadRequestException(
        'Cannot calculate price for products from multiple stores. POD orders must contain products from a single seller.'
      );
    }
    if (storeIds.length === 0 || !storeIds[0]) {
      throw new BadRequestException('Products must be associated with a store');
    }

    return this.gelatoService.calculatePrice(
      { items: gelatoItems, country, shippingMethodUid },
      storeIds[0]
    );
  }

  /**
   * Calculate price for a Gelato product by UID (for product selection preview)
   * Used by frontend to show pricing before saving the product
   */
  async calculateProductPrice(
    productUid: string,
    params: { quantity: number; country: string },
    userId?: string
  ) {
    this.logger.log(
      `Fetching price for Gelato product ${productUid} (quantity: ${params.quantity}, country: ${params.country})`
    );

    // First, try to get the product details to check if it has pricing information
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { store: true },
      });

      if (user?.store?.id) {
        const productDetails = await this.gelatoService.getProduct(productUid, userId);
        this.logger.log(
          `Product details fetched. Has ${productDetails.variants?.length || 0} variants`
        );

        // Check if variants have pricing information
        if (productDetails.variants && productDetails.variants.length > 0) {
          const firstVariant = productDetails.variants[0];
          if (firstVariant.baseCost) {
            this.logger.log(
              `✅ Found base cost in variant: ${firstVariant.baseCost.amount} ${firstVariant.baseCost.currency}`
            );
            return {
              baseCost: parseFloat(firstVariant.baseCost.amount),
              currency: firstVariant.baseCost.currency,
              productUid,
            };
          }
        }
      }
    } catch (error) {
      this.logger.warn(`Could not fetch product details for pricing: ${error.message}`);
    }

    try {
      // Get user's store ID if seller
      let storeId: string | undefined;
      if (userId) {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
          include: { store: true },
        });
        storeId = user?.store?.id;
      }

      const pricing = await this.gelatoService.calculatePrice(
        {
          items: [{ productUid, quantity: params.quantity }],
          country: params.country,
        },
        storeId
      );

      if (pricing.items && pricing.items.length > 0) {
        const item = pricing.items[0];
        const baseCost = parseFloat(item.itemCost.amount);

        this.logger.log(`✅ Gelato price fetched: $${baseCost.toFixed(2)}`);

        return {
          baseCost,
          currency: item.itemCost.currency,
          productUid,
        };
      }

      throw new BadRequestException('Unable to fetch pricing for this product');
    } catch (error) {
      this.logger.error(`Failed to fetch Gelato pricing: ${error.message}`);
      throw new BadRequestException(`Failed to fetch pricing: ${error.message}`);
    }
  }

  /**
   * Cache Gelato product images to ProductImage table
   * Downloads images from Gelato S3 and re-uploads to Supabase for permanent URLs
   *
   * @param productId - Local product ID
   * @param gelatoProduct - Gelato API product response
   * @returns Number of images cached
   */
  private async cacheGelatoProductImages(productId: string, gelatoProduct: any): Promise<number> {
    try {
      const imageUrls: Array<{ url: string; isPrimary: boolean; displayOrder: number }> = [];

      // Extract previewUrl (primary image)
      if (gelatoProduct.previewUrl) {
        imageUrls.push({
          url: gelatoProduct.previewUrl,
          isPrimary: true,
          displayOrder: 0,
        });
      }

      // Extract mockup images if available
      if (gelatoProduct.mockupUrl) {
        imageUrls.push({
          url: gelatoProduct.mockupUrl,
          isPrimary: false,
          displayOrder: 1,
        });
      }

      // Extract images array if available
      if (Array.isArray(gelatoProduct.images)) {
        gelatoProduct.images.forEach((img: any, index: number) => {
          const imgUrl = typeof img === 'string' ? img : img.url || img.previewUrl;
          if (imgUrl && !imageUrls.some((i) => i.url === imgUrl)) {
            imageUrls.push({
              url: imgUrl,
              isPrimary: false,
              displayOrder: imageUrls.length,
            });
          }
        });
      }

      // Extract variant images if available
      if (Array.isArray(gelatoProduct.variants)) {
        gelatoProduct.variants.forEach((variant: any, vIndex: number) => {
          if (variant.previewUrl && !imageUrls.some((i) => i.url === variant.previewUrl)) {
            imageUrls.push({
              url: variant.previewUrl,
              isPrimary: false,
              displayOrder: imageUrls.length,
            });
          }
          if (variant.mockupUrl && !imageUrls.some((i) => i.url === variant.mockupUrl)) {
            imageUrls.push({
              url: variant.mockupUrl,
              isPrimary: false,
              displayOrder: imageUrls.length,
            });
          }
        });
      }

      if (imageUrls.length === 0) {
        this.logger.debug(`No images found in Gelato product ${gelatoProduct.uid || 'unknown'}`);
        return 0;
      }

      // Delete existing cached Gelato images for this product
      await this.prisma.productImage.deleteMany({
        where: {
          productId,
          alt: 'gelato-cached',
        },
      });

      // Process images in batches of 5 to avoid overwhelming the system
      const batchSize = 5;
      const createdImages = [];

      for (let i = 0; i < imageUrls.length; i += batchSize) {
        const batch = imageUrls.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (img) => {
            // Check if permanent URL already exists
            const existing = await this.prisma.productImage.findFirst({
              where: {
                productId,
                displayOrder: img.displayOrder,
                alt: 'gelato-cached',
                url: { not: { contains: 'amazonaws.com' } },
              },
            });

            if (existing) {
              this.logger.debug(
                `Skipping image ${img.displayOrder} - permanent URL already exists`
              );
              return existing;
            }

            // Download and re-upload to Supabase
            try {
              this.logger.debug(`Downloading Gelato image: ${img.url.substring(0, 100)}...`);

              const response = await fetch(img.url);
              if (!response.ok) {
                throw new Error(`Failed to download image: ${response.statusText}`);
              }

              // Convert to Buffer
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Get content type and map to extension
              const contentType = response.headers.get('content-type') || 'image/jpeg';
              const extensionMap: Record<string, string> = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'image/gif': 'gif',
              };
              const extension = extensionMap[contentType] || 'jpg';

              // Create filename: gelato-products/{productId}/{displayOrder}.{ext}
              const folder = `gelato-products/${productId}`;
              const filename = `${img.displayOrder}.${extension}`;

              // Create a file object for UploadService
              const file = {
                buffer,
                originalname: filename,
                mimetype: contentType,
                size: buffer.length,
              } as Express.Multer.File;

              // Upload to Supabase
              this.logger.debug(`Uploading to Supabase: ${folder}/${filename}`);
              const uploadResult = await this.uploadService.uploadFile(file, folder);

              // Store in database with permanent Supabase URL
              const created = await this.prisma.productImage.create({
                data: {
                  productId,
                  url: uploadResult.url,
                  originalUrl: img.url, // Store original Gelato S3 URL
                  alt: 'gelato-cached',
                  width: 1000,
                  height: 1000,
                  isPrimary: img.isPrimary,
                  displayOrder: img.displayOrder,
                  size: uploadResult.size,
                  mimeType: uploadResult.mimeType,
                  format: extension,
                },
              });

              this.logger.log(
                `✅ Uploaded image ${img.displayOrder} to Supabase: ${uploadResult.url.substring(0, 80)}...`
              );

              return created;
            } catch (uploadError) {
              // Fall back to storing Gelato S3 URL temporarily
              this.logger.warn(
                `Failed to upload Gelato image to Supabase, using temporary URL: ${uploadError.message}`
              );

              const fallback = await this.prisma.productImage.create({
                data: {
                  productId,
                  url: img.url, // Temporary Gelato S3 URL
                  originalUrl: img.url,
                  alt: 'gelato-cached',
                  width: 1000,
                  height: 1000,
                  isPrimary: img.isPrimary,
                  displayOrder: img.displayOrder,
                },
              });

              return fallback;
            }
          })
        );

        // Collect successful results
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            createdImages.push(result.value);
          }
        });
      }

      this.logger.log(
        `✅ Cached ${createdImages.length} images for product ${productId} (Gelato: ${gelatoProduct.uid || 'unknown'})`
      );

      return createdImages.length;
    } catch (error) {
      this.logger.error(`Failed to cache Gelato images for product ${productId}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Refresh Gelato product images by re-fetching from API
   * Public method that can be called when seller views their product
   *
   * @param productId - Local product ID
   * @returns Updated product with cached images
   */
  async refreshGelatoProductImages(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { store: true },
    });

    if (!product) {
      throw new NotFoundException(`Product ${productId} not found`);
    }

    if (product.fulfillmentType !== FulfillmentType.GELATO_POD || !product.gelatoProductUid) {
      throw new BadRequestException('Product is not configured as a Gelato POD product');
    }

    if (!product.storeId) {
      throw new BadRequestException('Product must be associated with a store');
    }

    this.logger.log(
      `Refreshing Gelato images for product ${productId} (${product.gelatoProductUid})`
    );

    try {
      // Fetch latest product data from Gelato
      const gelatoProduct = await this.gelatoService.getProduct(
        product.gelatoProductUid,
        product.store.userId
      );

      // Cache the images
      const cachedCount = await this.cacheGelatoProductImages(productId, gelatoProduct);

      // Fetch updated product with cached images
      const updatedProduct = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: {
            where: { alt: 'gelato-cached' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        success: true,
        product: updatedProduct,
        imagesCached: cachedCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to refresh Gelato images for product ${productId}: ${error.message}`
      );

      // Don't throw - return product with existing cached images as fallback
      const productWithCachedImages = await this.prisma.product.findUnique({
        where: { id: productId },
        include: {
          images: {
            where: { alt: 'gelato-cached' },
            orderBy: { displayOrder: 'asc' },
          },
        },
      });

      return {
        success: false,
        product: productWithCachedImages,
        imagesCached: 0,
        error: error.message,
      };
    }
  }

  /**
   * Scheduled task to refresh Gelato images for all POD products
   * Runs daily at 2am to keep cached images fresh
   * Also fixes already-cached images that still have expiring AWS S3 URLs
   * Processes in batches of 10 with 500ms delay to avoid rate limiting
   */
  @Cron('0 2 * * *', {
    name: 'refresh-gelato-images',
    timeZone: 'UTC',
  })
  async refreshAllGelatoImages() {
    this.logger.log('🔄 Starting scheduled Gelato image refresh...');

    try {
      // Find all products with Gelato POD configuration
      const gelatoProducts = await this.prisma.product.findMany({
        where: {
          fulfillmentType: FulfillmentType.GELATO_POD,
          gelatoProductUid: { not: null },
          storeId: { not: null },
        },
        select: {
          id: true,
          gelatoProductUid: true,
          storeId: true,
        },
      });

      if (gelatoProducts.length === 0) {
        this.logger.log('No Gelato products found to refresh');
        return;
      }

      this.logger.log(`Found ${gelatoProducts.length} Gelato products to refresh`);

      let successCount = 0;
      let errorCount = 0;
      const batchSize = 10;

      // Process in batches to avoid rate limiting
      for (let i = 0; i < gelatoProducts.length; i += batchSize) {
        const batch = gelatoProducts.slice(i, i + batchSize);

        this.logger.debug(
          `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gelatoProducts.length / batchSize)}`
        );

        // Process batch concurrently
        const batchResults = await Promise.allSettled(
          batch.map((product) => this.refreshGelatoProductImages(product.id))
        );

        // Count successes and failures
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.success) {
            successCount++;
          } else {
            errorCount++;
            const product = batch[index];
            this.logger.warn(
              `Failed to refresh images for product ${product.id}: ${
                result.status === 'rejected' ? result.reason : result.value?.error
              }`
            );
          }
        });

        // Delay between batches to avoid rate limiting (except for last batch)
        if (i + batchSize < gelatoProducts.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      this.logger.log(
        `✅ Gelato image refresh completed: ${successCount} successful, ${errorCount} failed`
      );

      // Fix already-cached images that still have AWS S3 URLs
      await this.fixLegacyGelatoImages();
    } catch (error) {
      this.logger.error(`Gelato image refresh cron job failed: ${error.message}`, error.stack);
    }
  }

  /**
   * Fix already-cached Gelato images that still have expiring AWS S3 URLs
   * Re-downloads them and uploads to Supabase
   */
  private async fixLegacyGelatoImages(): Promise<void> {
    this.logger.log('🔧 Fixing legacy Gelato images with AWS S3 URLs...');

    try {
      // Find all ProductImages with alt='gelato-cached' and amazonaws.com URLs
      const legacyImages = await this.prisma.productImage.findMany({
        where: {
          alt: 'gelato-cached',
          url: { contains: 'amazonaws.com' },
        },
        select: {
          id: true,
          productId: true,
          url: true,
          displayOrder: true,
          isPrimary: true,
        },
      });

      if (legacyImages.length === 0) {
        this.logger.log('No legacy images found');
        return;
      }

      this.logger.log(`Found ${legacyImages.length} legacy images to fix`);

      let fixedCount = 0;
      let failedCount = 0;
      const batchSize = 5;

      // Process in batches
      for (let i = 0; i < legacyImages.length; i += batchSize) {
        const batch = legacyImages.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(
          batch.map(async (img) => {
            try {
              this.logger.debug(`Re-uploading image ${img.id} for product ${img.productId}`);

              // Download from AWS S3
              const response = await fetch(img.url);
              if (!response.ok) {
                throw new Error(`Failed to download: ${response.statusText}`);
              }

              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              // Get content type and extension
              const contentType = response.headers.get('content-type') || 'image/jpeg';
              const extensionMap: Record<string, string> = {
                'image/jpeg': 'jpg',
                'image/jpg': 'jpg',
                'image/png': 'png',
                'image/webp': 'webp',
                'image/gif': 'gif',
              };
              const extension = extensionMap[contentType] || 'jpg';

              // Upload to Supabase
              const folder = `gelato-products/${img.productId}`;
              const filename = `${img.displayOrder}.${extension}`;

              const file = {
                buffer,
                originalname: filename,
                mimetype: contentType,
                size: buffer.length,
              } as Express.Multer.File;

              const uploadResult = await this.uploadService.uploadFile(file, folder);

              // Update database with new URL
              await this.prisma.productImage.update({
                where: { id: img.id },
                data: {
                  url: uploadResult.url,
                  originalUrl: img.url,
                  size: uploadResult.size,
                  mimeType: uploadResult.mimeType,
                  format: extension,
                },
              });

              this.logger.log(`✅ Fixed image ${img.id}: ${uploadResult.url.substring(0, 60)}...`);
              return true;
            } catch (error) {
              this.logger.warn(`Failed to fix image ${img.id}: ${error.message}`);
              return false;
            }
          })
        );

        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value === true) {
            fixedCount++;
          } else {
            failedCount++;
          }
        });

        // Delay between batches
        if (i + batchSize < legacyImages.length) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      this.logger.log(`✅ Legacy image fix completed: ${fixedCount} fixed, ${failedCount} failed`);
    } catch (error) {
      this.logger.error(`Failed to fix legacy Gelato images: ${error.message}`, error.stack);
    }
  }
}
