const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enableEasyPost() {
  console.log('🔧 Enabling EasyPost integration...\n');

  try {
    // Enable EasyPost
    await prisma.systemSetting.update({
      where: { key: 'easypost_enabled' },
      data: { value: true },
    });
    console.log('✅ easypost_enabled = true');

    // Set API key from environment
    const apiKey =
      process.env.EASYPOST_API_KEY || 'EZTKc44aba3f57f8471ca9f0277ab3200059q76d49lVTwqLyXrRLEhB5Q';
    await prisma.systemSetting.update({
      where: { key: 'easypost_api_key' },
      data: { value: apiKey },
    });
    console.log(`✅ easypost_api_key = ${apiKey.substring(0, 15)}...`);

    // Ensure test mode is enabled
    await prisma.systemSetting.update({
      where: { key: 'easypost_test_mode' },
      data: { value: true },
    });
    console.log('✅ easypost_test_mode = true');

    console.log('\n✅ EasyPost integration enabled successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Restart the API server');
    console.log('   2. Test with: GET http://localhost:4000/api/v1/easypost/test');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enableEasyPost();
