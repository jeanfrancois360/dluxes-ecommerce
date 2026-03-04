#!/usr/bin/env ts-node

/**
 * Migration Script: Enable Email OTP for All Existing Users
 *
 * Purpose:
 * - Updates all existing users to have emailOTPEnabled = true
 * - Makes 2FA via email mandatory for all accounts
 *
 * Usage:
 *   cd apps/api
 *   pnpm tsx src/scripts/enable-email-otp-for-all-users.ts
 *
 * Safety:
 * - Dry run mode available (set DRY_RUN=true)
 * - Reports statistics before and after
 * - Can be run multiple times safely
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const DRY_RUN = process.env.DRY_RUN === 'true';

async function main() {
  console.log('='.repeat(60));
  console.log('📧 Email OTP Migration Script');
  console.log('='.repeat(60));
  console.log();

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN MODE - No changes will be made');
    console.log('   Set DRY_RUN=false to apply changes');
    console.log();
  }

  // Get current statistics
  console.log('📊 Current Statistics:');
  console.log('-'.repeat(60));

  const totalUsers = await prisma.user.count();
  console.log(`Total users: ${totalUsers}`);

  const emailOTPEnabled = await prisma.user.count({
    where: { emailOTPEnabled: true },
  });
  console.log(`Email OTP enabled: ${emailOTPEnabled}`);

  const emailOTPDisabled = await prisma.user.count({
    where: { emailOTPEnabled: false },
  });
  console.log(`Email OTP disabled: ${emailOTPDisabled}`);

  const emailVerified = await prisma.user.count({
    where: { emailVerified: true },
  });
  console.log(`Email verified: ${emailVerified}`);

  const emailUnverified = await prisma.user.count({
    where: { emailVerified: false },
  });
  console.log(`Email unverified: ${emailUnverified}`);

  console.log();

  // Show breakdown by role
  console.log('📊 Breakdown by Role:');
  console.log('-'.repeat(60));

  const roles = await prisma.user.groupBy({
    by: ['role'],
    _count: true,
  });

  for (const roleGroup of roles) {
    const roleOTPDisabled = await prisma.user.count({
      where: {
        role: roleGroup.role,
        emailOTPEnabled: false,
      },
    });
    console.log(`${roleGroup.role}: ${roleGroup._count} total (${roleOTPDisabled} need update)`);
  }

  console.log();

  if (emailOTPDisabled === 0) {
    console.log('✅ All users already have email OTP enabled!');
    console.log('   No changes needed.');
    return;
  }

  // Perform the migration
  console.log('🔄 Migration Plan:');
  console.log('-'.repeat(60));
  console.log(`Will enable email OTP for ${emailOTPDisabled} users`);
  console.log();

  if (DRY_RUN) {
    console.log('⚠️  DRY RUN - Skipping actual update');
    console.log('   Run with DRY_RUN=false to apply changes');
    return;
  }

  // Confirm before proceeding (in production)
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  PRODUCTION ENVIRONMENT DETECTED');
    console.log('   This will affect live users!');
    console.log();
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');

    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log();
  }

  console.log('🚀 Applying changes...');
  console.log();

  const startTime = Date.now();

  // Update all users with emailOTPEnabled = false
  const result = await prisma.user.updateMany({
    where: {
      emailOTPEnabled: false,
    },
    data: {
      emailOTPEnabled: true,
    },
  });

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log();
  console.log('✅ Migration Complete!');
  console.log('-'.repeat(60));
  console.log(`Updated ${result.count} users in ${duration}s`);
  console.log();

  // Get updated statistics
  console.log('📊 Updated Statistics:');
  console.log('-'.repeat(60));

  const updatedEmailOTPEnabled = await prisma.user.count({
    where: { emailOTPEnabled: true },
  });
  console.log(`Email OTP enabled: ${updatedEmailOTPEnabled} (was ${emailOTPEnabled})`);

  const updatedEmailOTPDisabled = await prisma.user.count({
    where: { emailOTPEnabled: false },
  });
  console.log(`Email OTP disabled: ${updatedEmailOTPDisabled} (was ${emailOTPDisabled})`);

  console.log();

  // Warnings for unverified emails
  if (emailUnverified > 0) {
    console.log('⚠️  Warning: Users with Unverified Emails');
    console.log('-'.repeat(60));
    console.log(`${emailUnverified} users have unverified email addresses`);
    console.log('These users will NOT be able to log in until they verify their email.');
    console.log();
    console.log('Consider sending verification emails to these users:');

    const unverifiedUsers = await prisma.user.findMany({
      where: { emailVerified: false },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
      take: 10,
    });

    console.log();
    unverifiedUsers.forEach((user, index) => {
      console.log(
        `${index + 1}. ${user.email} (${user.role}) - Created: ${user.createdAt.toLocaleDateString()}`
      );
    });

    if (emailUnverified > 10) {
      console.log(`... and ${emailUnverified - 10} more`);
    }

    console.log();
    console.log('💡 Tip: Run the send-verification-emails script to notify these users.');
  }

  console.log();
  console.log('='.repeat(60));
  console.log('🎉 Migration completed successfully!');
  console.log('='.repeat(60));
  console.log();
  console.log('Next steps:');
  console.log('1. ✅ Email OTP is now enabled for all users');
  console.log('2. 📧 Users will receive OTP codes on next login');
  console.log('3. ⚠️  Ensure email service (Resend) is properly configured');
  console.log('4. 🧪 Test the login flow with email OTP');
  console.log();
}

main()
  .catch((error) => {
    console.error();
    console.error('❌ Migration Failed!');
    console.error('-'.repeat(60));
    console.error(error);
    console.error();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
