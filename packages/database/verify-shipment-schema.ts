import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyShipmentSchema() {
  try {
    console.log('🔍 Verifying shipment schema...\n');

    // Check if we can query the new tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name LIKE '%shipment%'
      ORDER BY table_name;
    `;

    console.log('✅ Shipment tables found:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    // Check ShipmentStatus enum
    const shipmentStatuses = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT unnest(enum_range(NULL::"ShipmentStatus")) AS enumlabel;
    `;

    console.log('\n✅ ShipmentStatus enum values:');
    shipmentStatuses.forEach(status => {
      console.log(`   - ${status.enumlabel}`);
    });

    // Check OrderStatus enum (should include PARTIALLY_SHIPPED)
    const orderStatuses = await prisma.$queryRaw<Array<{ enumlabel: string }>>`
      SELECT unnest(enum_range(NULL::"OrderStatus")) AS enumlabel;
    `;

    console.log('\n✅ OrderStatus enum values (should include PARTIALLY_SHIPPED):');
    orderStatuses.forEach(status => {
      console.log(`   - ${status.enumlabel}`);
    });

    console.log('\n✨ Shipment schema verification complete!');

  } catch (error) {
    console.error('❌ Error verifying schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyShipmentSchema();
