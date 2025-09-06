import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest, requireRole, setCorsHeaders, AuthUser } from '../utils/auth';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../../src/schemas/validation';
import { sendWorkOrderNotification } from '../../src/services/twilio';
import { syncWorkOrderWithShopify } from '../../src/services/shopify';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error || 'Unauthorized' });
    }
    const user = authResult.user!;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user);
      case 'POST':
        return await handlePost(req, res, user);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, user: AuthUser) {
  const { status, assigned_user_id, page = '1', limit = '10' } = req.query;

  const where: any = {};
  if (status) where.status = status;
  if (assigned_user_id) where.assigned_user_id = assigned_user_id;

  const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

  const workOrders = await prisma.workOrder.findMany({
    where,
    include: {
      assigned_user: {
        select: { id: true, name: true, email: true, role: true }
      },
      logs: {
        orderBy: { created_at: 'desc' },
        take: 5
      }
    },
    orderBy: { created_at: 'desc' },
    skip,
    take: parseInt(limit as string)
  });

  const total = await prisma.workOrder.count({ where });

  res.json({
    work_orders: workOrders,
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      total,
      pages: Math.ceil(total / parseInt(limit as string))
    }
  });
}

async function handlePost(req: VercelRequest, res: VercelResponse, user: AuthUser) {
  // Check admin role
  if (!requireRole(user, ['admin'])) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const validatedData = createWorkOrderSchema.parse(req.body);

  const workOrder = await prisma.workOrder.create({
    data: {
      ...validatedData,
      status: 'open'
    },
    include: {
      assigned_user: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });

  // Log the creation
  await prisma.workOrderLog.create({
    data: {
      work_order_id: workOrder.id,
      action: 'created',
      details: `Work order created by ${user.email}`
    }
  });

  // Sync with Shopify if order ID provided
  if (validatedData.shopify_order_id) {
    try {
      await syncWorkOrderWithShopify(workOrder.id, validatedData.shopify_order_id);
      await prisma.workOrderLog.create({
        data: {
          work_order_id: workOrder.id,
          action: 'shopify_synced',
          details: `Synced with Shopify order ${validatedData.shopify_order_id}`
        }
      });
    } catch (error) {
      console.error('Shopify sync failed:', error);
    }
  }

  // Send notification if assigned to user
  if (workOrder.assigned_user_id) {
    try {
      await sendWorkOrderNotification(workOrder.id, 'has been assigned to you', '+13202677242');
    } catch (error) {
      console.error('SMS notification failed:', error);
    }
  }

  res.status(201).json(workOrder);
}
