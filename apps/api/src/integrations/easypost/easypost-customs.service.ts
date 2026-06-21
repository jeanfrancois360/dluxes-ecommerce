import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const GRAMS_PER_OZ = 28.3495;
const FALLBACK_WEIGHT_OZ = 4; // used when product has no weightGrams

export interface EasyPostCustomsItem {
  description: string;
  quantity: number;
  value: number;
  weight: number; // oz
  hs_tariff_number?: string;
  origin_country: string;
}

export interface EasyPostCustomsInfo {
  contents_type: string;
  customs_certify: boolean;
  customs_signer: string;
  eel_pfc: string;
  non_delivery_option: string;
  restriction_type: string;
  customs_items: EasyPostCustomsItem[];
}

@Injectable()
export class EasyPostCustomsService {
  private readonly logger = new Logger(EasyPostCustomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build EasyPost customs_info from an order's product data.
   *
   * Returns null for domestic shipments (from === to) or when no items are found.
   * hs_tariff_number is only included when the product has an hsCode set.
   * Weight falls back to FALLBACK_WEIGHT_OZ when product.weightGrams is null.
   */
  async buildCustomsInfoFromOrder(
    orderId: string,
    fromCountry: string,
    toCountry: string
  ): Promise<EasyPostCustomsInfo | null> {
    const from = (fromCountry || 'US').toUpperCase().trim();
    const to = (toCountry || 'US').toUpperCase().trim();

    // Domestic: no customs declaration needed
    if (from === to) {
      return null;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                hsCode: true,
                countryOfOrigin: true,
                weightGrams: true,
              },
            },
          },
        },
      },
    });

    if (!order?.items?.length) {
      this.logger.warn(`buildCustomsInfoFromOrder: order ${orderId} not found or has no items`);
      return null;
    }

    const customsItems: EasyPostCustomsItem[] = order.items.map((item) => {
      const weightOz = item.product.weightGrams
        ? Math.round((item.product.weightGrams / GRAMS_PER_OZ) * 100) / 100
        : FALLBACK_WEIGHT_OZ;

      const entry: EasyPostCustomsItem = {
        description: item.product.name.slice(0, 50),
        quantity: item.quantity,
        value: Number(item.price) * item.quantity,
        weight: weightOz,
        origin_country: (item.product.countryOfOrigin || from).toUpperCase(),
      };

      if (item.product.hsCode) {
        entry.hs_tariff_number = item.product.hsCode;
      }

      return entry;
    });

    return {
      contents_type: 'merchandise',
      customs_certify: true,
      customs_signer: 'Seller',
      eel_pfc: 'NOEEI 30.37(a)',
      non_delivery_option: 'return',
      restriction_type: 'none',
      customs_items: customsItems,
    };
  }
}
