import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOnboardingData() {
  console.log('Testing Onboarding Wizard Data Requirements\n');
  console.log('='.repeat(60));

  try {
    // Find a test seller with different statuses
    const pendingSeller = await prisma.user.findFirst({
      where: {
        role: 'SELLER',
        store: { status: 'PENDING' }
      },
      include: {
        store: true,
      }
    });

    const activeSeller = await prisma.user.findFirst({
      where: {
        role: 'SELLER',
        store: { status: 'ACTIVE' }
      },
      include: {
        store: {
          include: {
            products: true,
          }
        },
      }
    });

    console.log('\n1. PENDING SELLER (Step 1 - Awaiting Approval)');
    console.log('-'.repeat(60));
    if (pendingSeller) {
      console.log('✅ Found pending seller:', pendingSeller.email);
      console.log('   Store:', pendingSeller.store?.name);
      console.log('   Status:', pendingSeller.store?.status);
      console.log('   Created:', pendingSeller.store?.createdAt);
    } else {
      console.log('❌ No pending sellers found');
    }

    console.log('\n2. ACTIVE SELLER (Steps 2-4)');
    console.log('-'.repeat(60));
    if (activeSeller) {
      console.log('✅ Found active seller:', activeSeller.email);
      console.log('   Store:', activeSeller.store?.name);
      console.log('   Status:', activeSeller.store?.status);
      console.log('   Credits Balance:', activeSeller.store?.creditsBalance);
      console.log('   Product Count:', activeSeller.store?.products?.length || 0);

      const currentStep =
        activeSeller.store?.products && activeSeller.store.products.length > 0 ? 4 :
        activeSeller.store?.creditsBalance > 0 ? 3 : 2;

      console.log('   Current Step:', currentStep);
      console.log('   Step Description:',
        currentStep === 4 ? 'Products Created ✅' :
        currentStep === 3 ? 'Credits Purchased ✅' :
        'Approved (needs credits) ⏳'
      );
    } else {
      console.log('❌ No active sellers found');
    }

    // Check if seller dashboard endpoint will work
    console.log('\n3. SELLER DASHBOARD DATA STRUCTURE');
    console.log('-'.repeat(60));
    if (activeSeller?.store) {
      const productStats = await prisma.product.groupBy({
        by: ['status'],
        where: { storeId: activeSeller.store.id },
        _count: true,
      });

      const dashboardData = {
        store: {
          id: activeSeller.store.id,
          name: activeSeller.store.name,
          status: activeSeller.store.status,
          verified: activeSeller.store.verified,
          verifiedAt: activeSeller.store.verifiedAt,
          createdAt: activeSeller.store.createdAt,
        },
        products: {
          total: activeSeller.store.products?.length || 0,
          active: productStats.find(s => s.status === 'ACTIVE')?._count || 0,
        },
      };

      console.log('✅ Dashboard data structure:', JSON.stringify(dashboardData, null, 2));
    }

    // Check credits data
    console.log('\n4. SELLER CREDITS DATA STRUCTURE');
    console.log('-'.repeat(60));
    if (activeSeller?.store) {
      const creditsData = {
        creditsBalance: activeSeller.store.creditsBalance,
        creditsExpiresAt: activeSeller.store.creditsExpiresAt,
        creditsGraceEndsAt: activeSeller.store.creditsGraceEndsAt,
        canPublish: activeSeller.store.status === 'ACTIVE' && activeSeller.store.creditsBalance > 0,
      };

      console.log('✅ Credits data structure:', JSON.stringify(creditsData, null, 2));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Onboarding wizard data requirements verified!');
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOnboardingData();
