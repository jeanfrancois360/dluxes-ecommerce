import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function disableEasyPost() {
  console.log('🔧 Temporarily disabling EasyPost to speed up checkout...');

  try {
    const setting = await prisma.systemSetting.update({
      where: { key: 'easypost_enabled' },
      data: { value: false },
    });

    console.log('✅ EasyPost disabled successfully');
    console.log(`   Setting: ${setting.key} = ${setting.value}`);
    console.log('');
    console.log('ℹ️  Shipping will now use fallback providers:');
    console.log('   - DHL API (if configured)');
    console.log('   - Shipping Zones');
    console.log('   - Manual rates (final fallback)');
    console.log('');
    console.log('💡 To re-enable EasyPost later:');
    console.log('   - Go to Admin → Settings → Shipping');
    console.log('   - Toggle "Enable EasyPost" back on');
    console.log('   - Or run: pnpm tsx packages/database/scripts/enable-easypost.ts');
  } catch (error) {
    console.error('❌ Failed to disable EasyPost:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

disableEasyPost();
