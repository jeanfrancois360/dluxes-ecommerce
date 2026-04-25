#!/usr/bin/env ts-node
/**
 * Migration Script: Export EasyPost API Keys from Database to Environment Variables
 *
 * This script safely migrates EasyPost API credentials from the database (SystemSettings)
 * to environment variables (.env files) for improved security.
 *
 * Usage:
 *   pnpm tsx packages/database/scripts/migrate-easypost-to-env.ts
 *
 * What it does:
 * 1. Reads existing API keys from SystemSettings table
 * 2. Displays them for manual copying to .env files
 * 3. Waits for user confirmation
 * 4. Deletes the keys from the database
 *
 * IMPORTANT: This is a ONE-WAY migration. Backup your database before running!
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

async function promptUser(question: string): Promise<string> {
  const rl = createInterface();
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function migrateEasyPostSettings() {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  EasyPost API Key Migration: Database → Environment Variables ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Check if settings exist in database
    const apiKeySetting = await prisma.systemSetting.findUnique({
      where: { key: 'easypost_api_key' },
    });

    const webhookSecretSetting = await prisma.systemSetting.findUnique({
      where: { key: 'easypost_webhook_secret' },
    });

    // 2. Check if any keys exist
    if (!apiKeySetting?.value && !webhookSecretSetting?.value) {
      console.log('✅ No EasyPost API keys found in database.');
      console.log('   This is good! Keys should be in environment variables only.\n');
      console.log('📝 Make sure your .env file contains:\n');
      console.log('   EASYPOST_API_KEY=EZTK_or_EZAK_xxxxx');
      console.log('   EASYPOST_WEBHOOK_SECRET=whsec_xxxxx\n');
      return;
    }

    // 3. Display current values for manual copying
    console.log('⚠️  CRITICAL: EasyPost API credentials found in database!\n');
    console.log('📋 Copy these values to your .env files:\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    if (apiKeySetting?.value) {
      console.log(`EASYPOST_API_KEY=${apiKeySetting.value}`);
    } else {
      console.log('EASYPOST_API_KEY=<not set in database>');
    }

    if (webhookSecretSetting?.value) {
      console.log(`EASYPOST_WEBHOOK_SECRET=${webhookSecretSetting.value}`);
    } else {
      console.log('EASYPOST_WEBHOOK_SECRET=<not set in database>');
    }

    console.log('\n─────────────────────────────────────────────────────────────\n');
    console.log('📂 Add these to:\n');
    console.log('   Local Development:  apps/api/.env.local or apps/api/.env');
    console.log('   Production:         Your hosting platform environment variables\n');

    // 4. Safety backup suggestion
    console.log('💾 RECOMMENDED: Backup these values to a secure location');
    console.log('   (password manager, encrypted file, etc.)\n');

    // 5. Wait for user confirmation
    const answer = await promptUser(
      '❓ Have you copied these values to your .env file? (yes/no): '
    );

    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Migration cancelled. No changes made to database.');
      console.log('   Run this script again when ready.\n');
      return;
    }

    // 6. Double confirmation for production
    console.log('\n⚠️  WARNING: This will PERMANENTLY delete API keys from the database!');
    const finalConfirm = await promptUser('   Type "DELETE" to confirm: ');

    if (finalConfirm !== 'DELETE') {
      console.log('\n❌ Migration cancelled. No changes made to database.\n');
      return;
    }

    // 7. Delete sensitive settings from database
    console.log('\n🗑️  Removing API keys from database...');

    const result = await prisma.systemSetting.deleteMany({
      where: {
        key: {
          in: ['easypost_api_key', 'easypost_webhook_secret'],
        },
      },
    });

    console.log(`✅ Deleted ${result.count} setting(s) from database.\n`);

    // 8. Update related settings descriptions
    console.log('📝 Updating related settings descriptions...');

    await prisma.systemSetting.updateMany({
      where: { key: 'easypost_enabled' },
      data: {
        description:
          'Enable EasyPost multi-carrier shipping (Configure API key in .env: EASYPOST_API_KEY)',
      },
    });

    await prisma.systemSetting.updateMany({
      where: { key: 'easypost_test_mode' },
      data: {
        description:
          'Use EasyPost test environment (Requires EASYPOST_API_KEY in .env to match test/prod key)',
      },
    });

    console.log('✅ Settings updated.\n');

    // 9. Success message with next steps
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    ✅ MIGRATION COMPLETE!                      ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Next Steps:\n');
    console.log('   1. Verify .env file contains:');
    console.log('      EASYPOST_API_KEY=EZTK_or_EZAK_xxxxx');
    console.log('      EASYPOST_WEBHOOK_SECRET=whsec_xxxxx\n');
    console.log('   2. Restart your API server:');
    console.log('      pnpm dev:api (local)');
    console.log('      pm2 restart nextpik-api (production)\n');
    console.log('   3. Test EasyPost connection:');
    console.log('      GET http://localhost:4000/api/v1/easypost/health\n');
    console.log('   4. Verify in Admin UI:');
    console.log('      Settings → EasyPost Shipping → Should show "Connected ✓"\n');

    console.log('🔒 Your API credentials are now stored securely in environment variables.\n');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateEasyPostSettings()
  .catch((error) => {
    console.error('\n💥 Migration failed:', error.message);
    process.exit(1);
  })
  .then(() => {
    process.exit(0);
  });
