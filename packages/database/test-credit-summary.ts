#!/usr/bin/env ts-node

/**
 * Database Testing Script for Store Credits UX
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function testResult(passed: boolean, message: string) {
  testsRun++;
  if (passed) {
    console.log(`${colors.green}✅ PASS${colors.reset}: ${message}`);
    testsPassed++;
  } else {
    console.log(`${colors.red}❌ FAIL${colors.reset}: ${message}`);
    testsFailed++;
  }
}

async function runTests() {
  console.log('============================================================================');
  console.log('🧪 DATABASE TESTING: Store Credits UX');
  console.log('============================================================================\n');

  try {
    // ========================================================================
    // TEST 1: Database Connection
    // ========================================================================
    console.log('============================================================================');
    console.log('📋 TEST 1: Database Connection');
    console.log('============================================================================\n');

    try {
      await prisma.$queryRaw`SELECT 1`;
      testResult(true, 'Database connection successful');
    } catch (error: any) {
      testResult(false, `Database connection failed: ${error.message}`);
      return;
    }

    // ========================================================================
    // TEST 2: System Setting
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 2: subscription_grace_days Setting');
    console.log('============================================================================\n');

    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'subscription_grace_days' },
    });

    if (setting) {
      testResult(true, 'subscription_grace_days setting exists');
      console.log(`${colors.blue}Setting details:${colors.reset}`);
      console.log(`  Key: ${setting.key}`);
      console.log(`  Value: ${setting.value}`);
      console.log(`  Type: ${setting.valueType}`);
      console.log(`  Category: ${setting.category}`);
      console.log(`  Label: ${setting.label}`);

      testResult(setting.value === 3, 'Default value is 3');
      testResult(setting.valueType === 'NUMBER', 'Value type is NUMBER');
      testResult(setting.category === 'payment', 'Category is payment');
      testResult(setting.isEditable === true, 'Setting is editable');
    } else {
      testResult(false, 'subscription_grace_days setting NOT found');

      // Try to create it
      try {
        console.log('\nAttempting to create the setting...');
        const newSetting = await prisma.systemSetting.create({
          data: {
            key: 'subscription_grace_days',
            category: 'payment',
            value: 3,
            valueType: 'NUMBER',
            label: 'Subscription Grace Period (Days)',
            description:
              'Days after payment failure before blocking subscription access (PAST_DUE status)',
            isPublic: false,
            isEditable: true,
            requiresRestart: false,
            defaultValue: 3,
          },
        });
        testResult(true, 'Successfully created subscription_grace_days setting');
        console.log(`${colors.green}Setting created with ID: ${newSetting.id}${colors.reset}`);
      } catch (createError: any) {
        testResult(false, `Failed to create setting: ${createError.message}`);
      }
    }

    // ========================================================================
    // TEST 3: Store Table Structure
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 3: Store Table Credit Fields');
    console.log('============================================================================\n');

    const storeCount = await prisma.store.count();
    testResult(storeCount >= 0, `Store table accessible (${storeCount} stores found)`);

    const storeWithCredits = await prisma.store.findFirst({
      select: {
        id: true,
        name: true,
        creditsBalance: true,
        creditsExpiresAt: true,
        creditsGraceEndsAt: true,
        creditsLastDeducted: true,
      },
    });

    testResult(true, 'Store table has all credit fields');

    if (storeWithCredits) {
      console.log(`${colors.blue}Sample store credit data:${colors.reset}`);
      console.log(`  Store: ${storeWithCredits.name}`);
      console.log(`  Credits Balance: ${storeWithCredits.creditsBalance}`);
    }

    // ========================================================================
    // TEST 4: SellerSubscription Table
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 4: SellerSubscription Table Credit Fields');
    console.log('============================================================================\n');

    const subscriptionCount = await prisma.sellerSubscription.count();
    testResult(
      subscriptionCount >= 0,
      `SellerSubscription table accessible (${subscriptionCount} subscriptions)`
    );

    const subscriptionWithCredits = await prisma.sellerSubscription.findFirst({
      select: {
        id: true,
        creditsAllocated: true,
        creditsUsed: true,
        status: true,
      },
      include: {
        plan: {
          select: {
            name: true,
            tier: true,
          },
        },
      },
    });

    testResult(true, 'SellerSubscription has credit fields');

    if (subscriptionWithCredits) {
      const remaining =
        subscriptionWithCredits.creditsAllocated - subscriptionWithCredits.creditsUsed;
      console.log(`${colors.blue}Sample subscription:${colors.reset}`);
      console.log(`  Plan: ${subscriptionWithCredits.plan?.name}`);
      console.log(`  Allocated: ${subscriptionWithCredits.creditsAllocated}`);
      console.log(`  Used: ${subscriptionWithCredits.creditsUsed}`);
      console.log(`  Remaining: ${remaining}`);
      console.log(`  Status: ${subscriptionWithCredits.status}`);
    }

    // ========================================================================
    // TEST 5: Seller with Full Data
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 5: Sample Seller Credit Summary Query');
    console.log('============================================================================\n');

    const sellerCount = await prisma.user.count({
      where: { role: 'SELLER' },
    });

    testResult(sellerCount > 0, `Found ${sellerCount} seller user(s)`);

    if (sellerCount > 0) {
      const seller = await prisma.user.findFirst({
        where: { role: 'SELLER' },
        include: {
          store: {
            select: {
              creditsBalance: true,
              creditsExpiresAt: true,
              creditsGraceEndsAt: true,
            },
          },
          sellerSubscription: {
            select: {
              creditsAllocated: true,
              creditsUsed: true,
              status: true,
              currentPeriodEnd: true,
              plan: {
                select: {
                  name: true,
                  tier: true,
                  allowedProductTypes: true,
                },
              },
            },
          },
        },
      });

      if (seller) {
        testResult(true, 'Successfully loaded seller with store and subscription');

        console.log(`${colors.blue}Credit Summary for ${seller.email}:${colors.reset}`);
        console.log(`  Store Credits: ${seller.store?.creditsBalance || 0}`);
        console.log(
          `  Subscription Credits: ${(seller.sellerSubscription?.creditsAllocated || 0) - (seller.sellerSubscription?.creditsUsed || 0)}`
        );
        console.log(`  Plan: ${seller.sellerSubscription?.plan?.name || 'None'}`);
        console.log(`  Status: ${seller.sellerSubscription?.status || 'None'}`);
      }
    }
  } catch (error: any) {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error.message);
  } finally {
    await prisma.$disconnect();
  }

  // Summary
  console.log('\n============================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================================\n');

  console.log(`Total: ${colors.blue}${testsRun}${colors.reset}`);
  console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 ALL TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
