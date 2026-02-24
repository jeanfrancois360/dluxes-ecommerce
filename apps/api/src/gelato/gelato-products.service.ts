import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { GelatoService } from './gelato.service';
import { CreatePodProductDto, UpdatePodProductDto } from './dto';
import { FulfillmentType } from '@prisma/client';

@Injectable()
export class GelatoProductsService {
  private readonly logger = new Logger(GelatoProductsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gelatoService: GelatoService
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
    return this.gelatoService.getProduct(productUid, userId);
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

    if (dto.gelatoProductUid && dto.gelatoProductUid !== product.gelatoProductUid) {
      const gelatoProduct = await this.gelatoService.getProduct(dto.gelatoProductUid);
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

    return this.prisma.product.update({
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
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product?.gelatoProductUid) throw new NotFoundException('POD product not found');

    return this.gelatoService.getShippingMethods({
      productUid: product.gelatoProductUid,
      ...params,
    });
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
    });

    const gelatoItems = items.map((item) => {
      const product = products.find((p) => p.id === item.productId);
      if (!product?.gelatoProductUid) {
        throw new BadRequestException(`Product ${item.productId} is not a valid POD product`);
      }
      return { productUid: product.gelatoProductUid, quantity: item.quantity };
    });

    return this.gelatoService.calculatePrice({ items: gelatoItems, country, shippingMethodUid });
  }
}
