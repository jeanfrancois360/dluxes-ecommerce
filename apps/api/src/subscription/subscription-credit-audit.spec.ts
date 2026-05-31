import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StripeSubscriptionService } from './stripe-subscription.service';
import { SubscriptionService } from './subscription.service';
import { PrismaService } from '../database/prisma.service';
import { SettingsService } from '../settings/settings.service';

// ---------------------------------------------------------------------------
// Shared mock factory
// ---------------------------------------------------------------------------

function makePrismaMock() {
  return {
    $transaction: jest.fn(),
    sellerSubscription: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    subscriptionPlan: {
      findUnique: jest.fn(),
    },
    subscriptionCreditEvent: {
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
}

function makeStripeMock(userId = 'user_abc') {
  return {
    subscriptions: {
      retrieve: jest.fn().mockResolvedValue({ metadata: { userId } }),
    },
  };
}

// ---------------------------------------------------------------------------
// describe: StripeSubscriptionService — handleInvoicePaid
// ---------------------------------------------------------------------------

describe('StripeSubscriptionService — handleInvoicePaid', () => {
  let service: StripeSubscriptionService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
        {
          provide: SettingsService,
          useValue: { getStripeConfig: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  it('writes RENEWAL_RESET event with correct before/after values on invoice.paid', async () => {
    const mockTx = {
      sellerSubscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sub_123',
          userId: 'user_abc',
          creditsAllocated: 500,
          creditsUsed: 200,
          plan: { monthlyCredits: 500 },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscriptionCreditEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) =>
      fn(mockTx)
    );

    // Inject Stripe client directly — bypasses initializeStripe() entirely
    (service as any).stripe = makeStripeMock('user_abc');

    const invoice = { id: 'inv_xyz', subscription: 'sub_stripe_id' } as any;

    await (service as any).handleInvoicePaid(invoice);

    expect(mockTx.sellerSubscription.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          creditsAllocated: 500,
          creditsUsed: 0,
        }),
      })
    );

    expect(mockTx.subscriptionCreditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub_123',
        userId: 'user_abc',
        eventType: 'RENEWAL_RESET',
        creditsBefore: 500,
        creditsAfter: 500,
        creditsUsedBefore: 200,
        creditsUsedAfter: 0,
        reason: expect.stringContaining('inv_xyz'),
        metadata: expect.objectContaining({
          invoiceId: 'inv_xyz',
          stripeSubscriptionId: 'sub_stripe_id',
        }),
      }),
    });
  });
});

// ---------------------------------------------------------------------------
// describe: StripeSubscriptionService — handleSubscriptionDeleted
// ---------------------------------------------------------------------------

describe('StripeSubscriptionService — handleSubscriptionDeleted', () => {
  let service: StripeSubscriptionService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  const freePlan = { id: 'plan_free', monthlyCredits: 0 };

  // Stripe sub expired (period_end in the past)
  const expiredStripeSub = {
    id: 'sub_stripe_999',
    metadata: { userId: 'user_def' },
    current_period_end: Math.floor(Date.now() / 1000) - 3600,
  } as any;

  beforeEach(async () => {
    prismaMock = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
        {
          provide: SettingsService,
          useValue: { getStripeConfig: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  it('writes CANCELLATION event when subscription is deleted', async () => {
    prismaMock.subscriptionPlan.findUnique.mockResolvedValue(freePlan);

    const mockTx = {
      sellerSubscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sub_456',
          creditsAllocated: 1000,
          creditsUsed: 350,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscriptionCreditEvent: {
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) =>
      fn(mockTx)
    );

    await (service as any).handleSubscriptionDeleted(expiredStripeSub);

    expect(mockTx.subscriptionCreditEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        subscriptionId: 'sub_456',
        userId: 'user_def',
        eventType: 'CANCELLATION',
        creditsBefore: 1000,
        creditsUsedBefore: 350,
        creditsUsedAfter: 0,
      }),
    });
  });

  it('logs warning and skips update when subscription not found on deletion', async () => {
    prismaMock.subscriptionPlan.findUnique.mockResolvedValue(freePlan);

    const mockTx = {
      sellerSubscription: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
      },
      subscriptionCreditEvent: {
        create: jest.fn(),
      },
    };

    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) =>
      fn(mockTx)
    );

    const orphanSub = {
      id: 'sub_orphan',
      metadata: { userId: 'user_unknown' },
      current_period_end: Math.floor(Date.now() / 1000),
    } as any;

    // Must not throw — graceful no-op
    await expect((service as any).handleSubscriptionDeleted(orphanSub)).resolves.toBeUndefined();

    expect(mockTx.sellerSubscription.update).not.toHaveBeenCalled();
    expect(mockTx.subscriptionCreditEvent.create).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// describe: SubscriptionService — resetMonthlyCredits (cron path)
// ---------------------------------------------------------------------------

describe('SubscriptionService — resetMonthlyCredits', () => {
  let subscriptionService: SubscriptionService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  const makeSubs = () => [
    {
      id: 'sub_a',
      userId: 'user_1',
      creditsAllocated: 100,
      creditsUsed: 50,
      plan: { monthlyCredits: 100, name: 'Starter', tier: 'STARTER' },
      user: { email: 'user1@example.com' },
    },
    {
      id: 'sub_b',
      userId: 'user_2',
      creditsAllocated: 500,
      creditsUsed: 200,
      plan: { monthlyCredits: 500, name: 'Pro', tier: 'PROFESSIONAL' },
      user: { email: 'user2@example.com' },
    },
    {
      id: 'sub_c',
      userId: 'user_3',
      creditsAllocated: 1000,
      creditsUsed: 750,
      plan: { monthlyCredits: 1000, name: 'Business', tier: 'BUSINESS' },
      user: { email: 'user3@example.com' },
    },
  ];

  beforeEach(async () => {
    prismaMock = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SettingsService, useValue: {} },
      ],
    }).compile();

    subscriptionService = module.get<SubscriptionService>(SubscriptionService);
  });

  it('writes one CRON_RESET event per subscription', async () => {
    prismaMock.sellerSubscription.findMany.mockResolvedValue(makeSubs());

    const eventCreates: any[] = [];
    prismaMock.$transaction.mockImplementation(async (fn: (tx: any) => Promise<void>) => {
      const mockTx = {
        sellerSubscription: { update: jest.fn().mockResolvedValue({}) },
        subscriptionCreditEvent: {
          create: jest.fn().mockImplementation((args: any) => {
            eventCreates.push(args.data);
            return Promise.resolve({});
          }),
        },
      };
      return fn(mockTx);
    });

    await subscriptionService.resetMonthlyCredits();

    expect(eventCreates).toHaveLength(3);

    expect(eventCreates[0]).toMatchObject({
      subscriptionId: 'sub_a',
      eventType: 'CRON_RESET',
      creditsBefore: 100,
      creditsUsedBefore: 50,
      creditsUsedAfter: 0,
    });
    expect(eventCreates[1]).toMatchObject({
      subscriptionId: 'sub_b',
      eventType: 'CRON_RESET',
      creditsBefore: 500,
      creditsUsedBefore: 200,
      creditsUsedAfter: 0,
    });
    expect(eventCreates[2]).toMatchObject({
      subscriptionId: 'sub_c',
      eventType: 'CRON_RESET',
      creditsBefore: 1000,
      creditsUsedBefore: 750,
      creditsUsedAfter: 0,
    });
  });

  it('continues processing other subscriptions if one transaction fails', async () => {
    prismaMock.sellerSubscription.findMany.mockResolvedValue(makeSubs());

    const eventCreates: any[] = [];
    prismaMock.$transaction.mockImplementation(async (fn: (tx: any) => Promise<void>) => {
      const mockTx = {
        sellerSubscription: { update: jest.fn().mockResolvedValue({}) },
        subscriptionCreditEvent: {
          create: jest.fn().mockImplementation((args: any) => {
            if (args.data.subscriptionId === 'sub_b') {
              return Promise.reject(new Error('Simulated failure for sub_b'));
            }
            eventCreates.push(args.data);
            return Promise.resolve({});
          }),
        },
      };
      return fn(mockTx);
    });

    // Must NOT throw — cron absorbs per-subscription failures
    const result = await subscriptionService.resetMonthlyCredits();

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain('user_2');

    // sub_a and sub_c succeeded; sub_b is absent
    expect(eventCreates).toHaveLength(2);
    expect(eventCreates.map((e) => e.subscriptionId)).toEqual(['sub_a', 'sub_c']);
  });
});

// ---------------------------------------------------------------------------
// describe: Transactional rollback — audit failure propagates (CRITICAL)
// ---------------------------------------------------------------------------

describe('StripeSubscriptionService — transactional rollback on audit failure', () => {
  let service: StripeSubscriptionService;
  let prismaMock: ReturnType<typeof makePrismaMock>;

  beforeEach(async () => {
    prismaMock = makePrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StripeSubscriptionService,
        { provide: PrismaService, useValue: prismaMock },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('http://localhost:3001') },
        },
        {
          provide: SettingsService,
          useValue: { getStripeConfig: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<StripeSubscriptionService>(StripeSubscriptionService);
  });

  it('propagates error when audit event write fails — confirming rollback semantics', async () => {
    const mockTx = {
      sellerSubscription: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'sub_xyz',
          userId: 'user_xyz',
          creditsAllocated: 500,
          creditsUsed: 100,
          plan: { monthlyCredits: 500 },
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      subscriptionCreditEvent: {
        create: jest.fn().mockRejectedValue(new Error('Simulated audit write failure')),
      },
    };

    // Simulate Prisma transaction: propagates throws from the callback
    prismaMock.$transaction.mockImplementation(async (fn: (tx: typeof mockTx) => Promise<void>) => {
      return fn(mockTx); // real Prisma would roll back here; we prove the error isn't swallowed
    });

    (service as any).stripe = makeStripeMock('user_xyz');

    const invoice = { id: 'inv_fail', subscription: 'sub_stripe' } as any;

    // Error must propagate — not be swallowed silently
    await expect((service as any).handleInvoicePaid(invoice)).rejects.toThrow(
      'Simulated audit write failure'
    );

    // update was called (inside the tx), audit create threw → real Prisma rolls both back
    expect(mockTx.sellerSubscription.update).toHaveBeenCalledTimes(1);
    expect(mockTx.subscriptionCreditEvent.create).toHaveBeenCalledTimes(1);
  });
});
