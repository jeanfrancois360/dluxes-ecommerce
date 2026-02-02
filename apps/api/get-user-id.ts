import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUserId() {
  const email = process.argv[2] || 'jeanfrancoismunyaneza@gmail.com';

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  if (!user) {
    console.log(`❌ User not found: ${email}`);
  } else {
    console.log(`✅ User found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`\n📋 To add 50 credits, run:`);
    console.log(`   pnpm ts-node apps/api/add-credits-manual.ts ${user.id} 50`);
  }

  await prisma.$disconnect();
}

getUserId().catch(console.error);
