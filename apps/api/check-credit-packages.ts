import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCreditPackages() {
  console.log('Checking Credit Packages in Database...\n');

  const packages = await prisma.creditPackage.findMany({
    orderBy: { credits: 'asc' },
  });

  if (packages.length === 0) {
    console.log('❌ No credit packages found in database!');
    console.log('\nYou need to seed credit packages. Example:');
    console.log(`
await prisma.creditPackage.createMany({
  data: [
    {
      name: 'Starter Pack',
      description: 'Perfect for trying out the platform',
      credits: 10,
      price: 9.99,
      currency: 'USD',
      savingsPercent: 0,
      isPopular: false,
      displayOrder: 1,
      isActive: true,
    },
    {
      name: 'Value Pack',
      description: 'Best value for regular sellers',
      credits: 50,
      price: 39.99,
      currency: 'USD',
      savingsPercent: 20,
      savingsLabel: 'Save 20%',
      isPopular: true,
      displayOrder: 2,
      isActive: true,
    },
    {
      name: 'Pro Pack',
      description: 'For high-volume sellers',
      credits: 100,
      price: 69.99,
      currency: 'USD',
      savingsPercent: 30,
      savingsLabel: 'Best Deal',
      isPopular: false,
      displayOrder: 3,
      isActive: true,
    },
  ],
});
    `);
  } else {
    console.log('✅ Found credit packages:\n');
    packages.forEach((pkg) => {
      console.log(`Package: ${pkg.name}`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Credits: ${pkg.credits}`);
      console.log(`  Price: $${pkg.price}`);
      console.log(`  Popular: ${pkg.isPopular ? 'Yes' : 'No'}`);
      console.log(`  Active: ${pkg.isActive ? 'Yes' : 'No'}`);
      console.log(`  Savings: ${pkg.savingsPercent}%`);
      console.log('');
    });
  }

  // Check for the specific package that should have 50 credits
  const fiftyCreditsPackage = packages.find(p => p.credits === 50);
  if (fiftyCreditsPackage) {
    console.log('✅ Found 50-credit package:', fiftyCreditsPackage.name);
  } else {
    console.log('❌ No 50-credit package found!');
    console.log('   Available credit amounts:', packages.map(p => p.credits).join(', '));
  }

  await prisma.$disconnect();
}

checkCreditPackages().catch(console.error);
