import { PrismaClient } from '@prisma/client';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { updateWorkOrderSchema } from '../../src/schemas/validation';
import { sendWorkOrderNotification } from '../../src/services/twilio';
import { authenticateRequest, AuthUser, setCorsHeaders } from '../utils/auth';

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

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, user, id as string);
      case 'PATCH':
        return await handlePatch(req, res, user, id as string);
      default:
        res.setHeader('Allow', ['GET', 'PATCH']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleGet(req: VercelRequest, res: VercelResponse, user: AuthUser, id: string) {
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
}

async function handlePatch(req: VercelRequest, res: VercelResponse, user: AuthUser, id: string) {
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
      details: `Updated by ${user.email}: ${changes}`
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
}
