/**
 * DEPRECATION SCRIPT: System-Wide Gelato Settings
 *
 * This script marks the old system-wide Gelato settings as deprecated.
 * As of v2.9.0, Gelato integration is per-seller, not system-wide.
 *
 * Old Model (DEPRECATED):
 *   - gelato_enabled (system-wide) ❌
 *   - gelato_auto_submit_orders (system-wide) ❌
 *
 * New Model (v2.9.0+):
 *   - SellerGelatoSettings.isEnabled (per-seller) ✅
 *   - Each seller controls their own Gelato integration ✅
 *
 * Run this script to update the settings with deprecation notices.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Deprecating system-wide Gelato settings...\n');

  // Update gelato_enabled with deprecation notice
  await prisma.systemSetting.update({
    where: { key: 'gelato_enabled' },
    data: {
      description:
        '[DEPRECATED] This setting is no longer used. As of v2.9.0, each seller controls their own Gelato integration via SellerGelatoSettings.isEnabled. See /seller/gelato endpoint.',
      value: true, // Set to true to avoid blocking orders, but it's ignored in code
    },
  });

  // Update gelato_auto_submit_orders with deprecation notice
  await prisma.systemSetting.update({
    where: { key: 'gelato_auto_submit_orders' },
    data: {
      description:
        '[DEPRECATED] This setting is no longer used. Orders are auto-submitted when the seller has SellerGelatoSettings.isEnabled = true. Configure via /seller/gelato endpoint.',
      value: true, // Set to true to avoid blocking orders, but it's ignored in code
    },
  });

  console.log('✅ Updated system settings with deprecation notices\n');

  // Check if any sellers have Gelato configured
  const sellersWithGelato = await prisma.sellerGelatoSettings.findMany({
    where: { isEnabled: true },
    include: {
      seller: {
        include: {
          store: true,
        },
      },
    },
  });

  console.log(`📊 Current Status:`);
  console.log(`   Sellers with Gelato enabled: ${sellersWithGelato.length}\n`);

  if (sellersWithGelato.length > 0) {
    console.log('✅ Active Seller Gelato Integrations:');
    sellersWithGelato.forEach((settings) => {
      console.log(`   - ${settings.seller.email} (${settings.seller.store?.name || 'No store'})`);
      console.log(`     Verified: ${settings.isVerified ? '✅' : '❌'}`);
      console.log(`     Store ID: ${settings.gelatoStoreId || 'N/A'}\n`);
    });
  } else {
    console.log('⚠️  No sellers have configured Gelato yet.');
    console.log('   Sellers can configure via: POST /seller/gelato\n');
  }

  console.log('📝 Migration Complete!\n');
  console.log('System-wide settings are now deprecated.');
  console.log('Each seller must enable Gelato individually via /seller/gelato endpoint.\n');
}

main()
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
