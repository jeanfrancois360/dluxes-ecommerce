import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { PayoutSchedulerService } from './payout-scheduler.service';
import { StripeConnectService } from './integrations/stripe-connect.service';
import { PayPalPayoutsService } from './integrations/paypal-payouts.service';
import { SettingsService } from '../settings/settings.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';

/**
 * Kill-switch tests for seller_payouts_enabled setting.
 *
 * Verifies that with the setting false or missing:
 * - No Stripe/PayPal API calls are made
 * - No payout rows are created or status-changed
 * - Admin/manual endpoints throw clear errors
 *
 * With the setting true:
 * - Existing behavior is unchanged (calls reach the provider)
 */
describe('Seller Payout Kill Switch', () => {
  // ── Shared mocks ──────────────────────────────────────────────────

  const mockPrisma = {
    systemSetting: { findUnique: jest.fn() },
    payoutScheduleConfig: { findFirst: jest.fn() },
    payout: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: { findUnique: jest.fn() },
    commission: { updateMany: jest.fn() },
    sellerPayoutSettings: { findUnique: jest.fn() },
    store: { findUnique: jest.fn() },
    $transaction: jest.fn((fn: any) => fn(mockPrisma)),
  };

  const mockSettingsService = {
    areSellerPayoutsEnabled: jest.fn(),
    getSetting: jest.fn(),
    getStripeConfig: jest.fn().mockResolvedValue({
      secretKey: 'sk_test_fake',
      testMode: true,
      enabled: true,
      currency: 'USD',
      captureMethod: 'manual',
      statementDescriptor: 'NEXTPIK',
      autoPayoutEnabled: false,
    }),
  };

  const mockEmailService = {
    sendPayoutScheduled: jest.fn(),
    sendPayoutCompleted: jest.fn(),
    sendPayoutFailed: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const map: Record<string, string> = {
        STRIPE_SECRET_KEY: 'sk_test_fake',
        PAYPAL_CLIENT_ID: 'test-client-id',
        PAYPAL_CLIENT_SECRET: 'test-client-secret',
        PAYPAL_MODE: 'sandbox',
      };
      return map[key] || '';
    }),
  };

  // ── areSellerPayoutsEnabled helper ────────────────────────────────

  describe('areSellerPayoutsEnabled helper', () => {
    let realSettingsService: SettingsService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [SettingsService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      realSettingsService = module.get(SettingsService);
    });

    it('returns false when setting key is missing', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue(null);
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(false);
    });

    it('returns false when value is non-boolean string', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'seller_payouts_enabled',
        value: 'banana',
      });
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(false);
    });

    it('returns false when value is numeric 0', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'seller_payouts_enabled',
        value: 0,
      });
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(false);
    });

    it('returns false when value is string "false"', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'seller_payouts_enabled',
        value: 'false',
      });
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(false);
    });

    it('returns false when DB throws', async () => {
      mockPrisma.systemSetting.findUnique.mockRejectedValue(new Error('connection refused'));
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(false);
    });

    it('returns true when value is boolean true', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'seller_payouts_enabled',
        value: true,
      });
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(true);
    });

    it('returns true when value is string "true"', async () => {
      mockPrisma.systemSetting.findUnique.mockResolvedValue({
        key: 'seller_payouts_enabled',
        value: 'true',
      });
      expect(await realSettingsService.areSellerPayoutsEnabled()).toBe(true);
    });
  });

  // ── PayoutSchedulerService ────────────────────────────────────────

  describe('PayoutSchedulerService', () => {
    let scheduler: PayoutSchedulerService;
    let mockStripeConnect: { createPayout: jest.Mock };
    let mockPayPal: { createPayout: jest.Mock; configured: boolean };

    beforeEach(async () => {
      jest.clearAllMocks();
      mockStripeConnect = { createPayout: jest.fn() };
      mockPayPal = { createPayout: jest.fn(), configured: true };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PayoutSchedulerService,
          { provide: StripeConnectService, useValue: mockStripeConnect },
          { provide: PayPalPayoutsService, useValue: mockPayPal },
          { provide: SettingsService, useValue: mockSettingsService },
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: EmailService, useValue: mockEmailService },
        ],
      }).compile();

      scheduler = module.get(PayoutSchedulerService);
    });

    describe('when seller_payouts_enabled = false', () => {
      beforeEach(() => {
        mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(false);
      });

      it('processScheduledPayouts makes zero payout rows and zero provider calls', async () => {
        const result = await scheduler.processScheduledPayouts();
        expect(result).toEqual({
          processed: 0,
          successful: 0,
          failed: 0,
          totalAmount: 0,
        });
        expect(mockPrisma.payout.create).not.toHaveBeenCalled();
        expect(mockPrisma.payoutScheduleConfig.findFirst).not.toHaveBeenCalled();
        expect(mockStripeConnect.createPayout).not.toHaveBeenCalled();
        expect(mockPayPal.createPayout).not.toHaveBeenCalled();
      });

      it('processPendingPayouts makes zero Stripe/PayPal calls and reads no rows', async () => {
        const result = await scheduler.processPendingPayouts();
        expect(result).toEqual({
          processed: 0,
          failed: 0,
          failedPayoutIds: [],
        });
        expect(mockPrisma.payout.findMany).not.toHaveBeenCalled();
        expect(mockStripeConnect.createPayout).not.toHaveBeenCalled();
        expect(mockPayPal.createPayout).not.toHaveBeenCalled();
      });

      it('retryFailedPayouts leaves FAILED rows FAILED (no DB reads or writes)', async () => {
        const result = await scheduler.retryFailedPayouts();
        expect(result).toEqual({ retried: 0, succeeded: 0 });
        expect(mockPrisma.payout.findMany).not.toHaveBeenCalled();
        expect(mockPrisma.payout.update).not.toHaveBeenCalled();
      });

      it('triggerManualPayout throws BadRequestException with kill-switch message', async () => {
        await expect(scheduler.triggerManualPayout('seller-1', 'admin-1')).rejects.toThrow(
          BadRequestException
        );
        await expect(scheduler.triggerManualPayout('seller-1', 'admin-1')).rejects.toThrow(
          'seller_payouts_enabled=false'
        );
      });
    });

    describe('when seller_payouts_enabled = true', () => {
      beforeEach(() => {
        mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(true);
      });

      it('processScheduledPayouts proceeds past kill switch and queries config', async () => {
        mockPrisma.payoutScheduleConfig.findFirst.mockResolvedValue(null);
        const result = await scheduler.processScheduledPayouts();
        expect(mockSettingsService.areSellerPayoutsEnabled).toHaveBeenCalledTimes(1);
        expect(mockPrisma.payoutScheduleConfig.findFirst).toHaveBeenCalled();
        // With no config, reports disabled — but the kill switch was passed
        expect(result.processed).toBe(0);
      });

      it('processPendingPayouts queries PENDING rows', async () => {
        mockPrisma.payout.findMany.mockResolvedValue([]);
        await scheduler.processPendingPayouts();
        expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ status: 'PENDING' }),
          })
        );
      });

      it('retryFailedPayouts queries FAILED rows', async () => {
        mockPrisma.payout.findMany.mockResolvedValue([]);
        await scheduler.retryFailedPayouts();
        expect(mockPrisma.payout.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ status: 'FAILED' }),
          })
        );
      });
    });
  });

  // ── StripeConnectService inner guard ──────────────────────────────

  describe('StripeConnectService.createPayout inner guard', () => {
    let realStripeConnect: StripeConnectService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          StripeConnectService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: SettingsService, useValue: mockSettingsService },
        ],
      }).compile();
      realStripeConnect = module.get(StripeConnectService);
    });

    it('throws before calling getStripe when disabled', async () => {
      mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(false);
      const getStripeSpy = jest.spyOn(realStripeConnect as any, 'getStripe');

      await expect(
        realStripeConnect.createPayout({
          sellerId: 'seller-1',
          amount: 100,
          currency: 'USD',
        })
      ).rejects.toThrow('seller_payouts_enabled=false');

      expect(getStripeSpy).not.toHaveBeenCalled();
    });

    it('proceeds to getStripe when enabled', async () => {
      mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(true);
      const getStripeSpy = jest.spyOn(realStripeConnect as any, 'getStripe');

      // Will fail at getStripe (no real Stripe) — but proves the guard was passed
      try {
        await realStripeConnect.createPayout({
          sellerId: 'seller-1',
          amount: 100,
          currency: 'USD',
        });
      } catch (e) {
        // Expected — Stripe not configured in test
      }

      expect(getStripeSpy).toHaveBeenCalled();
    });
  });

  // ── PayPalPayoutsService inner guard ──────────────────────────────

  describe('PayPalPayoutsService.createPayout inner guard', () => {
    let realPayPal: PayPalPayoutsService;

    beforeEach(async () => {
      jest.clearAllMocks();
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          PayPalPayoutsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: ConfigService, useValue: mockConfigService },
          { provide: SettingsService, useValue: mockSettingsService },
        ],
      }).compile();
      realPayPal = module.get(PayPalPayoutsService);
    });

    it('throws before calling getAccessToken when disabled', async () => {
      mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(false);
      const tokenSpy = jest.spyOn(realPayPal as any, 'getAccessToken');

      await expect(
        realPayPal.createPayout({
          payoutId: 'pay-1',
          receiver: 'seller@example.com',
          amount: 100,
          currency: 'USD',
        })
      ).rejects.toThrow('seller_payouts_enabled=false');

      expect(tokenSpy).not.toHaveBeenCalled();
    });

    it('proceeds past kill switch when enabled (hits isConfigured check)', async () => {
      mockSettingsService.areSellerPayoutsEnabled.mockResolvedValue(true);

      // PayPal IS configured in test (env vars set), so it will proceed
      // to validation checks. With valid params it will try getAccessToken.
      const tokenSpy = jest.spyOn(realPayPal as any, 'getAccessToken');

      try {
        await realPayPal.createPayout({
          payoutId: 'pay-1',
          receiver: 'seller@example.com',
          amount: 100,
          currency: 'USD',
        });
      } catch (e) {
        // Expected — sandbox OAuth will fail in test
      }

      // The kill switch was passed — getAccessToken was attempted
      expect(tokenSpy).toHaveBeenCalled();
    });
  });
});
