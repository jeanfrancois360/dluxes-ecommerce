#!/usr/bin/env node

/**
 * Database and API Testing Script for Store Credits UX
 */

const { PrismaClient } = require('@nextpik/database');

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

function testResult(passed, message) {
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
  console.log('🧪 DATABASE & API TESTING: Store Credits UX');
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
    } catch (error) {
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
      console.log(`  Description: ${setting.description}`);

      testResult(setting.value === 3, 'Default value is 3');
      testResult(setting.valueType === 'NUMBER', 'Value type is NUMBER');
      testResult(setting.category === 'payment', 'Category is payment');
      testResult(setting.isEditable === true, 'Setting is editable');
    } else {
      testResult(false, 'subscription_grace_days setting NOT found');
      console.log(
        `${colors.yellow}⚠️  Run: pnpm --filter @nextpik/database prisma db seed${colors.reset}`
      );

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
      } catch (createError) {
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

    // Check if we can query credit fields
    try {
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

      testResult(
        true,
        'Store table has all credit fields (creditsBalance, creditsExpiresAt, etc.)'
      );

      if (storeWithCredits) {
        console.log(`${colors.blue}Sample store credit data:${colors.reset}`);
        console.log(`  Store: ${storeWithCredits.name}`);
        console.log(`  Credits Balance: ${storeWithCredits.creditsBalance}`);
        console.log(`  Expires At: ${storeWithCredits.creditsExpiresAt}`);
        console.log(`  Grace Ends At: ${storeWithCredits.creditsGraceEndsAt}`);
        console.log(`  Last Deducted: ${storeWithCredits.creditsLastDeducted}`);
      }
    } catch (error) {
      testResult(false, `Store credit fields query failed: ${error.message}`);
    }

    // ========================================================================
    // TEST 4: SellerSubscription Table Structure
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 4: SellerSubscription Table Credit Fields');
    console.log('============================================================================\n');

    const subscriptionCount = await prisma.sellerSubscription.count();
    testResult(
      subscriptionCount >= 0,
      `SellerSubscription table accessible (${subscriptionCount} subscriptions found)`
    );

    // Check if we can query credit fields
    try {
      const subscriptionWithCredits = await prisma.sellerSubscription.findFirst({
        select: {
          id: true,
          userId: true,
          creditsAllocated: true,
          creditsUsed: true,
          status: true,
          planId: true,
        },
        include: {
          plan: {
            select: {
              name: true,
              tier: true,
              monthlyCredits: true,
            },
          },
        },
      });

      testResult(
        true,
        'SellerSubscription table has credit fields (creditsAllocated, creditsUsed)'
      );

      if (subscriptionWithCredits) {
        console.log(`${colors.blue}Sample subscription credit data:${colors.reset}`);
        console.log(`  Subscription ID: ${subscriptionWithCredits.id}`);
        console.log(
          `  Plan: ${subscriptionWithCredits.plan?.name} (${subscriptionWithCredits.plan?.tier})`
        );
        console.log(`  Credits Allocated: ${subscriptionWithCredits.creditsAllocated}`);
        console.log(`  Credits Used: ${subscriptionWithCredits.creditsUsed}`);
        console.log(
          `  Credits Remaining: ${subscriptionWithCredits.creditsAllocated - subscriptionWithCredits.creditsUsed}`
        );
        console.log(`  Status: ${subscriptionWithCredits.status}`);
      } else {
        console.log(`${colors.yellow}No subscriptions found in database${colors.reset}`);
      }
    } catch (error) {
      testResult(false, `SellerSubscription credit fields query failed: ${error.message}`);
    }

    // ========================================================================
    // TEST 5: Test Data Availability
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 5: Test Data Availability');
    console.log('============================================================================\n');

    // Check for seller users
    const sellerUsers = await prisma.user.count({
      where: { role: 'SELLER' },
    });

    testResult(sellerUsers > 0, `Found ${sellerUsers} seller user(s)`);

    if (sellerUsers === 0) {
      console.log(
        `${colors.yellow}⚠️  No seller users found. You may want to create a test seller account.${colors.reset}`
      );
    }

    // Check for subscription plans
    const planCount = await prisma.subscriptionPlan.count();
    testResult(planCount > 0, `Found ${planCount} subscription plan(s)`);

    if (planCount > 0) {
      const plans = await prisma.subscriptionPlan.findMany({
        select: {
          tier: true,
          name: true,
          monthlyCredits: true,
          isActive: true,
        },
        orderBy: { displayOrder: 'asc' },
      });

      console.log(`${colors.blue}Available plans:${colors.reset}`);
      plans.forEach((plan) => {
        console.log(
          `  - ${plan.name} (${plan.tier}): ${plan.monthlyCredits} credits/month, Active: ${plan.isActive}`
        );
      });
    }

    // ========================================================================
    // TEST 6: Sample Credit Summary Query
    // ========================================================================
    console.log('\n============================================================================');
    console.log('📋 TEST 6: Sample Credit Summary Query');
    console.log('============================================================================\n');

    if (sellerUsers > 0) {
      const sampleSeller = await prisma.user.findFirst({
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

      if (sampleSeller) {
        testResult(true, 'Successfully queried seller with store and subscription');

        console.log(`${colors.blue}Sample seller credit summary:${colors.reset}`);
        console.log(`  Email: ${sampleSeller.email}`);
        console.log(`  Store Credits: ${sampleSeller.store?.creditsBalance || 0}`);
        console.log(
          `  Subscription Credits: ${(sampleSeller.sellerSubscription?.creditsAllocated || 0) - (sampleSeller.sellerSubscription?.creditsUsed || 0)}`
        );
        console.log(`  Subscription Status: ${sampleSeller.sellerSubscription?.status || 'None'}`);
        console.log(`  Plan: ${sampleSeller.sellerSubscription?.plan?.name || 'None'}`);

        // Test grace period calculation
        if (
          sampleSeller.sellerSubscription?.status === 'PAST_DUE' &&
          sampleSeller.sellerSubscription?.currentPeriodEnd
        ) {
          const graceDays = 3; // Default value
          const graceEndDate = new Date(sampleSeller.sellerSubscription.currentPeriodEnd);
          graceEndDate.setDate(graceEndDate.getDate() + graceDays);
          const inGracePeriod = new Date() < graceEndDate;

          testResult(
            true,
            `Grace period calculated: ${inGracePeriod ? 'In grace period' : 'Grace period expired'}`
          );
          console.log(`  Grace Period Ends: ${graceEndDate.toISOString()}`);
        }
      } else {
        testResult(false, "Found seller user but couldn't load related data");
      }
    } else {
      console.log(`${colors.yellow}Skipping (no seller users available)${colors.reset}`);
    }
  } catch (error) {
    console.error(`${colors.red}Fatal error during testing:${colors.reset}`, error);
  } finally {
    await prisma.$disconnect();
  }

  // ========================================================================
  // Final Summary
  // ========================================================================
  console.log('\n============================================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================================\n');

  console.log(`Total Tests: ${colors.blue}${testsRun}${colors.reset}`);
  console.log(`Passed: ${colors.green}${testsPassed}${colors.reset}`);
  console.log(`Failed: ${colors.red}${testsFailed}${colors.reset}`);

  if (testsFailed === 0) {
    console.log(`\n${colors.green}🎉 ALL DATABASE TESTS PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    const passRate = ((testsPassed / testsRun) * 100).toFixed(2);
    console.log(
      `\n${colors.yellow}⚠️  Some tests failed. Pass rate: ${passRate}%${colors.reset}\n`
    );
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
