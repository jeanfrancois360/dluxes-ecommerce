/**
 * Script to enable email verification requirement
 *
 * This updates the email_verification_required setting to true
 * Run this after deploying the fix to ensure login enforces email verification
 *
 * Usage: pnpm tsx packages/database/scripts/update-email-verification-setting.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateEmailVerificationSetting() {
  try {
    console.log('🔄 Updating email_verification_required setting...');

    const result = await prisma.systemSetting.update({
      where: {
        key: 'email_verification_required',
      },
      data: {
        value: true,
      },
    });

    console.log('✅ Successfully updated email_verification_required to true');
    console.log('📧 Email verification is now required for login');
    console.log('⏱️  Grace period:', await getGracePeriod(), 'days');
    console.log('\nℹ️  Users will be blocked from logging in if:');
    console.log('   - Email is not verified');
    console.log('   - Account is older than grace period');
    console.log('   - User is not an OAuth user (Google)');
  } catch (error: any) {
    if (error.code === 'P2025') {
      console.error('❌ Setting not found. Make sure the database is seeded first.');
      console.log('Run: pnpm prisma:seed');
    } else {
      console.error('❌ Error updating setting:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function getGracePeriod(): Promise<number> {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'email_verification_grace_period_days' },
    });
    return (setting?.value as number) || 7;
  } catch {
    return 7;
  }
}

updateEmailVerificationSetting();
