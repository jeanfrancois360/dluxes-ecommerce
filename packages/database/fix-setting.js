const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSetting() {
  await prisma.systemSetting.upsert({
    where: { key: 'easypost_default_label_format' },
    update: {},
    create: {
      key: 'easypost_default_label_format',
      value: 'PDF',
      valueType: 'STRING',
      category: 'delivery',
      label: 'Default Label Format',
      description: 'Default label format (PNG, PDF, ZPL, EPL2)',
      isPublic: false,
      isEditable: true,
      requiresRestart: false,
      defaultValue: 'PDF',
      validationRule: { enum: ['PNG', 'PDF', 'ZPL', 'EPL2'] },
    },
  });
  console.log('✅ Fixed easypost_default_label_format');
  await prisma.$disconnect();
}

fixSetting();
