#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testStripeStatus() {
  console.log('=== Testing Stripe Status ===\n');

  // Get all Stripe settings
  const stripeSettings = await prisma.systemSetting.findMany({
    where: {
      key: {
        startsWith: 'stripe_',
      },
    },
    select: {
      key: true,
      value: true,
      valueType: true,
      isEditable: true,
      isPublic: true,
    },
  });

  console.log('Stripe Settings from Database:');
  stripeSettings.forEach((setting) => {
    const value = typeof setting.value === 'string' ? setting.value : JSON.stringify(setting.value);
    const displayValue = setting.key.includes('secret') || setting.key.includes('key')
      ? value.substring(0, 20) + '...'
      : value;
    console.log(`  ${setting.key}: ${displayValue}`);
  });

  console.log('\n=== Parsed Config ===');

  const enabled = stripeSettings.find(s => s.key === 'stripe_enabled');
  const testMode = stripeSettings.find(s => s.key === 'stripe_test_mode');
  const publishableKey = stripeSettings.find(s => s.key === 'stripe_publishable_key');
  const secretKey = stripeSettings.find(s => s.key === 'stripe_secret_key');
  const webhookSecret = stripeSettings.find(s => s.key === 'stripe_webhook_secret');

  const config = {
    enabled: enabled ? Boolean(enabled.value) : false,
    testMode: testMode ? Boolean(testMode.value) : true,
    publishableKey: publishableKey ? String(publishableKey.value) : '',
    secretKey: secretKey ? String(secretKey.value) : '',
    webhookSecret: webhookSecret ? String(webhookSecret.value) : '',
  };

  console.log('Enabled:', config.enabled);
  console.log('Test Mode:', config.testMode);
  console.log('Has Publishable Key:', !!config.publishableKey, config.publishableKey.substring(0, 20) + '...');
  console.log('Has Secret Key:', !!config.secretKey, config.secretKey.substring(0, 20) + '...');
  console.log('Has Webhook Secret:', !!config.webhookSecret);

  const isConfigured = config.enabled && !!config.secretKey && !!config.publishableKey;
  console.log('\n=== Final Status ===');
  console.log('Configured:', isConfigured);
  console.log('Should show as Connected:', isConfigured && config.enabled);

  await prisma.$disconnect();
}

testStripeStatus().catch(console.error);
