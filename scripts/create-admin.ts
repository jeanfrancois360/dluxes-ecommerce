#!/usr/bin/env tsx
/**
 * Create Admin User Script
 * Creates a super admin user for production
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as readline from 'readline';

const prisma = new PrismaClient();

function askQuestion(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function createAdmin() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Create Admin User for Production                  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Get user details
  const email = 'admin@nextpik.com';
  const name = await askQuestion('Enter admin name (default: Admin User): ');
  const password = await askQuestion('Enter admin password (min 8 characters): ');

  if (!password || password.length < 8) {
    console.log('\n❌ Password must be at least 8 characters long\n');
    process.exit(1);
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists!`);
      const update = await askQuestion('Update password for existing user? (yes/no): ');

      if (update.toLowerCase() !== 'yes') {
        console.log('\n❌ Operation cancelled\n');
        process.exit(0);
      }

      // Update existing user
      const hashedPassword = await bcrypt.hash(password, 10);

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          emailVerified: true,
          name: name || existingUser.name,
        },
      });

      console.log('\n✅ Admin user updated successfully!\n');
      console.log('📧 Email:', updatedUser.email);
      console.log('👤 Name:', updatedUser.name);
      console.log('🔑 Role:', updatedUser.role);
      console.log('✓ Email verified: true\n');
    } else {
      // Create new user
      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || 'Admin User',
          role: 'SUPER_ADMIN',
          emailVerified: true,
        },
      });

      console.log('\n✅ Admin user created successfully!\n');
      console.log('📧 Email:', newUser.email);
      console.log('👤 Name:', newUser.name);
      console.log('🔑 Role:', newUser.role);
      console.log('✓ Email verified: true\n');

      console.log('🔐 Login credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('\n⚠️  Please change the password after first login!\n');
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ You can now login at your production site');
    console.log('═══════════════════════════════════════════════════════════\n');
  } catch (error) {
    console.error('\n❌ Error creating admin user:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
