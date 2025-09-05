import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { sendNotificationSchema } from '../schemas/validation';
import { sendSMS } from '../services/twilio';

const router = Router();
const prisma = new PrismaClient();

// POST /api/notifications - Send SMS notification
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = sendNotificationSchema.parse(req.body);
    
    const workOrder = await prisma.workOrder.findUnique({
      where: { id: validatedData.work_order_id },
      include: { assigned_user: true }
    });
    
    if (!workOrder) {
      return res.status(404).json({ error: 'Work order not found' });
    }
    
    const phoneNumber = validatedData.phone_number || '+13202677242'; // Default to your number
    
    const result = await sendSMS(phoneNumber, validatedData.message);
    
    // Log the notification
    await prisma.workOrderLog.create({
      data: {
        work_order_id: validatedData.work_order_id,
        action: 'notification_sent',
        details: `SMS sent to ${phoneNumber}: ${validatedData.message}`
      }
    });
    
    res.json({
      success: true,
      message_sid: result.sid,
      phone_number: phoneNumber
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input data' });
    }
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

export default router;
