import { Test, TestingModule } from '@nestjs/testing';
import { EasyPostCustomsService } from './easypost-customs.service';
import { PrismaService } from '../../database/prisma.service';

const makeOrder = (overrides: any = {}) => ({
  id: 'order-1',
  items: [
    {
      quantity: 2,
      price: 29.99,
      product: {
        name: 'Classic Cotton T-Shirt',
        hsCode: '6109.10',
        countryOfOrigin: 'CN',
        weightGrams: 200,
        ...overrides.product,
      },
    },
  ],
  ...overrides,
});

describe('EasyPostCustomsService', () => {
  let service: EasyPostCustomsService;
  let prisma: { order: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = { order: { findUnique: jest.fn() } };

    const module: TestingModule = await Test.createTestingModule({
      providers: [EasyPostCustomsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(EasyPostCustomsService);
  });

  describe('domestic shipments', () => {
    it('returns null when from and to country are the same', async () => {
      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'US');
      expect(result).toBeNull();
      expect(prisma.order.findUnique).not.toHaveBeenCalled();
    });

    it('is case-insensitive for country codes', async () => {
      const result = await service.buildCustomsInfoFromOrder('order-1', 'us', 'US');
      expect(result).toBeNull();
    });
  });

  describe('international shipments', () => {
    it('returns null when order not found', async () => {
      prisma.order.findUnique.mockResolvedValue(null);
      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      expect(result).toBeNull();
    });

    it('returns null when order has no items', async () => {
      prisma.order.findUnique.mockResolvedValue({ id: 'order-1', items: [] });
      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      expect(result).toBeNull();
    });

    it('builds customs info with hs_tariff_number when product has hsCode', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder());

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');

      expect(result).not.toBeNull();
      expect(result!.contents_type).toBe('merchandise');
      expect(result!.customs_certify).toBe(true);
      expect(result!.eel_pfc).toBe('NOEEI 30.37(a)');
      expect(result!.non_delivery_option).toBe('return');
      expect(result!.customs_items).toHaveLength(1);

      const item = result!.customs_items[0];
      expect(item.description).toBe('Classic Cotton T-Shirt');
      expect(item.quantity).toBe(2);
      expect(item.value).toBeCloseTo(59.98, 2);
      expect(item.hs_tariff_number).toBe('6109.10');
      expect(item.origin_country).toBe('CN');
    });

    it('omits hs_tariff_number when product has no hsCode', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder({ product: { hsCode: null } }));

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      expect(result).not.toBeNull();
      expect(result!.customs_items[0]).not.toHaveProperty('hs_tariff_number');
    });

    it('converts weightGrams to oz correctly (200g → 7.05oz)', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder({ product: { weightGrams: 200 } }));

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      // 200 / 28.3495 = 7.0548 → rounded to 2dp = 7.05
      expect(result!.customs_items[0].weight).toBeCloseTo(7.05, 1);
    });

    it('falls back to 4oz when product has no weightGrams', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder({ product: { weightGrams: null } }));

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      expect(result!.customs_items[0].weight).toBe(4);
    });

    it('falls back to fromCountry when product has no countryOfOrigin', async () => {
      prisma.order.findUnique.mockResolvedValue(makeOrder({ product: { countryOfOrigin: null } }));

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'GB');
      expect(result!.customs_items[0].origin_country).toBe('US');
    });

    it('handles multiple order items', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        items: [
          {
            quantity: 1,
            price: 10,
            product: { name: 'Item A', hsCode: '6109.10', countryOfOrigin: 'CN', weightGrams: 100 },
          },
          {
            quantity: 3,
            price: 5,
            product: { name: 'Item B', hsCode: null, countryOfOrigin: null, weightGrams: null },
          },
        ],
      });

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'FR');
      expect(result!.customs_items).toHaveLength(2);
      expect(result!.customs_items[0].hs_tariff_number).toBe('6109.10');
      expect(result!.customs_items[1]).not.toHaveProperty('hs_tariff_number');
      expect(result!.customs_items[1].origin_country).toBe('US');
      expect(result!.customs_items[1].weight).toBe(4);
    });

    it('truncates product name to 50 characters', async () => {
      const longName = 'A'.repeat(80);
      prisma.order.findUnique.mockResolvedValue(makeOrder({ product: { name: longName } }));

      const result = await service.buildCustomsInfoFromOrder('order-1', 'US', 'DE');
      expect(result!.customs_items[0].description.length).toBe(50);
    });
  });
});
