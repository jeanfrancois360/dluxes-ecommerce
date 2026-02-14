#!/usr/bin/env tsx
/**
 * Quick Admin User Creation Script
 * Usage: pnpm tsx scripts/create-admin-quick.ts "password" ["name"]
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Create Admin User for Production                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const email = 'admin@nextpik.com';
  const password = process.argv[2];
  const firstName = process.argv[3] || 'NextPik';
  const lastName = process.argv[4] || 'Admin';

  if (!password || password.length < 8) {
    console.log(
      '❌ Usage: pnpm tsx scripts/create-admin-quick.ts "YOUR_PASSWORD" ["FirstName"] ["LastName"]'
    );
    console.log('   Password must be at least 8 characters\n');
    process.exit(1);
  }

  try {
    console.log('🔍 Checking database connection...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⚠️  User ${email} already exists. Updating...\n`);

      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: true,
          firstName,
          lastName,
        },
      });

      console.log('✅ Admin user updated successfully!\n');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Name:', `${updatedUser.firstName} ${updatedUser.lastName}`);
      console.log('🔑 Role:', updatedUser.role);
      console.log('✓ Email verified: true\n');
    } else {
      console.log('🔨 Creating new admin user...\n');

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: 'SUPER_ADMIN',
          emailVerified: true,
        },
      });

      console.log('✅ Admin user created successfully!\n');
      console.log('📧 Email:', newUser.email);
      console.log('👤 Name:', `${newUser.firstName} ${newUser.lastName}`);
      console.log('🔑 Role:', newUser.role);
      console.log('✓ Email verified: true\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔐 Login Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n✅ You can now login at your production site\n');
    console.log('⚠️  IMPORTANT: Change this password after first login!\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
