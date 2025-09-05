import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken, requireRole } from '../middleware/auth';
import { createWorkOrderSchema, updateWorkOrderSchema } from '../schemas/validation';
import { sendWorkOrderNotification } from '../services/twilio';
import { syncWorkOrderWithShopify } from '../services/shopify';

const router = Router();
const prisma = new PrismaClient();

// GET /api/work-orders - List all work orders with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work orders' });
  }
});

// GET /api/work-orders/:id - Get specific work order
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const workOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        assigned_user: {
          select: { id: true, name: true, email: true, role: true }
        },
        logs: {
          orderBy: { created_at: 'desc' }
        }
      }
    });
    
    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    
    res.json(workOrder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch work order' });
  }
});

// POST /api/work-orders - Create work order (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
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
        details: `Work order created by ${req.user?.email}`
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
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Failed to create work order' });
  }
});

// PATCH /api/work-orders/:id - Update work order
router.patch('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateWorkOrderSchema.parse(req.body);
    
    const existingWorkOrder = await prisma.workOrder.findUnique({
      where: { id },
      include: { assigned_user: true }
    });
    
    if (!existingWorkOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    
    const workOrder = await prisma.workOrder.update({
      where: { id },
      data: validatedData,
      include: {
        assigned_user: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
    
    // Log the update
    const changes = Object.keys(validatedData).map(key => 
      `${key}: ${(existingWorkOrder as any)[key]} → ${(validatedData as any)[key]}`
    ).join(', ');
    
    await prisma.workOrderLog.create({
      data: {
        work_order_id: workOrder.id,
        action: 'updated',
        details: `Updated by ${req.user?.email}: ${changes}`
      }
    });
    
    // Send notification on status change
    if (validatedData.status && validatedData.status !== existingWorkOrder.status) {
      try {
        await sendWorkOrderNotification(workOrder.id, `status changed to ${validatedData.status}`, '+13202677242');
      } catch (error) {
        console.error('SMS notification failed:', error);
      }
    }
    
    res.json(workOrder);
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Failed to update work order' });
  }
});

export default router;
