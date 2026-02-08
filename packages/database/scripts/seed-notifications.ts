import { PrismaClient, NotificationType, NotificationPriority, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function seedNotifications() {
  try {
    console.log('🔔 Seeding test notifications...');

    // Get all admin users
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      },
      select: { id: true, firstName: true, email: true },
    });

    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found. Notifications not seeded.');
      return;
    }

    console.log(`Found ${adminUsers.length} admin user(s)`);

    // Create sample notifications for each admin
    for (const admin of adminUsers) {
      console.log(`\nCreating notifications for ${admin.firstName} (${admin.email})...`);

      const notifications = [
        {
          userId: admin.id,
          type: NotificationType.ORDER_PLACED,
          title: 'New Order #1234',
          message: 'A new order has been placed worth $299.99',
          link: '/admin/orders/1234',
          priority: NotificationPriority.HIGH,
          read: false,
          metadata: { orderId: '1234', amount: 299.99 },
        },
        {
          userId: admin.id,
          type: NotificationType.PRODUCT_REVIEW,
          title: 'Product Review',
          message: 'New review on Diamond Ring - 5 stars',
          link: '/admin/reviews',
          priority: NotificationPriority.NORMAL,
          read: false,
          metadata: { productName: 'Diamond Ring', rating: 5 },
        },
        {
          userId: admin.id,
          type: NotificationType.LOW_STOCK_ALERT,
          title: 'Low Stock Alert',
          message: 'Luxury Watch is running low (3 remaining)',
          link: '/admin/products',
          priority: NotificationPriority.HIGH,
          read: false,
          metadata: { productName: 'Luxury Watch', stock: 3 },
        },
        {
          userId: admin.id,
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Successful',
          message: 'Payment of $450.00 has been processed for Order #1235',
          link: '/admin/orders/1235',
          priority: NotificationPriority.NORMAL,
          read: true,
          metadata: { orderId: '1235', amount: 450.0 },
        },
        {
          userId: admin.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: 'System Update',
          message: 'New features have been added to the admin dashboard',
          priority: NotificationPriority.LOW,
          read: true,
          metadata: { version: '2.6.0' },
        },
      ];

      for (const notification of notifications) {
        await prisma.notification.create({
          data: notification,
        });
      }

      console.log(`✅ Created ${notifications.length} notifications for ${admin.firstName}`);
    }

    // Count total notifications
    const total = await prisma.notification.count();
    const unread = await prisma.notification.count({ where: { read: false } });

    console.log('\n📊 Notification Statistics:');
    console.log(`  Total: ${total}`);
    console.log(`  Unread: ${unread}`);
    console.log(`  Read: ${total - unread}`);

    console.log('\n✅ Notifications seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding notifications:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedNotifications();
