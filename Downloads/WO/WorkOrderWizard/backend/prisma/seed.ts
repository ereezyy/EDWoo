import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create users
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@workorderwizard.com',
      role: 'admin',
      firebase_uid: 'admin_firebase_uid_123',
    },
  });

  const worker1 = await prisma.user.create({
    data: {
      name: 'John Worker',
      email: 'john@workorderwizard.com',
      role: 'worker',
      firebase_uid: 'worker1_firebase_uid_456',
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      name: 'Jane Smith',
      email: 'jane@workorderwizard.com',
      role: 'worker',
      firebase_uid: 'worker2_firebase_uid_789',
    },
  });

  // Create work orders
  const workOrder1 = await prisma.workOrder.create({
    data: {
      title: 'Fix HVAC System',
      description: 'The HVAC system in building A needs immediate repair. Temperature control is not working properly.',
      status: 'open',
      assigned_user_id: worker1.id,
      shopify_order_id: 'shopify_order_001',
    },
  });

  const workOrder2 = await prisma.workOrder.create({
    data: {
      title: 'Electrical Maintenance',
      description: 'Routine electrical maintenance for the main office building. Check all outlets and lighting.',
      status: 'in_progress',
      assigned_user_id: worker2.id,
    },
  });

  const workOrder3 = await prisma.workOrder.create({
    data: {
      title: 'Plumbing Repair',
      description: 'Leaky faucet in the break room needs to be fixed urgently.',
      status: 'completed',
      assigned_user_id: worker1.id,
      shopify_order_id: 'shopify_order_002',
    },
  });

  const workOrder4 = await prisma.workOrder.create({
    data: {
      title: 'Network Equipment Setup',
      description: 'Install and configure new network equipment in the server room.',
      status: 'open',
    },
  });

  const workOrder5 = await prisma.workOrder.create({
    data: {
      title: 'Security System Update',
      description: 'Update security cameras and access control systems throughout the facility.',
      status: 'in_progress',
      assigned_user_id: worker2.id,
    },
  });

  // Create work order logs
  await prisma.workOrderLog.create({
    data: {
      work_order_id: workOrder1.id,
      action: 'created',
      details: 'Work order created by admin',
    },
  });

  await prisma.workOrderLog.create({
    data: {
      work_order_id: workOrder1.id,
      action: 'assigned',
      details: `Work order assigned to ${worker1.name}`,
    },
  });

  await prisma.workOrderLog.create({
    data: {
      work_order_id: workOrder2.id,
      action: 'status_changed',
      details: 'Status changed from open to in_progress',
    },
  });

  await prisma.workOrderLog.create({
    data: {
      work_order_id: workOrder3.id,
      action: 'completed',
      details: 'Work order marked as completed',
    },
  });

  // Create payments
  await prisma.payment.create({
    data: {
      work_order_id: workOrder1.id,
      stripe_payment_id: 'pi_1234567890abcdef',
      amount: 250.00,
      status: 'pending',
    },
  });

  await prisma.payment.create({
    data: {
      work_order_id: workOrder3.id,
      stripe_payment_id: 'pi_0987654321fedcba',
      amount: 150.75,
      status: 'completed',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
