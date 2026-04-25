#!/bin/bash

# Apply Gelato Print-on-Demand Migration to Production Database
# This script applies the 20260312084142_add_seller_gelato_settings migration

set -e

echo "====================================================================="
echo "  Gelato Print-on-Demand Migration - Production Database"
echo "====================================================================="
echo ""
echo "This migration will add the following tables:"
echo "  1. SellerGelatoSettings - Per-seller Gelato API credentials"
echo "  2. gelato_pod_orders - Print-on-demand order tracking"
echo "  3. gelato_webhook_events - Webhook event processing"
echo "  4. GelatoPodStatus enum - Order status values"
echo ""
echo "⚠️  IMPORTANT: This will modify your production database!"
echo ""
read -p "Have you backed up the production database? (yes/no): " backup_confirm

if [ "$backup_confirm" != "yes" ]; then
    echo "❌ Please backup the database before proceeding."
    echo "   Run this on your production server:"
    echo "   pg_dump -U \$DB_USER -h \$DB_HOST \$DB_NAME > backup_$(date +%Y%m%d_%H%M%S).sql"
    exit 1
fi

echo ""
echo "Choose migration method:"
echo "  1. Apply via Prisma Migrate (recommended)"
echo "  2. Apply raw SQL directly to production database"
echo ""
read -p "Enter choice (1 or 2): " method

if [ "$method" == "1" ]; then
    echo ""
    echo "📦 Applying migration via Prisma Migrate..."
    echo ""

    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL environment variable is not set."
        echo ""
        echo "Please set it to your production database connection string:"
        echo "export DATABASE_URL=\"postgresql://user:password@host:port/nextpik_ecommerce\""
        exit 1
    fi

    echo "Using DATABASE_URL: ${DATABASE_URL%%@*}@***" # Mask credentials
    echo ""
    read -p "Is this correct? (yes/no): " db_confirm

    if [ "$db_confirm" != "yes" ]; then
        echo "❌ Aborted. Please set the correct DATABASE_URL."
        exit 1
    fi

    cd packages/database
    pnpm prisma migrate deploy
    echo ""
    echo "✅ Migration applied successfully via Prisma!"

elif [ "$method" == "2" ]; then
    echo ""
    echo "📝 Raw SQL migration..."
    echo ""

    read -p "Enter production database host: " DB_HOST
    read -p "Enter production database port [5432]: " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Enter production database name [nextpik_ecommerce]: " DB_NAME
    DB_NAME=${DB_NAME:-nextpik_ecommerce}
    read -p "Enter production database user: " DB_USER
    read -sp "Enter production database password: " DB_PASS
    echo ""

    echo ""
    echo "Connecting to: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
    echo ""

    # Export password for psql
    export PGPASSWORD="$DB_PASS"

    # Apply the migration
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        -f packages/database/prisma/migrations/20260312084142_add_seller_gelato_settings/migration.sql

    # Update Prisma migration table
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c \
        "INSERT INTO \"_prisma_migrations\" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('$(uuidgen)', '$(sha256sum packages/database/prisma/migrations/20260312084142_add_seller_gelato_settings/migration.sql | cut -d' ' -f1)', NOW(), '20260312084142_add_seller_gelato_settings', '', NULL, NOW(), 1);"

    unset PGPASSWORD

    echo ""
    echo "✅ Migration applied successfully via raw SQL!"

else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

echo ""
echo "====================================================================="
echo "  Migration Complete!"
echo "====================================================================="
echo ""
echo "Next steps:"
echo "  1. Verify the tables exist in production:"
echo "     SELECT table_name FROM information_schema.tables"
echo "     WHERE table_schema='public' AND table_name LIKE '%gelato%';"
echo ""
echo "  2. Test the Gelato settings endpoint:"
echo "     GET https://api.nextpik.com/api/v1/seller/gelato"
echo ""
echo "  3. Monitor backend logs for any errors"
echo ""
echo "✅ Gelato Print-on-Demand integration is now ready!"
