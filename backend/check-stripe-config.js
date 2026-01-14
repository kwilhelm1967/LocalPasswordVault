require('dotenv').config();

console.log('\n=== Stripe Configuration Check ===\n');

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (stripeKey) {
  console.log('✅ STRIPE_SECRET_KEY is SET');
  console.log(`   Key starts with: ${stripeKey.substring(0, 10)}...`);
  console.log(`   Key type: ${stripeKey.startsWith('sk_live_') ? 'LIVE' : stripeKey.startsWith('sk_test_') ? 'TEST' : 'UNKNOWN'}`);
} else {
  console.log('❌ STRIPE_SECRET_KEY is NOT SET');
  console.log('   This will cause checkout to fail with 500 error');
  console.log('   Set it in your .env file or environment variables');
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (webhookSecret) {
  console.log('✅ STRIPE_WEBHOOK_SECRET is SET');
} else {
  console.log('⚠️  STRIPE_WEBHOOK_SECRET is NOT SET (optional for checkout, required for webhooks)');
}

console.log('\n=== End Check ===\n');
