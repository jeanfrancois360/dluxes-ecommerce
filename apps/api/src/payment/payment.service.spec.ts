import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from './payment.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { CurrencyService } from '../currency/currency.service';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import Stripe from 'stripe';
import { PaymentStatus } from '@prisma/client';

/**
 * Payment Service Unit Tests
 *
 * Comprehensive test suite for PaymentService covering:
 * - Currency validation and conversion
 * - Payment intent creation with multi-currency support
 * - Webhook event handling
 * - Payment health metrics
 * - Refund processing
 */

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;
  let settingsService: SettingsService;
  let currencyService: CurrencyService;

  // Mock Stripe Client
  const mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    refunds: {
      create: jest.fn(),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  // Mock Services
  const mockPrismaService = {
    order: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    paymentTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    systemSetting: {
      findUnique: jest.fn(),
    },
    webhookEvent: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    orderTimeline: {
      create: jest.fn(),
    },
  };

  const mockSettingsService = {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getStripeConfig: jest.fn(),
  };

  const mockCurrencyService = {
    validateCurrency: jest.fn(),
    getDefaultCurrency: jest.fn(),
    convertCurrency: jest.fn(),
    getSupportedCurrencies: jest.fn(),
    getRateByCode: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const config: Record<string, any> = {
        STRIPE_SECRET_KEY: 'sk_test_123',
        STRIPE_PUBLISHABLE_KEY: 'pk_test_123',
        STRIPE_WEBHOOK_SECRET: 'whsec_123',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: CurrencyService, useValue: mockCurrencyService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
    settingsService = module.get<SettingsService>(SettingsService);
    currencyService = module.get<CurrencyService>(CurrencyService);

    // Reset mocks before each test
    jest.clearAllMocks();

    // Set up default mock responses
    mockSettingsService.getSettings.mockResolvedValue({
      stripeLiveSecretKey: 'sk_test_123',
      stripeTestSecretKey: 'sk_test_123',
      stripeWebhookSecret: 'whsec_123',
      stripeTestMode: true,
      stripeEnabled: true,
      stripeCurrency: 'USD',
      stripeCaptureMethod: 'manual',
    });

    // Mock getStripeConfig to return configuration
    mockSettingsService.getStripeConfig.mockResolvedValue({
      enabled: true,
      testMode: true,
      publishableKey: 'pk_test_123',
      secretKey: 'sk_test_123',
      webhookSecret: 'whsec_123',
      currency: 'USD',
      captureMethod: 'manual' as 'automatic' | 'manual',
      statementDescriptor: 'LUXURY ECOM',
      autoPayoutEnabled: false,
    });

    mockCurrencyService.getDefaultCurrency.mockResolvedValue('USD');
    mockCurrencyService.validateCurrency.mockResolvedValue(true);

    // Mock getRateByCode to return currency details
    mockCurrencyService.getRateByCode.mockImplementation((code: string) =>
      Promise.resolve({
        currencyCode: code,
        currencyName: `${code} Name`,
        symbol: code === 'JPY' ? '¥' : '$',
        rate: 1.0,
        decimalDigits: code === 'JPY' ? 0 : 2,
        position: 'before',
        isActive: true,
      })
    );
  });

  describe('Currency Validation', () => {
    it('should validate supported currency', async () => {
      mockCurrencyService.validateCurrency.mockResolvedValue(true);

      await expect(
        service['validateCurrency']('USD')
      ).resolves.not.toThrow();
    });

    it('should reject unsupported system currency', async () => {
      mockCurrencyService.validateCurrency.mockResolvedValue(false);

      await expect(
        service['validateCurrency']('XYZ')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service['validateCurrency']('XYZ')
      ).rejects.toThrow('Currency XYZ is not supported');
    });

    it('should reject currency not supported by Stripe', async () => {
      mockCurrencyService.validateCurrency.mockResolvedValue(true);

      await expect(
        service['validateCurrency']('INVALID')
      ).rejects.toThrow(BadRequestException);
      await expect(
        service['validateCurrency']('INVALID')
      ).rejects.toThrow('not supported by Stripe');
    });

    it('should validate all major Stripe currencies', async () => {
      const majorCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
      mockCurrencyService.validateCurrency.mockResolvedValue(true);

      for (const currency of majorCurrencies) {
        await expect(
          service['validateCurrency'](currency)
        ).resolves.not.toThrow();
      }
    });
  });

  describe('Zero-Decimal Currency Conversion', () => {
    it('should convert standard currency to cents', () => {
      expect(service['convertToSmallestUnit'](100, 'USD')).toBe(10000);
      expect(service['convertToSmallestUnit'](50.50, 'EUR')).toBe(5050);
      expect(service['convertToSmallestUnit'](25.99, 'GBP')).toBe(2599);
    });

    it('should handle zero-decimal currencies correctly', () => {
      // Japanese Yen
      expect(service['convertToSmallestUnit'](1000, 'JPY')).toBe(1000);

      // Korean Won
      expect(service['convertToSmallestUnit'](5000, 'KRW')).toBe(5000);

      // Rwandan Franc
      expect(service['convertToSmallestUnit'](10000, 'RWF')).toBe(10000);
    });

    it('should round amounts correctly', () => {
      expect(service['convertToSmallestUnit'](10.999, 'USD')).toBe(1100);
      expect(service['convertToSmallestUnit'](99.995, 'EUR')).toBe(10000);
      expect(service['convertToSmallestUnit'](1000.4, 'JPY')).toBe(1000);
    });

    it('should handle all zero-decimal currencies', () => {
      const zeroDecimalCurrencies = [
        'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW',
        'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
      ];

      zeroDecimalCurrencies.forEach(currency => {
        expect(service['convertToSmallestUnit'](1000, currency)).toBe(1000);
      });
    });
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with valid order', async () => {
      const orderId = 'order-123';
      const userId = 'user-123';
      const mockOrder = {
        id: orderId,
        orderNumber: 'ORD-001',
        total: 100,
        status: 'PENDING',
        userId,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx-123',
        orderId,
        amount: 100,
        currency: 'USD',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_123',
      });
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      });

      // Mock Stripe client initialization
      jest.spyOn<any, any>(service, 'getStripeClient').mockResolvedValue(mockStripe as any);

      const result = await service.createPaymentIntent(
        { amount: 100, orderId, currency: 'USD' },
        userId
      );

      expect(result).toHaveProperty('clientSecret', 'secret_123');
      expect(result).toHaveProperty('amount', 100); // Original amount, not in cents
      expect(mockPrismaService.paymentTransaction.create).toHaveBeenCalled();
    });

    it('should throw error for non-existent order', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPaymentIntent({ amount: 100, orderId: 'invalid', currency: 'USD' }, 'user-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw error for order belonging to different user', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue({
        id: 'order-123',
        userId: 'other-user',
        total: 100,
      });

      await expect(
        service.createPaymentIntent({ amount: 100, orderId: 'order-123', currency: 'USD' }, 'user-123')
      ).rejects.toThrow(BadRequestException);
    });

    it('should use correct currency conversion for zero-decimal currencies', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        total: 10000,
        userId: 'user-123',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx-123',
        orderId: 'order-123',
        amount: 10000,
        currency: 'JPY',
        status: 'PENDING',
        stripePaymentIntentId: 'pi_123',
      });
      mockStripe.paymentIntents.create.mockResolvedValue({
        id: 'pi_123',
        client_secret: 'secret_123',
        amount: 10000,
        currency: 'jpy',
        status: 'requires_payment_method',
      });

      jest.spyOn<any, any>(service, 'getStripeClient').mockResolvedValue(mockStripe as any);

      await service.createPaymentIntent(
        { amount: 10000, orderId: 'order-123', currency: 'JPY' },
        'user-123'
      );

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 10000, // Not 1000000 (no multiplication for JPY)
          currency: 'jpy',
        })
      );
    });
  });

  describe('getSupportedPaymentCurrencies', () => {
    it('should return list of supported currencies', async () => {
      // Mock currency service responses
      mockCurrencyService.getSupportedCurrencies = jest.fn().mockResolvedValue(['USD', 'EUR', 'GBP', 'JPY']);
      mockCurrencyService.getRateByCode = jest.fn().mockImplementation((code) =>
        Promise.resolve({
          currencyCode: code,
          name: `${code} Name`,
          symbol: '$',
          rate: 1.0,
          decimalDigits: code === 'JPY' ? 0 : 2,
          position: 'before',
          isActive: true,
        })
      );

      const currencies = await service.getSupportedPaymentCurrencies();

      expect(Array.isArray(currencies)).toBe(true);
      expect(currencies.length).toBeGreaterThan(0);
    });

    it('should include major currencies', async () => {
      mockCurrencyService.getSupportedCurrencies = jest.fn().mockResolvedValue(['USD', 'EUR', 'GBP', 'JPY']);
      mockCurrencyService.getRateByCode = jest.fn().mockImplementation((code) =>
        Promise.resolve({
          currencyCode: code,
          name: `${code} Name`,
          symbol: '$',
          rate: 1.0,
          decimalDigits: 2,
          position: 'before',
          isActive: true,
        })
      );

      const currencies = await service.getSupportedPaymentCurrencies();
      const currencyCodes = currencies.map(c => c.code);

      expect(currencyCodes).toContain('USD');
      expect(currencyCodes).toContain('EUR');
      expect(currencyCodes).toContain('GBP');
      expect(currencyCodes).toContain('JPY');
    });

    it('should include decimal digits for each currency', async () => {
      mockCurrencyService.getSupportedCurrencies = jest.fn().mockResolvedValue(['USD', 'JPY']);
      mockCurrencyService.getRateByCode = jest.fn().mockImplementation((code) =>
        Promise.resolve({
          currencyCode: code,
          name: `${code} Name`,
          symbol: '$',
          rate: 1.0,
          decimalDigits: code === 'JPY' ? 0 : 2,
          position: 'before',
          isActive: true,
        })
      );

      const currencies = await service.getSupportedPaymentCurrencies();

      const usd = currencies.find(c => c.code === 'USD');
      const jpy = currencies.find(c => c.code === 'JPY');

      expect(usd?.decimalDigits).toBe(2);
      expect(jpy?.decimalDigits).toBe(0);
    });
  });

  describe('getPaymentHealthMetrics', () => {
    it('should calculate payment health metrics correctly', async () => {
      const mockDate = new Date('2025-01-01');
      const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      mockPrismaService.paymentTransaction.count.mockResolvedValue(100);
      mockPrismaService.paymentTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 50000 },
        _avg: { amount: 500 },
      });
      mockPrismaService.paymentTransaction.findMany.mockResolvedValue([
        {
          id: 'tx1',
          orderId: 'order1',
          amount: 100,
          currency: 'USD',
          status: 'SUCCEEDED',
          createdAt: new Date(),
          order: { orderNumber: 'ORD-001' },
        },
      ]);

      const metrics = await service.getPaymentHealthMetrics(30);

      expect(metrics).toHaveProperty('period');
      expect(metrics).toHaveProperty('transactions');
      expect(metrics).toHaveProperty('revenue');
      expect(metrics).toHaveProperty('recentTransactions');

      expect(metrics.period.days).toBe(30);
      expect(metrics.transactions.total).toBe(100);

      dateSpy.mockRestore();
    });

    it('should handle zero transactions gracefully', async () => {
      mockPrismaService.paymentTransaction.count.mockResolvedValue(0);
      mockPrismaService.paymentTransaction.aggregate.mockResolvedValue({
        _sum: { amount: null },
        _avg: { amount: null },
      });
      mockPrismaService.paymentTransaction.findMany.mockResolvedValue([]);

      const metrics = await service.getPaymentHealthMetrics(7);

      expect(metrics.transactions.total).toBe(0);
      expect(metrics.revenue.total).toBe(0);
      expect(metrics.revenue.average).toBe(0);
    });
  });

  describe('getPaymentStatus', () => {
    it('should retrieve payment status for valid order', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        paymentStatus: PaymentStatus.PAID,
        paymentMethod: 'STRIPE',
        paidAt: new Date(),
        total: 100,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const status = await service.getPaymentStatus('order-123');

      expect(status).toHaveProperty('paymentStatus', PaymentStatus.PAID);
      expect(status).toHaveProperty('total', 100);
    });

    it('should throw error for non-existent payment', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      await expect(
        service.getPaymentStatus('invalid-order')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('createRefund', () => {
    it('should create full refund successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        paymentStatus: PaymentStatus.PAID,
        total: 100,
        items: [],
      };

      const mockTransaction = {
        id: 'tx-123',
        orderId: 'order-123',
        amount: 100,
        currency: 'USD',
        status: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_123',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx-refund-123',
        orderId: 'order-123',
        amount: -100,
        currency: 'USD',
        status: 'REFUNDED',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.REFUNDED,
      });
      mockPrismaService.orderTimeline.create.mockResolvedValue({
        id: 'timeline-123',
        orderId: 'order-123',
        status: 'REFUNDED',
        description: 'Order refunded',
        createdAt: new Date(),
      });
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_123',
        amount: 10000,
        status: 'succeeded',
      });

      // Set stripe client directly on service
      service['stripe'] = mockStripe as any;

      const refund = await service.createRefund('order-123');

      expect(refund).toHaveProperty('refundId', 're_123');
      expect(mockPrismaService.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order-123' },
        })
      );
    });

    it('should create partial refund successfully', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        paymentStatus: PaymentStatus.PAID,
        total: 100,
        items: [],
      };

      const mockTransaction = {
        id: 'tx-123',
        orderId: 'order-123',
        amount: 100,
        currency: 'USD',
        status: 'SUCCEEDED',
        stripePaymentIntentId: 'pi_123',
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.paymentTransaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrismaService.paymentTransaction.create.mockResolvedValue({
        id: 'tx-refund-123',
        orderId: 'order-123',
        amount: -50,
        currency: 'USD',
        status: 'PARTIALLY_REFUNDED',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        paymentStatus: PaymentStatus.PARTIALLY_REFUNDED,
      });
      mockPrismaService.orderTimeline.create.mockResolvedValue({
        id: 'timeline-123',
        orderId: 'order-123',
        status: 'PROCESSING',
        description: 'Order partially refunded',
        createdAt: new Date(),
      });
      mockStripe.refunds.create.mockResolvedValue({
        id: 're_123',
        amount: 5000,
        status: 'succeeded',
      });

      // Set stripe client directly on service
      service['stripe'] = mockStripe as any;

      const refund = await service.createRefund('order-123', 50);

      expect(mockStripe.refunds.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
        })
      );
    });

    it('should throw error for refund on unpaid order', async () => {
      const mockOrder = {
        id: 'order-123',
        orderNumber: 'ORD-001',
        paymentStatus: PaymentStatus.PENDING,
        total: 100,
        items: [],
      };

      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.createRefund('order-123')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large amounts correctly', () => {
      const largeAmount = 999999.99;
      expect(service['convertToSmallestUnit'](largeAmount, 'USD')).toBe(99999999);
    });

    it('should handle very small amounts correctly', () => {
      const smallAmount = 0.01;
      expect(service['convertToSmallestUnit'](smallAmount, 'USD')).toBe(1);
    });

    it('should handle negative amounts', () => {
      // Stripe doesn't support negative amounts, but our conversion should still work
      expect(service['convertToSmallestUnit'](-100, 'USD')).toBe(-10000);
    });

    it('should be case-insensitive for currency codes', async () => {
      mockCurrencyService.validateCurrency.mockResolvedValue(true);

      await expect(
        service['validateCurrency']('usd')
      ).resolves.not.toThrow();

      await expect(
        service['validateCurrency']('USD')
      ).resolves.not.toThrow();
    });
  });
});
