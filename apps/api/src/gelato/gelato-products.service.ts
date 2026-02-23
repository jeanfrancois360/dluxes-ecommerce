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

    const updatedProduct = await this.prisma.product.update({
      where: { id: productId },
      data: {
        fulfillmentType: FulfillmentType.GELATO_POD,
        gelatoProductUid: dto.gelatoProductUid,
        gelatoTemplateId: dto.gelatoTemplateId,
        designFileUrl: dto.designFileUrl,
        printAreas: dto.printAreas || null,
        baseCost: dto.baseCost,
      },
    });

    this.logger.log(
      `Configured product ${productId} as Gelato POD with template ${dto.gelatoProductUid}`
    );

    return updatedProduct;
  }

  async updatePodProduct(productId: string, dto: UpdatePodProductDto) {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);
    if (product.fulfillmentType !== FulfillmentType.GELATO_POD) {
      throw new BadRequestException('Product is not configured as a POD product');
    }

    if (dto.gelatoProductUid && dto.gelatoProductUid !== product.gelatoProductUid) {
      const gelatoProduct = await this.gelatoService.getProduct(dto.gelatoProductUid);
      if (!gelatoProduct) {
        throw new NotFoundException(`Gelato product ${dto.gelatoProductUid} not found`);
      }
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        gelatoProductUid: dto.gelatoProductUid,
        gelatoTemplateId: dto.gelatoTemplateId,
        designFileUrl: dto.designFileUrl,
        printAreas: dto.printAreas,
        baseCost: dto.baseCost,
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
      },
    });
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
