import { PrismaClient, SettingValueType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedInventorySettings() {
  console.log('🔧 Seeding inventory settings...');

  const inventorySettings = [
    {
      key: 'inventory.low_stock_threshold',
      category: 'inventory',
      value: 10,
      valueType: SettingValueType.NUMBER,
      label: 'Low Stock Threshold',
      description: 'Products with inventory at or below this level are considered low stock',
      isPublic: true,
      isEditable: true,
      requiresRestart: false,
      defaultValue: 10,
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.auto_sku_generation',
      category: 'inventory',
      value: true,
      valueType: SettingValueType.BOOLEAN,
      label: 'Auto SKU Generation',
      description: 'Automatically generate SKUs for new products if not provided',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true,
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.sku_prefix',
      category: 'inventory',
      value: 'PROD',
      valueType: SettingValueType.STRING,
      label: 'SKU Prefix',
      description: 'Prefix used for auto-generated SKUs',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: 'PROD',
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.enable_stock_notifications',
      category: 'inventory',
      value: true,
      valueType: SettingValueType.BOOLEAN,
      label: 'Enable Stock Notifications',
      description: 'Send email notifications when products are low on stock',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: true,
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.notification_recipients',
      category: 'inventory',
      value: ['inventory@luxury.com', 'admin@luxury.com'],
      valueType: SettingValueType.ARRAY,
      label: 'Stock Notification Recipients',
      description: 'Email addresses to receive low stock notifications',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: ['inventory@luxury.com'],
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.allow_negative_stock',
      category: 'inventory',
      value: false,
      valueType: SettingValueType.BOOLEAN,
      label: 'Allow Negative Stock',
      description: 'Allow products to have negative inventory (backorders)',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: false,
      lastUpdatedBy: 'system',
    },
    {
      key: 'inventory.transaction_history_page_size',
      category: 'inventory',
      value: 20,
      valueType: SettingValueType.NUMBER,
      label: 'Transaction History Page Size',
      description: 'Number of inventory transactions to show per page',
      isPublic: true,
      isEditable: true,
      requiresRestart: false,
      defaultValue: 20,
      lastUpdatedBy: 'system',
    },
  ];

  for (const setting of inventorySettings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {
        ...setting,
        updatedAt: new Date(),
      },
      create: setting,
    });
  }

  console.log('✅ Inventory settings seeded successfully');
}

// Run if called directly
if (require.main === module) {
  seedInventorySettings()
    .catch((e) => {
      console.error('❌ Error seeding inventory settings:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
