# Outfittr Monetization Setup Guide

This guide explains how to set up the monetization features for Outfittr: seller subscriptions and product boosts.

## Environment Variables

Add these to your `.env.local` file:

```bash
# ===========================================
# STRIPE (Card Subscriptions)
# ===========================================
# Get these from https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Create these products/prices in Stripe Dashboard
# Products → Add Product → Set up recurring pricing
STRIPE_PRICE_BASE=price_xxx      # Base plan: KSh 400/month
STRIPE_PRICE_GROWTH=price_xxx    # Growth plan: KSh 1,000/month
STRIPE_PRICE_PRO=price_xxx       # Pro plan: KSh 4,000/month

# ===========================================
# FLUTTERWAVE (M-Pesa Payments)
# ===========================================
# Get these from https://dashboard.flutterwave.com/settings/api
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_WEBHOOK_SECRET=xxx
FLUTTERWAVE_ENCRYPTION_KEY=xxx
```

## Database Migration

Run the monetization migration to create the required tables:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase Dashboard:
# Copy contents of supabase/migrations/013_monetization.sql
```

## Stripe Setup

### 1. Create Products in Stripe Dashboard

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create three subscription products:

| Product | Price | Billing |
|---------|-------|---------|
| Outfittr Base | KSh 400 | Monthly recurring |
| Outfittr Growth | KSh 1,000 | Monthly recurring |
| Outfittr Pro | KSh 4,000 | Monthly recurring |

3. Copy each price ID (starts with `price_`) to your env vars

### 2. Set Up Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events to listen:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 3. Local Testing with Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Use the webhook secret it prints
```

## Flutterwave Setup

### 1. Get API Keys

1. Create account at [Flutterwave](https://dashboard.flutterwave.com)
2. Go to Settings → API Keys
3. Copy Public Key and Secret Key

### 2. Set Up Webhook

1. Go to Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/flutterwave`
3. Copy the secret hash to `FLUTTERWAVE_WEBHOOK_SECRET`

### 3. Enable M-Pesa

1. Go to Settings → Payment Methods
2. Enable M-Pesa Kenya
3. Complete KYC if required

### 4. Test M-Pesa

Use Flutterwave's test phone numbers in sandbox mode:
- Success: Use any Safaricom number format (0712345678)
- Sandbox will simulate STK push

## Subscription Tiers

| Tier | Price | Listings Limit | Features |
|------|-------|----------------|----------|
| Free | KSh 0 | 25 | Basic selling |
| Base | KSh 400/mo | 100 | + Basic analytics, priority search |
| Growth | KSh 1,000/mo | 300 | + Bulk tools, auto-relist, trending badge |
| Pro | KSh 4,000/mo | Unlimited | + Priority support, featured badge, demand insights |

## Boost Packages

| Package | Price | Duration | Visibility |
|---------|-------|----------|------------|
| Quick Boost | KSh 50 | 24 hours | Top of category |
| Weekly Boost | KSh 200 | 7 days | Top of category |
| Featured | KSh 600 | 30 days | Homepage carousel + category top |

## API Endpoints

### Subscriptions

```
GET  /api/subscriptions          # Get current user's plan
GET  /api/subscriptions/tiers    # Get all available tiers
```

### Payments

```
POST /api/payments/stripe/checkout  # Create Stripe checkout session
POST /api/payments/stripe/portal    # Open Stripe customer portal
POST /api/payments/mpesa/initiate   # Initiate M-Pesa STK push
```

### Boosts

```
GET  /api/boosts                 # Get boost packages and active boosts
POST /api/boosts                 # Check boost status for a product
```

### Webhooks

```
POST /api/webhooks/stripe        # Stripe webhook handler
POST /api/webhooks/flutterwave   # Flutterwave webhook handler
```

## Testing Checklist

- [ ] Create Stripe test products and prices
- [ ] Test Stripe checkout flow with test card `4242 4242 4242 4242`
- [ ] Test M-Pesa STK push in Flutterwave sandbox
- [ ] Verify webhook handling with Stripe CLI
- [ ] Test listing limit enforcement (create 25+ listings on free)
- [ ] Test boost purchase and visibility sorting

## Production Deployment

1. Switch to live API keys in production environment
2. Update webhook URLs to production domain
3. Complete Flutterwave KYC for live M-Pesa
4. Set up Stripe billing portal customization
5. Configure subscription reminder emails (optional)

## Troubleshooting

### Stripe webhooks not received
- Verify webhook URL is correct
- Check webhook signing secret matches
- Ensure server is accessible from internet

### M-Pesa STK push not appearing
- Verify phone number format (should be 254XXXXXXXXX)
- Check Flutterwave sandbox mode is enabled
- Confirm M-Pesa is enabled in Flutterwave settings

### Listing limit not enforced
- Run the database migration
- Check `seller_plans` table has correct data
- Verify `can_seller_create_listing` function exists

## Files Reference

```
lib/
├── stripe.ts                    # Stripe SDK wrapper
├── flutterwave.ts               # Flutterwave SDK wrapper

app/api/
├── payments/
│   ├── stripe/
│   │   ├── checkout/route.ts    # Stripe checkout
│   │   └── portal/route.ts      # Customer portal
│   └── mpesa/
│       └── initiate/route.ts    # M-Pesa STK push
├── webhooks/
│   ├── stripe/route.ts          # Stripe webhooks
│   └── flutterwave/route.ts     # Flutterwave webhooks
├── subscriptions/
│   ├── route.ts                 # User's subscription
│   └── tiers/route.ts           # Available tiers
└── boosts/
    └── route.ts                 # Boost management

components/monetization/
├── BoostButton.tsx              # Boost CTA button
├── BoostModal.tsx               # Boost package selection
└── PlanLimitsBanner.tsx         # Usage/limit display

app/(seller)/
├── plan/page.tsx                # Plan management page
└── dashboard/page.tsx           # Updated with monetization

supabase/migrations/
└── 013_monetization.sql         # Database schema

types/index.ts                   # Monetization types
```

