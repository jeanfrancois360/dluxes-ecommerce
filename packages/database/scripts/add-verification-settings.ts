import { PrismaClient, SettingValueType } from '@prisma/client';

const prisma = new PrismaClient();

async function addVerificationSettings() {
  try {
    console.log('Adding email verification settings...');

    // Add email_verification_required setting
    await prisma.systemSetting.upsert({
      where: { key: 'email_verification_required' },
      update: {
        value: false,
        label: 'Require Email Verification',
        description: 'Block login for users with unverified emails (excludes OAuth users)',
        updatedAt: new Date(),
      },
      create: {
        key: 'email_verification_required',
        category: 'security',
        value: false,
        valueType: SettingValueType.BOOLEAN,
        label: 'Require Email Verification',
        description: 'Block login for users with unverified emails (excludes OAuth users)',
        isPublic: true,
        isEditable: true,
        requiresRestart: false,
        defaultValue: false,
      },
    });
    console.log('✅ Added email_verification_required');

    // Add email_verification_grace_period_days setting
    await prisma.systemSetting.upsert({
      where: { key: 'email_verification_grace_period_days' },
      update: {
        value: 7,
        label: 'Email Verification Grace Period (Days)',
        description: 'Days after registration before enforcing email verification (0 = immediate)',
        updatedAt: new Date(),
      },
      create: {
        key: 'email_verification_grace_period_days',
        category: 'security',
        value: 7,
        valueType: SettingValueType.NUMBER,
        label: 'Email Verification Grace Period (Days)',
        description: 'Days after registration before enforcing email verification (0 = immediate)',
        isPublic: false,
        isEditable: true,
        requiresRestart: false,
        defaultValue: 7,
      },
    });
    console.log('✅ Added email_verification_grace_period_days');

    // Verify settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        key: {
          in: ['email_verification_required', 'email_verification_grace_period_days'],
        },
      },
      select: {
        key: true,
        value: true,
        valueType: true,
        category: true,
      },
    });

    console.log('\n📊 Verification Settings:');
    settings.forEach((s) => {
      console.log(`  - ${s.key}: ${JSON.stringify(s.value)} (${s.valueType})`);
    });

    console.log('\n✅ Email verification settings added successfully!');
  } catch (error) {
    console.error('❌ Error adding settings:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addVerificationSettings();
