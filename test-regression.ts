/**
 * Regression Test Suite
 * Verifies all fixes remain in place and no old issues have reappeared
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface RegressionTest {
  name: string;
  description: string;
  test: () => Promise<boolean>;
}

async function runRegressionTests() {
  try {
    console.log('🧪 Settings Module Regression Test Suite\n');
    console.log('=' * 60);
    console.log('Verifying all fixes remain in place...\n');

    const tests: RegressionTest[] = [
      {
        name: 'No Old Dot Notation in Database',
        description: 'Ensures old dot notation settings were removed',
        test: async () => {
          const oldKeys = [
            'escrow.enabled',
            'escrow.hold_period_days',
            'escrow.auto_release_enabled',
            'payout.minimum_amount',
            'payout.default_frequency',
            'commission.default_rate',
            'audit.log_all_escrow_actions',
          ];

          const oldSettings = await prisma.systemSetting.findMany({
            where: { key: { in: oldKeys } }
          });

          if (oldSettings.length > 0) {
            console.log(`      Found ${oldSettings.length} old settings: ${oldSettings.map(s => s.key).join(', ')}`);
            return false;
          }
          return true;
        }
      },

      {
        name: 'All 38 Settings Exist',
        description: 'Confirms complete settings coverage',
        test: async () => {
          const count = await prisma.systemSetting.count();
          if (count !== 38) {
            console.log(`      Expected 38, found ${count}`);
            return false;
          }
          return true;
        }
      },

      {
        name: 'Critical Settings Present',
        description: 'Verifies critical settings exist with correct keys',
        test: async () => {
          const criticalKeys = [
            'escrow_enabled',
            'escrow_default_hold_days',
            'min_payout_amount',
            'global_commission_rate',
            'default_currency',
            'supported_currencies',
            'delivery_confirmation_required',
            '2fa_required_for_admin',
          ];

          for (const key of criticalKeys) {
            const setting = await prisma.systemSetting.findUnique({ where: { key } });
            if (!setting) {
              console.log(`      Missing: ${key}`);
              return false;
            }
          }
          return true;
        }
      },

      {
        name: 'Validator Uses Correct Keys',
        description: 'Frontend validator uses underscore notation',
        test: async () => {
          const validatorPath = path.join(__dirname, 'apps/web/src/lib/settings-validator.ts');
          if (!fs.existsSync(validatorPath)) {
            console.log('      Validator file not found');
            return false;
          }

          const content = fs.readFileSync(validatorPath, 'utf-8');

          // Check for correct keys
          const correctKeys = ['escrow_enabled', 'escrow_default_hold_days', 'min_payout_amount'];
          const hasCorrectKeys = correctKeys.every(key => content.includes(`'${key}'`));

          // Check for incorrect old keys
          const incorrectKeys = ['escrow.enabled', 'escrow.hold_period_days', 'payout.minimum_amount'];
          const hasIncorrectKeys = incorrectKeys.some(key => content.includes(`'${key}'`));

          if (!hasCorrectKeys) {
            console.log('      Validator missing correct underscore keys');
            return false;
          }

          if (hasIncorrectKeys) {
            console.log('      Validator still has old dot notation keys');
            return false;
          }

          return true;
        }
      },

      {
        name: 'Escrow Service Uses Correct Keys',
        description: 'Backend escrow service uses underscore notation',
        test: async () => {
          const servicePath = path.join(__dirname, 'apps/api/src/escrow/escrow.service.ts');
          if (!fs.existsSync(servicePath)) {
            console.log('      Escrow service file not found');
            return false;
          }

          const content = fs.readFileSync(servicePath, 'utf-8');

          const hasCorrect = content.includes("'escrow_enabled'") &&
                            content.includes("'escrow_default_hold_days'");
          const hasIncorrect = content.includes("'escrow.enabled'") ||
                              content.includes("'escrow.hold_period_days'");

          if (!hasCorrect || hasIncorrect) {
            console.log('      Escrow service has incorrect keys');
            return false;
          }

          return true;
        }
      },

      {
        name: 'Payment Service Uses Correct Keys',
        description: 'Backend payment service uses underscore notation',
        test: async () => {
          const servicePath = path.join(__dirname, 'apps/api/src/payment/payment.service.ts');
          if (!fs.existsSync(servicePath)) {
            console.log('      Payment service file not found');
            return false;
          }

          const content = fs.readFileSync(servicePath, 'utf-8');

          const hasCorrect = content.includes("'escrow_enabled'") &&
                            content.includes("'escrow_default_hold_days'");
          const hasIncorrect = content.includes("'escrow.enabled'") ||
                              content.includes("'escrow.hold_period_days'");

          if (!hasCorrect || hasIncorrect) {
            console.log('      Payment service has incorrect keys');
            return false;
          }

          return true;
        }
      },

      {
        name: 'Settings by Category',
        description: 'All 8 categories properly populated',
        test: async () => {
          const expectedCounts: Record<string, number> = {
            general: 7,
            payment: 6,
            commission: 3,
            currency: 4,
            delivery: 4,
            security: 7,
            notifications: 3,
            seo: 4,
          };

          for (const [category, expectedCount] of Object.entries(expectedCounts)) {
            const count = await prisma.systemSetting.count({
              where: { category }
            });

            if (count !== expectedCount) {
              console.log(`      ${category}: expected ${expectedCount}, found ${count}`);
              return false;
            }
          }

          return true;
        }
      },

      {
        name: 'Locked Settings Configured',
        description: 'Critical settings are locked (isEditable: false)',
        test: async () => {
          const lockedSettings = await prisma.systemSetting.findMany({
            where: { isEditable: false }
          });

          // Should have at least 2 locked settings (escrow_enabled, delivery_confirmation_required)
          if (lockedSettings.length < 2) {
            console.log(`      Expected at least 2 locked settings, found ${lockedSettings.length}`);
            return false;
          }

          const criticalLocked = ['escrow_enabled', 'delivery_confirmation_required'];
          for (const key of criticalLocked) {
            const found = lockedSettings.find(s => s.key === key);
            if (!found) {
              console.log(`      ${key} should be locked but isn't`);
              return false;
            }
          }

          return true;
        }
      },

      {
        name: 'Public Settings Configured',
        description: 'Public settings flagged correctly',
        test: async () => {
          const publicSettings = await prisma.systemSetting.findMany({
            where: { isPublic: true }
          });

          // Should have at least 15 public settings
          if (publicSettings.length < 15) {
            console.log(`      Expected at least 15 public settings, found ${publicSettings.length}`);
            return false;
          }

          return true;
        }
      },

      {
        name: 'All Settings Have Values',
        description: 'No null or undefined values',
        test: async () => {
          const settings = await prisma.systemSetting.findMany();

          for (const setting of settings) {
            if (setting.value === null || setting.value === undefined) {
              console.log(`      ${setting.key} has null/undefined value`);
              return false;
            }
          }

          return true;
        }
      },
    ];

    // Run all tests
    const results: Array<{ test: RegressionTest; passed: boolean; error?: string }> = [];

    for (let i = 0; i < tests.length; i++) {
      const test = tests[i];
      console.log(`${i + 1}. ${test.name}`);
      console.log(`   ${test.description}`);

      try {
        const passed = await test.test();
        results.push({ test, passed });
        console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}`);
      } catch (error) {
        results.push({
          test,
          passed: false,
          error: error instanceof Error ? error.message : String(error)
        });
        console.log(`   ❌ FAIL - ${error instanceof Error ? error.message : String(error)}`);
      }

      console.log('');
    }

    // Summary
    console.log('=' * 60);
    console.log('Regression Test Summary');
    console.log('=' * 60);

    const passedCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    console.log(`\nTests Passed: ${passedCount}/${totalCount}`);
    console.log('');

    results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} - ${result.test.name}`);
      if (!result.passed && result.error) {
        console.log(`           ${result.error}`);
      }
    });

    console.log('');

    if (passedCount === totalCount) {
      console.log('✅ ALL REGRESSION TESTS PASSED!');
      console.log('✅ All fixes remain in place');
      console.log('✅ No regressions detected');
    } else {
      console.log('❌ REGRESSION DETECTED!');
      console.log(`❌ ${totalCount - passedCount} test(s) failed`);
      console.log('❌ Please review failed tests above');
    }

  } catch (error) {
    console.error('❌ Regression test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runRegressionTests();
