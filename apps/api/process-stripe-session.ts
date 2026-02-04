import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

const prisma = new PrismaClient();

async function processStripeSession() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.log('❌ Usage: pnpm ts-node process-stripe-session.ts <session_id>');
    console.log('📝 Example: pnpm ts-node process-stripe-session.ts cs_test_a1b2c3d4...');
    console.log('');
    console.log('💡 Get the session_id from the URL:');
    console.log('   http://localhost:3000/seller/credits/success?session_id=YOUR_SESSION_ID');
    process.exit(1);
  }

  console.log('🔍 Processing Stripe session:', sessionId, '\n');

  try {
    // Initialize Stripe
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY not found in environment variables');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-12-18.acacia',
    });

    // Retrieve session from Stripe
    console.log('📡 Fetching session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent'],
    });

    console.log('✅ Session retrieved:');
    console.log(`   Status: ${session.payment_status}`);
    console.log(`   Amount: $${(session.amount_total || 0) / 100}`);
    console.log(`   Customer Email: ${session.customer_email}`);
    console.log('');

    // Verify this is a credit package purchase
    if (session.metadata?.type !== 'credit_package') {
      console.log('❌ This is not a credit package purchase session');
      console.log(`   Metadata type: ${session.metadata?.type || 'none'}`);
      process.exit(1);
    }

    // Verify payment succeeded
    if (session.payment_status !== 'paid') {
      console.log('❌ Payment not completed');
      console.log(`   Payment status: ${session.payment_status}`);
      process.exit(1);
    }

    const { userId, packageId, credits, packageName } = session.metadata;

    console.log('📦 Package Details:');
    console.log(`   Package: ${packageName}`);
    console.log(`   Credits: ${credits}`);
    console.log(`   User ID: ${userId}`);
    console.log('');

    // Check if already processed
    const existingTransaction = await prisma.creditTransaction.findFirst({
      where: {
        action: 'purchase_package',
        packageId,
        description: { contains: sessionId },
      },
    });

    if (existingTransaction) {
      console.log('⚠️  This session has already been processed!');
      console.log(`   Transaction ID: ${existingTransaction.id}`);
      console.log(`   Processed at: ${existingTransaction.createdAt.toLocaleString()}`);
      process.exit(0);
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      console.log('❌ User not found:', userId);
      process.exit(1);
    }

    console.log('👤 User:', `${user.firstName} ${user.lastName}`, `(${user.email})`);
    console.log('');

    // Get current balance
    let balance = await prisma.creditBalance.findUnique({
      where: { userId },
    });

    if (!balance) {
      console.log('⚠️  No credit balance found, creating one...');
      balance = await prisma.creditBalance.create({
        data: {
          userId,
          availableCredits: 0,
          lifetimeCredits: 0,
          purchasedCredits: 0,
          bonusCredits: 0,
          lifetimeUsed: 0,
        },
      });
    }

    const creditsAmount = parseInt(credits, 10);
    const oldBalance = balance.availableCredits;
    const newBalance = oldBalance + creditsAmount;

    console.log('💳 Processing Payment:');
    console.log(`   Current Balance: ${oldBalance} credits`);
    console.log(`   Adding: ${creditsAmount} credits`);
    console.log(`   New Balance: ${newBalance} credits`);
    console.log('');

    // Process the purchase
    await prisma.$transaction(async (tx) => {
      // Update balance
      await tx.creditBalance.update({
        where: { id: balance.id },
        data: {
          availableCredits: newBalance,
          lifetimeCredits: { increment: creditsAmount },
          purchasedCredits: { increment: creditsAmount },
        },
      });

      // Create transaction record
      await tx.creditTransaction.create({
        data: {
          balanceId: balance.id,
          type: 'PURCHASE',
          amount: creditsAmount,
          balanceBefore: oldBalance,
          balanceAfter: newBalance,
          action: 'purchase_package',
          packageId,
          description: `Purchased ${packageName} (${creditsAmount} credits) - Stripe Session: ${sessionId}`,
        },
      });
    });

    console.log('✅ Payment processed successfully!');
    console.log('');
    console.log('📊 Updated Balance:');

    const updatedBalance = await prisma.creditBalance.findUnique({
      where: { userId },
    });

    console.log(`   Available: ${updatedBalance?.availableCredits || 0} credits`);
    console.log(`   Lifetime: ${updatedBalance?.lifetimeCredits || 0} credits`);
    console.log(`   Purchased: ${updatedBalance?.purchasedCredits || 0} credits`);
    console.log('');
    console.log('🎉 Done! User can now see updated credits in the app.');
    console.log('   💡 User may need to refresh browser (Cmd+Shift+R) to see changes.');

  } catch (error: any) {
    console.error('❌ Error processing session:', error.message);
    if (error.type === 'StripeInvalidRequestError') {
      console.log('');
      console.log('💡 Common issues:');
      console.log('   - Invalid session ID format');
      console.log('   - Session not found in Stripe');
      console.log('   - Wrong Stripe account (test vs live mode)');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

processStripeSession().catch(console.error);
