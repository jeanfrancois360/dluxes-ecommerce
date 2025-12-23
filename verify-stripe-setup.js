#!/usr/bin/env node

/**
 * Stripe Configuration Verification Script
 *
 * This script checks if your Stripe API keys are properly configured.
 * Run this after adding your Stripe keys to verify the setup.
 *
 * Usage: node verify-stripe-setup.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Verifying Stripe Configuration...\n');

// Check frontend .env.local
const frontendEnvPath = path.join(__dirname, 'apps/web/.env.local');
let frontendConfig = { exists: false, hasKey: false, isValid: false, key: '' };

if (fs.existsSync(frontendEnvPath)) {
  frontendConfig.exists = true;
  const content = fs.readFileSync(frontendEnvPath, 'utf8');
  const match = content.match(/NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=(.+)/);

  if (match && match[1]) {
    frontendConfig.hasKey = true;
    frontendConfig.key = match[1].trim();

    // Check if it's a valid format (not placeholder)
    if (
      frontendConfig.key.startsWith('pk_test_') &&
      frontendConfig.key.length > 20 &&
      !frontendConfig.key.includes('your_') &&
      !frontendConfig.key.includes('here')
    ) {
      frontendConfig.isValid = true;
    }
  }
}

// Check backend .env
const backendEnvPath = path.join(__dirname, 'apps/api/.env');
let backendConfig = { exists: false, hasKey: false, isValid: false, key: '' };

if (fs.existsSync(backendEnvPath)) {
  backendConfig.exists = true;
  const content = fs.readFileSync(backendEnvPath, 'utf8');
  const match = content.match(/STRIPE_SECRET_KEY=["']?([^"'\n]+)["']?/);

  if (match && match[1]) {
    backendConfig.hasKey = true;
    backendConfig.key = match[1].trim();

    // Check if it's a valid format (not placeholder or empty)
    if (
      backendConfig.key.startsWith('sk_test_') &&
      backendConfig.key.length > 20 &&
      !backendConfig.key.includes('your_') &&
      !backendConfig.key.includes('here')
    ) {
      backendConfig.isValid = true;
    }
  }
}

// Report Results
console.log('📱 Frontend Configuration (apps/web/.env.local):');
console.log('   File exists:', frontendConfig.exists ? '✅' : '❌');
console.log('   Has NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', frontendConfig.hasKey ? '✅' : '❌');

if (frontendConfig.hasKey) {
  const maskedKey = frontendConfig.key.substring(0, 12) + '...' + frontendConfig.key.substring(frontendConfig.key.length - 4);
  console.log('   Key format:', frontendConfig.isValid ? '✅ Valid' : '❌ Invalid');
  console.log('   Key preview:', maskedKey);

  if (!frontendConfig.isValid) {
    if (frontendConfig.key.includes('your_') || frontendConfig.key.includes('here')) {
      console.log('   ⚠️  Still using placeholder value!');
    } else if (!frontendConfig.key.startsWith('pk_test_')) {
      console.log('   ⚠️  Key should start with "pk_test_"');
    }
  }
}

console.log('\n🔧 Backend Configuration (apps/api/.env):');
console.log('   File exists:', backendConfig.exists ? '✅' : '❌');
console.log('   Has STRIPE_SECRET_KEY:', backendConfig.hasKey ? '✅' : '❌');

if (backendConfig.hasKey) {
  const maskedKey = backendConfig.key.substring(0, 12) + '...' + backendConfig.key.substring(backendConfig.key.length - 4);
  console.log('   Key format:', backendConfig.isValid ? '✅ Valid' : '❌ Invalid');
  console.log('   Key preview:', maskedKey);

  if (!backendConfig.isValid) {
    if (backendConfig.key === '' || backendConfig.key.length < 10) {
      console.log('   ⚠️  Key is empty or too short!');
    } else if (backendConfig.key.includes('your_') || backendConfig.key.includes('here')) {
      console.log('   ⚠️  Still using placeholder value!');
    } else if (!backendConfig.key.startsWith('sk_test_')) {
      console.log('   ⚠️  Key should start with "sk_test_"');
    }
  }
}

// Final Summary
console.log('\n📊 Summary:');

const allValid = frontendConfig.isValid && backendConfig.isValid;

if (allValid) {
  console.log('✅ Stripe is properly configured!');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your dev server: pnpm dev');
  console.log('   2. Navigate to /checkout in your app');
  console.log('   3. Test payment with card: 4242 4242 4242 4242');
  console.log('\n💡 Test cards available in STRIPE_SETUP_GUIDE.md');
} else {
  console.log('❌ Stripe configuration incomplete\n');

  console.log('🔧 To fix:');

  if (!frontendConfig.isValid) {
    console.log('\n   Frontend (apps/web/.env.local):');
    console.log('   1. Go to https://dashboard.stripe.com/test/apikeys');
    console.log('   2. Copy your Publishable key (starts with pk_test_)');
    console.log('   3. Replace the value in .env.local');
    console.log('      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE');
  }

  if (!backendConfig.isValid) {
    console.log('\n   Backend (apps/api/.env):');
    console.log('   1. Go to https://dashboard.stripe.com/test/apikeys');
    console.log('   2. Copy your Secret key (starts with sk_test_)');
    console.log('   3. Add it to .env (or reveal and copy if hidden)');
    console.log('      STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE');
  }

  console.log('\n📖 For detailed instructions, see: STRIPE_SETUP_GUIDE.md');
}

console.log('\n');

process.exit(allValid ? 0 : 1);
