# Subscription Tier Management Guide

This guide explains how to easily update and manage subscription plans after your app is launched. The subscription system is now **fully database-driven**, meaning you can update plans without code changes or redeployment.

## Overview

Previously, subscription tiers were hardcoded in the codebase, requiring code changes and redeployment to update. Now, all subscription tiers are stored in the database and fetched dynamically, making updates instant and easy.

## How It Works

1. **Database Storage**: All subscription tiers are stored in the `subscription_tiers` table
2. **Dynamic Fetching**: The frontend and API endpoints fetch tiers from the database
3. **Admin API**: Use the admin API endpoints to update tiers without touching code
4. **No Redeployment**: Changes take effect immediately without code changes

## Environment Setup

Add your admin phone numbers to `.env.local`:

```bash
# Admin phone numbers (comma-separated)
# These users will have access to the admin API endpoints
ADMIN_PHONE_NUMBERS=+254712345678,+254798765432
```

**Important**: Use the exact phone number format that users have in your database (including country code).

## Admin API Endpoints

All admin endpoints require authentication and admin privileges.

### 1. Get All Tiers

```bash
GET /api/admin/subscriptions/tiers
```

**Response:**
```json
{
  "tiers": [
    {
      "id": "free",
      "name": "Free",
      "price_kes": 0,
      "active_listings_limit": 25,
      "features": ["Basic selling", "Up to 25 active listings"],
      "paystack_plan_code": null,
      "created_at": "2024-01-01T00:00:00Z"
    },
    ...
  ]
}
```

### 2. Update a Tier

```bash
PUT /api/admin/subscriptions/tiers/[tier_id]
Content-Type: application/json

{
  "name": "Base Plan",
  "price_kes": 500,
  "active_listings_limit": 150,
  "features": ["Up to 150 active listings", "Basic analytics", "Priority in search"],
  "paystack_plan_code": "PLN_xxxxx"
}
```

**Example:**
```bash
curl -X PUT https://your-domain.com/api/admin/subscriptions/tiers/base \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "price_kes": 500,
    "active_listings_limit": 150
  }'
```

**Updatable Fields:**
- `name`: Display name of the tier
- `price_kes`: Price in Kenyan Shillings
- `active_listings_limit`: Maximum active listings (null for unlimited)
- `features`: Array of feature strings
- `paystack_plan_code`: Paystack plan code (optional)

### 3. Create a New Tier

```bash
POST /api/admin/subscriptions/tiers
Content-Type: application/json

{
  "id": "premium",
  "name": "Premium",
  "price_kes": 5000,
  "active_listings_limit": null,
  "features": [
    "Unlimited listings",
    "Priority support",
    "Featured seller badge",
    "All Growth features"
  ],
  "paystack_plan_code": "PLN_xxxxx"
}
```

**Example:**
```bash
curl -X POST https://your-domain.com/api/admin/subscriptions/tiers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "premium",
    "name": "Premium",
    "price_kes": 5000,
    "active_listings_limit": null,
    "features": ["Unlimited listings", "Priority support"]
  }'
```

### 4. Delete a Tier

```bash
DELETE /api/admin/subscriptions/tiers/[tier_id]
```

**Important Notes:**
- Cannot delete the `free` tier
- Cannot delete a tier that is currently in use by sellers
- You must migrate sellers to another tier before deletion

**Example:**
```bash
curl -X DELETE https://your-domain.com/api/admin/subscriptions/tiers/old_tier \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Direct Database Updates (Alternative)

If you prefer to update tiers directly in the database:

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → `subscription_tiers`
3. Click on a row to edit, or use the SQL Editor

### Using SQL

```sql
-- Update a tier's price
UPDATE subscription_tiers
SET price_kes = 500
WHERE id = 'base';

-- Update features
UPDATE subscription_tiers
SET features = '["Up to 150 active listings", "Basic analytics", "Priority in search"]'::jsonb
WHERE id = 'base';

-- Add a new tier
INSERT INTO subscription_tiers (id, name, price_kes, active_listings_limit, features)
VALUES (
  'premium',
  'Premium',
  5000,
  NULL,
  '["Unlimited listings", "Priority support"]'::jsonb
);
```

## Common Update Scenarios

### Scenario 1: Change Plan Pricing

**Via Admin API:**
```bash
PUT /api/admin/subscriptions/tiers/base
{
  "price_kes": 500
}
```

**Via SQL:**
```sql
UPDATE subscription_tiers SET price_kes = 500 WHERE id = 'base';
```

### Scenario 2: Change Listing Limits

**Via Admin API:**
```bash
PUT /api/admin/subscriptions/tiers/growth
{
  "active_listings_limit": 400
}
```

**Via SQL:**
```sql
UPDATE subscription_tiers SET active_listings_limit = 400 WHERE id = 'growth';
```

### Scenario 3: Update Features

**Via Admin API:**
```bash
PUT /api/admin/subscriptions/tiers/pro
{
  "features": [
    "Unlimited listings",
    "Priority support",
    "Featured seller badge",
    "Demand insights dashboard",
    "All Growth features",
    "New Feature: Custom branding"
  ]
}
```

**Via SQL:**
```sql
UPDATE subscription_tiers
SET features = '["Unlimited listings", "Priority support", "New Feature"]'::jsonb
WHERE id = 'pro';
```

### Scenario 4: Add a New Plan

**Via Admin API:**
```bash
POST /api/admin/subscriptions/tiers
{
  "id": "enterprise",
  "name": "Enterprise",
  "price_kes": 10000,
  "active_listings_limit": null,
  "features": [
    "Unlimited listings",
    "Dedicated account manager",
    "Custom integrations",
    "All Pro features"
  ]
}
```

## Important Notes

### 1. Existing Subscriptions
- Changing a tier's price **does not affect** existing active subscriptions
- Users will continue paying their original price until renewal
- New subscriptions will use the updated price

### 2. Feature Updates
- Feature list changes are immediately visible on the plan page
- This is cosmetic - actual feature enforcement is handled in your code

### 3. Listing Limits
- Changes to `active_listings_limit` take effect immediately
- Existing sellers may need to adjust their listings if the limit decreases
- Consider notifying affected sellers before reducing limits

### 4. Tier IDs
- Tier IDs (like `free`, `base`, `growth`, `pro`) are used throughout the system
- Changing an ID requires updating all references in the database
- It's safer to keep IDs the same and just update other fields

### 5. Free Tier
- The `free` tier cannot be deleted
- It's used as the default tier for new sellers
- Ensure it always exists in your database

## Testing Changes

After updating tiers:

1. **Check the Plan Page**: Visit `/plan` to see updated tiers
2. **Test Payment Flow**: Try upgrading to ensure payment amounts are correct
3. **Verify Limits**: Check that listing limits are enforced correctly
4. **Check API Response**: Verify `/api/subscriptions/tiers` returns updated data

## Troubleshooting

### Changes Not Appearing

1. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Check Database**: Verify the update was saved in `subscription_tiers` table
3. **Check API**: Call `/api/subscriptions/tiers` directly to see the response
4. **Check Logs**: Look for errors in your server logs

### Admin Access Denied

1. **Verify Phone Number**: Ensure your phone number is in `ADMIN_PHONE_NUMBERS`
2. **Check Format**: Phone number must match exactly (including country code)
3. **Restart Server**: After updating `.env.local`, restart your server

### Payment Issues

1. **Verify Paystack Plan Code**: If using Paystack subscriptions, ensure `paystack_plan_code` is correct
2. **Check Amount**: Verify `price_kes` matches your Paystack plan amount
3. **Test Payment**: Use Paystack test mode to verify payments work

## Best Practices

1. **Test in Development First**: Always test tier changes in a development environment
2. **Notify Users**: Inform users of pricing changes before making them
3. **Gradual Rollout**: Consider A/B testing new pricing
4. **Backup Database**: Before major changes, backup your `subscription_tiers` table
5. **Document Changes**: Keep a changelog of tier updates
6. **Monitor Impact**: Watch for changes in subscription rates after updates

## Migration from Hardcoded Tiers

If you're migrating from the old hardcoded system:

1. ✅ **Already Done**: The codebase has been updated to fetch from the database
2. ✅ **Database Ready**: Your `subscription_tiers` table should already have the tiers
3. ✅ **Fallback Removed**: Hardcoded constants are no longer used (except as TypeScript types)

The system is now fully database-driven!

## Support

If you encounter issues:
1. Check the database directly: `SELECT * FROM subscription_tiers;`
2. Test the API: `GET /api/subscriptions/tiers`
3. Check server logs for errors
4. Verify admin phone numbers in environment variables

