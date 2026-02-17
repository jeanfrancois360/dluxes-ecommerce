# 🧹 Production Dry-Run Data Cleanup Guide

This guide helps you safely remove test data created during dry-run testing on your production database.

## ⚠️ Important Safety Notes

1. **This operates on your PRODUCTION database** - be careful!
2. **Always run preview mode first** to see what will be deleted
3. **Consider creating a database backup** before executing
4. **Test users are identified by email patterns** (configurable)
5. **Products are identified by name patterns** (configurable)

---

## 🔍 What Data Will Be Deleted?

The script identifies and deletes:

### Test Users (by email pattern):

- Emails containing: `@test.com`, `@example.com`
- Emails starting with: `test@`, `demo@`
- Emails containing: `+test@`

### Test Products (by name pattern):

- Product names containing: `test`, `demo`, `sample`, `dryrun`
- Products created by test users

### Related Data:

- Orders from test users or containing test products
- Payment transactions for test orders
- Cart items with test products
- Reviews by test users or for test products
- Addresses of test users
- User sessions of test users
- Deliveries for test orders
- Commissions for test orders
- Payouts to test sellers
- Escrow transactions for test orders
- Stores owned by test users

### ✅ What Will NOT Be Deleted:

- System settings (always preserved)
- Categories (unless specified)
- Real customer data (doesn't match test patterns)

---

## 📋 Step-by-Step Usage

### Step 1: Preview What Will Be Deleted

**ALWAYS run this first!**

```bash
# From project root
pnpm cleanup:preview
```

This will show you:

- All test users found
- All test products found
- All test orders found
- All test stores found
- Summary of related records
- Total number of records to delete

**Example output:**

```
📧 Test Users Found:
   - test@example.com (BUYER) - Created: 2026-02-10T10:00:00Z
   - demo@test.com (SELLER) - Created: 2026-02-10T11:00:00Z
   Total: 2

📦 Test Products Found:
   - Test Product 1 - Created: 2026-02-10T12:00:00Z
   - Demo Watch - Created: 2026-02-10T13:00:00Z
   Total: 2

📊 Summary of Related Data:
   - Payment Transactions: 5
   - Reviews: 3
   - Cart Items: 8
   - Addresses: 4
   ...
   📈 TOTAL RECORDS TO DELETE: 45
```

### Step 2: Review the Results

Check the preview output carefully:

✅ **Good signs:**

- Only test emails like `test@example.com`
- Only test product names like "Test Product"
- Counts match your dry-run testing

❌ **Warning signs:**

- Real customer emails appearing
- Production product names appearing
- Unexpectedly high record counts

**If you see any warning signs, STOP and adjust the patterns!**

### Step 3: (Optional) Customize Patterns

Edit `scripts/cleanup-dryrun-data.ts` to adjust what's considered "test data":

```typescript
const DRY_RUN_CONFIG = {
  // Add or modify email patterns
  testEmailPatterns: [
    '@test.com',
    '@example.com',
    'test@',
    '+test@',
    'demo@',
    // Add your patterns here
    '@yourtestdomain.com',
  ],

  // Add or modify product name patterns
  testProductPatterns: [
    'test',
    'demo',
    'sample',
    'dryrun',
    // Add your patterns here
  ],
};
```

### Step 4: Create Database Backup (Recommended)

Before executing deletion, create a backup:

```bash
# If using Docker
docker exec nextpik-postgres pg_dump -U postgres nextpik_ecommerce > backup_before_cleanup_$(date +%Y%m%d_%H%M%S).sql

# If using local PostgreSQL
pg_dump -U postgres nextpik_ecommerce > backup_before_cleanup_$(date +%Y%m%d_%H%M%S).sql
```

### Step 5: Execute Deletion

**Only after reviewing preview and creating backup:**

```bash
pnpm cleanup:execute
```

You'll be asked for **double confirmation**:

```
⚠️  Are you sure you want to DELETE 45 records from production? (yes/no): yes
⚠️  FINAL CONFIRMATION: This action cannot be undone. Proceed? (yes/no): yes
```

Type `yes` for both confirmations.

The script will then:

1. Delete all related data in the correct order (respecting foreign keys)
2. Show progress for each deletion step
3. Run everything in a transaction (all-or-nothing)

**Example output:**

```
⏳ Deleting data in transaction...
   ✓ Deleted 3 escrow transactions
   ✓ Deleted 5 commissions
   ✓ Deleted 2 payouts
   ✓ Deleted 5 payment transactions
   ✓ Deleted 4 deliveries
   ✓ Deleted 8 order items
   ✓ Deleted 3 orders
   ✓ Deleted 3 reviews
   ✓ Deleted 8 cart items
   ✓ Deleted 2 carts
   ✓ Deleted 6 product images
   ✓ Deleted 0 product variants
   ✓ Deleted 2 products
   ✓ Deleted 1 store followers
   ✓ Deleted 1 stores
   ✓ Deleted 4 addresses
   ✓ Deleted 5 user sessions
   ✓ Deleted 2 magic links
   ✓ Deleted 2 users

✅ Deletion complete!
```

---

## 🔄 If Something Goes Wrong

### If deletion fails mid-transaction:

The script uses Prisma transactions, so if any step fails, **ALL changes are rolled back automatically**. Your database remains unchanged.

### If you deleted the wrong data:

Restore from your backup:

```bash
# If using Docker
cat backup_before_cleanup_20260210_120000.sql | docker exec -i nextpik-postgres psql -U postgres nextpik_ecommerce

# If using local PostgreSQL
psql -U postgres nextpik_ecommerce < backup_before_cleanup_20260210_120000.sql
```

---

## 🎯 Common Scenarios

### Scenario 1: Delete ALL current data (complete reset)

If you want to delete everything except system settings:

1. Update patterns to be more inclusive
2. Run preview to verify
3. Execute deletion
4. Optionally reseed categories and initial data

### Scenario 2: Delete only data from specific date range

Modify the script to add date filtering:

```typescript
// In the testUsers query
const testUsers = await prisma.user.findMany({
  where: {
    AND: [
      { createdAt: { lt: new Date('2026-02-11') } }, // Before go-live date
      {
        OR: [
          { email: { contains: '@test.com' } },
          // ... other patterns
        ],
      },
    ],
  },
});
```

### Scenario 3: Delete only specific user's data

```bash
# Manually specify user ID in script or use Prisma Studio
pnpm prisma studio
```

---

## 📞 Troubleshooting

### "No test data found"

✅ Good! Your database is already clean.

### "Foreign key constraint violation"

The script deletes in the correct order, but if you modified the schema, you may need to adjust the deletion order in the script.

### "Connection timeout"

Your database might be busy. Try again when traffic is lower.

### "Permission denied"

Ensure your database user has DELETE permissions.

---

## ✅ After Cleanup

Once cleanup is complete:

1. Verify the database is clean:

   ```bash
   pnpm cleanup:preview
   ```

   Should show: "No test data found"

2. Test your production site:
   - Try registering a new user
   - Try creating a product
   - Try placing an order

3. Monitor for any issues
4. Delete the backup file (after confirming everything works):
   ```bash
   rm backup_before_cleanup_*.sql
   ```

---

## 🔒 Security Best Practices

1. **Never commit the backup file** to git (contains production data)
2. **Store backups securely** or delete after verification
3. **Run cleanup during low-traffic hours**
4. **Have a rollback plan** ready
5. **Test the script on a staging database** first if possible

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [PostgreSQL Backup Guide](https://www.postgresql.org/docs/current/backup.html)
- NextPik Technical Documentation: `COMPREHENSIVE_TECHNICAL_DOCUMENTATION.md`

---

**Last Updated:** February 10, 2026
